/// <reference path="../../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import { IAction, ISeqPartLoad, ILoop } from "../../../registry/interfaces";
import ClockWorker from "../clock.worker";
import SeqPart from "../SeqPart";
import Sequencer from "../Sequencer";

// tslint:disable: no-string-literal
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

    function createPattern(length: number) {
        const arr = [];
        for (let i = 0; i < length; i++) {
            arr[i] = i + 1;
        }
        return arr;
    }

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
    });

    describe("playback", () => {

        beforeEach(() => {
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
            expect(sequencer["runqueue"]).toHaveLength(0);
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

    describe("Loop Mode", () => {
        let part1: SeqPart;
        let part2: SeqPart;

        beforeEach(() => {
            part1 = new SeqPart();
            part2 = new SeqPart();
        });

        test("activates looped playback", () => {
            sequencer.onChange(["LOOP_ACTIVE", true]);
            expect(sequencer["isLooped"]).toBeTruthy();
        });

        test("sets loop start- and endpoint", () => {
            const loop: ILoop = { start: 23, end: 42 };
            sequencer.onChange(["LOOP", loop]);
            expect(sequencer["loopStart"]).toEqual(23);
            expect(sequencer["loopEnd"]).toEqual(42);
        });

        test("ignores a loop action if it makes no sense", () => {
            const loop: ILoop = { start: 42, end: 23 }; // loop ends before it starts
            sequencer.onChange(["LOOP", loop]);
            expect(sequencer["loopStart"]).toEqual(0);
            expect(sequencer["loopEnd"]).toEqual(63);
        });

        test("sets the pointer back to start when end of loop is reached", () => {
            const loop: ILoop = { start: 23, end: 42 };
            sequencer.onChange(["LOOP", loop]);
            sequencer.onChange(["LOOP_ACTIVE", true]);

            sequencer["setQueuePointer"](42);
            expect(sequencer["nextStep"]).toEqual(42);
            sequencer["increaseQueuePointer"]();
            expect(sequencer["nextStep"]).toEqual(23);
        });

        test("cleans the runqueue when the pointer jumps", () => {
            sequencer.onChange(["LOOP_ACTIVE", true]);
            sequencer["setQueuePointer"](63);
            sequencer["runqueue"].push(part1, part2);
            sequencer["increaseQueuePointer"]();
            expect(sequencer["runqueue"]).toHaveLength(0);
        });
    });

    describe("masterqueue", () => {
        let part1: SeqPart;
        let part2: SeqPart;
        let partObject1: ISeqPartLoad;
        let partObject2: ISeqPartLoad;

        const action1: IAction = {
            type: "NOTE",
            dest: "abcd",
            payload: {
                noteNumber: 0,
                velocity: 0,
                startTime: 0,
                duration: 0,
            },
        };
        const action2: IAction = {
            type: "SYSEX",
            dest: "abcd",
            payload: 0x14a70f,
        };

        beforeEach(() => {
            // object under test didn't pass registry so there
            // are no action creators
            sequencer.actionCreators.QUEUE = jest.fn();

            part1 = new SeqPart();
            part2 = new SeqPart();

            part1.addAction(action1, 2)
                .addAction(action1, 4);

            part2.addAction(action2, 1)
                .addAction(action2, 3);

            partObject1 = {
                part: part1,
                position: 5,
            };
            partObject2 = {
                part: part2,
                position: 5,
            };
        });

        test("adds a part", () => {
            sequencer.onChange(["ADD_PART", partObject1]);
            expect(sequencer["queue"][5][0]).toBe(part1);
        });

        test("sends a QUEUE action when part is added", () => {
            sequencer.onChange(["ADD_PART", partObject1]);
            expect(sequencer.actionCreators.QUEUE).toHaveBeenCalledTimes(1);
        });

        test("adds many parts to the same position", () => {
            sequencer.onChange(["ADD_PART", partObject1]);
            sequencer.onChange(["ADD_PART", partObject2]);
            expect(sequencer["queue"][5][1]).toBe(part2);
        });

        test("removes a part", () => {
            sequencer.onChange(["ADD_PART", partObject1]);
            sequencer.onChange(["ADD_PART", partObject2]);
            sequencer.onChange(["ADD_PART", partObject2]);
            sequencer.onChange(["REMOVE_PART", partObject2]);
            expect(sequencer["queue"][5][0]).toBe(part1);
            expect(sequencer["queue"][5][1]).toBe(part2);
            expect(sequencer["queue"][5]).toHaveLength(2);
        });

        test("sends a QUEUE action when part is removed", () => {
            sequencer.onChange(["ADD_PART", partObject2]);
            sequencer.onChange(["REMOVE_PART", partObject2]);
            expect(sequencer.actionCreators.QUEUE).toHaveBeenCalledTimes(2);
        });

        test("removes nothing if part not found", () => {
            sequencer.onChange(["ADD_PART", partObject1]);
            sequencer.onChange(["ADD_PART", partObject1]);
            sequencer.onChange(["REMOVE_PART", partObject2]);
            expect(sequencer["queue"][5]).toHaveLength(2);
        });

        test("set the pointer to a given position", () => {
            sequencer.onChange(["JUMP_TO_POSITION", 23]);
            expect(sequencer["nextStep"]).toEqual(23);
        });

        test("cleans the runqueue when the pointer jumps", () => {
            sequencer["runqueue"].push(part1, part2);
            sequencer.onChange(["JUMP_TO_POSITION", 23]);
            expect(sequencer["runqueue"]).toHaveLength(0);
        });
    });

    describe("scheduler", () => {

        beforeEach(() => {
            sequencer["increaseQueuePointer"] = jest.fn();
            sequencer["addPartsToRunqueue"] = jest.fn();
            sequencer["sendAllActionsInNextStep"] = jest.fn();
            sequencer["ac"].$processTo("00:01.000");
        });

        afterEach(() => {
            sequencer["ac"].$processTo("00:00.000");
        });

        test("runs until all steps in lookahead are processed", () => {
            // runs 10 times with lookahead=0.3 and bpm=120
            sequencer["scheduler"]();
            expect(sequencer["increaseQueuePointer"]).toHaveBeenCalledTimes(10);
        });

        test("adds parts to runqueue", () => {
            sequencer["scheduler"]();
            expect(sequencer["addPartsToRunqueue"]).toHaveBeenCalled();
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

    // describe(".addPartsToRunqueue", function () {

    //     beforeEach(function () {
    //         sequencer.addPart(part1, 3);
    //         sequencer.addPart(part2, 3);
    //         sequencer.nextStep = 3;
    //         sequencer.addPartsToRunqueue();
    //     });

    //     it("copys parts from the master queue to the runqueue", function () {
    //         expect(sequencer.runqueue).toContain(part1);
    //         expect(sequencer.runqueue).toContain(part2);
    //     });

    //     it("adds a pointer to the part when copied to the runqueue", function () {
    //         expect(sequencer.runqueue[0].pointer).toEqual(0);
    //         expect(sequencer.runqueue[1].pointer).toEqual(0);
    //     });

    // });

    // describe(".deletePartsFromRunqueue", function () {

    //     beforeEach(function () {
    //         part1.pointer = part2.pointer = 64;
    //         sequencer.runqueue.push(part1, part2);
    //         sequencer.deletePartsFromRunqueue([1, 0]);
    //     });

    //     it("should remove parts from runqueue", function () {
    //         expect(sequencer.runqueue.length).toEqual(0);
    //     });

    //     it("should delete the pointer from removed parts", function () {
    //         expect(part1.pointer).not.toBeDefined();
    //         expect(part2.pointer).not.toBeDefined();
    //     });

    // });

    // describe(".fireEvents", function () {

    //     beforeEach(function () {
    //         sequencer.processSeqEvent = jasmine.createSpy("processSeqEvent");
    //         part1.pointer = part2.pointer = 0;
    //         sequencer.runqueue.push(part1, part2);
    //         sequencer.fireEvents();
    //     });

    //     it("calls .processSeqEvent for every processed event", function () {
    //         expect(sequencer.processSeqEvent).toHaveBeenCalledTimes(7);
    //     });

    //     it("calls .processSeqEvent with the current event as parameter", function () {
    //         expect(sequencer.processSeqEvent.calls.allArgs())
    //             .toEqual([[1, 0], [2, 0], [3, 0], [4, 0], [1, 0], [2, 0], [3, 0]]);
    //     });

    // });

    // describe(".processSeqEvent", function () {

    //     it("sends an event to an eventBus relay endpoint", function () {
    //         sequencer.processSeqEvent(seqEvent);
    //         expect(window.intermix.eventBus.sendToRelayEndpoint)
    //             .toHaveBeenCalledWith(seqEvent.uid, seqEvent);
    //     });

    //     it("adds a delay parameter to the event msg if given", function () {
    //         sequencer.processSeqEvent(seqEvent, 0.2342);
    //         expect(seqEvent.msg.delay).toEqual(0.2342);
    //     });

    //     it('adds an "undefined" delay parameter if no delay given', function () {
    //         sequencer.processSeqEvent(seqEvent);
    //         expect(seqEvent.msg.delay).toBeUndefined();
    //     });

    //     it("adds a duration property with tone duration in seconds", function () {
    //         sequencer.processSeqEvent(seqEvent);
    //         expect(seqEvent.msg.duration).toEqual(0.125);
    //     });

    // });

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

    // it("should copy an array by value", function () {
    //     var src = createArray(32);
    //     var dest = sequencer.copyArray(src);
    //     dest[5] = "brzz";
    //     expect(dest.length).toEqual(32);
    //     expect(dest[5]).toMatch("brzz");
    //     expect(src[5]).toEqual(6);
    // });

});
