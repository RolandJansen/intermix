import SeqPart from "../../seqpart/SeqPart";
import { store } from "../../store/store";
import { IState, IOscAction } from "../interfaces";
import SeqPartRegistry from "../SeqPartRegistry";

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
        expect(acKeys).toContain("addNote");
        expect(acKeys).toContain("deleteNote");
    });

    test("adds unbound action creators to the plugin instance", () => {
        const acKeys = Object.keys(testPart.unboundActionCreators);
        expect(acKeys).toContain("addNote");
    });

    test("action creators are bound to store.dispatch()", () => {
        const testPayload = ["note", 23, 5, 0.5, 0.5];
        const action: IOscAction = {
            address: `/intermix/seqpart/${testPart.uid}/addNote`,
            typeTag: ",siiff",
            type: "addNote",
            payload: testPayload,
        };

        testPart.actionCreators.addNote(testPayload);
        expect(store.dispatch as jest.Mock).toHaveBeenCalledWith(action);
    });

    test("unbound action creators are not bound to store.dispatch()", () => {
        const testPayload = ["note", 23, 5, 0.5, 0.5];
        const action: IOscAction = {
            address: `/intermix/seqpart/${testPart.uid}/addNote`,
            typeTag: ",siiff",
            type: "addNote",
            payload: testPayload,
        };

        testPart.unboundActionCreators.addNote(testPayload);
        expect(store.dispatch as jest.Mock).not.toHaveBeenCalledWith(action);
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
