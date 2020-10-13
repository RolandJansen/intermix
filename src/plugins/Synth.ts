import { AbstractPlugin } from "../registry/AbstractPlugin";
import { Tuple, IntermixNote, IntermixCtrl } from "../interfaces/interfaces";
import { IOscActionDef } from "../interfaces/IActions";
import { IPlugin, IPluginMetaData, IPluginConstructor } from "../interfaces/IRegistryItems";
/**
 * The builtin synthesizer plugin for intermix.js
 *
 * For API docs of the AudioContext see
 * https://developer.mozilla.org/de/docs/Web/API/AudioContext
 */
const Plugin: IPluginConstructor = class Synth extends AbstractPlugin implements IPlugin {
    public static readonly METADATA: IPluginMetaData = {
        type: "instrument",
        name: "Intermix Synth",
        version: "1.0.0",
        authors: "R. Jansen",
        desc: "A simple synthesizer",
    };
    private static readonly PREFIX = "/intermix/plugin/<UID>/";

    public readonly actionDefs: IOscActionDef[] = [
        {
            address: Synth.PREFIX + "envAttack",
            typeTag: ",sff",
            value: ["Envelope Attack", 0.0, 0.0],
            description: "Filter-Envelope Attack: name, value, starttime",
        },
        {
            address: Synth.PREFIX + "envDecay",
            typeTag: ",sff",
            value: ["Envelope Decay", 0.0, 0.0],
            description: "Filter-Envelope Decay: name, value, starttime",
        },
        {
            address: Synth.PREFIX + "stop",
            typeTag: ",N",
            description: "immediately disconnect all nodes from audio output",
        },
    ];

    private attack: number;
    private decay: number;
    private filter: BiquadFilterNode;
    private volume: GainNode;
    private queue: OscillatorNode[] = [];

    constructor(public readonly uid: string, private ac: AudioContext) {
        super();

        // Create biquad filter and gain nodes
        this.filter = this.ac.createBiquadFilter();
        this.volume = this.ac.createGain();

        // Initial envelope attack value in seconds
        this.attack = 0.1;

        // Initial envelope decay value in seconds
        this.decay = 0.1;

        // Initialize filter
        this.initFilter();
    }

    // list of all audio output nodes
    public get outputs(): AudioNode[] {
        return [this.volume];
    }

    // list of all input nodes, if no inputs, return an empty list
    public get inputs(): AudioNode[] {
        return [];
    }

    // onChange gets called
    // on every state change
    public onChange(changed: Tuple): boolean {
        switch (changed[0]) {
            case "note":
                const note: IntermixNote = changed[1];
                this.handleNote(note);
                return true;
            case "volume":
                this.handleVolume(changed[1]);
                return true;
            case "stop":
                this.stop();
                return true;
            case "envAttack":
                const attack: IntermixCtrl = changed[1];
                this.handleAttack(attack);
                return true;
            case "envDecay":
                const decay: IntermixCtrl = changed[1];
                this.handleDecay(decay);
                return true;
            default:
                return false;
        }
    }

    // Handles note events
    private handleNote(note: IntermixNote): void {
        if (note[1] >= 0 && note[1] <= 127) {
            this.start(note);
        }
    }

    private handleVolume(volume: number): void {
        if (volume >= 0 && volume <= 127) {
            this.volume.gain.value = volume / 128;
        }
    }

    // Handles attack-time-change events.
    // You could also archive this with getter/setter
    // but for the sake of consistency we use one handler
    // per action in this example.
    private handleAttack(control: IntermixCtrl): void {
        this.attack = control[1];
    }

    // Handles decay-time-change events.
    // You could also archive this with getter/setter
    // but for the sake of consistency we use one handler
    // per action in this example.
    private handleDecay(control: IntermixCtrl): void {
        this.decay = control[1];
    }

    // Sets filtertype, quality, cutoff frequency and connect it to gain node
    private initFilter(): void {
        this.filter.type = "lowpass";
        this.filter.Q.value = 15;
        this.filter.frequency.value = 1000;
        this.filter.connect(this.volume);
    }

    // Plays a note
    private start(note: IntermixNote): void {
        const freq = this.frequencyLookup[note[1]];
        const osc = this.getNewOsc(freq);
        osc.start(note[4]);
        osc.stop(note[3] + note[4]);
        this.queue.push(osc);
        this.startEnvelope(note[4]);
    }

    private stop(): void {
        this.queue.forEach((node) => {
            // we can't stop a running node so we just disconnect
            node.disconnect();
        });
        this.queue = []; // release all references
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

    // Schedules an envelope run
    private startEnvelope(delay: number): void {
        const freq = this.filter.frequency;
        freq.cancelScheduledValues(delay);
        freq.setValueAtTime(12000, delay);
        freq.linearRampToValueAtTime(22050, delay + this.attack);
        freq.linearRampToValueAtTime(1000, delay + this.decay);
    }
};
export default Plugin;
