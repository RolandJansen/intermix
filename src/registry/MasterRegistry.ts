import { AnyAction, Reducer, ReducersMapObject } from "redux";
import { store } from "../store/store";
import AbstractRegistry from "./AbstractRegistry";
import combineReducersWithRoot from "./combineReducersWithRoot";
import Registry from "./Registry";
import SeqPartRegistry from "./SeqPartRegistry";
import SeqPart from "../seqpart/SeqPart";
import PluginRegistry from "./PluginRegistry";

/**
 * Calls the appropriate sub-registry
 * and builds the new state and reducer
 */
export default class MasterRegistry {

    private plugins: PluginRegistry;
    private seqParts: SeqPartRegistry;

    public constructor(ac: AudioContext) {
        this.plugins = new PluginRegistry(ac);
        this.seqParts = new SeqPartRegistry();
    }

    public addPlugin() {
        try {
            // not implemented yet
        } catch (error) {
            // not implemented yet
        }
    }

    public removePlugin() {
        try {
            // not implemented yet
        } catch (error) {
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
            this.replaceReducer(this.seqParts);

            // make it observe the store
            newPart.unsubscribe = this.seqParts.observeStore(
                store,
                newPart,
            );

            return newPart.uid;
        } catch (error) {
            // not implemented yet
        }
    }

    public removeSeqPart(uid: string) {
        try {
            this.seqParts.remove(uid);
            this.replaceReducer(this.seqParts);
            store.dispatch({ type: "REMOVE", payload: uid });
        } catch (error) {
            // not implemented yet
        }
    }

    /**
     * Combines all sub reducers with the root reducer
     * and replaces the current reducer
     */
    protected replaceReducer<T extends AbstractRegistry>(itemRegistry: T) {
        const seqPartReducer: ReducersMapObject = itemRegistry.getAllSubReducers();

        const subReducers: ReducersMapObject = this.getSubReducer(seqPartReducer);
        const rootReducer: Reducer = this.getRootReducer();
        const reducerTree: Reducer = this.getCompleteReducer(rootReducer, subReducers);

        store.replaceReducer(reducerTree);
    }

    protected getSubReducer(...subReducers: ReducersMapObject[]): ReducersMapObject {
        return Object.assign({}, ...subReducers);
    }

    /**
     * Builds the root reducer with handlers that can operate
     * on the root state. Use with combineReducersWithRoot().
     */
    protected getRootReducer(): Reducer {
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

    private getCompleteReducer(rootReducer: Reducer, subReducers: ReducersMapObject): Reducer {
        return combineReducersWithRoot(
            subReducers,
            rootReducer,
        );
    }

}
