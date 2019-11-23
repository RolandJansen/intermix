/// <reference path="../../typings/web-audio-test-api.d.ts" />
import { ActionCreatorsMapObject } from "redux";
import "web-audio-test-api";
import { dispatch,getActionCreators, getAudioContext, getState, resumeAudioContext } from "../index";
import ClockWorker from "../plugins/Sequencer/clock.worker";
import { IAction, IState } from "../registry/interfaces";

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
        const partialState = JSON.stringify({ VOLUME: 127 });
        let gsContainsPs = false;

        for (const uid in globalState) {
            if (partialState === JSON.stringify(globalState[uid])) {
                gsContainsPs = true;
            }
        }
        expect(gsContainsPs).toBeTruthy();
    });

    test("provides action creators for all plugins", () => {
        const allActionCreators = getActionCreators();

        // tslint:disable-next-line: forin
        for (const uid in allActionCreators) {
            const pluginAC = allActionCreators[uid];
            expect(pluginAC).toHaveProperty("metadata");
            expect(pluginAC).toHaveProperty("actionCreators");
        }
    });

    test("action creators are bound to dispatch", () => {
        const allActionCreators = getActionCreators();
        let seqUID: string = "";
        let seqAC: ActionCreatorsMapObject = {};

        for (const uid in allActionCreators) {
            if (allActionCreators[uid].metadata.name === "Intermix Sequencer") {
                seqUID = uid;
                seqAC = allActionCreators[uid].actionCreators;
            }
        }
        seqAC.BPM(90);

        const globalState = getState();
        expect(globalState[seqUID].BPM).toEqual(90);
    });

    test("provides a dispatch function", () => {
        const allActionCreators = getActionCreators();
        let seqUID: string = "";
        let globalState = getState();

        for (const uid in allActionCreators) {
            if (allActionCreators[uid].metadata.name === "Intermix Sequencer") {
                seqUID = uid;
            }
        }
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

});
