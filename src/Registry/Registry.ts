import { ActionCreatorsMapObject, AnyAction, bindActionCreators, Reducer, ReducersMapObject, Store } from "redux";
import { store } from "../store/store";
import combineReducersWithRoot from "./combineReducersWithRoot";
import {
    GetChanged,
    IAction,
    IActionDef,
    IActionHandlerMap,
    IPlugin,
    IState,
    Select,
    Tuple,
} from "./interfaces";

/**
 * Plugin registry
 *
 * static plugins bekommen vom wrapper eine eindeutige kennung:
 * name+version+author => base64
 * instanzen werden nur hochgezählt, dabei die ID im store via
 * action hinterlegen.
 */
export default class Registry {

    private _ac: AudioContext;
    private _pluginStore: IPlugin[] = [];

    public constructor(audioContext: AudioContext) {
        this._ac = audioContext;
    }

    public get pluginStore() {
        return this._pluginStore;
    }

    /**
     * Registers a plugin which means it
     * * builds action creators and reducers
     * * registers reducers to the store
     * * adds the plugin to the plugin store
     * @param pluginClass New plugin to be registered
     */
    public registerPlugin<p extends IPlugin>(pluginClass: new(ac: AudioContext) => p): void {
        const pInstance = this.getPluginInstance(pluginClass, this._ac);

        pInstance.actionCreators = this.getBoundActionCreators(pInstance);
        this.pluginStore.push(pInstance);

        this.replaceReducer(this.pluginStore, this.getRootReducer());

        // attach the initial state to the plugin
        pInstance.initState = this.getInitialState(pInstance);

        // make the plugin observe the store for changes
        pInstance.unsubscribe = this.observeStore(
            store,
            this.select,
            this.getChanged,
            pInstance,
        );
    }

    /**
     * Removes a plugin instance from the plugin store.
     * @param pluginUid Unique ID of the plugin to be removed
     */
    public unregisterPlugin(pluginUid: string): boolean {
        let result = false;
        this.pluginStore.forEach((plugin, index) => {
            if (plugin.uid === pluginUid) {
                plugin.unsubscribe();
                this._pluginStore.splice(index, 1);
                result = true;
                return;
            }
        });

        this.replaceReducer(this.pluginStore, this.getRootReducer());
        store.dispatch({ type: "REMOVE", payload: pluginUid });
        return result;
    }

    /**
     * Calculates reducers for all loaded plugins
     * then combines them with a root reducer and
     * and replaces the reducer in the redux store.
     * @param pStore Array with plugin instances
     * @param rootReducer A redux reducer that handles root state
     */
    private replaceReducer(pStore: IPlugin[], rootReducer: Reducer): void {
        const subReducers: ReducersMapObject = {};

        pStore.forEach((plugin) => {
            subReducers[plugin.uid] = this.getPluginReducer(plugin);
        });

        const reducer = combineReducersWithRoot(
            subReducers,
            rootReducer,
        );

        store.replaceReducer(reducer);
    }

    /**
     * A plugin instance factory.
     * @param pluginClass The class to be instanciated
     * @param ac An AudioContext instance
     * @returns An instance of the given plugin class
     */
    private getPluginInstance<p extends IPlugin>(pluginClass: new(ac: AudioContext) => p, ac: AudioContext): p {
        return new pluginClass(ac);
    }

    /**
     * For details see:
     * https://github.com/reduxjs/redux/issues/303#issuecomment-125184409
     * @param st Instance of the store that keeps the state
     * @param select Function that selects the sub-state for a plugin
     * @param onChange Method from the plugin that gets invoked when the state changes.
     */
    private observeStore(st: Store, select: Select, getChanged: GetChanged, pInstance: IPlugin) {
        const uid = pInstance.uid;
        const onChange = pInstance.onChange;
        let currentState: IState = {};

        function handleChange() {
            const nextState: IState = select(st.getState(), uid);

            // check by reference that
            // both objects are different
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

    private select(globalState: IState, pluginUid: string) {
        if (globalState.hasOwnProperty(pluginUid)) {
            return globalState[pluginUid];
        }
        throw new Error(`Plugin with ID ${ pluginUid } not found in state object.`);
    }

    private getChanged(currentState: IState, nextState: IState): Tuple {
        let prop: string;
        let change: Tuple = ["", ""];
        for (prop in currentState) {
            if (currentState[prop] !== nextState[prop]) {
                change = [prop, nextState[prop]];
            }
        }
        return change;
    }

    /**
     * Builds all action creators and binds them to
     * the dispatcher of the store, so an action is
     * automatically dispatched after creation.
     * @param pInstance The plugin instance
     */
    private getBoundActionCreators(pInstance: IPlugin): ActionCreatorsMapObject {
        const creators = pInstance.makeActionCreators(
            pInstance.actionDefs,
            pInstance.pluginId,
        );
        return bindActionCreators(creators, store.dispatch);
    }

    /**
     * Generates the initial state for a plugin from
     * its ActionDef object. Plugin state is represented
     * as a Map (instead of a generic object) for better
     * performance and ease of use.
     * @param pInstance Instance of a plugin
     */
    private getInitialState(pInstance: IPlugin): IState {
        const iState: IState = {};

        pInstance.actionDefs.forEach((aDef) => {
            iState[aDef.type] = aDef.defVal;
        });

        return iState;
    }

    /**
     * Builds a top-level reducer for a plugin.
     * @param actionDefs ActionDef object from plugin instance
     */
    private getPluginReducer(pInstance: IPlugin) {
        const actionDefs = pInstance.actionDefs;
        const handlers = this.getActionHandlerMappings(actionDefs);
        const initState: IState = this.getInitialState(pInstance);
        return this.createReducer(initState, handlers);
    }

    /**
     * Generates an object mapping from action-types to the handlers
     * that will be used to auto-generate reducers. See:
     * https://redux.js.org/recipes/reducingboilerplate#generating-reducers
     * @param actionDefs An array of action definitions (see IActionDef)
     */
    private getActionHandlerMappings(actionDefs: IActionDef[]): IActionHandlerMap {
        const handlers: IActionHandlerMap = {};

        actionDefs.forEach((actionDef) => {
            handlers[actionDef.type] = (state: IState, action: AnyAction | IAction): IState => {
                return Object.assign({}, state, {
                    [action.type]: action.payload,
                });
            };
        });
        return handlers;
    }

    /**
     * A generic way to build a reducer with pre-defined handlers.
     * These handlers get called according to a lookup table and
     * they do the real work.
     * This approach is explained in detail in the redux doc section
     * "Reducing Boilerplate".
     * @todo Write a type/interface for this kind of reducer (return type)
     * @param initialState Initial state of the sub-state-tree for this reducer
     * @param handlers Lookup table: action-types -> handlers
     */
    private createReducer(initialState: IState, handlers: IActionHandlerMap): Reducer {
        return (state = initialState, action: AnyAction | IAction) => {
            if (handlers.hasOwnProperty(action.type)) {
                const handler = handlers[action.type];
                const newState = handler(state, action);
                return newState;
            }
            return state;
        };
    }

    /**
     * Returns the root reducer with handlers that can operate
     * on the root state. Use with combineReducersWithRoot().
     */
    private getRootReducer(): Reducer {
        return (state = {}, action: AnyAction) => {
            if (action.type === "REMOVE" &&
            state.hasOwnProperty(action.payload)) {
                const newState = JSON.parse(JSON.stringify(state));
                delete newState[action.payload];
                return newState;
            }
            return state;
        };
    }

}
