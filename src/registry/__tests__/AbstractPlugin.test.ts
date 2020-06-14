import "web-audio-test-api";
import TestPlugin from "../../plugins/TestInstrument";

// Tests the implemented public and
// protected methods of the AbstractPlugin class.
// This is achieved by building a bare test
// class which becomes the object under test.

const ac = new AudioContext();
let plug: TestPlugin;

beforeEach(() => {
    plug = new TestPlugin("abcd", ac);
});

// test("Generate a random unique ID", () => {
//     expect(plug.uid).toBeDefined();
//     expect(plug.uid.length).toEqual(plug.uidLength);
// });

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
