import { ActionCreatorsMapObject, bindActionCreators } from "redux";
import { IAction, IActionDef, IPlugin } from "../registry/interfaces";
import { store } from "../store/store";

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

    protected readonly _actionDefs: IActionDef[];
    private readonly _productId: string;

    constructor(
        private readonly _name: string,
        private readonly _version: string,
        private readonly _author: string) {

        this._productId = this.getProductId(
            this.name, this.version, this.author);
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
