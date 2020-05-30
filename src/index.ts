import { Action, ActionCreatorsMapObject } from "redux";
import { IPlugin, IState } from "./registry/interfaces";
import MasterRegistry from "./registry/MasterRegistry";
import { store } from "./store/store";
import Sequencer from "./plugins/Sequencer/Sequencer";
import DemoSampler from "./plugins/Sampler";
import DemoSynth from "./plugins/Synth";
import SeqPart from "./seqpart/SeqPart";

// system components
const audioContext: AudioContext = new AudioContext();
const registry: MasterRegistry = new MasterRegistry(audioContext);

// deprecated
// const registry: Registry = new Registry(audioContext);

// plugins
// const defaultSequencer: Sequencer = registry.registerPlugin(Sequencer);
// const defaultSampler: DemoSampler = registry.registerPlugin(DemoSampler);
// const defaultSynth: DemoSynth = registry.registerPlugin(DemoSynth);

export const plugins = {
    Sequencer,
    DemoSampler,
    DemoSynth,
};

export function getState(): IState {
    return store.getState();
}

export function dispatch(action: Action): void {
    const dispatched = store.dispatch(action);
    console.log(dispatched)
}

// useful if the browser doesn't allow ac to start
export function resumeAudioContext(): void {
    audioContext.resume();
}

export function getAudioContext(): AudioContext {
    return audioContext;
}

type GenericPluginClass = new (ac: AudioContext) => IPlugin;

/**
 * Tries to find a class (prototype) with the name of a given string (reflection),
 * then tries to cast it to a valid plugin class.
 * If both worked, a plugin instance will be created, registered etc.
 * and the item-id will be returned
 * @param pluginClassName The name of the class from which a plugin instance should be created
 */
export function addPlugin(pluginClassName: string): string {
    try {
        if (plugins.hasOwnProperty(pluginClassName)) {
            const possibleClass: any = (plugins as any)[pluginClassName];
            const pluginClass: GenericPluginClass = (possibleClass as GenericPluginClass);

            return registry.addPlugin(pluginClass);
        }
        return ""
    } catch (error) {
        // not implemented yet
        console.log(error);
        return "";
    }
}

export function removePlugin(itemId: string): void {
    registry.removePlugin(itemId);
}

export function addSeqPart(lengthInStepsPerBar?: number): string {
    if (lengthInStepsPerBar) {
        return registry.addSeqPart(lengthInStepsPerBar);
    } else {
        return registry.addSeqPart();
    }
}

export function removeSeqPart(itemId: string): void {
    registry.removeSeqPart(itemId);
}

export function getActionCreators(itemId: string): ActionCreatorsMapObject {
    return registry.getActionCreators(itemId);
}

export function getUnboundActionCreators(itemId: string): ActionCreatorsMapObject {
    return registry.getActionCreators(itemId, "unbound");
}

export function getSeqPart(itemId: string): SeqPart {
    return registry.getSeqPart(itemId);
}
// export function getNewPart(): SeqPart {
//     return new SeqPart();
// }

// export function animate(animeFunc: (lastPlayedStep: number) => void): void {
//     defaultSequencer.updateFrame = animeFunc;
// }

// export const react = {
//     store,
//     actionCreators: getActionCreators("unbound"),
// };
