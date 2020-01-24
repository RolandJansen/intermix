import { Action } from "redux";
import DemoSampler from "./plugins/DemoSampler";
import DemoSynth from "./plugins/DemoSynth";
import SeqPart from "./plugins/Sequencer/SeqPart";
import Sequencer from "./plugins/Sequencer/Sequencer";
import { IGlobalActionCreators, IPlugin } from "./registry/interfaces";
import Registry from "./registry/Registry";
import { store } from "./store/store";

// system components
const audioContext: AudioContext = new AudioContext();
const registry: Registry = new Registry(audioContext);

// plugins
const defaultSequencer: Sequencer = registry.registerPlugin(Sequencer);
const defaultSampler: DemoSampler = registry.registerPlugin(DemoSampler);
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

export function getActionCreators(bound?: string): IGlobalActionCreators {
    const pluginList = registry.pluginStore;
    const actionCreators: IGlobalActionCreators = {};
    let actionCreatorsType: string;

    actionCreatorsType = bound === "unbound" ? "actionCreators" : "boundActionCreators";

    pluginList.forEach((plugin: IPlugin) => {
        const pluginAC = {
            metadata: plugin.metaData,
            actionCreators: plugin[actionCreatorsType],
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
}

export const react = {
    store,
    actionCreators: getActionCreators("unbound"),
};
