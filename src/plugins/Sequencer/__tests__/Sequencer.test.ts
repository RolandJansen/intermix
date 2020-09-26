/// <reference path="../../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import Sequencer from "../Sequencer";
import SeqPart from "../../../seqpart/SeqPart";
import { ILoop, IOscActionDef, IntermixNote, OscArgSequence, IPlugin } from "../../../registry/interfaces";
import { createInlineWorker } from "../../../fileLoader";
import { IClockMessage } from "../clock.worker";

// mock dependencies of the module under test
jest.mock("../clock.worker");
jest.mock("../../../fileLoader");

const workerMock = {
    postMessage: jest.fn(),
    onMessage: jest.fn(),
};

(createInlineWorker as jest.Mock).mockReturnValue(workerMock);

// WebAudioTestAPI Config
WebAudioTestAPI.setState({
    "AudioContext#suspend": "enabled",
    "AudioContext#resume": "enabled",
});

const createTestSequencer = (ac: AudioContext): IPlugin => {
    const newSequencer = new Sequencer("abcd", ac);
    newSequencer.actionCreators = {
        position: jest.fn(),
    };
    return newSequencer;
};

describe("Sequencer", () => {
    let ac: AudioContext;
    let sequencer: IPlugin;

    beforeEach(() => {
        ac = new AudioContext();
        sequencer = createTestSequencer(ac);
        workerMock.onMessage.mockClear();
        workerMock.postMessage.mockClear();
        // sequencer.clock.mockClear();
    });

    test("ensure that we're testing against the WebAudioTestAPI", () => {
        expect(ac.$name).toEqual("AudioContext");
    });

    test("has a static metadata section", () => {
        expect(Sequencer.METADATA.type).toEqual("controller");
        expect(Sequencer.METADATA.name).toEqual("Intermix Sequencer");
    });

    test("has action definitions", () => {
        const testActionDef: IOscActionDef = {
            address: "/intermix/plugin/<UID>/position",
            typeTag: ",i",
            description: "jump to a specific step in the score",
        };
        expect(sequencer.actionDefs).toContainEqual(testActionDef);
    });

    test("has an empty list of inputs", () => {
        expect(sequencer.inputs).toHaveLength(0);
    });

    test("has an empty list of outputs", () => {
        expect(sequencer.outputs).toHaveLength(0);
    });

    describe("onChange", () => {
        beforeEach(() => {
            // sequencer.actionCreators["QUEUE"] = (): boolean => true;
        });

        test("returns true when called with a recognized value", () => {
            const expected = sequencer.onChange(["BPM", 0]);
            expect(expected).toBeTruthy();
        });

        test("returns false when called with an unrecognized value", () => {
            const expected = sequencer.onChange(["something-different", true]);
            expect(expected).toBeFalsy();
        });

        test("sets bpm and timePerStep", () => {
            sequencer.onChange(["BPM", 160]);
            expect(sequencer["bpm"]).toEqual(160);
            expect(sequencer["timePerStepInSec"]).toEqual(0.0234375);
        });

        // test("adds a SeqPart object", () => {
        //     const testPart = new SeqPart("abcd");
        //     sequencer.onChange(["ADD_PART", testPart]);
        //     const partList = sequencer["score"]["parts"].getUidList();
        //     expect(partList).toContain("abcd");
        // });

        // test("removes a SeqPart object", () => {
        //     const testPart = new SeqPart("abcd");
        //     const parts = sequencer["score"]["parts"];
        //     parts.add(testPart);

        //     sequencer.onChange(["REMOVE_PART", "abcd"]);
        //     expect(parts.getUidList()).toHaveLength(0);
        // });

        test("puts a seq part on the score", () => {
            const testPart = new SeqPart("abcd");
            const fictivePluginUid = "efgh";
            const testTuple = [testPart.uid, fictivePluginUid];
            // const partID = sequencer["score"]["parts"].add(testPart);
            sequencer.onChange(["addToScore", testTuple]);
            expect(sequencer["score"]["queue"][0]).toContain(testTuple);
        });

        test("removes a seq part from score", () => {
            const testPart = new SeqPart("abcd");
            const fictivePluginUid = "efgh";
            sequencer["score"]["queue"][23] = [[testPart.uid, fictivePluginUid]];
            sequencer["score"].activeStep = 23;
            sequencer.onChange(["removeFromScore", [testPart.uid, fictivePluginUid]]);
            expect(sequencer["score"]["queue"][23]).toHaveLength(0);
        });

        test("sets the loop interval", () => {
            const loop: ILoop = {
                start: 23,
                end: 42,
            };
            sequencer.onChange(["LOOP", loop]);
            expect(sequencer["score"]["loopStart"]).toEqual(23);
            expect(sequencer["score"]["loopEnd"]).toEqual(42);
        });

        test("activates loop mode", () => {
            sequencer["score"]["loopActive"] = false;
            sequencer.onChange(["loopActive", 1]);
            expect(sequencer["score"]["loopActive"]).toBeTruthy();
        });

        test("deactivates loop mode", () => {
            sequencer["score"]["loopActive"] = true;
            sequencer.onChange(["loopActive", 0]);
            expect(sequencer["score"]["loopActive"]).toBeFalsy();
        });

        test("moves the score pointer to a certain position", () => {
            sequencer.onChange(["position", 23]);
            expect(sequencer["score"]["nextStep"]).toEqual(23);
        });
    });

    describe("playback", () => {
        beforeEach(() => {
            const score = sequencer["score"];
            score.resetScorePointer = jest.fn();
            window.requestAnimationFrame = jest.fn();
        });

        test("starts", () => {
            const msg: IClockMessage = { command: "start" };
            sequencer.onChange(["running", 1]);
            expect(sequencer["clock"].postMessage).toBeCalledWith(msg);
            expect(sequencer["isRunning"]).toBeTruthy();
            expect(window.requestAnimationFrame).toBeCalled();
        });

        test("stops", () => {
            const msg: IClockMessage = { command: "stop" };
            sequencer.onChange(["running", 1]);
            expect(sequencer["isRunning"]).toBeTruthy();

            sequencer.onChange(["running", 0]);
            expect(sequencer["clock"].postMessage).toBeCalledWith(msg);
            expect(sequencer["ac"].state).toMatch("suspended");
            expect(sequencer["isRunning"]).toBeFalsy();
            expect(sequencer.actionCreators.position).toHaveBeenCalled();
        });

        test("doesn't stop if sequencer is not running", () => {
            sequencer.onChange(["running", 0]);
            expect(sequencer["ac"].state).toMatch("running");
        });

        test("reactivates audio context when restarted", () => {
            sequencer.onChange(["running", 1]);
            sequencer.onChange(["running", 0]);
            expect(sequencer["ac"].state).toMatch("suspended");
            sequencer.onChange(["running", 1]);
            expect(sequencer["ac"].state).toMatch("running");
        });

        test("resets (stop and reset queue pointer)", () => {
            const msg: IClockMessage = { command: "stop" };
            sequencer.onChange(["reset", 1]);
            expect(sequencer["clock"].postMessage).toBeCalledWith(msg);
            expect(sequencer["isRunning"]).toBeFalsy();
            // expect(sequencer["nextStep"]).toEqual(0);
            expect(sequencer["score"].resetScorePointer).toHaveBeenCalled();
        });
    });

    describe("scheduler", () => {
        // const action1: IAction = {
        //     listener: "abcd",
        //     type: "SOME_TYPE",
        //     payload: 23,
        // };
        // const action2: IAction = {
        //     listener: "efgh",
        //     type: "SOME_TYPE",
        //     payload: 42,
        // };
        // let part: SeqPart;

        const partId = "abcd";
        const pluginId = "efgh";
        const note1: IntermixNote = ["note", 23, 1, 1, 0];
        const note2: IntermixNote = ["note", 42, 1, 1, 0];

        beforeEach(() => {
            const noteVal1 = Array.from(note1);
            const noteVal2 = Array.from(note2);
            const pattern = Array(64).fill([]);
            pattern[0].push(noteVal1);
            pattern[1].push(noteVal2);
            sequencer["getGlobalState"] = jest.fn();
            (sequencer["getGlobalState"] as jest.Mock).mockReturnValue({
                abcd: {
                    pattern,
                },
            });

            // part = new SeqPart("abcd");
            // part.addAction(action1, 0);
            // part.addAction(action2, 1);

            // const partId = sequencer["score"].parts.add(part);
            sequencer["score"].addPartToScore([partId, pluginId]);
            sequencer["score"].increaseScorePointer = jest.fn();
            sequencer["score"]["addPatternToRunqueue"] = jest.fn();
            sequencer["sendAllActionsInNextStep"] = jest.fn();
            sequencer["ac"].$processTo("00:01.000");
            sequencer["scheduler"]();
        });

        afterEach(() => {
            sequencer["ac"].$processTo("00:00.000");
        });

        test("runs until all steps in lookahead are processed", () => {
            // runs 10 times with lookahead=0.3 and bpm=120
            expect(sequencer["score"].increaseScorePointer).toHaveBeenCalledTimes(10);
        });

        test("adds parts to runqueue", () => {
            expect(sequencer["score"]["addPatternToRunqueue"]).toHaveBeenCalled();
        });

        test("increases nextStepTime on every step", () => {
            const expected = 1.3125; // 10 x timePerStep + timestamp
            expect(sequencer["nextStepTimeInSec"]).toEqual(expected);
        });

        test("fires all actions", () => {
            expect(sequencer["sendAllActionsInNextStep"]).toHaveBeenCalled();
        });
    });

    describe("process Actions from queue", () => {
        // probably more mocks needed. we're testing against
        // real score object (which effects other tests, too)

        // const action1: IAction = {
        //     listener: "abcd",
        //     type: "SOME_TYPE",
        //     payload: 23,
        // };
        // const action2: IAction = {
        //     listener: "efgh",
        //     type: "SOME_TYPE",
        //     payload: 42,
        // };
        // const brokenPayload = {
        //     value: 23,
        //     velocity: 1,
        //     steps: 4,
        // };
        // const sanePayload = Object.assign({}, brokenPayload, { duration: 0 });
        // const brokenNoteAction: IAction = {
        //     listener: "ijkl",
        //     type: "NOTE",
        //     payload: brokenPayload,
        // };
        // const saneNoteAction = {
        //     listener: "ijkl",
        //     type: "NOTE",
        //     payload: sanePayload,
        // };
        // let part: SeqPart;

        // same as "scheduler" tests
        const partId = "abcd";
        const pluginId = "efgh";
        const note1: IntermixNote = ["note", 23, 1, 1, 0];
        const note2: IntermixNote = ["note", 42, 1, 1, 0];

        beforeEach(() => {
            // const subArray: OscArgSequence[] = [];
            const pattern = [];

            for (let i = 0; i < 64; i++) {
                const subArray: OscArgSequence[] = [];
                pattern[i] = subArray;
            }

            const noteVal1 = Array.from(note1);
            const noteVal2 = Array.from(note2);
            const saneNote = Array.from(note1);
            const brokenNote = ["note", 5, 1, 1, "hello"];
            pattern[0].push(noteVal1);
            pattern[1].push(noteVal2);
            pattern[2].push(saneNote);
            pattern[2].push(brokenNote);

            sequencer["getGlobalState"] = jest.fn();
            (sequencer["getGlobalState"] as jest.Mock).mockReturnValue({
                abcd: {
                    pattern,
                },
            });

            // part = new SeqPart("abcd");
            // part.addAction(action1, 0);
            // part.addAction(action2, 1);
            // part.addAction(saneNoteAction, 2);
            // part.addAction(brokenNoteAction, 2);

            // const partId = sequencer["score"].parts.add(part);
            sequencer["score"].addPartToScore([partId, pluginId]);
            sequencer.sendAction = jest.fn();

            sequencer["ac"].$processTo("00:01.000");
            sequencer["scheduler"]();
        });

        afterEach(() => {
            sequencer["ac"].$processTo("00:00.000");
            (sequencer.sendAction as jest.Mock).mockClear(); // reset call history
        });

        test("sends all actions from the score to dispatch", () => {
            expect(sequencer.sendAction).toHaveBeenCalledTimes(4);
        });

        test("adds delay to the actions payload", () => {
            const sendAction = sequencer.sendAction as jest.Mock;
            const delayedAction1 = sendAction.mock.calls[0][0];
            const delayedAction2 = sendAction.mock.calls[1][0];

            expect(delayedAction1.payload[delayedAction1.payload.length - 1]).toEqual(1);
            expect(delayedAction2.payload[delayedAction1.payload.length - 1]).toEqual(1.03125);
        });

        test("adds delay to payload of NOTE actions", () => {
            const sendAction = sequencer.sendAction as jest.Mock;
            const delayedNote = sendAction.mock.calls[2][0];
            expect(delayedNote.payload[delayedNote.payload.length - 1]).toEqual(1.0625);
        });
        test("changes duration for NOTE actions", () => {
            const sendAction = sequencer.sendAction as jest.Mock;
            const delayedNoteAction = sendAction.mock.calls[2][0];

            expect(delayedNoteAction.payload.length - 2).toEqual(3);
        });

        test("adds duration on NOTE actions if its not defined", () => {
            const sendAction = sequencer.sendAction as jest.Mock;
            const delayedNoteAction = sendAction.mock.calls[3][0];

            expect(delayedNoteAction.payload.length - 2).toEqual(3);
        });
    });

    // describe(".draw", function () {

    //     beforeEach(function () {
    //         spyOn(sequencer, "updateFrame");
    //     });

    //     describe("if sequencer is running", function () {

    //         beforeEach(function () {
    //             var step = sequencer.getMasterQueuePosition(0, sequencer.ac.currentTime + 0.1);
    //             sequencer.isRunning = true;
    //             sequencer.stepList.push(step);
    //             // sequencer.ac.$processTo('00:00.050');
    //         });

    //         describe("but is within start delay", function () {

    //             beforeEach(function () {
    //                 sequencer.draw();
    //             });

    //             it("calls window.requestAnimationFrame", function () {
    //                 expect(window.requestAnimationFrame).toHaveBeenCalled();
    //             });

    //             it("doesn't call .updateFrame", function () {
    //                 expect(sequencer.updateFrame).not.toHaveBeenCalled();
    //             });

    //         });

    //         describe("and has passed start delay", function () {

    //             beforeEach(function () {
    //                 sequencer.ac.$processTo("00:00.200");
    //                 sequencer.draw();
    //             });

    //             it("calls window.requestAnimationFrame", function () {
    //                 expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    //             });

    //             it("calls .updateFrame", function () {
    //                 expect(sequencer.updateFrame).toHaveBeenCalledWith(0);
    //             });

    //             it("removes first element in stepList", function () {
    //                 expect(sequencer.stepList.length).toEqual(0);
    //             });

    //         });

    //     });

    //     describe("if sequencer is not running", function () {

    //         beforeEach(function () {
    //             sequencer.isRunning = false;
    //         });

    //         it("doesn't call .updateFrame", function () {
    //             expect(sequencer.updateFrame).not.toHaveBeenCalled();
    //         });

    //         it("doesn't call window.requestAnimationFrame", function () {
    //             expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    //         });

    //     });

    // });

    // describe(".updateFrame", function () {

    //     it("is a function", function () {
    //         expect(typeof sequencer.updateFrame).toBe("function");
    //     });

    // });
});
