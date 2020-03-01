import { ActionCreatorsMapObject, AnyAction, bindActionCreators, Reducer, ReducersMapObject, Store } from "redux";
import SeqPart from "../seqpart/SeqPart";
import SeqPartActionDefs from "../seqpart/SeqPartActionDefs";
import { store } from "../store/store";
import AbstractRegistry from "./AbstractRegistry";
import combineReducersWithRoot from "./combineReducersWithRoot";
import { GetChanged, IAction, IActionDef, IActionHandlerMap, IState, Payload, Select, Tuple } from "./interfaces";
import SeqPartList from "./SeqPartList";

export default class SeqPartRegistry extends AbstractRegistry {

    private partList: SeqPartList;

    public constructor() {
        super();
        this.partList = new SeqPartList();
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
        const uid = this.partList.add(newPart);

        // build action creators
        const actionCreators = this.getActionCreators(SeqPartActionDefs, uid);
        newPart.actionCreators = actionCreators;

        // bind action creators to dispatch
        const boundActionCreators = bindActionCreators(actionCreators, store.dispatch);
        newPart.boundActionCreators = boundActionCreators;

        // build initial state
        const iState: IState = this.getInitialState(SeqPartActionDefs, uid);

        // build reducers
        const newReducer = this.getNewReducer(SeqPartActionDefs, iState);

        // build a new root reducer that handles the
        // plugin state and replace the current one.
        this.replaceReducer(this.getRootReducer());

        // make it observe the store
        newPart.unsubscribe = this.observeStore(
            store,
            this.selectSubState,
            this.getChanged,
            newPart,
        );

        return uid;
    }

    public remove(uid: string) {
        const oldPart: SeqPart = this.partList.getPart(uid);

        // trigger the parts unsubscribe method (decouple from dispatch)
        oldPart.unsubscribe();

        // remove from partList
        this.partList.remove(uid);

        // remove reducers from root reducer
        this.replaceReducer(this.getRootReducer());

        // remove part from store
        store.dispatch({ type: "REMOVE", payload: uid });
    }

    /* basically the same as in Registry */
    private observeStore(st: Store, selectSubState: Select, getChanged: GetChanged, newPart: SeqPart): () => void {
        const uid = newPart.uid;
        const onChange = newPart.onChange.bind(newPart);
        let currentState: IState = {};

        function handleChange() {
            const nextState: IState = selectSubState(st.getState(), uid);

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

    /* basically the same as in Registry */
    private selectSubState(globalState: IState, uid: string) {
        if (globalState.hasOwnProperty(uid)) {
            return globalState[uid];
        }
        throw new Error(`SeqPart with ID ${uid} not found in state object.`);
    }

    /* exactly the same as in Registry */
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

    private getActionCreators(actionDefs: IActionDef[], partId: string): ActionCreatorsMapObject {
        const actionCreators: ActionCreatorsMapObject = {};

        actionDefs.forEach((actionDef) => {
            actionCreators[actionDef.type] = (payload: Payload): IAction => {
                return {
                    type: actionDef.type,
                    dest: partId,
                    payload,
                };
            };
        });
        return actionCreators;
    }

    /* very close to getNewPluginReducer in Registry */
    // private getNewPartReducer(actionDefs: IActionDef[], uid: string) {
    //     const handlers = this.getActionHandlers(actionDefs);
    //     const initState: IState = this.getInitialState(actionDefs, uid);
    //     return this.getNewReducer(handlers, initState);
    // }

    /* exactly like in Registry */
    private getNewReducer(actionDefs: IActionDef[], initialState: IState): Reducer {
        const actionHandlers: IActionHandlerMap = this.getActionHandlers(actionDefs);

        return (state = initialState, action: AnyAction | IAction) => {
            if (state.uid === action.dest && actionHandlers.hasOwnProperty(action.type)) {
                const handler = actionHandlers[action.type];
                const newState = handler(state, action);
                return newState;
            }
            return state;
        };
    }

    /* exactly like in Registry */
    private getActionHandlers(actionDefs: IActionDef[]): IActionHandlerMap {
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

    /* nearly the same like in Registry */
    private getInitialState(actionDefs: IActionDef[], uid: string): IState {
        const iState: IState = {};

        iState.uid = uid;  // readonly field
        actionDefs.forEach((actionDef) => {
            iState[actionDef.type] = actionDef.defVal;
        });

        return iState;
    }

    /* same idea like Registry but changed code */
    private replaceReducer(rootReducer: Reducer) {
        const subReducers: ReducersMapObject = {};
        const allSeqPartUids = this.partList.getUidList();

        allSeqPartUids.forEach((uid: string) => {
            const part = this.partList.getPart(uid);
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
