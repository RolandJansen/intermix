import { ActionCreatorsMapObject, Store } from "redux";
import { store } from "../store/store";
import { IAction, IActionDef, IPlugin, tuple } from "./interfaces";

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
    private pluginStore: IPlugin[] = [];
    private uidLength = 4;  // length of unique keys for plugin instances

    public constructor(audioContext: AudioContext) {
        this.ac = audioContext;
    }

    /**
     * Registers a plugin which means it
     * * builds action creators and reducers
     * * registers reducers to the store
     * * adds the plugin to the plugin store
     * @param plugin New plugin to be registered
     */
    public registerPlugin(pluginClass): void {
        const pluginUid: string = this.getPluginUid(this.pluginStore, this.uidLength);
        const actionDefs = pluginClass.actionDefs;
        const pInstance = this.getPluginInstance(pluginClass, pluginUid, this.ac);

        pInstance.actionCreators = this.generateActionCreators(
            pInstance,
            actionDefs,
            pluginUid);

        const reducers = this.generateReducers(actionDefs);
        store.attachReducers({ [pluginUid]: { reducers } });

        this.pluginStore.push(pInstance);
    }

    /**
     * Removes a plugin instance from the plugin store.
     * @param pluginUid Unique ID of the plugin to be removed
     */
    public unregisterPlugin(pluginUid: string): boolean {
        this.pluginStore.forEach((plugin, index) => {
            if (plugin.uid === pluginUid) {
                this.pluginStore.splice(index, 1);
                return true;
            }
        });
        return false;
    }

    /**
     * A basic factory that produces plugin instances.
     * This is vital since it is used by the plugin registry.
     * @param pluginClass The class to be instanciated
     * @param pluginUid A unique id to distinguish the instance from others
     * @param ac An AudioContext instance
     * @returns An instance of the given plugin class
     */
    private getPluginInstance(pluginClass, pluginUid: string, ac: AudioContext): IPlugin {
        return new pluginClass(pluginUid, ac);
    }

    /**
     * For details see:
     * https://github.com/reduxjs/redux/issues/303#issuecomment-125184409
     * @param st Instance of the store that keeps the state
     * @param select Function that selects the sub-state for a plugin
     * @param onChange Method from the plugin that gets invoked when the state changes.
     */
    private observeStore(st: Store, select, getChanged, onChange) {
        let currentState: {};

        function handleChange() {
            const nextState = select(st.getState());

            // check if next/current don't link to the same object
            if (nextState !== currentState) {
                const changed = getChanged(currentState, nextState);
                currentState = nextState;
                onChange(changed);
            }
        }

        const unsubscribe = store.subscribe(handleChange);
        handleChange();  // invoke the function once to set currentState
        return unsubscribe;
    }

    private select(globalState, pluginUid: string) {
        if (globalState.hasOwnProperty(pluginUid)) {
            return globalState[pluginUid];
        }
        throw new Error(`Plugin with ID ${ pluginUid } not found in state object.`);
    }

    private getChanged(currentState, nextState): tuple {
        let prop: string;
        for (prop in currentState) {
            if (currentState[prop] !== nextState[prop]) {
                return [prop, nextState[prop]];
            }
        }
    }

    /**
     * Builds all action creators and binds them to
     * the dispatcher of the store, so an action is
     * automatically dispatched after creation.
     * @param pInstance The plugin instance
     * @param actionDefs Array of action definitions
     * @param pluginId Unique ID of the plugin instance
     */
    private generateActionCreators(
        pInstance: IPlugin,
        actionDefs: IActionDef[],
        pluginId: string): ActionCreatorsMapObject {
        const creators = pInstance.makeActionCreators(actionDefs, pluginId);
        return pInstance.connectActionCreators(creators);
    }

    private generateReducers(actionDefs: IActionDef[]) {
        const handlers = this.getActionHandlerMappings(actionDefs);
        return this.createReducer({}, handlers);
    }

    /**
     * Generates an object mapping from action-types to the handlers
     * that will be used to auto-generate reducers. See:
     * https://redux.js.org/recipes/reducingboilerplate#generating-reducers
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
     * Generates a unique id string.
     * @param pluginList An array which holds all plugin instances
     */
    private getPluginUid(pluginList: IPlugin[], idLength: number): string {
        let uid = this.getRandomId(idLength);
        pluginList.forEach((p) => {
            if (p.uid === uid) {
                const newUid = this.getRandomId(idLength);
                uid = this.getPluginUid(pluginList, idLength);
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
