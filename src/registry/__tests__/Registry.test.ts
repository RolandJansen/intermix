import { Reducer } from "redux";
import "web-audio-test-api";
import TestPlugin from "../../plugins/TestPlugin";
import { store } from "../../store/store";
import { IPlugin, IState } from "../interfaces";
import Registry from "../Registry";

// instruct Jest to use the mock class
// instead of the real one globaly.
jest.mock("../../store/store");

let registry: Registry;
let globalState: IState = {};
const ac = new AudioContext();
// const tempPlugin = new TestPlugin(ac);

beforeEach(() => {
    globalState = {};

    // doesn't attach reducers but builds the global state
    // (just plugins, root state is not of interest here)
    (store.replaceReducer as jest.Mock).mockImplementation((reducer: Reducer) => {
        globalState = reducer(undefined, { type: "ANY" });
    });

    // can't use mockReturnValue here cause it
    // handles its argument like a constant
    (store.getState as jest.Mock).mockImplementation(() => globalState);

    // subscribe must return a function to meet the typedef
    (store.subscribe as jest.Mock).mockReturnValue(() => true);

    registry = new Registry(ac);
});

describe("registerPlugin", () => {

    let plug: IPlugin;
    const pluginInitState: IState = { ACTION1: 0, ACTION2: 1 };

    beforeEach(() => {
        registry.registerPlugin(TestPlugin);
        plug = registry.pluginStore[0];
    });

    test("dumps a plugin instance to the pluginStore", () => {
        // this is pretty obvious but anyway...
        expect(registry.pluginStore.length).toEqual(1);
    });

    test("adds action creator functions to the plugin instance", () => {
        const acKeys = Object.keys(plug.actionCreators);
        expect(acKeys.length).toBe(2);
        expect(acKeys).toContain("ACTION1");
        expect(acKeys).toContain("ACTION2");
    });

    test("action creators are bound to store.dispatch()", () => {
        const action = {
            type: "ACTION1",
            payload: 23,
        };
        plug.actionCreators.ACTION1(23);
        expect((store.dispatch as jest.Mock)).toBeCalledWith(action);
    });

    test("Replaces the reducer in the store", () => {
        expect(store.replaceReducer).toBeCalled();
    });

    test("adds the initial state object to the plugin", () => {
        expect(plug.initState).toEqual(pluginInitState);
    });

    test("plugin subscribes to store changes", () => {
        expect(store.subscribe).toBeCalled();
    });

    test("adds an unsubscribe function to the plugin", () => {
        expect(plug.unsubscribe).toBeDefined();
        expect(typeof plug.unsubscribe).toBe("function");
    });

});

describe("unregisterPlugin", () => {

    let plug: IPlugin;

    beforeEach(() => {
        registry.registerPlugin(TestPlugin);
        plug = registry.pluginStore[0];
        jest.spyOn(plug, "unsubscribe");
    });

    test("calls the unsubscribe method of the plugin", () => {
        registry.unregisterPlugin(plug.uid);
        expect(plug.unsubscribe).toBeCalled();
    });

    test("removes the plugin from pluginStore", () => {
        registry.unregisterPlugin(plug.uid);
        expect(registry.pluginStore.length).toBe(0);
    });

//     // test("removes the corresponding subtree from store", () => {

//     // });

//     // test("removes all reducers from store", () => {

//     // });

//     test("returns true if successful", () => {
//         const result = registry.unregisterPlugin(plug.uid);
//         expect(result).toBeTruthy();
//     });

//     test("returns false if not succeeded", () => {
//         const result = registry.unregisterPlugin("asdf");
//         expect(result).toBeFalsy();
//     });
});
