import { createStore, Store } from "redux";

import { initialState } from "./store/initialState";
import reducer from "./store/reducers";

// intermix.EventBus = require('./EventBus.js');
// intermix.SoundWave = require('./SoundWave.js');
// intermix.Sound = require('./Sound.js');
// intermix.Sequencer = require('./Sequencer.js');
// intermix.Part = require('./Part.js');

// intermix.helper = require('./Helper.js');
// intermix.eventBus = new intermix.EventBus();
// import Helper from "./Helper";

export default class Intermix {

    private _store: Store;

    // tslint:disable-next-line:variable-name
    private _audioContext: AudioContext;
    // public helper: object;

    constructor() {
        this._audioContext = new AudioContext();
        this._store = createStore(
            reducer,
            initialState,
        );
    }

    get audioContext(): AudioContext {
        return this._audioContext;
    }

    get store(): Store {
        return this._store;
    }

}
