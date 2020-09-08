import { IQueuePosition } from "./Sequencer";
import { ILoop, IAction, OscArgSequence } from "../../registry/interfaces";

export type Pattern = OscArgSequence[][];

export interface IRunqueue {
    [pointerId: string]: Pattern;
}

interface IPointer {
    position: number;
    partId: string;
    pluginId: string;
}

interface IPointerTable {
    [pointerId: string]: IPointer;
}

type SeqPartID = string;
type PluginID = string;
export type PartAndPlugin = [SeqPartID, PluginID];

/**
 * One concept that may needs explanation:
 * The score has no specific length but the main queue does.
 * If the score pointer goes beyond the main queue
 * it can run further and theoretically forever.
 * Think of it like a tape that plays beyond its recorded audio.
 */
export default class Score {
    // public parts: RegistryItemList<SeqPart>; // Lookup table with all available parts
    public activeStep = 0; // step in the queue where parts can be inserted or removed
    private nextStep = 0; // position in the queue that will get triggered next
    private mainQueue: PartAndPlugin[][] = []; // main queue that only holds part ids
    private loopActive = false; // play a section of the queue in a loop
    private loopStart = 0; // first step of the loop
    private loopEnd = 63; // last step of the loop

    private runQueue: IRunqueue = {}; // table with parts that are playing or will be played shortly
    private patternPointerId = 0; // every pointer in the runqueue has a unique id
    private pointers: IPointerTable = {};

    public get nextStepPartsInScore(): PartAndPlugin[] {
        if (typeof this.mainQueue[this.nextStep] !== "undefined") {
            return this.mainQueue[this.nextStep];
        }
        return [];
    }

    public set loop(loop: ILoop) {
        if (loop.start < loop.end) {
            this.loopStart = loop.start;
            this.loopEnd = loop.end;
        }
    }

    // this is casual and should be expressed with higher level functions
    public get queue(): PartAndPlugin[][] {
        return this.mainQueue;
    }

    public activateLoop(): void {
        this.loopActive = true;
    }

    public deactivateLoop(): void {
        this.loopActive = false;
    }

    public increaseScorePointer(): void {
        if (this.loopActive && this.nextStep >= this.loopEnd) {
            this.setScorePointerTo(this.loopStart);
        } else {
            this.nextStep++;
        }
    }

    public resetScorePointer(): void {
        this.setScorePointerTo(0);
    }

    public moveScorePointerTo(position: number): void {
        // don't reset the runqueue if nothings changed
        if (position !== this.nextStep) {
            this.setScorePointerTo(position);
        }
    }

    private setScorePointerTo(position: number): void {
        this.nextStep = position;
        this.runQueue = {}; // pointer jumps -> new runqueue
    }

    public getScorePosition(preciseTime: number): IQueuePosition {
        return {
            position: this.nextStep,
            timestamp: preciseTime,
        };
    }

    public addPartToScore(partPluginTuple: PartAndPlugin): void {
        if (!this.mainQueue[this.activeStep]) {
            this.mainQueue[this.activeStep] = [];
        }
        this.mainQueue[this.activeStep].push(partPluginTuple);
    }

    public removePartFromScore(partPluginTuple: PartAndPlugin): void {
        if (this.mainQueue[this.activeStep] instanceof Array && this.mainQueue[this.activeStep].length > 0) {
            const index = this.mainQueue[this.activeStep].indexOf(partPluginTuple);
            if (index >= 0) {
                this.mainQueue[this.activeStep].splice(index, 1);
            } else {
                this.mainQueue[this.activeStep] = [];
            }
        }
    }

    /**
     * Looks in the master queue for parts and adds
     * their pattern to the runqueue.
     */
    // public addPatternsToRunqueue(): void {
    //     if (typeof this.mainQueue[this.nextStep] !== "undefined") {
    //         if (this.mainQueue[this.nextStep].length !== 0) {
    //             this.mainQueue[this.nextStep].forEach((item: PartAndPlugin) => {
    //                 this.addPatternToRunqueue(item);
    //             });
    //         }
    //     }
    // }

    public addPatternToRunqueue(item: PartAndPlugin, pattern: Pattern): void {
        this.patternPointerId++;

        this.pointers[this.patternPointerId] = {
            position: 0,
            partId: item[0],
            pluginId: item[1],
        };
        this.runQueue[this.patternPointerId] = pattern;
    }

    public getAllActionsForNextStep(): IAction[] {
        let actionList: IAction[] = [];
        let pointerId: string;

        for (pointerId in this.runQueue) {
            const pattern = this.runQueue[pointerId];
            const pointer = this.pointers[pointerId];

            // could be refactored into a function
            if (pointer.position < pattern.length - 1) {
                const events = pattern[pointer.position];

                actionList = actionList.concat(this.buildActionsFromEvents(events, pointer));
                this.pointers[pointerId].position++;
            } else {
                delete this.pointers[pointerId];
                delete this.runQueue[pointerId];
            }
        }
        return actionList;
    }

    /**
     * builds actions of type IAction and copies the event array
     * so it won't be mutated.
     * @param events List of "payloads" (notes or controller values)
     * @param pointer A runqueue pointer object
     */
    private buildActionsFromEvents(events: OscArgSequence[], pointer: IPointer): IAction[] {
        const actions: IAction[] = events.map((payload: OscArgSequence) => {
            return {
                listener: pointer.pluginId,
                type: payload[0],
                payload,
            };
        });
        return actions;
    }
}
