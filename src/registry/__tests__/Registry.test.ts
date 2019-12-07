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
let globalState: IState;
let plug: IPlugin;
let plugUID: string;
const ac = new AudioContext();
const pluginInitState: IState = { ACTION1: 0, ACTION2: 1 };
let plugStaticState: IState;
let plugCompleteState: IState;

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

    // subscribe must return some function to meet the typedef
    (store.subscribe as jest.Mock).mockReturnValue(() => true);

    (store.replaceReducer as jest.Mock).mock.calls = []; // reset call history

    registry = new Registry(ac);
    registry.registerPlugin(TestPlugin);
    plug = registry.pluginStore[0];
    plugUID = plug.uid;

    plugStaticState = {
        uid: plugUID,
        NOTE: { value: 0, velocity: 1, steps: 0, duration: 0 },
    };
    plugCompleteState = Object.assign({}, plugStaticState, pluginInitState);
});

test("registry has a public member 'pluginStore'", () => {
    expect(registry.pluginStore).toBeDefined();
});

describe("registerPlugin", () => {

    test("creates and dumps a plugin instance to the pluginStore", () => {
        expect(registry.pluginStore.length).toEqual(1);
    });

    test("adds action creator functions to the plugin instance", () => {
        const acKeys = Object.keys(plug.actionCreators);
        expect(acKeys).toContain("ACTION1");
        expect(acKeys).toContain("ACTION2");
    });

    test("adds action creators for common actions to the plugin instance", () => {
        const acKeys = Object.keys(plug.actionCreators);
        expect(acKeys).toContain("NOTE");
    });

    test("action creators are bound to store.dispatch()", () => {
        const action = {
            type: "ACTION1",
            payload: 23,
            dest: plug.uid,
        };
        plug.actionCreators.ACTION1(23);
        expect((store.dispatch as jest.Mock)).toBeCalledWith(action);
    });

    test("Replaces the reducer in the store", () => {
        expect(store.replaceReducer).toBeCalledTimes(1);
    });

    test("adds the initial state object to the plugin", () => {
        expect(plug.initState).toEqual(plugCompleteState);
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

    beforeEach(() => {
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

    test("removes the corresponding subtree from store", () => {
        registry.unregisterPlugin(plug.uid);
        expect(store.getState()).toEqual({});
    });

    test("Replaces the reducer in the store", () => {
        registry.unregisterPlugin(plug.uid);
        expect(store.replaceReducer).toBeCalledTimes(2);
    });

    test("removes the plugin state from the global state", () => {
        const startState = { [plug.uid]: plugCompleteState };
        const removeAction = { type: "REMOVE", payload: plug.uid };
        (store.dispatch as jest.Mock).mock.calls = []; // reset call history
        expect(store.getState()).toEqual(startState);
        registry.unregisterPlugin(plug.uid);
        expect(store.dispatch).toBeCalledTimes(1);
        expect(store.dispatch).toBeCalledWith(removeAction);
        expect(store.getState()).toEqual({}); // this works cause reducer is empty
    });

    test("returns true if plugin was found in pluginStore", () => {
        const result = registry.unregisterPlugin(plug.uid);
        expect(result).toBeTruthy();
    });

    test("returns false if plugin was not found in pluginStore", () => {
        const result = registry.unregisterPlugin("asdf");
        expect(result).toBeFalsy();
    });
});
