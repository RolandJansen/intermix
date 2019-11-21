import AbstractPlugin from "../registry/AbstractPlugin";
import { IActionDef, IDelayedNote, IPlugin, IPluginMetaData, Tuple } from "../registry/interfaces";
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
        name: "Demo Synth",
        version: "1.0.0",
        author: "R. Jansen",
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

    private attack: number;
    private decay: number;
    private filter: BiquadFilterNode;
    private queue: OscillatorNode[] = [];

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
                const note: IDelayedNote = changed[1];
                this.handleNote(note);
                return true;
            case "STOP":
                this.stop();
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
    private handleNote(note: IDelayedNote): void {
        if (note.noteNumber >= 0 && note.noteNumber <= 127) {
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
    private handleDecay(value: number): void {
        this.decay = value;
    }

    // Sets filtertype, quality and initial cutoff frequency
    private initFilter(): void {
        this.filter.type = "lowpass";
        this.filter.Q.value = 15;
        this.filter.frequency.value = 1000;
    }

    // Plays a note
    private start(note: IDelayedNote): void {
        const freq = this.frequencyLookup[note.noteNumber];
        const osc = this.getNewOsc(freq);
        osc.start(note.startTime);
        osc.stop(note.startTime + note.duration);
        this.queue.push(osc);
        this.startEnvelope(note.startTime);
    }

    private stop() {
        this.queue.forEach((node) => {
            // we can't stop a node twice so we just disconnect
            node.disconnect();
        });
        this.queue = [];  // release all references
    }

    // Creates a sawtooth oscillator object and returns it.
    // An oscillation destroys itself after a note is played.
    private getNewOsc(freq: number): OscillatorNode {
        const osc = this.ac.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        // osc.connect(this.filter);
        return osc;
    }

    // Schedules an envelope run
    private startEnvelope(delay: number): void {
        const freq = this.filter.frequency;
        freq.cancelScheduledValues(delay);
        freq.setValueAtTime(12000, delay);
        freq.linearRampToValueAtTime(22050, delay + this.attack);
        freq.linearRampToValueAtTime(1000, delay + this.decay);
    }
}
