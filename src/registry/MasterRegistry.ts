import { AnyAction, Reducer, ReducersMapObject } from "redux";
import { store } from "../store/store";
import combineReducersWithRoot from "./combineReducersWithRoot";
import Registry from "./Registry";
import SeqPartRegistry from "./SeqPartRegistry";

/**
 * Calls the appropriate sub-registry
 * and builds the new state and reducer
 */
export default class MasterRegistry {

    private plugins: Registry;
    private seqParts: SeqPartRegistry;

    public constructor(ac: AudioContext) {
        this.plugins = new Registry(ac);
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
            let uid: string;

            if (lengthInStepsPerBar) {
                uid = this.seqParts.add(lengthInStepsPerBar);
            } else {
                uid = this.seqParts.add();
            }
            this.replaceReducer();

            return uid;
        } catch (error) {
            // not implemented yet
        }
    }

    public removeSeqPart(uid: string) {
        try {
            this.seqParts.remove(uid);
            this.replaceReducer();
            store.dispatch({ type: "REMOVE", payload: uid });
        } catch (error) {
            // not implemented yet
        }
    }

    /**
     * Combines all sub reducers with the root reducer
     * and replaces the current reducer
     */
    protected replaceReducer() {
        const seqPartReducer: ReducersMapObject = this.seqParts.getAllSubReducers();

        const subReducer: ReducersMapObject = this.getSubReducer(seqPartReducer);
        const rootReducer: Reducer = this.getRootReducer();
        const reducerTree: Reducer = this.getCompleteReducer(rootReducer, subReducer);

        store.replaceReducer(reducerTree);
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

    protected getSubReducer(...subReducers: ReducersMapObject[]): ReducersMapObject {
        return Object.assign({}, ...subReducers);
    }

    private getCompleteReducer(rootReducer: Reducer, subReducers: ReducersMapObject): Reducer {
        return combineReducersWithRoot(
            subReducers,
            rootReducer,
        );
    }

}
