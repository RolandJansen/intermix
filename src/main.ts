// intermix.EventBus = require('./EventBus.js');
// intermix.SoundWave = require('./SoundWave.js');
// intermix.Sound = require('./Sound.js');
// intermix.Sequencer = require('./Sequencer.js');
// intermix.Part = require('./Part.js');

// intermix.helper = require('./Helper.js');
// intermix.eventBus = new intermix.EventBus();
import Helper from "./Helper";

export default class Intermix {

    public audioContext: AudioContext;
    public helper: object;

    constructor() {
        this.audioContext = new window.AudioContext();
        this.helper = new Helper();
    }
}
