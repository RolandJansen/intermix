import { Reducer, ReducersMapObject, ActionCreatorsMapObject } from "redux";
import { store } from "../store/store";
import combineReducersWithRoot from "./combineReducersWithRoot";
import SeqPartRegistry from "./SeqPartRegistry";
import SeqPart from "../seqpart/SeqPart";
import PluginRegistry from "./PluginRegistry";
import { IPlugin } from "./interfaces";
import rootReducer from "../store/rootReducer";
import { addPlugin, addPart, removePlugin, removePart } from "../store/rootActions";

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

    public constructor(ac: AudioContext) {
        this.plugins = new PluginRegistry(ac);
        this.seqParts = new SeqPartRegistry();
    }

    public addPlugin<P extends IPlugin>(pluginClass: new (itemId: string, ac: AudioContext) => P): string {
        // try {
        // console.log(store.getState());
        const newPlugin: IPlugin = this.plugins.add(pluginClass);
        // console.log("new plugin added: " + newPlugin.uid);

        // build a new root reducer and replace the current one
        this.replaceReducer();

        store.dispatch(addPluginAction(newPlugin.uid));

        // make the new item observe the store
        newPlugin.unsubscribe = this.seqParts.observeStore(store, newPlugin);
        return newPlugin.uid;
        // } catch (error) {
        //     // not implemented yet
        //     console.log(error);
        //     return "";
        // }
    }

    public removePlugin(itemId: string): void {
        // try {
        this.plugins.remove(itemId);
        this.replaceReducer();
        store.dispatch(removePluginAction(itemId));
        // } catch (error) {
        //     console.log(error);
        //     // not implemented yet
        // }
    }

    public addSeqPart(lengthInStepsPerBar?: number): string {
        // try {
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
        // } catch (error) {
        //     // not implemented yet
        //     console.log(error);
        //     return "";
        // }
    }

    public removeSeqPart(itemId: string): void {
        // try {
        this.seqParts.remove(itemId);
        this.replaceReducer();
        store.dispatch(removePart(itemId));
        // } catch (error) {
        //     console.log(error);
        //     // not implemented yet
        // }
    }

    // this is probably not the best idea
    public getSeqPart(itemId: string): SeqPart {
        return this.seqParts.itemList.getItem(itemId);
    }

    public getActionCreators(itemId: string, bound?: string): ActionCreatorsMapObject {
        const pluginKeys = this.plugins.itemList.getUidList();
        const seqPartKeys = this.seqParts.itemList.getUidList();
        const actionCreatorsType = bound === "unbound" ? "unboundActionCreators" : "actionCreators";
        let actionCreators: ActionCreatorsMapObject = {};

        if (pluginKeys.includes(itemId)) {
            const item = this.plugins.itemList.getItem(itemId);
            actionCreators = Object.assign({}, item[actionCreatorsType]);
        } else if (seqPartKeys.includes(itemId)) {
            const item = this.seqParts.itemList.getItem(itemId);
            actionCreators = Object.assign({}, item[actionCreatorsType]);
        }

        return actionCreators;
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
