import { Action, ActionCreatorsMapObject } from "redux";
import { IPlugin, IState } from "./registry/interfaces";
import MasterRegistry from "./registry/MasterRegistry";
import { store } from "./store/store";

// system components
const audioContext: AudioContext = new AudioContext();
const registry: MasterRegistry = new MasterRegistry(audioContext);

// deprecated
// const registry: Registry = new Registry(audioContext);

// plugins
// const defaultSequencer: Sequencer = registry.registerPlugin(Sequencer);
// const defaultSampler: DemoSampler = registry.registerPlugin(DemoSampler);
// const defaultSynth: DemoSynth = registry.registerPlugin(DemoSynth);

export function getState(): IState {
    return store.getState();
}

export function dispatch(action: Action): void {
    store.dispatch(action);
}

// useful if the browser doesn't allow ac to start
export function resumeAudioContext(): void {
    audioContext.resume();
}

export function getAudioContext(): AudioContext {
    return audioContext;
}

export function addPlugin<P extends IPlugin>(pluginClass: new (ac: AudioContext) => P): string {
    return registry.addPlugin(pluginClass);
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
