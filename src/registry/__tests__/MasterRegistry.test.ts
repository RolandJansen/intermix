/// <reference path="../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import MasterRegistry from "../MasterRegistry";
import TestInstrument from "../../plugins/TestInstrument";
import { IPlugin } from "../interfaces";
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
             const action1 = {
                 dest: pluginId,
                 type: "ACTION1",
                 payload: 23,
             }
             const action2 = {
                 dest: pluginId,
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

    let part: SeqPart;
    let partId: string;

    beforeEach(() => {
        partId = registry.addSeqPart();
        part = registry["seqParts"]["itemList"].getItem(partId);
    })

    describe("addSeqPart", () => {

        test("returns the instance id", () => {
            expect(partId).toMatch(part.uid);
        })

        test("adds an entry to the store", () => {
            const state = store.getState();
            expect(state[partId]).toBeDefined();
        })

        test("store entry contains sequencer part properties", () => {
            const state = store.getState();
            expect(state[partId].ACTION1).toBeDefined;
            expect(state[partId].ACTION2).toBeDefined;
        })

        test("adds reducers for the seqpart to the store", () => {
            const payload = {
                type: "FANTASYACTION",
                payload: 23,
            }
            const action1 = {
                dest: partId,
                type: "ADD_ACTION",
                payload,
            }
            const action2 = {
                dest: partId,
                type: "REMOVE_ACTION",
                payload,
            }

            store.dispatch(action1);
            store.dispatch(action2);

            const state = store.getState();
            expect(state[partId].ADD_ACTION).toEqual(payload);
            expect(state[partId].REMOVE_ACTION).toEqual(payload);
        })

        test("adds action creators to the part", () => {
            part.actionCreators.ADD_ACTION(5);

            const state = store.getState();
            expect(state[partId].ADD_ACTION).toBe(5);
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

})
