import { ActionCreatorsMapObject } from "redux";
import AbstractPlugin from "../registry/AbstractPlugin";
import { IActionDef, IPlugin, IPluginMetaData, Note, Tuple } from "../registry/interfaces";
/**
 * An example synthesizer plugin for intermix.js
 *
 *
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
export default class DemoSynth extends AbstractPlugin implements IPlugin {

  public readonly metaData: IPluginMetaData = {
    type: "instrument",
    name: "Basic Synth",
    version: "1.0.0",
    author: "Roland Jansen",
    desc: "A simple synthesizer demo",
  };

  public readonly actionDefs: IActionDef[] = [
    {
      type: "ENV_ATTACK",
      desc: "Envelope Attack",
      minVal: 0,
      maxVal: 1,
      defVal: 0,
      steps: 128,
    },
    {
      type: "ENV_DECAY",
      desc: "Envelope Decay",
      minVal: 0,
      maxVal: 1,
      defVal: 0.5,
      steps: 128,
    },
  ];

  public actionCreators: ActionCreatorsMapObject;
  private filter: BiquadFilterNode;
  private attack: number;
  private decay: number;

  constructor(private ac: AudioContext) {
    super();

    // Create a new biquad filter
    this.filter = this.ac.createBiquadFilter();

    // Initial envelope attack value in seconds
    this.attack = 0.1;

    // Initial envelope decay value in seconds
    this.decay = 0.1;

    // Initialize filter
    this.initFilter();
  }

  // list of all audio output nodes
  public get outputs(): AudioNode[] {
    return [
      this.filter,
    ];
  }

  // list of all input nodes, if no inputs, return an empty list
  public get inputs(): AudioNode[] {
    return [];
  }

  // onChange gets called
  // on every state change
  public onChange(changed: Tuple) {
    switch (changed[0]) {
      case "NOTE":
      this.handleNote(changed[1]);
      return true;
      case "ENV_ATTACK":
      this.handleAttack(changed[1]);
      return true;
      case "ENV_DECAY":
      this.handleDecay(changed[1]);
      return true;
      default:
      return false;
    }
  }

  // Handles note events
  private handleNote(note: Note): void {
    const tone = note[0];
    if (tone >= 0 && tone <= 127) {
      this.start(note);
    }
  }

  // Handles attack-time-change events.
  // You could also archive this with getter/setter
  // but for the sake of consistency we use one handler
  // per action in this example.
  private handleAttack(value: number): void {
    this.attack = value;
  }

  // Handles decay-time-change events.
  // You could also archive this with getter/setter
  // but for the sake of consistency we use one handler
  // per action in this example.
  private handleDecay = function(value: number): void {
    this.decay = value;
  };

  // Sets filtertype, quality and initial cutoff frequency
  private initFilter(): void {
    this.filter.type = "lowpass";
    this.filter.Q.value = 15;
    this.filter.frequency.value = 1000;
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
    const osc = this.ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.connect(this.filter);
    return osc;
  }

  // Plays a note
  private start([noteNumber, duration, delay]: Note): void {
    const freq = this.frequencyLookup[noteNumber];
    const osc = this.getNewOsc(freq);
    osc.start(delay);
    osc.stop(delay + duration);
    this.startEnvelope(delay);
  }
}
