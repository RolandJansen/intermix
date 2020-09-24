/// <reference path="../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import PluginRegistry from "../PluginRegistry";
import { IPlugin, IState, IAction, IOscActionDef, IOscAction } from "../interfaces";
import TestController from "../../plugins/TestController";
import TestInstrument from "../../plugins/TestInstrument";
import { store } from "../../store/store";
import commonActionDefs from "../../registry/commonActionDefs";

// instruct Jest to use the mock class
// instead of the real one globaly.
jest.mock("../../store/store");

let globalState: IState;
let ac: AudioContext;
let registry: PluginRegistry;
let testPlugin: IPlugin;

beforeEach(() => {
    globalState = {
        plugins: [],
        seqparts: [],
    };

    // can't use mockReturnValue here cause it
    // handles its argument like a constant
    (store.getState as jest.Mock).mockImplementation(() => globalState);

    // subscribe must return some function to meet the typedef
    (store.subscribe as jest.Mock).mockReturnValue(() => true);

    ac = new AudioContext();
    registry = new PluginRegistry(ac);
    testPlugin = registry.add(TestInstrument);
});

describe("add", () => {
    test("creates a plugin instance", () => {
        expect(testPlugin.uid.length).toBeGreaterThan(0);
    });

    test("adds action defs for common actions to the plugin instance", () => {
        const noteAction: IOscActionDef = commonActionDefs[0];
        expect(testPlugin.actionDefs).toContainEqual(noteAction);
    });

    test("populates the initState", () => {
        expect(testPlugin.initState.inputCount).toEqual(0);
        expect(testPlugin.initState.outputCount).toEqual(1);
        expect(testPlugin.initState.inputs).toHaveLength(0);
        expect(testPlugin.initState.outputs).toHaveLength(1);
    });

    test("output nodes get connected to output by default", () => {
        const out1Dest = testPlugin.initState.outputs[0];
        expect(out1Dest).toEqual("destination");
    });

    test("adds action creator functions to the plugin instance", () => {
        const acKeys = Object.keys(testPlugin.actionCreators);
        expect(acKeys).toContain("ACTION1");
        expect(acKeys).toContain("ACTION2");
    });

    test("adds unbound action creators to the plugin instance", () => {
        const acKeys = Object.keys(testPlugin.unboundActionCreators);
        expect(acKeys).toContain("ACTION1");
        expect(acKeys).toContain("ACTION2");
    });

    test("action creators are bound to store.dispatch()", () => {
        const testPayload = 23;
        const action: IOscAction = {
            address: `/intermix/plugin/${testPlugin.uid}/ACTION1`,
            typeTag: ",i",
            type: "ACTION1",
            payload: testPayload,
        };

        testPlugin.actionCreators.ACTION1(testPayload);
        expect(store.dispatch as jest.Mock).toHaveBeenCalledWith(action);
    });

    test("unbound action creators are not bound to store.dispatch()", () => {
        const testPayload = 23;
        const action: IAction = {
            listener: testPlugin.uid,
            type: "ACTION1",
            payload: testPayload,
        };

        testPlugin.unboundActionCreators.ACTION1(testPayload);
        expect(store.dispatch as jest.Mock).not.toHaveBeenCalledWith(action);
    });

    test("implements the sendAction method for controller plugins", () => {
        const testController: IPlugin = registry.add(TestController);
        const action: IAction = {
            listener: testPlugin.uid,
            type: "ACTION_UNKNOWN",
            payload: 23,
        };

        testController.sendAction(action);
        expect(store.dispatch as jest.Mock).toHaveBeenCalledWith(action);
    });

    // skipping wireAudio tests because they will be obsolete by v0.6.0
});

describe("remove", () => {
    beforeEach(() => {
        jest.spyOn(testPlugin, "unsubscribe");
    });

    test("calls the unsubscribe method of the plugin", () => {
        registry.remove(testPlugin.uid);
        expect(testPlugin.unsubscribe).toHaveBeenCalled();
    });

    test("removes the plugin from this registry", () => {
        const uidList = registry.getUidList();
        expect(uidList).toContain(testPlugin.uid);

        registry.remove(testPlugin.uid);
        const newUidList = registry.getUidList();
        expect(newUidList).not.toContain(testPlugin.uid);
    });
});
