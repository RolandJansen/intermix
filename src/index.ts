import { Action } from "redux";
import DemoSampler from "./plugins/DemoSampler";
import DemoSynth from "./plugins/DemoSynth";
import Sequencer from "./plugins/Sequencer/Sequencer";
import Registry from "./registry/Registry";
import { store } from "./store/store";

// In vscode, go to File->Preferences->Settings
// search for "experimental decorators" and enable
// the corresponding setting to disable warnings
// in the editor.
// TODO: put this in the readme.

// system components
const audioContext: AudioContext = new AudioContext();
const registry: Registry = new Registry(audioContext);

// plugins
const defaultSequencer: Sequencer = registry.registerPlugin(Sequencer);
const defaultSampler: DemoSampler = registry.registerPlugin(DemoSampler);
const defaultSynth: DemoSynth = registry.registerPlugin(DemoSynth);

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
