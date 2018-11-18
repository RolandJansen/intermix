import { combineReducers } from "redux";
import { store } from "../store/store";
import { IAction, IActionDef, ImxPlugin } from "./interfaces";

/**
 * Plugin registry
 *
 * static plugins bekommen vom wrapper eine eindeutige kennung:
 * name+version+author => base64
 * instanzen werden nur hochgezählt, dabei die ID im store via
 * action hinterlegen.
 *
 */
export default class Registry {

    private ac: AudioContext;
    private pluginStore: ImxPlugin[] = [];

    // contains all auto-generated reducers for all plugins
    private pluginReducers = {};

    public constructor(audioContext: AudioContext) {
        this.ac = audioContext;
    }

    /**
     * Registers a plugin which means it
     * * it builds actions, action creators and reducers
     * * registers reducers to the store
     * * adds the plugin to the plugin store
     * @param plugin New plugin to be registered
     */
    public registerPlugin(plugin: ImxPlugin): `() => boolean` {
        const pluginId: string = this.getPluginUid(this.pluginStore);
        const actionDefs = plugin.actionDefs;
        const pInstance = plugin.getInstance(pluginId, this.ac);
        const reducers = this.generateReducers(actionDefs, this.reducerList);

        this.reducerList[pluginId] = reducers;
        rootReducer = combineReducers(this.reducerList);

        this.pluginStore.push(pInstance);
        return true;
    }

    public unregisterPlugin(pName: string, pVersion: string): boolean {
        this.pluginStore.forEach((p, index) => {
            if (p.name === pName && p.version === pVersion) {
                this.pluginStore.splice(index, 1);
                return true;
            }
        });
        return false;
    }

    /**
     *
     */
    private registerReducersToStore() {
        return true;
    }

    private generateReducers(actionDefs: IActionDef[], reducerList: object) {
        const handlers = this.getActionHandlerMappings(actionDefs);
        const reducer = this.createReducer({}, handlers);

    }

    /**
     * Generates an object mapping from action-types to the handlers
     * that will be used to auto-generate reducers.
     * @param actionDefs An array of action definitions (see IActionDef)
     */
    private getActionHandlerMappings(actionDefs: IActionDef[]): object {
        const handlers = {};

        actionDefs.forEach((actionDef) => {
            handlers[actionDef.type] = (state, action) => {
                return Object.assign({}, state, {
                    [action.type]: action.payload,
                });
            };
        });

        return handlers;
    }

    /**
     * A generic way to build a reducer with pre-defined handlers
     * This approach is explained in detail in the redux doc section
     * "Reducing Boilerplate".
     * @param initialState Initial state of the sub-state-tree for this reducer
     * @param handlers object mapping from action-types to handlers
     */
    private createReducer(initialState, handlers) {
        return (state = initialState, action) => {
            if (handlers.hasOwnProperty(action.type)) {
                return handlers[action.type](state, action);
            } else {
                return state;
            }
        };
    }

    /**
     * Generates a unique ID string.
     * @param pluginList An array which holds all plugin instances
     */
    private getPluginUid(pluginList) {
        const idLength = 8;
        let uid = this.getRandomId(idLength);
        pluginList.forEach((p) => {
            if (p.uid === uid) {
                const newUid = this.getRandomId(idLength);
                uid = this.getPluginUid(pluginList);
            }
        });
        return uid;
    }

    /**
     * Generates an id string.
     * @param length Length of the ID string in digits
     * @returns      ID string
     */
    private getRandomId(length: number): string {
        const randomChars: string[] = [];
        const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < length; i++) {
            randomChars[i] = input.charAt(Math.floor(Math.random() * input.length));
        }

        return randomChars.join("");
    }

}
