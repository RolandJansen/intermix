import { ActionCreatorsMapObject, AnyAction, Reducer, ReducersMapObject, Store } from "redux";
import { store } from "../store/store";
import {
    IAction,
    IActionDef,
    IActionHandlerMap,
    IRegistryItem,
    IState,
    Payload,
    Tuple,
    IPlugin,
} from "./interfaces";
import RegistryItemList from "./RegistryItemList";

export default abstract class AbstractRegistry {

    protected abstract itemList: RegistryItemList<IRegistryItem>;

    public abstract add(optionalParameter?: any): IRegistryItem;
    public abstract remove(itemId: string): void;

    public getAllSubReducers(): ReducersMapObject {
        const subReducers: ReducersMapObject = {};
        const allUids = this.itemList.getUidList();

        allUids.forEach((uid: string) => {
            const item: IRegistryItem = this.itemList.getItem(uid);
            const initState: IState = this.getInitialState(item.actionDefs, uid);
            subReducers[uid] = this.getSubReducer(item.actionDefs, initState);
        });

        return subReducers;
    }

    /**
     * Subscribes an item to the store. The function that will
     * be called by the store invokes the onChange handler of the registered item.
     * This should be the only intermix function that subscribes to the store.
     * For details see:
     * https://github.com/reduxjs/redux/issues/303#issuecomment-125184409
     * @param st Instance of the store that keeps the state
     * @param newObserver The item to be registered
     */
    public observeStore<T extends IRegistryItem>(st: Store, newObserver: T): () => void {
        const selectSubState = this.selectSubState;
        const getChanged = this.getChanged;

        const uid = newObserver.uid;
        const onChange = newObserver.onChange.bind(newObserver);
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

    /**
     * Returns the sub state of a plugin from the global state object
     * @param globalState The global state object from redux store
     * @param uid Unique id of the item
     */
    protected selectSubState(globalState: IState, uid: string) {
        if (globalState.hasOwnProperty(uid)) {
            return globalState[uid];
        }
        throw new Error(`Item with ID ${uid} not found in state object.`);
    }

    /**
     * Determines which value has been changed between
     * two successive states. Only works with flat states.
     * @param currentState Original item state
     * @param nextState Changed item state
     */
    protected getChanged(currentState: IState, nextState: IState): Tuple {
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
     * Creates action creator functions from an object with
     * action definitions.
     * @param actionDefs Object with action definitions
     * @param uid The unique id of the item that gets registered
     */
    protected getActionCreators(actionDefs: IActionDef[], uid: string): ActionCreatorsMapObject {
        const actionCreators: ActionCreatorsMapObject = {};

        actionDefs.forEach((actionDef) => {
            actionCreators[actionDef.type] = (payload: Payload): IAction => {
                return {
                    type: actionDef.type,
                    dest: uid,
                    payload,
                };
            };
        });
        return actionCreators;
    }

    /**
     * A generic way to build a reducer with pre-defined handlers.
     * These handlers get called according to a lookup table and
     * they do the real work.
     * This approach is explained in detail in the redux doc section
     * "Reducing Boilerplate".
     * @param initialState Initial state of the sub-state-tree for this reducer
     * @param handlers Lookup table: action-types -> handlers
     */
    protected getSubReducer(actionDefs: IActionDef[], initialState: IState): Reducer {
        const actionHandlers: IActionHandlerMap = this.getActionHandlers(actionDefs);

        return (state: IState = initialState, action: AnyAction | IAction) => {
            if (state.uid === action.dest && actionHandlers.hasOwnProperty(action.type)) {
                const handler = actionHandlers[action.type];
                const newState = handler(state, action);
                return newState;
            }
            return state;
        };
    }

    /**
     * Generates an object mapping from action-types to the handlers
     * that will be used to auto-generate reducers. See:
     * https://redux.js.org/recipes/reducingboilerplate#generating-reducers
     * @param actionDefs An array of action definitions (see IActionDef)
     */
    protected getActionHandlers(actionDefs: IActionDef[]): IActionHandlerMap {
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
     * Generates the initial state for a registry item from
     * its ActionDef object.
     */
    protected getInitialState(actionDefs: IActionDef[], uid: string): IState {
        const iState: IState = {};

        iState.uid = uid;  // readonly field
        actionDefs.forEach((actionDef) => {
            iState[actionDef.type] = actionDef.defVal;
        });

        return iState;
    }

}
