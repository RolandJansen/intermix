import { IQueuePosition } from "./Sequencer";
import SeqPart from "../../seqpart/SeqPart";

export default class Score {

    private patternList: string[][] = [];
    private nextStep = 0;               // position in the queue that will get triggered next
    private isLooped = false;           // play a section of the queue in a loop
    private loopStart = 0;              // first step of the loop
    private loopEnd = 63;               // last step of the loop

    public get queue(): string[][] {
        return this.patternList;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public increaseScorePointer(runqueue: SeqPart[]): void {
        if (this.isLooped && this.nextStep >= this.loopEnd) {
            this.nextStep = this.loopStart;
            runqueue = [];
        } else {
            this.nextStep++;
        }
    }

    public setScorePointerTo(position: number): void {
        this.nextStep = position;
    }

    public resetScorePointer(): void {
        this.setScorePointerTo(0);
    }

    public getScorePosition(step: number, timestamp: number): IQueuePosition {
        return {
            position: step,
            timestamp,
        };
    }

    public addToScore(seqPartKey: string, position: number): void {
        if (!this.patternList[position]) {
            this.patternList[position] = [];
        }
        this.patternList[position].push(seqPartKey);
        // this.actionCreators.QUEUE(this.queue);
    }

    public removeFromScore(seqPartKey: string, position: number): void {
        if (this.patternList[position] instanceof Array &&
            this.patternList[position].length > 0) {
            const index = this.patternList[position].indexOf(seqPartKey);
            if (index >= 0) {
                this.patternList[position].splice(index, 1);
                // this.actionCreators.QUEUE(this.queue);
            }
        }
    }

}
