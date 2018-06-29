import Intermix from "./main";
/**
 * An example plugin for intermix.js
 *
 * Technically, the intermix namespace (window.intermix) is
 * just an extended AudioContext instance.
 * This means that intermix provides not just the
 * library functions but also all properties and methods
 * of the browsers AudioContext which makes it easy to build
 * synthesizers.
 *
 * For API docs of the AudioContext see
 * https://developer.mozilla.org/de/docs/Web/API/AudioContext
 */
interface IMySynthAction {
  type: string;
  payload: number | RangeError;
  meta: string;
  error?: boolean;
}

const MY_SYNTH_ENV_ATTACK = "MY_SYNTH_ENV_ATTACK";
const MY_SYNTH_ENV_DECAY = "MY_SYNTH_ENV_DECAY";

class MySynth {

  private im: Intermix;
  private ac: AudioContext;
  private uid: string;
  private filter: BiquadFilterNode;
  private attack: number;
  private decay: number;

  constructor(intermix: Intermix) {
    this.im = intermix;

    // map the AudioContext to a class member (optional)
    this.ac = this.im.audioContext;

    // Create a new biquad filter
    this.filter = this.ac.createBiquadFilter();

    // Initial envelope attack value in seconds
    this.attack = 0.1;

    // Initial envelope decay value in seconds
    this.decay = 0.1;

    this.uid = this.im.registerPlugin("My Synthesizer");
    this.im.registerActionCreators([
      this.getEnvAttackAction,
      this.getEnvDecayAction,
    ]);
  }

  private getEnvAttackAction(attack: number, error = false): IMySynthAction {
    return this.getMySynthAction(MY_SYNTH_ENV_ATTACK, attack, "Filter Attack");
  }

  private getEnvDecayAction(decay: number, error = false) {
    return this.getMySynthAction(MY_SYNTH_ENV_DECAY, decay, "Filter Decay");
  }

  private getMySynthAction(type: string, value: number, meta: string, error = false) {
    let payload: number | RangeError;

    if (value < 0 || value > 1) {
      error = true;
      payload = new RangeError("The argument must be between 0 and 1.");
    } else {
      payload = value;
    }

    return {
      type,
      payload,
      meta,
      error,
    };

  }

  // Sets filtertype, quality and initial cutoff frequency
  private initFilter(): void {
    this.filter.type = "lowpass";
    this.filter.Q.value = 15;
    this.filter.frequency.value = 1000;
  }

  // Connects the filter to main out
  private connect(): void {
    this.filter.connect(intermix.destination);
  }

  // Schedules an envelope run
  private startEnvelope(delay: number): void {
    const freq = this.filter.frequency;
    freq.cancelScheduledValues(delay);
    freq.setValueAtTime(12000, delay);
    freq.linearRampToValueAtTime(22050, delay + this.attack);
    freq.linearRampToValueAtTime(1000, delay + this.decay);
  }

  // Creates a sawtooth oscillator object and returns it.
  // An oscillation destroys itself after a note is played.
  private getNewOsc(freq: number): OscillatorNode {
    const osc = intermix.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.connect(this.filter);
    return osc;
  }

  // Plays a note
  private start(noteMsg): void {
    const freq = intermix.helper.getNoteFrequency(noteMsg.value);
    const osc = this.getNewOsc(freq);
    osc.start(noteMsg.delay);
    osc.stop(noteMsg.delay + noteMsg.duration);
    this.startEnvelope(noteMsg.delay);
  }

  // This function has to be implemented by every plugin.
  // It gets called by the eventbus if a message arrives.
  // Here we use a lookup table to avoid conditionals.
  private handleRelayData(evt): void {
    const msg = evt.msg;
    this.handleEvents[msg.type].call(this, msg);
  }

  // Handles note events
  private handleNote = function(msg): void {
    var tone = msg.value;
    if (tone >= 0 && tone <= 127) {
      this.start(msg);
    }
  };

  // Handles attack-time-change events
  private handleAttack = function(msg) {
    this.attack = msg.value;
  };

  // Handles decay-time-change events
  private handleDecay = function(msg) {
    this.decay = msg.value;
  };

  // Define any number of controllable events
  // and name them at will. Custom events should
  // be defined with a name and an array with
  // min/max/default values.
  // Here we just have attack/decay.
  this.events = {
    filterEnvAttack: [0, 0.2, 0.1],
    filterEnvDecay: [0, 0.2, 0.1],
  };
  // Define callback functions for the
  // previously defined events.
  this.handleEvents = {
    note: this.handleNote,
    filterEnvAttack: this.handleAttack,
    filterEnvDecay: this.handleDecay
  };

  // Register this plugin to the instrument relay
  // of the intermix event bus. It returns a unique id
  // which is of no use in this example.
  this.uid = intermix.eventBus.addRelayEndpoint('instrument', this.events, this);

  // Setup the audio chain (which consists of
  // just one filter) and connect it to the audio output
  this.initFilter();
  this.connect();

}
