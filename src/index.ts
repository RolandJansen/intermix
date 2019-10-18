import { Action, Store } from "redux";
import Sequencer from "./plugins/Sequencer/Sequencer";
import Registry from "./registry/Registry";
import { store } from "./store/store";

// In vscode, go to File->Preferences->Settings
// search for "experimental decorators" and enable
// the corresponding setting to disable warnings
// in the editor.
// TODO: put this in the readme.

// intermix.EventBus = require('./EventBus.js');
// intermix.SoundWave = require('./SoundWave.js');
// intermix.Sound = require('./Sound.js');
// intermix.Sequencer = require('./Sequencer.js');
// intermix.Part = require('./Part.js');

// intermix.eventBus = new intermix.EventBus();
// import Helper from "./Helper";

// const reduxStore: Store = store;
const audioContext: AudioContext = new AudioContext();
const registry: Registry = new Registry(audioContext);
const defaultSequencer: Sequencer = registry.registerPlugin(Sequencer);

export function getState() {
    return store.getState();
}

export function dispatch(action: Action) {
    // console.log(action);
    store.dispatch(action);
}

// useful if the browser doesn't allow ac to start
export function resumeAudioContext() {
    audioContext.resume();
}

export function getAudioContext(): AudioContext {
    return audioContext;
}

export function getDefaultSequencer(): Sequencer {
    return defaultSequencer;
}

    // get store(): Store {
    //     return store;
    // }

    // public getPluginInstanceRef(instanceId: number): boolean {
    //     return true;
    // }

    // public loadPlugin(): boolean {
    //     return true;
    // }

    // public removePlugin(): boolean {
    //     return true;
    // }

    // public makePluginInstance(pluginId: number): boolean {
    //     return true;
    // }

    // private initDefaultPlugins(): boolean {
    //     return true;
    // }
