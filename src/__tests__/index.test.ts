// import "web-audio-test-api";
// import { getAudioContext, getDefaultSequencer } from "../index";
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

describe("Intermix", () => {

    test("index.ts ...", () => {
        // ... is the place where it all comes together.
        // So this is not a unit test rather than an integration test.
        // skipped this for now until all other components are tested.
    });

    // test("provides an audioContext", () => {
    //     const audioContext: AudioContext = getAudioContext();
    //     expect(audioContext).toBeDefined();
    // });

    // test("provides a default sequencer", () => {
    //     const seq: Sequencer = getDefaultSequencer();
    //     expect(seq).toBeDefined();
    // });

});
