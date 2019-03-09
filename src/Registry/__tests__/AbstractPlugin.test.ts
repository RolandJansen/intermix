import { IPlugin } from "../interfaces";
import TestPlugin from "../TestPlugin";

// Tests the implemented public and
// protected methods of the AbstractPlugin class.
// This is achieved by building a bare test
// class which becomes the object under test.

let plug: TestPlugin;

beforeEach(() => {
    plug = new TestPlugin();
    plug.actionCreators = plug.makeActionCreators(
        plug.actionDefs,
        plug.uid,
    );
});

test("Read access for productId", () => {
    expect(plug.productId).toBeDefined();
});

test("Read access for name", () => {
    expect(plug.name).toEqual("testplug");
});

test("Read access for version", () => {
    expect(plug.version).toEqual("v1.0.0");
});

test("Read access for author", () => {
    expect(plug.author).toEqual("Some Bloke");
});

test("Generate a random string (as uid)", () => {
    const id = plug.getRandomString(4);
    expect(id.length).toEqual(4);
});

// See cheat sheet:
// http://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
test("Get frequencies from lookup table", () => {
    // Frequency is a float so we cut after
    // two decimal places to meet the sheet spec
    const a0 = plug.frequencyLookup[21].toFixed(2);
    const c3 = plug.frequencyLookup[48].toFixed(2);
    const gis5 = plug.frequencyLookup[80].toFixed(2);
    const fis9 = plug.frequencyLookup[126].toFixed(2);

    expect(a0).toEqual("27.50");
    expect(c3).toEqual("130.81");
    expect(gis5).toEqual("830.61");
    expect(fis9).toEqual("11839.82");
});

// See cheat sheet:
// http://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
test("getNoteNumber gets a midi note number from a string", () => {
    const a0 = plug.getNoteNumber("a0");
    const c3 = plug.getNoteNumber("C3");
    const gis5 = plug.getNoteNumber("g#5");
    const fis9 = plug.getNoteNumber("F#9");

    expect(a0).toEqual(21);
    expect(c3).toEqual(48);
    expect(gis5).toEqual(80);
    expect(fis9).toEqual(126);
});

describe("verifyPluginUid", () => {
    let pluginList: IPlugin[];

    beforeEach(() => {
        pluginList = [];

        for (let i = 0; i <= 3; i++) {
            pluginList[i] = new TestPlugin();
        }
        // ensure that each uid is unique
        pluginList[0].uid = "asdf";
        pluginList[1].uid = "sdfg";
        pluginList[2].uid = "dfgh";
        pluginList[3].uid = "fghj";
    });

    test("returns the original uid if its unique", () => {
        const newPlug: IPlugin = new TestPlugin();
        newPlug.uid = "ghjk";   // has to be unique too

        const npUid = newPlug.verifyPluginUid(pluginList, newPlug.uid);
        expect(npUid).toEqual(newPlug.uid);
    });

    test("returns a new uid if the original is not unique", () => {
        const newPlug: IPlugin = new TestPlugin();
        newPlug.uid = "sdfg";   // has to be NOT unique

        const npUid = newPlug.verifyPluginUid(pluginList, newPlug.uid);
        expect(npUid).not.toEqual(newPlug.uid);
    });
});

describe("makeActionCreators", () => {
    let at1: string;
    let at2: string;

    beforeEach(() => {
        at1 = plug.actionDefs[0].type;
        at2 = plug.actionDefs[1].type;
    });

    test("creates proper action types", () => {
        expect(plug.actionCreators[at1]).toBeDefined();
        expect(plug.actionCreators[at2]).toBeDefined();
    });

    test("creates actionCreators that return proper actions", () => {
        const action = plug.actionCreators[at1](23);
        expect(action.type).toEqual(at1);
        expect(action.dest).toEqual(plug.uid);
        expect(action.payload).toEqual(23);
    });

    test("Actions don't contain errors when value is within bounds", () => {
        let action = plug.actionCreators[at1](0);
        expect(action.error).not.toBeDefined();

        action = plug.actionCreators[at1](127);
        expect(action.error).not.toBeDefined();
    });

    test("Actions contain errors when value is out of bounds", () => {
        let action = plug.actionCreators[at1](-1);
        expect(action.error).toBeInstanceOf(RangeError);

        action = plug.actionCreators[at1](128);
        expect(action.error).toBeInstanceOf(RangeError);
    });

});
