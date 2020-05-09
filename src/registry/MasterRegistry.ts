import { AnyAction, Reducer, ReducersMapObject, ActionCreatorsMapObject } from "redux";
import { store } from "../store/store";
import combineReducersWithRoot from "./combineReducersWithRoot";
import SeqPartRegistry from "./SeqPartRegistry";
import SeqPart from "../seqpart/SeqPart";
import PluginRegistry from "./PluginRegistry";
import { IPlugin } from "./interfaces";

/**
 * Calls the appropriate sub-registry
 * and builds the new state and reducer
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

    public addPlugin<P extends IPlugin>(pluginClass: new (ac: AudioContext) => P): string {

        try {
            const newPlugin: IPlugin = this.plugins.add(pluginClass);

            // build a new root reducer and replace the current one
            this.replaceReducer();

            // make the new item observe the store
            newPlugin.unsubscribe = this.seqParts.observeStore(
                store,
                newPlugin,
            );
            return newPlugin.uid;
        } catch (error) {
            // not implemented yet
            console.log(error)
            return "";
        }
    }

    public removePlugin(itemId: string): void {
        try {
            this.plugins.remove(itemId);
            this.replaceReducer();
            store.dispatch({ type: "REMOVE", payload: itemId});
        } catch (error) {
            console.log(error)
            // not implemented yet
        }
    }

    public addSeqPart(lengthInStepsPerBar?: number): string {
        try {
            let newPart: SeqPart;

            // add new item to the seqPart Registry
            if (lengthInStepsPerBar) {
                newPart = this.seqParts.add(lengthInStepsPerBar);
            } else {
                newPart = this.seqParts.add();
            }

            // build a new root reducer and replace the current one
            this.replaceReducer();

            // make the new item observe the store
            newPart.unsubscribe = this.seqParts.observeStore(
                store,
                newPart,
            );

            return newPart.uid;
        } catch (error) {
            // not implemented yet
            console.log(error)
            return "";
        }
    }

    public removeSeqPart(itemId: string): void {
        try {
            this.seqParts.remove(itemId);
            this.replaceReducer();
            store.dispatch({ type: "REMOVE", payload: itemId });
        } catch (error) {
            console.log(error)
            // not implemented yet
        }
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
        const pluginReducer: ReducersMapObject = this.plugins.getAllSubReducers();
        const seqPartReducer: ReducersMapObject = this.seqParts.getAllSubReducers();

        const subReducers: ReducersMapObject = this.getSubReducer(pluginReducer, seqPartReducer);
        const rootReducer: Reducer = this.getRootReducer();
        const reducerTree: Reducer = this.getCompleteReducer(rootReducer, subReducers);

        store.replaceReducer(reducerTree);
    }

    private getSubReducer(...subReducers: ReducersMapObject[]): ReducersMapObject {
        return Object.assign({}, ...subReducers);
    }

    /**
     * Builds the root reducer with handlers that can operate
     * on the root state. Use with combineReducersWithRoot().
     */
    private getRootReducer(): Reducer {
        return (state = {}, action: AnyAction): void => {
            if (action.type === "REMOVE" &&
                state.hasOwnProperty(action.payload)) {
                const newState = JSON.parse(JSON.stringify(state));
                delete newState[action.payload];
                return newState;
            }
            return state;
        };
    }

    private getCompleteReducer(rootReducer: Reducer, subReducers: ReducersMapObject): Reducer {
        return combineReducersWithRoot(
            subReducers,
            rootReducer,
        );
    }

}
