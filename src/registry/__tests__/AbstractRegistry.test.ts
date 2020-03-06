import { ActionCreatorsMapObject, Reducer, Store } from "redux";
import AbstractRegistry from "../AbstractRegistry";
import { IAction, IActionDef, IActionHandlerMap, IRegistryItem, IState, Tuple } from "../interfaces";
import RegistryItemList from "../RegistryItemList";

// tslint:disable: max-classes-per-file

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

test("observeStore", () => {
    // nothing yet
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

test("creates a reducer for the sub-state", () => {
    // nothing yet
});
