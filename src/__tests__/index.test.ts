/// <reference path="../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import { getAudioContext } from "../index";
import ClockWorker from "../plugins/Sequencer/clock.worker";
// import Sequencer from "../plugins/Sequencer/Sequencer";
// import Registry from "../registry/Registry";

// const mockRegistry = {
//     registerPlugin: jest.fn(),
// };

// jest.mock("../plugins/Sequencer/Sequencer");
// jest.mock("../registry/Registry", () => mockRegistry);

// const ac: AudioContext = new AudioContext();
// const fakeSeq: Sequencer = new Sequencer(ac);
// (Registry.registerPlugin as jest.Mock).mockImplementation(() => {
//     return fakeSeq;
// });
// (Registry as jest.Mock).mockImplementation(() => {
//     return {
//         registerPlugin: () => {
//             return fakeSeq;
//         },
//     };
// });

// no workers in node.js, we use the same manual mock as in sequencer test
jest.mock("../plugins/Sequencer/clock.worker");

describe("Intermix", () => {

    test("provides an audioContext", () => {
        const audioContext: AudioContext = getAudioContext();
        expect(audioContext).toBeDefined();
    });

    test("ensure that we're testing against the WebAudioTestAPI", () => {
        const audioContext: AudioContext = getAudioContext();
        expect(audioContext.$name).toEqual("AudioContext");
    });

    // test("provides a default sequencer", () => {
    //     const seq: Sequencer = getDefaultSequencer();
    //     expect(seq).toBeDefined();
    // });

});
