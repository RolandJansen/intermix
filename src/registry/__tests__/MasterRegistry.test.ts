/// <reference path="../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import MasterRegistry from "../MasterRegistry";
import TestInstrument from "../../plugins/TestInstrument";

// tslint:disable: no-string-literal
// We use string-literals to test private functions like:
// objectName["privateMethod"](parameters)
// Normally this could be considered as bad style ("test API only")
// but here we want to check the values of private fields to
// check the result of certain api calls.

let registry: MasterRegistry;
let ac: AudioContext;

beforeEach(() => {
    ac = new AudioContext();
    registry = new MasterRegistry(ac);
});

describe("addPlugin", () => {
    test("creates a new plugin instance from a given class", () => {
        const itemId = registry.addPlugin(TestInstrument);
    });
})

describe("removePlugin", () => {

})

describe("addSeqPart", () => {

})

describe("removeSeqPart", () => {

})
