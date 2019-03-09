import { ActionCreatorsMapObject, bindActionCreators } from "redux";
import { IAction, IActionDef, IPlugin, Payload, Tuple } from "./interfaces";

// in plugins müssen actionsCreators in
// einem objekt gekapselt sein.
// Wird vom wrapper via bindActionCreators (redux)
// durch ein objekt mit dispatch-funktionen ersetzt.
// so muß das Plugin nichts vom store oder redux wissen.

/**
 * The basic skeleton of an Intermix Plugin
 * @todo: actionCreators should be a real map for better performance (not object)
 */
export default abstract class AbstractPlugin implements IPlugin {

    public abstract readonly actionDefs: IActionDef[];
    public abstract actionCreators: ActionCreatorsMapObject;

    // frequency lookup not readonly because it has to be fast
    public frequencyLookup: number[];
    private readonly _productId: string;
    private uidLength = 4;
    private _uid: string;

    constructor(
        private readonly _name: string,
        private readonly _version: string,
        private readonly _author: string) {

        this._productId = this.getProductId(
            this.name,
            this.version,
            this.author,
        );

        this._uid = this.getRandomString(this.uidLength);
        this.frequencyLookup = this.getNoteFrequencies();
    }

    public get productId() {
        return this._productId;
    }

    public get uid() {
        return this._uid;
    }

    public set uid(uid: string) {
        this._uid = uid;
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

    public abstract get inputs(): AudioNode[];
    public abstract get outputs(): AudioNode[];

    /**
     * This gets called by the registry when the store
     * has changed.
     * @param changed Parameter with new value from store
     */
    public abstract onChange(changed: Tuple): boolean;

    /**
     * Generates a random string.
     * @param length Length of the output string in digits
     * @returns      random string
     */
    public getRandomString(length: number): string {
        const randomChars: string[] = [];
        const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < length; i++) {
            randomChars[i] = input.charAt(Math.floor(Math.random() * input.length));
        }

        return randomChars.join("");
    }

    /**
     * Checks that the uid of a plugin instance
     * is really unique. If not, it generates a
     * new one and checks again.
     * However it's important that the plugin which owns the
     * uid is not part of the pluginList.
     * @param pluginList An array which holds all plugin instances
     * @returns The verified uid or a new one
     */
    public verifyPluginUid(pluginList: IPlugin[], uid: string): string {
        const idLength = uid.length;
        pluginList.forEach((p) => {
            if (p.uid === uid) {
                const newUid = this.getRandomString(idLength);
                uid = this.verifyPluginUid(pluginList, newUid);
            }
        });
        return uid;
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
            return notes.indexOf(note) + (oct + 1) * 12;  // +1: because 1st midi octave is -1
        } else {
            throw new Error("Unvalid string. Has to be like [a-h]<#>[0-9]");
        }
    }

    /**
     * Creates action creator functions from an object with
     * action definitions.
     * @param actionDefs Object with action definitions
     * @param pluginUid The unique id of the plugin instance
     * @returns  Object with action creator functions
     */
    public makeActionCreators(actionDefs: IActionDef[], pluginUid: string): ActionCreatorsMapObject {
        const actionCreators: ActionCreatorsMapObject = {};

        actionDefs.forEach((actionDef) => {
            const min = actionDef.minVal;
            const max = actionDef.maxVal;

            actionCreators[actionDef.type] = (payload: Payload): IAction => {

                const action: IAction = {
                    type: actionDef.type,
                    dest: pluginUid,
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
