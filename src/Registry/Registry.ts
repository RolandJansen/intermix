import { ActionCreatorsMapObject, AnyAction, bindActionCreators, Reducer, ReducersMapObject, Store } from "redux";
import { store } from "../store/store";
import combineReducersWithRoot from "./combineReducersWithRoot";
import { commonActionDefs } from "./commonActionDefs";
import {
    BoundSendAction,
    GetChanged,
    IAction,
    IActionDef,
    IActionHandlerMap,
    IControllerPlugin,
    IPlugin,
    IState,
    Payload,
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

    // this is just a list that holds plugin
    // instances, not the redux store (should probably be renamed)
    private _pluginStore: IPlugin[] = [];

    public constructor(private ac: AudioContext) { }

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
    public registerPlugin<p extends IPlugin>(pluginClass: new (ac: AudioContext) => p): p {
        const pInstance = this.getPluginInstance(pluginClass, this.ac);

        // add commonActionDefs to the plugin if its an instrument
        if (pInstance.metaData.type === "instrument") {
            pInstance.actionDefs = [...pInstance.actionDefs, ...commonActionDefs];
        }

        // generate action creator functions and bind them to the dispatcher
        pInstance.actionCreators = this.getBoundActionCreators(pInstance);

        // if the plugin is a controller, it needs a sendAction method
        this.bindSendActionMethod(pInstance);

        // add plugin instance to the plugin store
        this.pluginStore.push(pInstance);

        // build a new root reducers that handles the
        // plugin state and replace the current one.
        this.replaceReducer(this.getRootReducer());

        // attach the initial state to the plugin
        pInstance.initState = this.getInitialState(pInstance);  // why do we need this?

        // make the plugin observe the store for changes
        pInstance.unsubscribe = this.observeStore(
            store,
            this.selectSubState,
            this.getChanged,
            pInstance,
        );

        this.wireAudioOutputs(pInstance);

        // console.log(store.getState());
        return pInstance;
    }

    /**
     * Removes a plugin from the system.
     * In detail: Removes a plugin instance from the plugin store
     * and the redux store (state and reducer) and
     * unsubscribes to changes.
     * @param pluginUid Unique ID of the plugin to be removed
     */
    public unregisterPlugin(pluginUid: string): boolean {
        let result = false;

        this.pluginStore.forEach((plugin, index) => {
            if (plugin.uid === pluginUid) {
                plugin.unsubscribe();
                this._pluginStore.splice(index, 1);
                this.replaceReducer(this.getRootReducer());
                store.dispatch({ type: "REMOVE", payload: pluginUid });
                result = true;
            }
        });

        return result;
    }

    /**
     * A plugin instance factory:
     * Returns a plugin instance with a unique ID.
     * @param pluginClass The class to be instanciated
     * @param ac An AudioContext instance
     * @returns An instance of the given plugin class
     */
    private getPluginInstance<p extends IPlugin>(pluginClass: new (ac: AudioContext) => p, ac: AudioContext): p {
        let plugin = new pluginClass(ac);

        // repeat instanciation if uid is not unique in pluginStore
        while (!this.isUidUnique(plugin.uid)) {
            plugin = new pluginClass(ac);
        }

        return plugin;
    }

    /**
     * Checks if there is another plugin in the
     * plugin store with the same uid.
     * However it's important that the plugin which owns the
     * uid is not part of the pluginList.
     * @param uid The unique ID of a plugin instance
     */
    private isUidUnique(uid: string): boolean {
        this.pluginStore.forEach((plug) => {
            if (plug.uid === uid) {
                return false;
            }
        });
        return true;
    }

    /**
     * Subscribes a plugin to the store. The function that will
     * be called by the store invokes the onChange handler of the plugin.
     * This should be the only intermix function that subscribes to the store.
     * For details see:
     * https://github.com/reduxjs/redux/issues/303#issuecomment-125184409
     * @param st Instance of the store that keeps the state
     * @param select Function that selects the sub-state for a plugin
     * @param onChange Method from the plugin that gets invoked when the state changes.
     */
    private observeStore(st: Store, select: Select, getChanged: GetChanged, pInstance: IPlugin) {
        const uid = pInstance.uid;
        const onChange = pInstance.onChange.bind(pInstance);
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

    /**
     * Returns the sub state of a plugin from the global state object
     * @param globalState The global state object from redux store
     * @param pluginUid Unique id of the plugin
     */
    private selectSubState(globalState: IState, pluginUid: string) {
        if (globalState.hasOwnProperty(pluginUid)) {
            return globalState[pluginUid];
        }
        throw new Error(`Plugin with ID ${pluginUid} not found in state object.`);
    }

    /**
     * Determines which value has been changed between
     * two successive states. Only works with flat
     * plugin states.
     * @param currentState Original plugin state
     * @param nextState Changed plugin state
     */
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
        const creators = this.getActionCreators(
            [...commonActionDefs, ...pInstance.actionDefs],
            pInstance.uid,
        );
        return bindActionCreators(creators, store.dispatch);
    }

    /**
     * Creates action creator functions from an object with
     * action definitions.
     * @param actionDefs Object with action definitions
     * @param pluginUid The unique id of the plugin instance
     * @returns  Object with action creator functions
     */
    private getActionCreators(actionDefs: IActionDef[], pluginUid: string): ActionCreatorsMapObject {
        const actionCreators: ActionCreatorsMapObject = {};

        actionDefs.forEach((actionDef) => {

            actionCreators[actionDef.type] = (payload: Payload): IAction => {
                return {
                    type: actionDef.type,
                    dest: pluginUid,
                    payload,
                };
            };
        });
        return actionCreators;
    }

    /**
     * If the plugin is a controller, bind the sendAction method
     * to the dispatcher so it emmits actions when called.
     */
    private bindSendActionMethod(pInstance: IPlugin) {
        if (this.isInstanceOfIControllerPlugin(pInstance)) {
            const actionRelay = this.getActionRelay();
            pInstance.sendAction = (action: IAction) => store.dispatch(actionRelay(action));
        }
    }

    /**
     * Simply returns a data relay function:
     * It takes an action and returns it without any computation.
     *
     * This is for plugins of type IControllerPlugin to
     * fire actions without knowing anything about their consumers.
     * Will be wrapped in a dispatch and serves as a generic action creator.
     */
    private getActionRelay(): (action: IAction) => IAction {
        return (action: IAction) => {
            return action;
        };
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

        pInstance.actionDefs.forEach((actionDef) => {
            iState[actionDef.type] = actionDef.defVal;
        });

        return iState;
    }

    /**
     * Calculates reducers for all loaded plugins
     * then combines them with a root reducer and
     * and replaces the reducer in the redux store.
     * @param rootReducer A redux reducer that handles root state
     */
    private replaceReducer(rootReducer: Reducer): void {
        const subReducers: ReducersMapObject = {};

        this.pluginStore.forEach((plugin) => {
            subReducers[plugin.uid] = this.getPluginReducer(plugin);
        });

        const reducer = combineReducersWithRoot(
            subReducers,
            rootReducer,
        );

        store.replaceReducer(reducer);
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

    // type guard for IControllerPlugin
    private isInstanceOfIControllerPlugin(obj: any): obj is IControllerPlugin {
        return "sendAction" in obj;
    }

    /**
     * There is no complex audio routing at the moment
     * so we just connect the 1st audio output of the
     * plugin with the audio destination.
     * @param pInstance The plugin to be wired
     */
    private wireAudioOutputs(pInstance: IPlugin) {
        const outputs = pInstance.outputs;
        if (outputs.length !== 0) {
            outputs[0].connect(this.ac.destination);
        }
    }

}
