import SeqPart from "../../seqpart/SeqPart";
import { store } from "../../store/store";
import { IState, IAction } from "../interfaces";
import SeqPartRegistry from "../SeqPartRegistry";

// tslint:disable: no-string-literal
// We use string-literals to test private functions like:
// objectName["privateMethod"](parameters)
// Normally this could be considered as bad style ("test API only")
// but here we want to check the values of private fields to
// check the result of certain api calls.

// instruct Jest to use the mock class
// instead of the real one globaly.
jest.mock("../../store/store");

let globalState: IState;
let registry: SeqPartRegistry;
let testPart: SeqPart;

beforeEach(() => {
    globalState = {};

    // can't use mockReturnValue here cause it
    // handles its argument like a constant
    (store.getState as jest.Mock).mockImplementation(() => globalState);

    // subscribe must return some function to meet the typedef
    (store.subscribe as jest.Mock).mockReturnValue(() => true);

    registry = new SeqPartRegistry();
    testPart = registry.add();
});

describe("add", () => {

    test("creates a seqPart with standard length (16)", () => {
        expect(testPart.length).toEqual(64);
    });

    test("creates a seq part with variable length", () => {
        const customPart = registry.add(24);
        expect(customPart.length).toEqual(96);
    });

    test("adds action creator functions to the SeqPart instance", () => {
        const acKeys = Object.keys(testPart.actionCreators);
        expect(acKeys).toContain("ADD_ACTION");
        expect(acKeys).toContain("REMOVE_ACTION");
    });

    test("adds unbound action creators to the plugin instance", () => {
        const acKeys = Object.keys(testPart.unboundActionCreators);
        expect(acKeys).toContain("ADD_ACTION");
    });

    test("action creators are bound to store.dispatch()", () => {
        const testPayload = { msg: "hello" };
        const action: IAction = {
            listener: testPart.uid,
            type: "ADD_ACTION",
            payload: testPayload,
        }

        testPart.actionCreators.ADD_ACTION(testPayload);
        expect((store.dispatch as jest.Mock)).toHaveBeenCalledWith(action);
    });

    test("unbound action creators are not bound to store.dispatch()", () => {
        const testPayload = 23;
        const action: IAction = {
            listener: testPart.uid,
            type: "ADD_ACTION",
            payload: testPayload,
        }

        testPart.unboundActionCreators.ADD_ACTION(testPayload);
        expect((store.dispatch as jest.Mock)).not.toHaveBeenCalledWith(action);
    });

});

describe("remove", () => {

    beforeEach(() => {
        jest.spyOn(testPart, "unsubscribe");
    });

    test("calls the unsubscribe method of the seq part", () => {
        registry.remove(testPart.uid);
        expect(testPart.unsubscribe).toHaveBeenCalled();
    });

    test("removes the seq part from this registry", () => {
        const uidList = registry["itemList"].getUidList();
        expect(uidList).toContain(testPart.uid);

        registry.remove(testPart.uid);
        const newUidList = registry["itemList"].getUidList();
        expect(newUidList).not.toContain(testPart.uid);
    });
});
