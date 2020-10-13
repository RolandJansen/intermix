/// <reference path="../../../typings/web-audio-test-api.d.ts" />
import "web-audio-test-api";
import Synth from "../Synth";
import { IntermixNote, IntermixCtrl } from "../../interfaces/interfaces";
import { IPlugin } from "../../interfaces/IRegistryItems";

describe("DemoSynth", () => {
    let ac: AudioContext;
    let synth: IPlugin;

    beforeEach(() => {
        ac = new AudioContext();
        synth = new Synth("abcd", ac);
    });

    test("ensure that we're testing against the WebAudioTestAPI", () => {
        expect(ac.$name).toEqual("AudioContext");
    });

    test("has a metadata section (static)", () => {
        expect(Synth.METADATA.type).toEqual("instrument");
        expect(Synth.METADATA.name).toEqual("Intermix Synth");
    });

    test("has action definitions", () => {
        expect(synth.actionDefs[0].typeTag).toEqual(",sff");
    });

    test("has zero inputs", () => {
        expect(synth.inputs.length).toEqual(0);
    });

    test("has one output", () => {
        expect(synth.outputs.length).toEqual(1);
    });

    test("output type is GainNode", () => {
        expect(synth.outputs[0]).toBeInstanceOf(GainNode);
    });

    describe("onChange", () => {
        let testNote: IntermixNote;
        let testCtrl: IntermixCtrl;

        beforeEach(() => {
            testNote = ["note", 23, 1, 1, 1];
            testCtrl = ["testCtrl", 0.23, 0];
            // {
            //     value: 23,
            //     velocity: 1,
            //     steps: 1,
            //     duration: 1,
            //     startTime: 1,
            // };
            synth["ac"].$processTo("00:00.000");
        });

        test("should return false with an uncovered parameter", () => {
            const falsyValue = synth.onChange(["FANTASY_PARAMETER", 23]);
            expect(falsyValue).toBeFalsy();
        });

        test("should add and delete OscillatorNodes from the queue", () => {
            synth.onChange(["note", testNote]);
            synth.onChange(["note", testNote]);
            expect(synth["queue"].length).toEqual(2);
            synth.onChange(["stop", true]);
            expect(synth["queue"].length).toEqual(0);
        });

        test("should start and stop an OscillatorNode at given times", () => {
            synth.onChange(["note", testNote]);

            const node = synth["queue"][0];
            expect(node.$stateAtTime("00:00.000")).toBe("SCHEDULED");
            expect(node.$stateAtTime("00:00.999")).toBe("SCHEDULED");
            expect(node.$stateAtTime("00:01.000")).toBe("PLAYING");
            expect(node.$stateAtTime("00:01.999")).toBe("PLAYING");
            expect(node.$stateAtTime("00:02.000")).toBe("FINISHED");
        });

        test("should disconnect nodes on stop", () => {
            synth.onChange(["note", testNote]);
            const oscNode = synth["queue"][0];
            oscNode.disconnect = jest.fn(); // fake disconnect call
            synth.onChange(["stop", true]);
            expect(oscNode.disconnect).toHaveBeenCalledTimes(1);
        });

        test("should remove nodes from queue on stop", () => {
            synth.onChange(["note", testNote]);
            expect(synth["queue"].length).toEqual(1);
            synth.onChange(["stop", true]);
            expect(synth["queue"].length).toEqual(0);
        });

        test("should handle envelope attack", () => {
            // there's no check if value is within range (covered by actionDef)
            synth.onChange(["envAttack", testCtrl]);
            expect(synth["attack"]).toEqual(0.23);
        });

        test("should handle envelope decay", () => {
            // there's no check if value is within range (covered by actionDef)
            synth.onChange(["envDecay", testCtrl]);
            expect(synth["decay"]).toEqual(0.23);
        });
    });
});
