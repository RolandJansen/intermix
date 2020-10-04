import "web-audio-test-api";
import TestInstrument from "../../plugins/TestInstrument";
import { IPlugin } from "../../interfaces/IRegistryItems";

// Tests the implemented public and
// protected methods of the AbstractPlugin class.
// This is achieved by building a bare test
// class which becomes the object under test.

const ac = new AudioContext();
let plug: IPlugin;

beforeEach(() => {
    plug = new TestInstrument("abcd", ac);
});

test("has an empty initState object", () => {
    expect(plug.initState).toBeDefined();
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

test("getNoteNumber returns -1 if string is not valid", () => {
    const y23 = plug.getNoteNumber("y23");
    expect(y23).toEqual(-1);
});

test("refreshAllValues", () => {
    plug.getMyState = jest.fn(() => {
        return {
            ACTION1: 23,
            ACTION2: 42,
        };
    });
    plug.onChange = jest.fn();
    plug.refreshAllValues();
    expect(plug.onChange).toHaveBeenCalledTimes(2);
    expect(plug.onChange).toHaveBeenCalledWith(["ACTION1", 23]);
    expect(plug.onChange).toHaveBeenCalledWith(["ACTION2", 42]);
});
