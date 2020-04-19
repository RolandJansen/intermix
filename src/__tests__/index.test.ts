/// <reference path="../../typings/web-audio-test-api.d.ts" />
import { ActionCreatorsMapObject } from "redux";
import "web-audio-test-api";
import {
    dispatch,
    getActionCreators,
    getAudioContext,
    getNewPart,
    getState,
    resumeAudioContext } from "../index";
import { IAction, IGlobalActionCreators, IState } from "../registry/interfaces";
import SeqPart from "../seqpart/SeqPart";

/**
 * Integration tests for the intermix API
 */

// no workers in node.js, we use the same manual mock as in sequencer test
jest.mock("../plugins/Sequencer/clock.worker");

// WebAudioTestAPI Config
WebAudioTestAPI.setState({
    "AudioContext#suspend": "enabled",
    "AudioContext#resume": "enabled",
});

describe("Intermix", () => {
    let allActionCreators: IGlobalActionCreators = {};
    let seqAC: ActionCreatorsMapObject = {};
    let seqUID = "";

    beforeEach(() => {
        allActionCreators = getActionCreators();

        for (const uid in allActionCreators) {
            if (allActionCreators[uid].metadata.name === "Intermix Sequencer") {
                seqUID = uid;
                seqAC = allActionCreators[uid].actionCreators;
            }
        }
    });

    test("provides an audioContext", () => {
        const audioContext: AudioContext = getAudioContext();
        expect(audioContext).toBeDefined();
    });

    test("ensure that we're testing against the WebAudioTestAPI", () => {
        const audioContext: AudioContext = getAudioContext();
        expect(audioContext.$name).toEqual("AudioContext");
    });

    test("provides a function to resume audio context", () => {
        const audioContext: AudioContext = getAudioContext();
        audioContext.suspend();
        expect(audioContext.state).toEqual("suspended");
        resumeAudioContext();
        expect(audioContext.state).toEqual("running");
    });

    test("provides the global state", () => {
        const globalState: IState = getState();
        const getPartialState = (uid: string): string => {
            return JSON.stringify({
                uid,
                ENV_ATTACK: { value: 0 },
                ENV_DECAY: { value: 0.5 },
                NOTE: { value: 0, velocity: 1, steps: 0, duration: 0 },
            });
        };
        let gsContainsPs = false;

        for (const uid in globalState) {
            if (getPartialState(uid) === JSON.stringify(globalState[uid])) {
                gsContainsPs = true;
            }
        }
        expect(gsContainsPs).toBeTruthy();
    });

    test("provides action creators for all plugins", () => {
        // tslint:disable-next-line: forin
        for (const uid in allActionCreators) {
            const pluginAC = allActionCreators[uid];
            expect(pluginAC).toHaveProperty("metadata");
            expect(pluginAC).toHaveProperty("actionCreators");
        }
    });

    test("action creators are bound to dispatch", () => {
        seqAC.BPM(90);  // calls dispatch
        const globalState = getState();
        expect(globalState[seqUID].BPM).toEqual(90);
    });

    test("provides a dispatch function", () => {
        let globalState = getState();

        // state is polluted from former test (not ideal but ok for now)
        expect(globalState[seqUID].BPM).toEqual(90);

        const bpmAction: IAction = {
            type: "BPM",
            dest: seqUID,
            payload: 180,
        };
        dispatch(bpmAction);

        globalState = getState();
        expect(globalState[seqUID].BPM).toEqual(180);
    });

    test("getNewPart returns a part object", () => {
        // this test is kinda dump in typescript
        const part: SeqPart = getNewPart();
        expect(part).toBeInstanceOf(SeqPart);
    });

    // test("animate forwards a callback to sequencer.updateFrame", () => {
    //     const audioContext: AudioContext = getAudioContext();
    //     const boundActionCreators = getActionCreators();
    //     const animeCallback = jest.fn();
    //     let seqActionCreators: ActionCreatorsMapObject = {};

    //     for (const uid in allActionCreators) {
    //         if (allActionCreators[uid].metadata.name === "Intermix Sequencer") {
    //             // seqUID = uid;
    //             seqActionCreators = allActionCreators[uid].actionCreators;
    //         }
    //     }
    //     animate(animeCallback);
    //     audioContext.$processTo("00:00.000");
    //     seqActionCreators.STATE(1);
    //     audioContext.$processTo("00:01.000");
    //     seqActionCreators.STATE(0);
    //     expect(animeCallback).toBeCalled();
    // });

    // This raf mock doesn't work.
    // It works in the browser and I'm sick of it spending hours on this test.
    // describe("animate", () => {

    //     beforeAll(() => {
    //         // make raf synchronous (return value (23) doesn't matter here)
    //         jest.spyOn(window, "requestAnimationFrame").
    //             mockImplementation((cb) => 23);
    //     });

    //     afterAll(() => {
    //         // doesn't work, probably not needed
    //         // window.requestAnimationFrame.mockRestore();
    //     });

    //     test("provides an animation function", () => {
    //         const doSomething = jest.fn();

    //         animate(doSomething);
    //         seqAC.STATE(1);
    //         seqAC.STATE(0);
    //         expect(window.requestAnimationFrame).toBeCalled();
    //         expect(doSomething).toHaveBeenCalled();
    //     });

    // });

});
