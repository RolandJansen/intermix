import "web-audio-test-api";
import { getAudioContext, getDefaultSequencer } from "../index";
import Sequencer from "../plugins/Sequencer/Sequencer";
import { initialState } from "../store/initialState";

describe("Intermix", () => {

    test("provides an audioContext", () => {
        const audioContext: AudioContext = getAudioContext();
        expect(audioContext).toBeDefined();
    });

    test("provides a default sequencer", () => {
        const seq: Sequencer = getDefaultSequencer();
        expect(seq).toBeDefined();
    });

});
