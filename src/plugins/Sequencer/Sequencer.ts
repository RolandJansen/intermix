/* eslint-disable @typescript-eslint/no-unused-vars */
import AbstractPlugin from "../../registry/AbstractPlugin";
import {
    IAction,
    IActionDef,
    IControllerPlugin,
    IDelayedAudioController,
    IDelayedNote,
    ILoop,
    Tuple,
} from "../../registry/interfaces";
import SeqPart from "../../seqpart/SeqPart";
import ClockWorker from "./clock.worker";
import Score from "./Score";
import seqActionDefs from "./SeqActionDefs";

export interface IQueuePosition {
    position: number;
    timestamp: number;
}

/**
 * The main class of the sequencer. It does the queuing of
 * parts, runs the scheduler that fires actions
 * and draws to the screen.
 */
export default class Sequencer extends AbstractPlugin implements IControllerPlugin {

    public static bpmDefault = 120;

    public readonly metaData = {
        type: "controller",
        name: "Intermix Sequencer",
        version: "1.0.0-beta",
        authors: "R. Jansen",
        desc: "The Intermix buildin sequencer",
    };

    public readonly actionDefs: IActionDef[] = seqActionDefs;

    // constants
    private readonly resolution = 64;       // shortest possible note.
    private readonly intervalInMili = 100;  // time between two scheduler invocations
    private readonly lookaheadInSec = 0.3;  // should be longer than interval.

    private bpm = Sequencer.bpmDefault;
    private score: Score;          // List with references to parts that makes the score

    private timePerStepInSec: number;   // period of time between two steps
    private nextStepTimeInSec = 0;      // time relative to ac.currentTime until the next sequencer step
    private nextStep = 0;               // position in the queue that will get triggered next
    private triggeredSteps: IQueuePosition[] = [];    // list of steps that were triggered but are still ahead of time
    // private lastPlayedStep = 0;         // step in queue that was played (not triggered) recently (used for drawing).
    private isRunning = false;          // true if sequencer is running, otherwise false

    private clock: Worker;

    constructor(private ac: AudioContext) {
        super();
        this.timePerStepInSec = this.getTimePerStep();
        this.score = new Score();

        // Initialize the timer
        this.clock = new ClockWorker();
        this.clock.postMessage({ interval: this.intervalInMili });
        this.clock.onmessage = (e: MessageEvent): void => {
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
    public updateFrame(lastPlayedStep: number): void { /* nothing */ }

    // list of all audio input nodes, if no inputs, return an empty list
    public get inputs(): AudioNode[] {
        return [];
    }

    // list of all audio output nodes, if no inputs, return an empty list
    public get outputs(): AudioNode[] {
        return [];
    }

    /**
     * This is where you drop in actions that should be dispatched for
     * other plugins (not in this plugins actionCreators list).
     * The implementation will be injected by the registry so we just have to
     * provide an empty method here. It has to be public so the registry can see it.
     * @param action An action object that normally holds data for an audio device
     */
    public sendAction(action: IAction): void { /* nothing */ }

    /**
     * onChange gets called on every state change
     * @param changed A tuple with actiontype and payload
     */
    public onChange(changed: Tuple): boolean {
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
                const newPart: SeqPart = changed[1];
                this.score.parts.add(newPart);
                return true;
            case "REMOVE_PART":
                const partID: string = changed[1];
                this.score.parts.remove(partID);
                return true;
            case "ADD_TO_SCORE":
                const toBeAdded: string = changed[1].partID;
                const newPosition: number = changed[1].position;
                this.score.addPartToScore(toBeAdded, newPosition);
                this.actionCreators.QUEUE(this.score.queue);
                return true;
            case "REMOVE_FROM_SCORE":
                const toBeRemoved: string = changed[1].partID;
                const oldPosition: number = changed[1].position;
                this.score.removePartFromScore(toBeRemoved, oldPosition);
                this.actionCreators.QUEUE(this.score.queue);
                return true;
            case "LOOP":
                const loop: ILoop = changed[1];
                this.score.loop = loop;
                return true;
            case "LOOP_ACTIVE":
                const isActive: boolean = changed[1];
                if (isActive) {
                    this.score.activateLoop();
                } else {
                    this.score.deactivateLoop();
                }
                return true;
            case "JUMP_TO_POSITION":
                const step: number = changed[1];
                this.score.moveScorePointerTo(step);
                return true;
            default:
                return false;
        }
    }

    private start(): void {
        if (!this.isRunning) {
            if (this.ac.state === "suspended") {
                this.ac.resume();
            }
            if (this.triggeredSteps.length === 0) {
                this.triggeredSteps.push(this.score.getScorePosition(0, this.ac.currentTime + 0.1));
            }
            this.clock.postMessage("start");
            this.isRunning = true;
            window.requestAnimationFrame(this.draw.bind(this));
        }
    }

    private stop(): void {
        this.clock.postMessage("stop");
        this.nextStepTimeInSec = 0;
        this.score.resetScorePointer();
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
        const bpmDivisor = this.resolution / 4; // number of steps per one beat (beat: 1/4)
        const timePerBeat = 60 / this.bpm;
        const timePerStep = timePerBeat / bpmDivisor; // or: (60 * 4) / (this.bpm * this.resolution)
        return timePerStep;
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
            this.score.addPartsToRunqueue();
            this.sendAllActionsInNextStep();
            this.triggeredSteps.push(this.score.getScorePosition(this.nextStep, this.nextStepTimeInSec));
            this.nextStepTimeInSec += this.timePerStepInSec;
            this.score.increaseScorePointer();
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
        if (this.isRunning && this.triggeredSteps[0]) {
            if (this.triggeredSteps[0].timestamp <= this.ac.currentTime) {
                this.updateFrame(this.triggeredSteps[0].position);
                this.triggeredSteps.shift();
            }
            window.requestAnimationFrame(this.draw.bind(this));
        }
    }

    private sendAllActionsInNextStep(): void {
        // const markForDelete: number[] = [];
        // this.runqueue.forEach((part, index) => {
        //     if (part.pointer === part.length - 1) {
        //         markForDelete.unshift(index);
        //     } else {
        //         const nextStepActions = part.getActionsAtPointerPosition();
        //         let action: IAction;
        //         if (nextStepActions.length === 1) {  // if we test for length we can sometimes skip the foreach loop
        //             action = this.prepareActionForDispatching(nextStepActions[0], this.nextStepTimeInSec);
        //             this.sendAction(action);
        //         } else {
        //             nextStepActions.forEach((actionEvent) => {
        //                 action = this.prepareActionForDispatching(actionEvent, this.nextStepTimeInSec);
        //                 this.sendAction(action);
        //             });
        //         }
        //     }
        //     part.pointer++;
        // });

        const nextStepActions = this.score.getAllActionsInNextStep();
        nextStepActions.forEach((actionEvent) => {
            const action = this.prepareActionForDispatching(actionEvent, this.nextStepTimeInSec);
            this.sendAction(action);
        });
    }

    /**
     * Adds delay and eventually duration to an action and returns it.
     * Type of payload in the returned object can be IDelayedNote
     * or IDelayedAudioController (notes have a duration while controllers have not).
     * @param action An action object that normally holds data for an audio device
     * @param startTime time in seconds when the audio event should start
     */
    private prepareActionForDispatching(action: IAction, startTime: number): IAction {
        const payload = action.payload;
        let delayedPayload;
        if (action.type === "NOTE") {
            const duration = this.getDurationTime(action.payload.steps);
            delayedPayload = Object.assign({}, payload, {
                startTime,
                duration,
            }) as IDelayedNote;
        } else {
            delayedPayload = Object.assign({}, payload, { startTime }) as IDelayedAudioController;
        }
        action.payload = delayedPayload;
        return action;
    }

    /**
     * Computes the duration (of an event, usually a note) in seconds
     * @param steps Note duration in 64th steps
     */
    private getDurationTime(steps: number): number {
        return steps * this.timePerStepInSec;
    }

}
