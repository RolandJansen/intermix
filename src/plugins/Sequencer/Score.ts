import AbstractPlugin from "../../registry/AbstractPlugin";
import { IAction, IActionDef, IControllerPlugin, Tuple } from "../../registry/interfaces";

export default class Score {

    private score: string[][] = [];

    public get queue(): string[][] {
        return this.score;
    }

    public addToScore(partKey: string, position: number) {
        if (!this.score[position]) {
            this.score[position] = [];
        }
        this.score[position].push(partKey);
        // this.actionCreators.QUEUE(this.queue);
    }

    public removeFromScore(partKey: string, position: number) {
        if (this.score[position] instanceof Array &&
            this.score[position].length > 0) {
            const index = this.score[position].indexOf(partKey);
            if (index >= 0) {
                this.score[position].splice(index, 1);
                // this.actionCreators.QUEUE(this.queue);
            }
        }
    }

}
