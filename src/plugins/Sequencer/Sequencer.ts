// import { ActionCreatorsMapObject, AnyAction } from "redux";
// import * as ClockWorker from "worker-loader!./clock.worker";
import AbstractPlugin from "../../registry/AbstractPlugin";
import { IActionDef, IAudioAction, IPlugin, ISeqPartLoad, Tuple } from "../../registry/interfaces";
import ClockWorker from "./clock.worker";
import seqActionDefs from "./SeqActionDefs";
import SeqPart from "./SeqPart";

type SeqQueue = SeqPart[][];

interface IQueuePosition {
    position: number;
    timestamp: number;
}

/**
 * The main class of the sequencer. It does the queuing of
 * parts and events and runs the schedulers that fire events
 * and draws to the screen.
 * @example
 * var part = new intermix.Part();
 * var seq = new intermix.Sequencer();
 * part.addEvent(someNote, 0);
 * seq.addPart(part, 0);
 * seq.start();
 * @constructor
 */
export default class Sequencer extends AbstractPlugin implements IPlugin {

    public static bpmDefault = 120;

    public readonly metaData = {
        type: "controller",
        name: "Intermix Sequencer",
        version: "1.0.0",
        author: "R. Jansen",
        desc: "The Intermix buildin sequencer",
    };

    public readonly actionDefs: IActionDef[] = seqActionDefs;

    // constants
    private readonly resolution = 64;       // shortest possible note.
    private readonly schedulerIntervalInMili = 100;
    private readonly lookaheadInSec = 0.3;  // should be longer than interval.

    private bpm = Sequencer.bpmDefault;
    private queue: SeqQueue = [];       // List with all parts of the score
    private runqueue: SeqPart[] = [];   // list with parts that are playing or will be played shortly

    private timePerStepInSec: number;           // period of time between two steps
    private nextStepTimeInSec = 0;      // time relative to ac.currentTime until the next sequencer step
    private nextStep = 0;          // position in the queue that will get triggered next
    private stepList: IQueuePosition[] = [];         // list of steps that were triggered but are still ahead of time
    private lastPlayedStep = 0;    // step in queue that was played (not triggered) recently (used for drawing).
    private loop = false;          // play a section of the queue in a loop
    private loopStart = 0;         // first step of the loop
    private loopEnd = 63;          // last step of the loop
    private isRunning = false;     // true if sequencer is running, otherwise false
    // draw function with the lastPlayedStep int as parameter.

    private clock: Worker;

    constructor(private ac: AudioContext) {
        super();
        this.timePerStepInSec = this.getTimePerStep();
        this.draw.bind(this);  // prevent contextchange in raf

        // Initialize the timer
        this.clock = new ClockWorker();
        this.clock.postMessage({ interval: this.schedulerIntervalInMili });
        this.clock.onmessage = (e: MessageEvent) => {
            if (e.data === "tick") {
                this.scheduler();
            }
        };
    }

    /**
     * Has to be overridden by the app to render to the screen.
     * Gets called by the draw() method on every screen refresh.
     * @param  lastPlayedStep  The 64th step that was played recently
     */
    public updateFrame(lastPlayedStep: number): boolean { return true; }

    // list of all audio input nodes, if no inputs, return an empty list
    public get inputs(): AudioNode[] {
        return [];
    }

    // list of all audio output nodes, if no inputs, return an empty list
    public get outputs(): AudioNode[] {
        return [];
    }

    // onChange gets called
    // on every state change
    public onChange(changed: Tuple) {
        switch (changed[0]) {
            case "STATE":
                if (changed[1] === 1) {
                    this.start();
                } else if (changed[1] === 2) {
                    this.pause();
                } else {
                    this.stop();
                }
                return true;
            case "BPM":
                this.setBpmAndTimePerStep(changed[1]);
                return true;
            case "ADD_PART":
                const addPart: ISeqPartLoad = changed[1];
                this.addPart(addPart.part, addPart.position);
                return true;
            case "REMOVE_PART":
                const rmPart: ISeqPartLoad = changed[1];
                this.removePart(rmPart.part, rmPart.position);
                return true;
            default:
                return false;
        }
    }

    /**
     * Starts the sequencer
     */
    private start(): void {
        if (!this.isRunning) {
            if (this.ac.state === "suspended") {
                this.ac.resume();
            }
            if (this.stepList.length === 0) {
                this.stepList.push(this.getMasterQueuePosition(0, this.ac.currentTime + 0.1));
            }
            this.clock.postMessage("start");
            this.isRunning = true;
            window.requestAnimationFrame(this.draw.bind(this));
        }
    }

    /**
     * Stops the sequencer (halts at the current position)
     */
    private stop(): void {
        this.clock.postMessage("stop");
        this.nextStepTimeInSec = 0;
        this.resetQueuePointer();
        this.isRunning = false;
    }

    /**
     * Stops the sequencer and suspends the AudioContext to
     * globally halt all audio streams. It just halts if
     * if sequencer and AudioContext both are in running state.
     * @return  true if halted, false if not
     */
    private pause(): boolean {
        if (this.ac.state === "running" && this.isRunning) {
            this.stop();
            this.ac.suspend();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Set beats per minute
     * @param  bpm beats per minute
     */
    private setBpmAndTimePerStep(bpm: number): void {
        this.bpm = bpm;
        this.timePerStepInSec = this.getTimePerStep();
    }

    /**
     * Computes the time in seconds of the shortest
     * posssible interval between two notes.
     * @return time in seconds
     */
    private getTimePerStep(): number {
        return (60 * 4) / (this.bpm * this.resolution);
    }

    /**
     * Reads events from the master queue and fires them.
     * It gets called at a constant rate, looks ahead in
     * the queue and fires all events in the near future
     * with a delay computed from the current bpm value.
     */
    private scheduler(): void {
        const timestamp = this.ac.currentTime;
        const limit = timestamp + this.lookaheadInSec;

        if (this.nextStepTimeInSec === 0) {
            // if invoked for the first time or previously stopped
            this.nextStepTimeInSec = timestamp;
        }

        while (this.nextStepTimeInSec < limit) {
            this.addPartsToRunqueue();
            this.sendAllActionsInNextStep();
            this.stepList.push(this.getMasterQueuePosition(this.nextStep, this.nextStepTimeInSec));
            this.nextStepTimeInSec += this.timePerStepInSec;
            this.increaseQueuePointer();
        }
    }

    /**
     * Scheduler that runs a drawing function on screen refresh.
     * It calls itself recursively but only if something
     * happend in the sequencer and as long as the sequencer is running.
     * The function Sequencer.animationFrame() has to be
     * overridden by the application with stuff to be drawn on the screen.
     */
    private draw(): void {
        if (this.isRunning && this.stepList[0]) {
            if (this.stepList[0].timestamp <= this.ac.currentTime) {
                this.updateFrame(this.stepList[0].position);
                this.stepList.shift();
            }
            window.requestAnimationFrame(this.draw);
        }
    }

    /**
     * Looks in the master queue for parts and adds
     * copies of them to the runqueue.
     */
    private addPartsToRunqueue(): void {
        if (typeof this.queue[this.nextStep] !== "undefined") {
            if (this.queue[this.nextStep].length === 1) {
                const part = this.queue[this.nextStep][0];
                part.pointer = 0;
                this.runqueue.push(part);
            } else {
                this.queue[this.nextStep].forEach((part) => {
                    part.pointer = 0;
                    this.runqueue.push(part);
                }, this);
            }
        }
    }

    /**
     * Deletes parts from runqueue. It is important, that the indices
     * of the parts are sorted from max to min. Otherwise the forEach
     * loop won't work.
     * @param  indices  Indices of the parts in the runqueue
     */
    private deletePartsFromRunqueue(indices: number[]): void {
        if (indices.length > 0) {
            indices.forEach((id) => {
                delete this.runqueue[id].pointer;
                this.runqueue.splice(id, 1);
            }, this);
        }
    }

    /**
     * Fires all events for the upcomming step.
     */
    private sendAllActionsInNextStep(): void {
        const markForDelete: number[] = [];
        this.runqueue.forEach((part, index) => {
            if (part.pointer === part.length - 1) {
                markForDelete.unshift(index);
            } else {
                const nextStepActions = part.getActionsAtPointerPosition();
                if (nextStepActions && nextStepActions.length > 1) {
                    nextStepActions.forEach((seqEvent) => {
                        this.sendAction(seqEvent, this.nextStepTimeInSec);
                    });
                } else if (nextStepActions && nextStepActions.length === 1) {
                    this.sendAction(nextStepActions[0], this.nextStepTimeInSec);
                }
            }
            part.pointer++;
        });
        this.deletePartsFromRunqueue(markForDelete);
    }

    /**
     * Adds delay and eventually duration to an action and
     * returns it. The dispatching
     * happens automatically as the function gets invoked.
     * @param  seqEvent  The event to process
     * @param  delay     time in seconds when the event should start
     */
    private sendAction(action: IAudioAction, delay: number): IAudioAction {
        const actionOut = action;

        switch (action.type) {
            case "NOTE":
                actionOut.delay = delay;
                if (action.sequencerSteps) {
                    actionOut.duration = this.getDurationTime(action.sequencerSteps);
                }
            default:
                actionOut.delay = delay;
        }

        return actionOut;
    }

    /**
     * Computes the duration (of an event, usually a note) in seconds
     * @param steps Note duration in 64th steps
     */
    private getDurationTime(steps: number): number {
        return steps * this.timePerStepInSec;
    }

    /**
     * Sets the pointer to the next step that should be played
     * in the master queue. If we're playing in loop mode,
     * jump back to loopstart when end of loop is reached.
     */
    private increaseQueuePointer(): void {
        if (this.loop && this.nextStep >= this.loopEnd) {
            this.nextStep = this.loopStart;
            this.runqueue = [];
        } else {
            this.nextStep++;
        }
    }

    /**
     * Jump to a specific point in the queue.
     * @param   position  New position in the master queue
     */
    private setQueuePointer(position: number): void {
        this.nextStep = position;
        this.runqueue = [];
    }

    /**
     * Resets the queue pointer (set to position 0).
     */
    private resetQueuePointer(): void {
        this.setQueuePointer(0);
    }

    private getMasterQueuePosition(step: number, timestamp: number): IQueuePosition {
        return {
            position: step,
            timestamp,
        };
    }

    /**
     * Adds a part to the master queue.
     * @param  part      An instance of Part
     * @param  position  Position in the master queue
     */
    private addPart(part: SeqPart, position: number) {
        if (!this.queue[position]) {
            this.queue[position] = [];
        }
        this.queue[position].push(part);
    }

    /**
     * Removes a part object from the master queue
     * @param  part     Part instance to be removed
     * @param  position Position in the master queue
     */
    private removePart(part: SeqPart, position: number) {
        if (this.queue[position] instanceof Array &&
            this.queue[position].length > 0) {
            const index = this.queue[position].indexOf(part);
            if (index >= 0) {
                this.queue[position].splice(index, 1);
            }
        }
    }

    // probably not needed
    private isPartObject(partObject: any): partObject is ISeqPartLoad {
        if ((partObject as ISeqPartLoad).part &&
            (partObject as ISeqPartLoad).position) {
                return true;
        }
        return false;
    }

    /**
     * Makes a copy of a flat array.
     * Uses a pre-allocated while-loop
     * which seems to be the fasted way
     * (by far) of doing this:
     * http://jsperf.com/new-array-vs-splice-vs-slice/113
     * @private
     * @param   sourceArray Array that should be copied.
     * @return  Copy of the source array.
     */
    private copyArray(sourceArray: any[]): any[] {
        const destArray: any[] = new Array(sourceArray.length);
        let i = sourceArray.length;
        while (i--) {
            destArray[i] = sourceArray[i];
        }
        return destArray;
    }
}
