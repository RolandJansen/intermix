import { IQueuePosition } from "./Sequencer";
import SeqPart from "../../seqpart/SeqPart";
import { ILoop, IAction } from "../../registry/interfaces";
import RegistryItemList from "../../registry/RegistryItemList";

export interface IRunqueue {
    [pointerId: string]: SeqPart;
}

/**
 * One concept that may needs explanation:
 * The score has no specific length but the main queue does.
 * If the score pointer goes beyond the main queue
 * it can run further and theoretically forever.
 * Think of it like a tape that plays beyond its recorded audio.
 */
export default class Score {
    public parts: RegistryItemList<SeqPart>; // Lookup table with all available parts
    private mainQueue: string[][] = []; // main queue that only holds part ids
    private runQueue: IRunqueue = {}; // table with parts that are playing or will be played shortly
    private seqPartPointerId = 0; // every pointer in every part has a unique id
    private nextStep = 0; // position in the queue that will get triggered next
    private loopActivated = false; // play a section of the queue in a loop
    private loopStart = 0; // first step of the loop
    private loopEnd = 63; // last step of the loop

    public constructor() {
        this.parts = new RegistryItemList();
    }

    public set loop(loop: ILoop) {
        if (loop.start < loop.end) {
            this.loopStart = loop.start;
            this.loopEnd = loop.end;
        }
    }

    // this is casual and should be expressed with higher level functions
    public get queue(): string[][] {
        return this.mainQueue;
    }

    public activateLoop(): void {
        this.loopActivated = true;
    }

    public deactivateLoop(): void {
        this.loopActivated = false;
    }

    public increaseScorePointer(): void {
        if (this.loopActivated && this.nextStep >= this.loopEnd) {
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

    public addPartToScore(seqPartKey: string, position: number): void {
        if (!this.mainQueue[position]) {
            this.mainQueue[position] = [];
        }
        this.mainQueue[position].push(seqPartKey);
    }

    public removePartFromScore(seqPartKey: string, position: number): void {
        if (this.mainQueue[position] instanceof Array && this.mainQueue[position].length > 0) {
            const index = this.mainQueue[position].indexOf(seqPartKey);
            if (index >= 0) {
                this.mainQueue[position].splice(index, 1);
            }
        }
    }

    /**
     * Looks in the master queue for parts and adds
     * copies of them to the runqueue.
     */
    public addPartsToRunqueue(): void {
        if (typeof this.mainQueue[this.nextStep] !== "undefined") {
            if (this.mainQueue[this.nextStep].length !== 0) {
                this.mainQueue[this.nextStep].forEach((itemId) => {
                    this.addPartToRunqueue(itemId);
                });
            }
        }
    }

    private addPartToRunqueue(itemId: string): void {
        const part = this.parts.getItem(itemId);
        this.seqPartPointerId++;
        part.pointers[this.seqPartPointerId] = 0;
        this.runQueue[this.seqPartPointerId] = part;
    }

    public getAllActionsInNextStep(): IAction[] {
        let actionList: IAction[] = [];
        let pointerId: string;

        for (pointerId in this.runQueue) {
            const part = this.runQueue[pointerId];
            const pointer = part.pointers[pointerId];

            // could be refactored into a function
            if (pointer < part.length - 1) {
                const partActions = part.getActionsAtPointerPosition(pointerId);
                actionList = actionList.concat(partActions);
                part.pointers[pointerId]++;
            } else {
                delete part.pointers[pointerId];
                delete this.runQueue[pointerId];
            }
        }
        return actionList;
    }
}
