/// <reference path="../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import MasterRegistry from "../MasterRegistry";
import TestInstrument from "../../plugins/TestInstrument";
import { IPlugin, IAction } from "../interfaces";
import { store } from "../../store/store";
import SeqPart from "../../seqpart/SeqPart";

// tslint:disable: no-string-literal
// We use string-literals to test private functions like:
// objectName["privateMethod"](parameters)
// Normally this could be considered as bad style ("test API only")
// but here we want to check the values of private fields to
// check the result of certain api calls.

// instruct Jest to use the mock class
// instead of the real one globaly.
// jest.mock("../../store/store");

let registry: MasterRegistry;
let ac: AudioContext;

beforeEach(() => {
    ac = new AudioContext();
    registry = new MasterRegistry(ac);

});

/**
 * In the following tests we use the real store. It will be
 * polluted by every test but it doesn't
 * matter as long as we just examine the
 * sub-state for the current test.
 */

describe("PluginRegistry", () => {
    let plugin: IPlugin;
    let pluginId: string;

    beforeEach(() => {
        pluginId = registry.addPlugin(TestInstrument);
        plugin = registry["plugins"]["itemList"].getItem(pluginId);
    })

    describe("addPlugin", () => {

        test("creates a new plugin instance from a given class", () => {
            expect(plugin.metaData.name).toMatch("Test-Instrument");
        })

        test("returns the instance id", () => {
            expect(pluginId).toMatch(plugin.uid);
        })

        test("adds an entry to the store", () => {
            const state = store.getState();
            expect(state[pluginId]).toBeDefined();
        })

        test("store entry contains the properties of the plugin", () => {
            const state = store.getState();
            expect(state[pluginId].ACTION1).toBe(0);
            expect(state[pluginId].ACTION2).toBe(1);
        })

        test("adds reducers for the plugin to the store", () => {
            const action1: IAction = {
                listener: pluginId,
                type: "ACTION1",
                payload: 23,
            }
            const action2: IAction = {
                listener: pluginId,
                type: "ACTION2",
                payload: 42,
            }

            store.dispatch(action1);
            store.dispatch(action2);

            const state = store.getState();
            expect(state[pluginId].ACTION1).toBe(23);
            expect(state[pluginId].ACTION2).toBe(42);
        })

        test("adds action creators to the plugin", () => {
            plugin.actionCreators.ACTION1(5);

            const state = store.getState();
            expect(state[pluginId].ACTION1).toBe(5);
        })

        test("subscribes the plugin to dispatch", () => {
            // we cannot spy on plugin.onChange as the
            // dispatcher would use the original method anyway.
            // Instead, testValue in the plugin can be checked.
            plugin.actionCreators.ACTION1(2342);
            expect(plugin.testValue[1]).toBe(2342);
        })
    })

    describe("removePlugin", () => {

        beforeEach(() => {
            jest.spyOn(plugin, "unsubscribe");
            registry.removePlugin(pluginId);
        });

        test("removes the plugin from the plugin registry", () => {
            const allPluginIds = registry["plugins"]["itemList"].getUidList();
            expect(allPluginIds).not.toContain(pluginId);
        })

        test("unsubscribes from dispatch", () => {
            // this is also tested in PluginRegistry.test but anyway
            expect(plugin.unsubscribe).toHaveBeenCalled();
        })

        test("removes the plugins reducers", () => {
            // we dispatch an action and assume that when
            // it doesn't alter the state, there is no
            // appropriate reducer present.
            const oldState = store.getState();
            plugin.actionCreators.ACTION1(237);
            const nextState = store.getState();
            expect(oldState).toEqual(nextState);
        })

        test("removes the plugins state from the store", () => {
            const state = store.getState();
            expect(state[pluginId]).not.toBeDefined();
        })

    })
})

describe("SeqPart Registry", () => {

    const payload = {
        step: 5,
        action: {
            type: "FANTASYACTION",
            payload: 23,
        }
    }

    let part: SeqPart;
    let partId: string;

    beforeEach(() => {
        partId = registry.addSeqPart();
        part = registry["seqParts"]["itemList"].getItem(partId);
    })

    describe("addSeqPart", () => {

        let action1: IAction;
        let action2: IAction;

        beforeEach(() => {
            action1 = {
                listener: partId,
                type: "ADD_ACTION",
                payload,
            }
            action2 = {
                listener: partId,
                type: "REMOVE_ACTION",
                payload,
            }
        })

        test("returns the instance id", () => {
            expect(partId).toMatch(part.uid);
        })

        test("adds an entry to the store", () => {
            const state = store.getState();
            expect(state[partId]).toBeDefined();
        })

        test("store entry contains sequencer part properties", () => {
            const state = store.getState();
            expect(state[partId].ADD_ACTION.step).toBe(0);
            expect(state[partId].REMOVE_ACTION.step).toBe(0);
        })

        test("adds reducers for the seqpart to the store", () => {
            store.dispatch(action1);
            store.dispatch(action2);

            const state = store.getState();
            expect(state[partId].ADD_ACTION).toEqual(payload);
            expect(state[partId].REMOVE_ACTION).toEqual(payload);
        })

        test("adds action creators to the part", () => {
            part.actionCreators.ADD_ACTION(payload);

            const state = store.getState();
            expect(state[partId].ADD_ACTION).toBe(payload);
        })

        test("subscribes the part to dispatch", () => {
            // there's no way to test this currently.
            // in the future we can send something
            // to the SeqPart but that's not implemented yet (in SeqPart).
        })

    })

    describe("removeSeqPart", () => {

        beforeEach(() => {
            jest.spyOn(part, "unsubscribe");
            registry.removeSeqPart(partId);
        });

        test("removes the part from the seqpart registry", () => {
            const allPartsIds = registry["seqParts"]["itemList"].getUidList();
            expect(allPartsIds).not.toContain(partId);
        })

        test("unsubscribes from dispatch", () => {
            // this is also tested in SeqPartRegistry.test but anyway
            expect(part.unsubscribe).toHaveBeenCalled();
        })

        test("removes the parts reducers", () => {
            // we dispatch an action and assume that when
            // it doesn't alter the state, there is no
            // appropriate reducer present.
            const oldState = store.getState();
            part.actionCreators.ADD_ACTION(237);
            const nextState = store.getState();
            expect(oldState).toEqual(nextState);
        })

        test("removes the parts state from the store", () => {
            const state = store.getState();
            expect(state[partId]).not.toBeDefined();
        })

    })

    describe("getActionCreators", () => {
        let pluginId: string;
        let partId: string;

        beforeEach(() => {
            pluginId = registry.addPlugin(TestInstrument);
            partId = registry.addSeqPart();
        })

        test("returns an empty object if id was not found", () => {
            const ac = registry.getActionCreators("wasdas");
            expect(ac).toEqual({});
        })

        test("takes a plugin id and returns its action creators", () => {
            const ac = registry.getActionCreators(pluginId);
            const oldState = store.getState();
            expect(oldState[pluginId].ACTION1).toBe(0);
            expect(oldState[pluginId].ACTION2).toBe(1);
            ac.ACTION1(23);
            ac.ACTION2(42);
            const nextState = store.getState();
            expect(nextState[pluginId].ACTION1).toBe(23);
            expect(nextState[pluginId].ACTION2).toBe(42);
        })

        test("takes a plugin id and returns its unbound action creators", () => {
            const ac = registry.getActionCreators(pluginId, "unbound");
            const oldState = store.getState();
            ac.ACTION1(23);
            const nextState = store.getState();
            expect(oldState).toEqual(nextState);  // nothing changed = action was not dispatched
        })

        test("takes a seqPart id and returns its action creators", () => {
            const expected = {
                step: 0,
                action: {},
            }
            const ac = registry.getActionCreators(partId);
            const oldState = store.getState();
            expect(oldState[partId].ADD_ACTION).toEqual(expected);
            expect(oldState[partId].REMOVE_ACTION).toEqual(expected);
            ac.ADD_ACTION(payload);
            ac.REMOVE_ACTION(payload);
            const nextState = store.getState();
            expect(nextState[partId].ADD_ACTION).toBe(payload);
            expect(nextState[partId].REMOVE_ACTION).toBe(payload);
        })

        test("takes a seqPart id and returns its unbound action creators", () => {
            const ac = registry.getActionCreators(partId, "unbound");
            const oldState = store.getState();
            ac.ADD_ACTION(23);
            const nextState = store.getState();
            expect(oldState).toEqual(nextState);  // nothing changed = action was not dispatched
        })
    })

})
