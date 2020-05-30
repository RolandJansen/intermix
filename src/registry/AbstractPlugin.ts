import { ActionCreatorsMapObject } from "redux";
import { getRandomString } from "../helper";
import { IPlugin, IPluginMetaData, IState, Tuple, IOscActionDef } from "./interfaces";

// in plugins müssen actionsCreators in
// einem objekt gekapselt sein.
// Wird vom wrapper via bindActionCreators (redux)
// durch ein objekt mit dispatch-funktionen ersetzt.
// so muß das Plugin nichts vom store oder redux wissen.

/**
 * The basic skeleton of an Intermix Plugin
 */
export default abstract class AbstractPlugin implements IPlugin {
    public abstract readonly metaData: IPluginMetaData;
    public abstract readonly actionDefs: IOscActionDef[];
    // public abstract actionCreators: ActionCreatorsMapObject;

    public readonly frequencyLookup: number[];
    public readonly uidLength = 4;
    public readonly uid: string;

    public actionCreators: ActionCreatorsMapObject = {};
    public unboundActionCreators: ActionCreatorsMapObject = {};
    public initState: IState = {};

    constructor() {
        this.uid = this.getRandomString(this.uidLength);
        this.frequencyLookup = this.getNoteFrequencies();
    }

    public abstract get inputs(): AudioNode[];
    public abstract get outputs(): AudioNode[];

    /**
     * This gets called by the registry when the store
     * has changed.
     * @param changed Parameter with new value from store
     */
    public abstract onChange(changed: Tuple): boolean;

    public unsubscribe(): void {
        // will be overridden by the registry
    }

    /**
     * A convenience method that takes a string
     * of the form "C3" or "d#4" and returns the
     * corresponding midi note number.
     * "h" will be converted to "b".
     * @param  tone String representing a note
     * @return      Number representing a note
     */
    public getNoteNumber(tone: string): number {
        const notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
        const str = tone.toLowerCase();

        if (str.match(/^[a-h]#?[0-9]$/)) {
            let note = str.substring(0, str.length - 1);
            const oct = parseInt(str.slice(-1), 10);

            if (note === "h") {
                note = "b";
            }
            return notes.indexOf(note) + (oct + 1) * 12; // +1: because 1st midi octave is -1
        } else {
            throw new Error("Unvalid string. Has to be like [a-h]<#>[0-9]");
        }
    }

    protected getRandomString(length: number): string {
        return getRandomString(length);
    }

    /**
     * Computes the frequencies of all midi notes and returns
     * them as an array. Used for frequency lookup.
     * @see https://newt.phys.unsw.edu.au/jw/notes.html
     * @return    Frequency table
     */
    private getNoteFrequencies(): number[] {
        const frequencies = new Array(128);
        const a4 = 440;
        const posa4 = 69;
        for (let i = 0; i < 128; i++) {
            frequencies[i] = a4 * Math.pow(2, (i - posa4) / 12);
        }
        return frequencies;
    }
}
