// import "web-audio-test-api";
import { AudioContext } from "web-audio-test-api";
import Sequencer from "../Sequencer";

// All 'new' features of the api have to be enabled here
// WebAudioTestAPI.setState({
//   "AudioContext#suspend": "enabled",
//   "AudioContext#resume": "enabled",
// });

describe("Sequencer", () => {
    let ac: AudioContext;
    let sequencer: Sequencer;
    // Sequencer, sequencer, pattern1
    //   , pattern2, part1, part2, seqEvent;

    function createArray(length: number) {
        const arr = [];
        for (let i = 0; i < length; i++) {
            arr[i] = i + 1;
        }
        return arr;
    }

    beforeEach(() => {
        ac = new AudioContext();
        sequencer = new Sequencer(ac);

        // mock window object globally if running on node
        // if (typeof window === "undefined") {
        //   global.window = {
        //     intermix: global.intermix,
        //     requestAnimationFrame: jasmine.createSpy("requestAnimationFrame"),
        //     AudioContext: jasmine.createSpy("AudioContext")
        //   };

        //   Sequencer = proxyquire("../../src/Sequencer.js", {
        //     "webworkify": function(worker) { return worker; },
        //     "./core.js": ac,
        //     "./scheduleWorker.js": jasmine.createSpyObj("scheduleWorker", [ "postMessage", "onmessage" ]),
        //     "@noCallThru": true
        //   });
        // } else {
        //   // var proxyquire = require('proxyquire');
        //   window.requestAnimationFrame = jasmine.createSpy("requestAnimationFrame");
        //   Sequencer = proxyquire("../../src/Sequencer.js", {
        //     "webworkify": function(worker) { return worker; },
        //     "./core.js": ac,
        //     "./scheduleWorker.js": jasmine.createSpyObj("scheduleWorker", [ "postMessage", "onmessage" ])
        //   });
        // }

        // pattern1 = [];
        // pattern2 = [];
        // for (var i = 0; i <= 3; i++) {
        //     pattern1[i] = createArray(4);
        //     pattern2[i] = createArray(3);
        // }
        // part1 = { "pattern": pattern1, "length": 64 };
        // part2 = { "pattern": pattern2, "length": 64 };
        // seqEvent = {
        //     "uid": "1a",
        //     "msg": { "type": "note", "value": 60, "velocity": 1, "steps": 4 }
        // };

    });

    // afterEach(function() {
    //   if (typeof global.window.document !== "undefined") {
    //     delete global.window;
    //   }
    //   ac = Sequencer = sequencer = pattern1 =
    //     pattern2 = part1 = part2 = seqEvent = null;
    // });

    it("ensure that we're testing against the WebAudioTestAPI", () => {
        expect(AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined();  // is the api mock there?
        // expect(sequencer.ac.$name).toBeDefined();                    //are we testing against it?
    });

    // it("registers to the controller relay of eventBus", function () {
    //     // should be more nicely rewritten as a 'registerToRelay' test
    //     expect(window.intermix.eventBus.addRelayEndpoint).toHaveBeenCalledWith("controller", {}, sequencer);
    // });

    // describe("scheduler", function () {

    //     beforeEach(function () {
    //         sequencer.addPartsToRunqueue = jasmine.createSpy("addPartsToRunqueue");
    //         sequencer.fireEvents = jasmine.createSpy("fireEvents");
    //         sequencer.increaseQueuePointer = jasmine.createSpy("setQueuePointer");
    //         sequencer.getMasterQueuePosition = jasmine.createSpy("getMasterQueuePosition");
    //     });

    //     afterEach(function () {
    //         sequencer.ac.$processTo("00:00.000");
    //     });

    //     it("runs until the lookahead limit is reached", function () {
    //         // should be splitted into separate tests
    //         sequencer.ac.$processTo("00:01.000");
    //         sequencer.scheduler();
    //         expect(sequencer.addPartsToRunqueue).toHaveBeenCalledTimes(10);
    //         expect(sequencer.fireEvents).toHaveBeenCalledTimes(10);
    //         expect(sequencer.increaseQueuePointer).toHaveBeenCalledTimes(10);
    //         expect(sequencer.getMasterQueuePosition).toHaveBeenCalledTimes(10);
    //         expect(sequencer.nextStepTime).toBeGreaterThan(1.3);
    //         expect(sequencer.nextStepTime).toBeLessThan(1.4);
    //     });
    // });

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

    // describe(".increaseQueuePointer", function () {

    //     it("sets the queue pointer one step forward", function () {
    //         sequencer.increaseQueuePointer();
    //         expect(sequencer.nextStep).toEqual(1);
    //         sequencer.increaseQueuePointer();
    //         expect(sequencer.nextStep).toEqual(2);
    //     });

    //     describe("in loop mode", function () {

    //         beforeEach(function () {
    //             sequencer.loopStart = 5;
    //             sequencer.loopEnd = 23;
    //             sequencer.loop = true;
    //             sequencer.nextStep = 22;
    //         });

    //         it("sets the pointer back to start when end of loop is reached", function () {
    //             sequencer.increaseQueuePointer();
    //             expect(sequencer.nextStep).toEqual(23);
    //             sequencer.increaseQueuePointer();
    //             expect(sequencer.nextStep).toEqual(5);
    //         });

    //         it("cleans the runqueue when the pointer jumps", function () {
    //             sequencer.runqueue.push(part1, part2);
    //             sequencer.increaseQueuePointer();
    //             sequencer.increaseQueuePointer();
    //             expect(sequencer.runqueue.length).toEqual(0);
    //         });

    //     });

    // });

    // describe(".setQueuePointer", function () {

    //     it("sets the pointer to a given position", function () {
    //         sequencer.setQueuePointer(42);
    //         expect(sequencer.nextStep).toEqual(42);
    //     });

    //     it("cleans the runqueue when the pointer jumps", function () {
    //         sequencer.runqueue.push(part1, part2);
    //         sequencer.setQueuePointer(5);
    //         expect(sequencer.runqueue.length).toEqual(0);
    //     });

    // });

    // describe(".resetQueuePointer", function () {

    //     it("resets the queue pointer", function () {
    //         sequencer.runqueue.push(part1, part2);
    //         sequencer.setQueuePointer(23);
    //         sequencer.resetQueuePointer();
    //         expect(sequencer.nextStep).toEqual(0);
    //         expect(sequencer.runqueue.length).toEqual(0);
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
    //     // has to be refactored (probably 2 new describe blocks):
    //     // it should do nothing if !isRunning
    //     // it shouldn't add to stepList if stepList is not empty

    //     beforeEach(function () {
    //         sequencer.start();
    //     });

    //     it("sets isRunning to true", function () {
    //         expect(sequencer.isRunning).toBeTruthy();
    //     });

    //     it("starts the scheduleWorker", function () {
    //         expect(sequencer.scheduleWorker.postMessage).toHaveBeenCalledWith("start");
    //     });

    //     it("adds an entry to the stepList as a start delay for .draw ", function () {
    //         expect(sequencer.stepList[0].time).toEqual(sequencer.ac.currentTime + 0.1);
    //     });

    //     it("calls window.requestAnimationFrame", function () {
    //         expect(window.requestAnimationFrame).toHaveBeenCalled();
    //     });

    // });

    // describe(".stop", function () {

    //     beforeEach(function () {
    //         sequencer.stop();
    //     });

    //     it("sets isRunning to false", function () {
    //         expect(sequencer.isRunning).toBeFalsy();
    //     });

    //     it("sets nextStepTime to 0 (will be set in the scheduler on start)", function () {
    //         expect(sequencer.nextStepTime).toBe(0);
    //     });

    //     it("halts the scheduleWorker", function () {
    //         expect(sequencer.scheduleWorker.postMessage).toHaveBeenCalledWith("stop");
    //     });

    // });

    // describe(".pause", function () {

    //     it("should pause", function () {
    //         sequencer.start();
    //         sequencer.pause();
    //         expect(sequencer.ac.state).toMatch("suspended");
    //         expect(sequencer.isRunning).toBeFalsy();
    //     });

    //     it("should not pause if sequencer's not running", function () {
    //         sequencer.pause();
    //         expect(sequencer.ac.state).toMatch("running");
    //     });

    //     it("should not pause if AudioContext already suspenden", function () {
    //         sequencer.ac.suspend();
    //         var paused = sequencer.pause();
    //         expect(paused).toBeFalsy();
    //     });

    // });

    // describe(".resume", function () {

    //     it("resumes when paused", function () {
    //         sequencer.ac.suspend();
    //         expect(sequencer.ac.state).toMatch("suspended");
    //         sequencer.resume();
    //         expect(sequencer.ac.state).toMatch("running");
    //     });

    //     it("doesn't resume if sequencer's running already", function () {
    //         sequencer.start();
    //         var resumed = sequencer.resume();
    //         expect(resumed).toBeFalsy();
    //     });

    //     it("doesn't resume if AudioContext is not suspended", function () {
    //         var resumed = sequencer.resume();
    //         expect(resumed).toBeFalsy();
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

    // describe(".addPart", function () {

    //     it("is chainable", function () {
    //         var ctx = sequencer.addPart(part1, 4);
    //         expect(ctx).toEqual(sequencer);
    //     });

    //     it("adds a part to the master queue", function () {
    //         sequencer.addPart(part1, 5);
    //         expect(sequencer.queue[5][0]).toBe(part1);
    //     });

    //     it("throws if parameter is not a part object", function () {
    //         expect(function () { sequencer.addPart("brzz", 6); }).toThrowError(TypeError);
    //     });

    // });

    // describe(".removePart", function () {

    //     beforeEach(function () {
    //         sequencer.addPart(part1, 5);
    //     });

    //     it("is chainable", function () {
    //         var ctx = sequencer.removePart(part1, 5);
    //         expect(ctx).toEqual(sequencer);
    //     });

    //     it("removes a part from the master queue", function () {
    //         sequencer.removePart(part1, 5);
    //         expect(sequencer.queue[5][0]).toBeUndefined();
    //     });

    //     it("throws if parameter is not a part object", function () {
    //         expect(function () { sequencer.removePart({}, 5); }).toThrowError(TypeError);
    //     });

    //     it("fails silently if part not found on given position", function () {
    //         expect(function () { sequencer.removePart(part1, 6); }).not.toThrow();
    //     });

    // });

    // describe(".setBpm", function () {

    //     it("should set the bpm value", function () {
    //         sequencer.setBpm(160);
    //         expect(sequencer.bpm).toEqual(160);
    //         expect(sequencer.timePerStep).toEqual(0.0234375);
    //     });

    // });

    // describe(".setTimePerStep", function () {

    //     it("should compute the time between two shortest possible notes", function () {
    //         var t1 = sequencer.setTimePerStep(120, 64);
    //         var t2 = sequencer.setTimePerStep(160, 24);
    //         expect(t1).toEqual(0.03125);
    //         expect(t2).toEqual(0.0625);
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
