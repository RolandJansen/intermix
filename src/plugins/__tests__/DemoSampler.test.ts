/// <reference path="../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import { IDelayedNote } from "../../registry/interfaces";
import DemoSampler from "../DemoSampler";

// tslint:disable: no-string-literal
// We use string-literals to test private functions like:
// objectName["privateMethod"](parameters)
// Normally this could be considered as bad style ("test API only")
// but here we want to check the values of private fields to
// check the result of certain api calls.

describe("DemoSampler", () => {
    let ac: AudioContext;
    let sampler: DemoSampler;

    beforeEach(() => {
        ac = new AudioContext();
        sampler = new DemoSampler(ac);
    });

    test("ensure that we're testing against the WebAudioTestAPI", () => {
        expect(ac.$name).toEqual("AudioContext");
    });

    test("has a metadata section", () => {
        expect(sampler.metaData.type).toEqual("instrument");
        expect(sampler.metaData.name).toEqual("Demo Sampler");
    });

    test("has action definitions", () => {
        const actionDef = {
            type: "VOLUME",
            desc: "loudness",
            minVal: 0,
            maxVal: 127,
            defVal: 127,
            steps: 128,
        };
        expect(sampler.actionDefs).toContainEqual(actionDef);
    });

    test("has zero inputs", () => {
        expect(sampler.inputs.length).toEqual(0);
    });

    test("has one output", () => {
        expect(sampler.outputs.length).toEqual(1);
    });

    test("output type is gainNode", () => {
        expect(sampler.outputs[0]).toBeInstanceOf(GainNode);
    });

    test("has an empty audio buffer by default", () => {
        const buffer = sampler["audioData"];
        expect(buffer.length).toEqual(0);
        expect(buffer.sampleRate).toEqual(ac.sampleRate);
    });

    describe("onChange", () => {
        let note: IDelayedNote;
        let buffer: AudioBuffer;

        beforeEach(() => {
            note = {
                value: 23,
                velocity: 1,
                steps: 1,
                duration: 1,
                startTime: 1,
            };
            buffer = ac.createBuffer(1, 22050, 44100);  // create a buffer of 0.5s length
            sampler["ac"].$processTo("00:00.000");
        });

        test("should return false with an uncovered parameter", () => {
            const falsyValue = sampler.onChange(["FANTASY_PARAMETER", 23]);
            expect(falsyValue).toBeFalsy();
        });

        test("should replace the default audio buffer", () => {
            sampler.onChange(["AUDIODATA", buffer]);
            expect(sampler["audioData"]).toBe(buffer);
        });

        test("should add and delete BufferSourceNodes from the queue", () => {
            sampler.onChange(["NOTE", note]);
            expect(sampler["queue"].length).toEqual(1);
            sampler.onChange(["STOP", true]);
            expect(sampler["queue"].length).toEqual(0);
        });

        test("should start a BufferSourceNode at a given time", () => {
            sampler.onChange(["AUDIODATA", buffer]);
            sampler.onChange(["NOTE", note]);

            const node = sampler["queue"][0];
            expect(node.$stateAtTime("00:00.000")).toBe("SCHEDULED");
            expect(node.$stateAtTime("00:00.999")).toBe("SCHEDULED");
            expect(node.$stateAtTime("00:01.000")).toBe("PLAYING");
            expect(node.$stateAtTime("00:01.499")).toBe("PLAYING");
            expect(node.$stateAtTime("00:01.500")).toBe("FINISHED");
        });

        test("should stop a BufferSourceNode immediately", () => {
            sampler.onChange(["AUDIODATA", buffer]);
            sampler.onChange(["NOTE", note]);
            expect(sampler["queue"][0].$stateAtTime("00:01.000")).toBe("PLAYING");

            sampler.onChange(["STOP", true]);
            expect(sampler["queue"][0]).not.toBeDefined();
        });

        test("should stop a BufferSourceNode even if it\'s just scheduled.", () => {
            sampler.onChange(["AUDIODATA", buffer]);
            sampler.onChange(["NOTE", note]);
            expect(sampler["queue"][0].$stateAtTime("00:00.500")).toBe("SCHEDULED");

            sampler.onChange(["STOP", true]);
            expect(sampler["queue"][0]).not.toBeDefined();
        });

        test("should set the volume", () => {
            sampler.onChange(["VOLUME", 64]);
            expect(sampler["gainNode"].gain.value).toEqual(0.5);
        });

    });

});
