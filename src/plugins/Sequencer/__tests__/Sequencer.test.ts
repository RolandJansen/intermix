/// <reference path="../../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import Sequencer from "../Sequencer";
import SeqPart from "../../../seqpart/SeqPart";
import { ILoop } from "../../../registry/interfaces";

// We use string-literals to test private functions like:
// objectName["privateMethod"](parameters)
// Normally this could be considered as bad style ("test API only")
// but here we want to check the values of private fields to
// check the result of certain api calls.

// mock dependencies of the module under test
jest.mock("../clock.worker");

// WebAudioTestAPI Config
WebAudioTestAPI.setState({
    "AudioContext#suspend": "enabled",
    "AudioContext#resume": "enabled",
});

describe("Sequencer", () => {
    let ac: AudioContext;
    let sequencer: Sequencer;

    beforeEach(() => {
        ac = new AudioContext();
        sequencer = new Sequencer(ac);
        // sequencer.clock.mockClear();
    });

    test("ensure that we're testing against the WebAudioTestAPI", () => {
        expect(ac.$name).toEqual("AudioContext");
    });

    test("has a metadata section", () => {
        expect(sequencer.metaData.type).toEqual("controller");
        expect(sequencer.metaData.name).toEqual("Intermix Sequencer");
    });

    test("has action definitions", () => {
        const stateAction = {
            type: "STATE",
            desc: "0=stop, 1=start, 2=pause",
            defVal: 0,
        };
        expect(sequencer.actionDefs).toContainEqual(stateAction);
    });

    test("has an empty list of inputs", () => {
        expect(sequencer.inputs).toHaveLength(0);
    });

    test("has an empty list of outputs", () => {
        expect(sequencer.outputs).toHaveLength(0);
    });

    describe("onChange", () => {

        beforeEach(() => {
            sequencer.actionCreators["QUEUE"] = (): boolean => true;
        })

        test("returns true when called with a recognized value", () => {
            const expected = sequencer.onChange(["STATE", 0]);
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

        test("adds a SeqPart object", () => {
            const testPart = new SeqPart();
            testPart.uid = "abcd";
            sequencer.onChange(["ADD_PART", testPart]);
            const partList = sequencer["score"]["parts"].getUidList();
            expect(partList).toContain("abcd");
        })

        test("removes a SeqPart object", () => {
            const testPart = new SeqPart();
            testPart.uid = "abcd";
            const parts = sequencer["score"]["parts"];
            parts.add(testPart);

            sequencer.onChange(["REMOVE_PART", "abcd"]);
            expect(parts.getUidList()).toHaveLength(0);
        })

        test("puts a seq part on the score", () => {
            const testPart = new SeqPart();
            const partID = sequencer["score"]["parts"].add(testPart);
            sequencer.onChange(["ADD_TO_SCORE", {
                partID,
                position: 23,
            }]);
            expect(sequencer["score"]["queue"][23]).toContain(partID);
        })

        test("removes a seq part from score", () => {
            const testPart = new SeqPart();
            testPart.uid = "abcd";
            sequencer["score"]["queue"][23] = [ testPart.uid ];
            sequencer.onChange(["REMOVE_FROM_SCORE", {
                partID: testPart.uid,
                position: 23,
            }]);
            expect(sequencer["score"]["queue"][23]).toHaveLength(0);
        })

        test("sets the loop interval", () => {
            const loop: ILoop = {
                start: 23,
                end: 42,
            };
            sequencer.onChange(["LOOP", loop]);
            expect(sequencer["score"]["loopStart"]).toEqual(23);
            expect(sequencer["score"]["loopEnd"]).toEqual(42);
        })

        test("activates loop mode", () => {
            sequencer["score"]["loopActivated"] = false;
            sequencer.onChange(["LOOP_ACTIVE", true]);
            expect(sequencer["score"]["loopActivated"]).toBeTruthy();
        })

        test("deactivates loop mode", () => {
            sequencer["score"]["loopActivated"] = true;
            sequencer.onChange(["LOOP_ACTIVE", false]);
            expect(sequencer["score"]["loopActivated"]).toBeFalsy();
        })

        test("moves the score pointer to a certain position", () => {
            sequencer.onChange(["JUMP_TO_POSITION", 23]);
            expect(sequencer["score"]["nextStep"]).toEqual(23);
        })
    });

    describe("playback", () => {

        beforeEach(() => {
            const score = sequencer["score"];
            score.resetScorePointer = jest.fn();
            window.requestAnimationFrame = jest.fn();
        });

        test("starts", () => {
            sequencer.onChange(["STATE", 1]);
            expect(sequencer["clock"].postMessage).toBeCalledWith("start");
            expect(sequencer["isRunning"]).toBeTruthy();
            expect(window.requestAnimationFrame).toBeCalled();
        });

        test("stops", () => {
            sequencer.onChange(["STATE", 0]);
            expect(sequencer["clock"].postMessage).toBeCalledWith("stop");
            expect(sequencer["isRunning"]).toBeFalsy();
            expect(sequencer["nextStep"]).toEqual(0);
            expect(sequencer["score"].resetScorePointer).toHaveBeenCalled();
        });

        test("pauses", () => {
            sequencer.onChange(["STATE", 1]);
            expect(sequencer["isRunning"]).toBeTruthy();

            sequencer.onChange(["STATE", 2]);
            expect(sequencer["ac"].state).toMatch("suspended");
            expect(sequencer["isRunning"]).toBeFalsy();
        });

        test("doesn't pause if sequencer is not running", () => {
            sequencer.onChange(["STATE", 2]);
            expect(sequencer["ac"].state).toMatch("running");
        });

        test("starts and resumes audio context after pause", () => {
            sequencer.onChange(["STATE", 1]);
            sequencer.onChange(["STATE", 2]);
            expect(sequencer["ac"].state).toMatch("suspended");
            sequencer.onChange(["STATE", 1]);
            expect(sequencer["ac"].state).toMatch("running");
        });

    });

    describe("scheduler", () => {

        beforeEach(() => {
            // sequencer["increaseScorePointer"] = jest.fn();
            sequencer["score"].addPartsToRunqueue = jest.fn();
            sequencer["sendAllActionsInNextStep"] = jest.fn();
            sequencer["ac"].$processTo("00:01.000");
        });

        afterEach(() => {
            sequencer["ac"].$processTo("00:00.000");
        });

        test("runs until all steps in lookahead are processed", () => {
            // runs 10 times with lookahead=0.3 and bpm=120
            sequencer["scheduler"]();
            // expect(sequencer["increaseScorePointer"]).toHaveBeenCalledTimes(10);
        });

        test("adds parts to runqueue", () => {
            sequencer["scheduler"]();
            expect(sequencer["score"].addPartsToRunqueue).toHaveBeenCalled();
        });

        test("fires all actions", () => {
            sequencer["scheduler"]();
            expect(sequencer["sendAllActionsInNextStep"]).toHaveBeenCalled();
        });

        test("increases nextStepTime on every step", () => {
            const expected = 1.3125;  // 10 x timePerStep + timestamp
            sequencer["scheduler"]();
            expect(sequencer["nextStepTimeInSec"]).toEqual(expected);
        });

    });

    describe("process Actions from queue", () => {
        // test sendAllActionsInNextStep() to sendAction() (scheduled for 0.5.0 #107)
    });

    // describe(".getDurationTime", function () {
    //     it("calculates the duration time from 64th steps", function () {
    //         var duration = sequencer.getDurationTime(8);
    //         expect(duration).toEqual(0.25);
    //     });
    // });

    // describe(".getMasterQueuePosition", function () {

    //     beforeEach(function () {
    //         this.step = sequencer.getMasterQueuePosition(5, 23.5);
    //     });

    //     it("returns an object", function () {
    //         expect(typeof this.step).toBe("object");
    //     });

    //     it("sets the position to the value of its 1st parameter", function () {
    //         expect(this.step.position).toEqual(5);
    //     });

    //     it("sets the time to the value of its 2nd parameter", function () {
    //         expect(this.step.time).toEqual(23.5);
    //     });

    // });

    // describe(".start", function () {

    //     it("adds an entry to the stepList as a start delay for .draw ", function () {
    //         expect(sequencer.stepList[0].time).toEqual(sequencer.ac.currentTime + 0.1);
    //     });
    // });

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

    //     it("throws if stepList is empty", function () {
    //         expect(sequencer.draw).toThrow();
    //     });

    // });

    // describe(".updateFrame", function () {

    //     it("is a function", function () {
    //         expect(typeof sequencer.updateFrame).toBe("function");
    //     });

    // });

});
