import { ActionCreatorsMapObject } from "redux";
import { getRandomString } from "../helper";
import { IPlugin, IOscActionDef, Tuple, IState } from "./interfaces";

/**
 * In the following we use declaration merging to
 * not beeing forced to add members of IPlugin
 * to the abstract class (just in the derived classes)
 *
 * note: this seems to be a bad idea since the infered
 * classes don't have to implement the interface also.
 * So it makes the idea of interfaces and abstract classes pretty useless.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface AbstractPlugin extends IPlugin {}

/**
 * The basic skeleton of an Intermix Plugin
 */
export abstract class AbstractPlugin implements IPlugin {
    public abstract readonly uid: string;
    public abstract actionDefs: IOscActionDef[]; // will be extended with commonActionDefs

    public readonly frequencyLookup: number[];
    public initState: IState;

    // actionCreators will be bound to dispatch by the registry
    public actionCreators: ActionCreatorsMapObject = {};
    public unboundActionCreators: ActionCreatorsMapObject = {};

    constructor() {
        this.frequencyLookup = this.getNoteFrequencies();
        this.initState = {};
    }

    public abstract get inputs(): AudioNode[];
    public abstract get outputs(): AudioNode[];

    /**
     * This gets called by the registry when the store
     * has changed.
     * @param changed Parameter with new value from store
     */
    public abstract onChange(changed: Tuple): boolean;

    /**
     * Unsubscribe from the dispatcher.
     * This is empty by default and will
     * be overridden by the registry.
     */
    public unsubscribe(): void {
        // will be overridden by the registry (observeStore)
    }

    /**
     * A wrapper for getState that returns
     * the substate of the plugin.
     */
    public getMyState(): IState {
        // will be overridden by the registry (observeStore)
        return {};
    }

    /**
     * Reads all fields defined in actionDefs
     * from the plugin state and sends them to
     * the onChange function to get the plugin
     * in sync with its state.
     * This is needed on unexpected state change
     * like when a preset is loaded.
     */
    public refreshAllValues(): void {
        const myState = this.getMyState();

        this.actionDefs.forEach((actionDef: IOscActionDef) => {
            const addressParts = actionDef.address.split("/");
            const method = addressParts[addressParts.length - 1];

            let type: string;
            actionDef.type ? (type = actionDef.type) : (type = method);

            if (myState.hasOwnProperty(type)) {
                const changed: Tuple = [type, myState[type]];
                this.onChange(changed);
            }
        });
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
        const noteName = tone.toLowerCase();

        if (noteName.match(/^[a-h]#?[0-9]$/)) {
            let note = noteName.substring(0, noteName.length - 1);
            const oct = parseInt(noteName.slice(-1), 10);

            if (note === "h") {
                note = "b";
            }
            return notes.indexOf(note) + (oct + 1) * 12; // +1: because 1st midi octave is -1
        } else {
            return -1;
        }
    }

    /**
     * Computes a random string out of letters and numbers.
     * Just a wrapper for the helper function.
     * @param length Number of chars to be contained in the string
     */
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
        const pitchA4 = 440;
        const positionA4 = 69;
        for (let i = 0; i < 128; i++) {
            frequencies[i] = pitchA4 * Math.pow(2, (i - positionA4) / 12);
        }
        return frequencies;
    }
}
