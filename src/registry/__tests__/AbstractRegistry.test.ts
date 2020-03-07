import { ActionCreatorsMapObject, Reducer, Store } from "redux";
import { store } from "../../store/store";
// tslint:disable: max-classes-per-file
import AbstractRegistry from "../AbstractRegistry";
import { IAction, IActionDef, IActionHandlerMap, IRegistryItem, IState, Tuple } from "../interfaces";
import RegistryItemList from "../RegistryItemList";

// instruct Jest to use the mock class
// instead of the real one globaly.
jest.mock("../../store/store");

/**
 * A bare RegistryItem so we don't depend on
 * real world code
 */
class TestItem implements IRegistryItem {
    public uid: string = "";

    public readonly actionDefs: IActionDef[] = [
        {
            type: "ACTION1",
            desc: "Does nothing",
            defVal: 23,
        },
        {
            type: "ACTION2",
            desc: "Does nothing also",
            defVal: 42,
        },
    ];
    public actionCreators: ActionCreatorsMapObject = {};
    public unboundActionCreators: ActionCreatorsMapObject = {};

    public onChange(changed: Tuple): boolean {
        return true;
    }

    public unsubscribe() {
        // will be overridden by the registry
    }
}

/**
 * A bare registry class that extends
 * AbstractRegistry and becomes the
 * object under test.
 */
class TestRegistry extends AbstractRegistry {
    public itemList: RegistryItemList<TestItem>;

    constructor() {
        super();
        this.itemList = new RegistryItemList();
    }

    public add(): string {
        const newItem = new TestItem();
        const uid = this.itemList.add(newItem);
        return uid;
    }

    public remove(uid: string) {
        this.itemList.remove(uid);
    }

    public selectSubState_Test(globalState: IState, uid: string): IState {
        return this.selectSubState(globalState, uid);
    }

    public getChanged_Test(currentState: IState, nextState: IState): Tuple {
        return this.getChanged(currentState, nextState);
    }

    public observeStore_Test(st: Store, newObserver: TestItem): () => void {
        return this.observeStore(st, newObserver);
    }

    public getActionCreators_Test(adefs: IActionDef[], uid: string): ActionCreatorsMapObject {
        return this.getActionCreators(adefs, uid);
    }

    public getInitialState_Test(actionDefs: IActionDef[], uid: string): IState {
        return this.getInitialState(actionDefs, uid);
    }

    public getActionHandlers_Test(actionDefs: IActionDef[]): IActionHandlerMap {
        return this.getActionHandlers(actionDefs);
    }

    public getNewReducer_Test(actionDefs: IActionDef[], initialState: IState): Reducer {
        return this.getNewReducer(actionDefs, initialState);
    }
}

const testState = {
    ACTION1: 5,
    ACTION2: 6,
};
let registry: TestRegistry;
let testItem: TestItem;
let testItemUid: string;

beforeEach(() => {
    registry = new TestRegistry();
    testItemUid = registry.add();
    testItem = registry.itemList.getItem(testItemUid);
});

test("creates action creators from action defs", () => {
    const adefs = testItem.actionDefs;
    const actionCreators = registry.getActionCreators_Test(adefs, testItemUid);
    const action: IAction = actionCreators.ACTION1(555);
    expect(action.type).toMatch("ACTION1");
    expect(action.dest).toMatch(testItemUid);
    expect(action.payload).toEqual(555);
});

test("builds the initial state from action defs", () => {
    const iniState: IState = registry.getInitialState_Test(testItem.actionDefs, testItemUid);
    expect(iniState.uid).toMatch(testItemUid);
    expect(iniState.ACTION1).toEqual(23);
    expect(iniState.ACTION2).toEqual(42);
});

test("creates action handlers (sub reducers)", () => {
    const handlers = registry.getActionHandlers_Test(testItem.actionDefs);
    const newState1 = handlers.ACTION1(testState, {
        type: "ACTION1",
        payload: 23,
    });
    expect(newState1.ACTION1).toEqual(23);
    expect(testState.ACTION1).toEqual(5);  // old state shouldn't be altered
});

describe("getNewReducer -> reducer", () => {

    let iniState: IState;
    let adefs: IActionDef[];
    let testReducer: Reducer;

    beforeEach(() => {
        iniState = Object.assign({}, testState, { uid: testItemUid });
        adefs = testItem.actionDefs;
        testReducer = registry.getNewReducer_Test(adefs, iniState);
    });

    test("returns the initial state if called with no args", () => {
        const returnedState = testReducer(undefined, { type: "" });
        expect(returnedState).toEqual(iniState);
    });

    test("returns the original state if called with unknown action", () => {
        expect(testReducer(iniState, { type: "" })).toEqual(iniState);
    });

    test("returns the original state if action.dest doesn't match", () => {
        expect(testReducer(iniState, {
            dest: "123",
            type: "ACTION1",
            payload: 23,
        })).toEqual(iniState);
    });

    test("should handle ACTION1", () => {
        expect(testReducer([], {
            type: "ACTION1",
            payload: 23,
        })).toEqual({ ACTION1: 23 });
    });

    test("should handle ACTION2", () => {
        expect(testReducer([], {
            type: "ACTION2",
            payload: 23,
        })).toEqual({ ACTION2: 23 });
    });

    test("returns a new state if action is valid (copy by val)", () => {
        const newState = testReducer(iniState, {
            dest: testItemUid,
            type: "ACTION1",
            payload: 23,
        });
        expect(newState.ACTION1).toEqual(23);
        expect(iniState.ACTION1).toEqual(5);
    });

});

test("selectSubState throws if uid is not in state", () => {
    expect(() => {
        registry.selectSubState_Test(testState, "abcd");
    }).toThrow();
});

test("selectSubState returns the corresponding sub-state", () => {
    const subState = registry.selectSubState_Test(testState, "ACTION1");
    expect(subState).toEqual(5);
});

test("getChanged diffs two states and returns the changed value", () => {
    const nextState = Object.assign({}, testState, { ACTION2: { uid: 23 } });
    const changed = registry.getChanged_Test(testState, nextState);
    expect(changed[0]).toMatch("ACTION2");
    expect(changed[1]).toEqual({ uid: 23 });
});

test("getChanged returns an emtpy tuple if no change happened", () => {
    const nextState = Object.assign({}, testState);
    const changed = registry.getChanged_Test(testState, nextState);
    expect(changed[0]).toMatch("");
    expect(changed[1]).toMatch("");
});

describe("observeStore", () => {

    beforeEach(() => {
        const iniState = registry.getInitialState_Test(testItem.actionDefs, testItemUid);

        // tslint:disable-next-line: variable-name
        const globalState_Test = {
            [testItemUid]: iniState,
        };

        (store.getState as jest.Mock).mockImplementation(() => globalState_Test);
        (store.subscribe as jest.Mock).mockImplementation(() => {
            return () => true;
        });
        (store.subscribe as jest.Mock).mock.calls = []; // reset call history
    });

    test("subscribes to the store", () => {
        expect(store.subscribe).not.toHaveBeenCalled();
        registry.observeStore_Test(store, testItem);
        expect(store.subscribe).toHaveBeenCalled();
    });

    test("returns an unsubscribe function", () => {
        const unsubscribe = registry.observeStore_Test(store, testItem);
        expect(unsubscribe()).toBeTruthy();
    });
});
