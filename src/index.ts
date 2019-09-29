import { Store } from "redux";
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

const reduxStore: Store = store;

const audioContext: AudioContext = new AudioContext();
const registry: Registry = new Registry(audioContext);

export function getSequencerInstance(): Sequencer {
    const seq: Sequencer = registry.registerPlugin(Sequencer);
    return seq;
}

    // this should be encapsulated in a dev namespace
    // get audioContext(): AudioContext {
    //     return this._audioContext;
    // }

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
