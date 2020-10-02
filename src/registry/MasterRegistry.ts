import { Reducer, ReducersMapObject, ActionCreatorsMapObject } from "redux";
import { store } from "../store/store";
import combineReducersWithRoot from "./combineReducersWithRoot";
import SeqPartRegistry from "./SeqPartRegistry";
import SeqPart from "../seqpart/SeqPart";
import PluginRegistry from "./PluginRegistry";
import { AudioEndpoint, IPlugin, IPluginConstructor } from "./interfaces";
import rootReducer from "../store/rootReducer";
import { addPlugin, addPart, removePlugin, removePart, connectAudioNodes } from "../store/rootActions";

// this file has a method also called "addPlugin"
// so we'll rename it to avoid confusion.
const addPluginAction = addPlugin;
const removePluginAction = removePlugin;

/**
 * Calls the appropriate sub-registries
 * and adds new items to the state and reducers map
 *
 * This is not derived from AbstractRegistry,
 * it's more like an orchestrator class.
 */
export default class MasterRegistry {
    private plugins: PluginRegistry;
    private seqParts: SeqPartRegistry;

    public constructor(private ac: AudioContext) {
        this.plugins = new PluginRegistry(ac);
        this.seqParts = new SeqPartRegistry();
    }

    public addPlugin(pluginClass: IPluginConstructor): string {
        const newPlugin: IPlugin = this.plugins.add(pluginClass);

        // build a new root reducer and replace the current one
        this.replaceReducer();

        store.dispatch(addPluginAction(newPlugin.uid));

        // make the new item observe the store
        newPlugin.unsubscribe = this.plugins.observeStore(store, newPlugin);
        return newPlugin.uid;
    }

    public removePlugin(itemId: string): void {
        this.plugins.remove(itemId);
        this.replaceReducer();
        store.dispatch(removePluginAction(itemId));
    }

    public addSeqPart(lengthInStepsPerBar?: number): string {
        let newPart: SeqPart;

        // add new item to the seqPart Registry
        if (lengthInStepsPerBar) {
            newPart = this.seqParts.add(lengthInStepsPerBar);
        } else {
            newPart = this.seqParts.add();
        }

        // build a new root reducer and replace the current one
        this.replaceReducer();

        store.dispatch(addPart(newPart.uid));

        // make the new item observe the store
        newPart.unsubscribe = this.seqParts.observeStore(store, newPart);

        return newPart.uid;
    }

    public removeSeqPart(itemId: string): void {
        this.seqParts.remove(itemId);
        this.replaceReducer();
        store.dispatch(removePart(itemId));
    }

    public getActionCreators(itemId: string, bound?: string): ActionCreatorsMapObject {
        const pluginKeys = this.plugins.getUidList();
        const seqPartKeys = this.seqParts.getUidList();
        const actionCreatorsType = bound === "unbound" ? "unboundActionCreators" : "actionCreators";
        let actionCreators: ActionCreatorsMapObject = {};

        if (pluginKeys.includes(itemId)) {
            const item = this.plugins.itemList.get(itemId);
            if (item) {
                actionCreators = Object.assign({}, item[actionCreatorsType]);
            }
        } else if (seqPartKeys.includes(itemId)) {
            const item = this.seqParts.itemList.get(itemId);
            if (item) {
                actionCreators = Object.assign({}, item[actionCreatorsType]);
            }
        }

        return actionCreators;
    }

    /**
     * Connects two audio endpoints and dispatches the new state.
     * If the id of the input plugin is not valid, it connects to the soundcard input.
     * If the id of the output plugin is not valid, it cancels the operation.
     * @param connection Audio endpoints to be connected
     */
    public connectAudioNodes(connection: [AudioEndpoint, AudioEndpoint]): void {
        const output = connection[0];
        const input = connection[1];

        const pluginOut = this.plugins.itemList.get(output[0]);
        const pluginIn = this.plugins.itemList.get(input[0]);
        if (typeof pluginOut === "undefined") {
            return;
        }

        const audioNodeOut = pluginOut.outputs[output[1]];
        const audioNodeIn = pluginIn ? pluginIn.inputs[input[1]] : this.ac.destination;

        if (audioNodeIn.numberOfOutputs === 0) {
            input[0] = "destination"; // enshure that no wrong id will be dispatched
        }
        audioNodeOut.disconnect();
        audioNodeOut.connect(audioNodeIn);
        store.dispatch(connectAudioNodes(connection));
    }

    /**
     * Combines all sub reducers with the root reducer
     * and replaces the current reducer
     */
    private replaceReducer(): void {
        const pluginReducers: ReducersMapObject = this.plugins.getAllSubReducers();
        const seqPartReducers: ReducersMapObject = this.seqParts.getAllSubReducers();

        const subReducers: ReducersMapObject = this.getSubReducer(pluginReducers, seqPartReducers);
        const reducerTree: Reducer = this.getCompleteReducer(rootReducer, subReducers);

        store.replaceReducer(reducerTree);
    }

    private getSubReducer(...subReducers: ReducersMapObject[]): ReducersMapObject {
        return Object.assign({}, ...subReducers);
    }

    private getCompleteReducer(rootReducer: Reducer, subReducers: ReducersMapObject): Reducer {
        return combineReducersWithRoot(subReducers, rootReducer);
    }
}
