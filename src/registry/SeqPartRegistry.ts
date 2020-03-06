import { ActionCreatorsMapObject, AnyAction, bindActionCreators, Reducer, ReducersMapObject, Store } from "redux";
import SeqPart from "../seqpart/SeqPart";
import SeqPartActionDefs from "../seqpart/SeqPartActionDefs";
import { store } from "../store/store";
import AbstractRegistry from "./AbstractRegistry";
import combineReducersWithRoot from "./combineReducersWithRoot";
import { GetChanged, IAction, IActionDef, IActionHandlerMap, IState, Payload, Select, Tuple } from "./interfaces";
import RegistryItemList from "./RegistryItemList";

export default class SeqPartRegistry extends AbstractRegistry {

    protected itemList: RegistryItemList<SeqPart>;

    public constructor() {
        super();
        this.itemList = new RegistryItemList<SeqPart>();
    }

    public add(lengthInStepsPerBar?: number): string {
        // create the new part
        let newPart: SeqPart;
        if (lengthInStepsPerBar) {
            newPart = new SeqPart(lengthInStepsPerBar);
        } else {
            newPart = new SeqPart();
        }

        // add to partList
        const uid = this.itemList.add(newPart);

        // build action creators
        const actionCreators = this.getActionCreators(SeqPartActionDefs, uid);
        newPart.unboundActionCreators = actionCreators;

        // bind action creators to dispatch
        newPart.actionCreators = bindActionCreators(actionCreators, store.dispatch);

        // build a new root reducer that handles the
        // plugin state and replace the current one.
        this.replaceReducer(this.getRootReducer());

        // make it observe the store
        newPart.unsubscribe = this.observeStore(
            store,
            newPart,
        );

        return uid;
    }

    public remove(uid: string) {
        const oldPart: SeqPart = this.itemList.getItem(uid);

        // trigger the parts unsubscribe method (decouple from dispatch)
        oldPart.unsubscribe();

        // remove from partList
        this.itemList.remove(uid);

        // remove reducers from root reducer
        this.replaceReducer(this.getRootReducer());

        // remove part from store
        store.dispatch({ type: "REMOVE", payload: uid });
    }

    /* basically the same as in Registry */
    // private observeStore(st: Store, selectSubState: Select, getChanged: GetChanged, newPart: SeqPart): () => void {
    //     const uid = newPart.uid;
    //     const onChange = newPart.onChange.bind(newPart);
    //     let currentState: IState = {};

    //     function handleChange() {
    //         const nextState: IState = selectSubState(st.getState(), uid);

    //         // check by reference that
    //         // both objects are different
    //         if (nextState !== currentState) {
    //             const changed = getChanged(currentState, nextState);
    //             currentState = nextState;
    //             onChange(changed);
    //         }
    //     }

    //     const unsubscribe = store.subscribe(handleChange);
    //     handleChange();  // invoke the function once to set currentState
    //     return unsubscribe;
    // }

    /* same idea like Registry but changed code */
    private replaceReducer(rootReducer: Reducer) {
        const subReducers: ReducersMapObject = {};
        const allSeqPartUids = this.itemList.getUidList();

        allSeqPartUids.forEach((uid: string) => {
            const part = this.itemList.getItem(uid);
            const initState: IState = this.getInitialState(SeqPartActionDefs, uid);
            subReducers[uid] = this.getNewReducer(SeqPartActionDefs, initState);
        });

        const reducer = combineReducersWithRoot(
            subReducers,
            rootReducer,
        );

        store.replaceReducer(reducer);
    }

    /* exact copy of Registry function */
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

    private addToStore() {
        return true;
    }

    private removeFromStore() {
        return true;
    }

}
