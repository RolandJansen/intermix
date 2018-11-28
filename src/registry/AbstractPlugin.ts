import { ActionCreatorsMapObject, bindActionCreators } from "redux";
import { store } from "../store/store";
import { IAction, IActionDef, IPlugin, tuple } from "./interfaces";

// in plugins müssen actionsCreators in
// einem objekt gekapselt sein.
// Wird vom wrapper via bindActionCreators (redux)
// durch ein objekt mit dispatch-funktionen ersetzt.
// so muß das Plugin nichts vom store oder redux wissen.

/**
 * The basic skeleton of an Intermix Plugin
 * @todo: actionCreators should be a real map for better performance (not object)
 */
export abstract class AbstractPlugin implements IPlugin {

    public abstract actionCreators: ActionCreatorsMapObject;

    // frequency lookup not readonly because it has to be fast
    protected frequencyLookup: number[];
    protected readonly _actionDefs: IActionDef[];
    private readonly _productId: string;

    constructor(
        private readonly _name: string,
        private readonly _version: string,
        private readonly _author: string) {

        this._productId = this.getProductId(
            this.name,
            this.version,
            this.author,
        );

        this.frequencyLookup = this.getNoteFrequencies();
    }

    public get productId() {
        return this._productId;
    }

    public get name() {
        return this._name;
    }

    public get version() {
        return this._version;
    }

    public get author() {
        return this._author;
    }

    public get actionDefs() {
        return this._actionDefs;
    }

    public abstract get inputs(): AudioNode[];
    public abstract get outputs(): AudioNode[];

    /**
     * This gets called by the registry when the store
     * has changed.
     * @param changed Parameter with new value from store
     */
    public abstract onChange(changed: tuple): void;

    /**
     * Creates action creator functions from an object with
     * action definitions.
     * @param actionDefs Object with action definitions
     * @param pluginUid The unique id of the plugin instance
     * @returns  Object with action creator functions
     */
    protected makeActionCreators(actionDefs: IActionDef[], pluginUid: string): ActionCreatorsMapObject {
        const actionCreators: ActionCreatorsMapObject = {};

        actionDefs.forEach((actionDef) => {
            const min = actionDef.minVal;
            const max = actionDef.maxVal;
            const actionType = pluginUid + actionDef.type;

            actionCreators[actionType] = (payload: number): IAction => {

                const action: IAction = {
                    type: actionType,
                    payload,
                };

                if (payload >= min && payload <= max) {
                    return action;
                }

                action.error = new RangeError(`payload ${ payload } out of bounds.
                Must be within ${ min } and ${ max }`);

                return action;
            };
        });
        return actionCreators;
    }

    /**
     * Takes an object with action creators (functions that take a value and
     * return an action object) and wraps them into dispatch calls.
     * This is only for convenience so we have one function call instead of two
     * (actions are created and dispatched at once).
     * @param actionCreators An object whose values are action creators.
     * @returns    An object with action creators bound to a dispatch function.
     */
    protected connectActionCreators(actionCreators: ActionCreatorsMapObject): ActionCreatorsMapObject {
        const boundActionCreators = {};
        let ac: string;

        for (ac in actionCreators) {
            if (actionCreators.hasOwnProperty(ac)) {
                boundActionCreators[ac] = bindActionCreators(actionCreators[ac], store.dispatch);
            }
        }

        return boundActionCreators;
    }

    /**
     * Returns the frequency of a note.
     * @param  note Note (like "c3", "a#5") or midi note number
     * @return      Frequency
     */
    protected getNoteFrequency(note: number | string): number {
        if (typeof note === "string") {
            note = this.getNoteNumber(note);
        }
        return this.frequencyLookup[note];
    }

    /**
     * Takes a string of the form c3 or d#4 and
     * returns the corresponding number. Upper classes
     * strings are allowed and "h" will be converted to "b".
     * @param  tone String representing a note
     * @return      Number representing a note
     */
    private getNoteNumber(tone: string): number {
        const notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
        const str = tone.toLowerCase();

        if (str.match(/^[a-h]#?[0-9]$/)) {
            let note = str.substring(0, str.length - 1);
            const oct = parseInt(str.slice(-1), 10);

            if (note === "h") {
                note = "b";
            }
            return notes.indexOf(note) + (oct + 1) * 12;  // +1: because 1st midi octave is -1
        } else {
            throw new Error("Unvalid string. Has to be like [a-h]<#>[0-9]");
        }
    }

    /**
     * Computes the frequencies of all midi notes and returns
     * them as an array. Used for frequency lookup.
     * @return    Frequency table
     */
    private getNoteFrequencies(): number[] {
        const frequencies = new Array(128);
        const a4 = 440;
        const posa4 = 69;
        for (let i = 0; i < 128; i++) {
            frequencies[i] = a4 * Math.pow(2, ((i - posa4) / 12));
        }
        return frequencies;
    }

    /**
     * Computes a unique product identifier by concatenating
     * name, version and author and returns this string base64 encoded.
     * @param name    Name of the plugin
     * @param version Version number (e.g. "1.2.3")
     * @param author  The developer (author, company, org, etc)
     */
    private getProductId(name: string, version: string, author: string) {
        const pluginId = name + version + author;
        return btoa(pluginId);
    }
}
