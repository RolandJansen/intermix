import { Action } from "redux";
import DemoSampler from "./plugins/DemoSampler";
import DemoSynth from "./plugins/DemoSynth";
import SeqPart from "./plugins/Sequencer/SeqPart";
import Sequencer from "./plugins/Sequencer/Sequencer";
import { IGlobalActionCreators, IPlugin } from "./registry/interfaces";
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
// const defaultSampler: DemoSampler = registry.registerPlugin(DemoSampler);
const defaultSynth: DemoSynth = registry.registerPlugin(DemoSynth);

export function getState(): any {
    return store.getState();
}

export function dispatch(action: Action) {
    store.dispatch(action);
}

// useful if the browser doesn't allow ac to start
export function resumeAudioContext() {
    audioContext.resume();
}

export function getAudioContext(): AudioContext {
    return audioContext;
}

export function getActionCreators(): IGlobalActionCreators {
    const pluginList = registry.pluginStore;
    const actionCreators: IGlobalActionCreators = {};

    pluginList.forEach((plugin: IPlugin) => {
        const pluginAC = {
            metadata: plugin.metaData,
            actionCreators: plugin.actionCreators,
        };
        actionCreators[plugin.uid] = pluginAC;
    });

    return actionCreators;
}

export function getNewPart(): SeqPart {
    return new SeqPart();
}

export function animate(animeFunc: (lastPlayedStep: number) => void) {
    defaultSequencer.updateFrame = animeFunc;
    // defaultSequencer.updateFrame(23);
}
