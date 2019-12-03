import AbstractPlugin from "../registry/AbstractPlugin";
import { IActionDef, IDelayedNote, IPlugin, IPluginMetaData, Tuple } from "../registry/interfaces";

export default class DemoSampler extends AbstractPlugin implements IPlugin {

    public readonly metaData: IPluginMetaData = {
        type: "instrument",
        name: "Demo Sampler",
        version: "1.0.0",
        author: "R. Jansen",
        desc: "A sample player demo",
    };

    public readonly actionDefs: IActionDef[] = [
        {
            type: "VOLUME",
            desc: "loudness",
            minVal: 0,
            maxVal: 127,
            defVal: { value: 127 },
            steps: 128,
        },
    ];

    private gainNode: GainNode;
    private audioData: AudioBuffer;
    private queue: AudioBufferSourceNode[] = [];  // list of polyphonic voices

    constructor(private ac: AudioContext) {
        super();

        // create gain node
        this.gainNode = this.ac.createGain();
        this.gainNode.gain.value = 1;

        // create an empty audio buffer to prevent potential errors
        this.audioData = ac.createBuffer(1, 1, ac.sampleRate);
    }

    // list of all audio output nodes
    public get outputs(): AudioNode[] {
        return [
            this.gainNode,
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
            case "VOLUME":
                this.handleVolume(changed[1]);
                return true;
            case "STOP":
                this.stop();
                return true;
            case "AUDIODATA":
                const buffer: AudioBuffer = changed[1];
                this.handleAudioData(buffer);
                return true;
            default:
                return false;
        }
    }

    private handleNote(note: IDelayedNote) {
        if (note.value >= 0 && note.value <= 127) {
            this.start(note);
        }
    }

    private handleVolume(volume: number) {
        if (volume >= 0 && volume <= 127) {
            this.gainNode.gain.value = volume / 128;
        }
    }

    private handleAudioData(buffer: AudioBuffer) {
        this.audioData = buffer;
    }

    /**
     * Starts a sound (AudioBufferSourceNode) and stores a references
     * in a queue. This enables you to play multiple sounds at once
     * and even stop them all at a given time.
     */
    private start(note: IDelayedNote) {
        const frequency = this.frequencyLookup[note.value];
        const bufferSrcNode = this.createBufferSrcNode();

        bufferSrcNode.playbackRate.value = frequency;
        bufferSrcNode.connect(this.gainNode);

        this.queue.push(bufferSrcNode);
        bufferSrcNode.start(note.startTime);
    }

    /**
     * Stops all audio stream, even the ones that are just scheduled.
     * It also cleans the queue so that the sound object is ready for another round.
     */
    private stop() {
        this.queue.forEach((node) => {
            node.stop();
            node.disconnect();
        });
        this.queue = [];  // release all references
    }

    /**
     * Creates and configures a BufferSourceNode
     * that can be played once and then destroys itself.
     */
    private createBufferSrcNode(): AudioBufferSourceNode {
        const bufferSrc: AudioBufferSourceNode = this.ac.createBufferSource();
        bufferSrc.buffer = this.audioData;
        bufferSrc.connect(this.gainNode);
        bufferSrc.onended = () => {
            this.destroyBufferSrcNode(bufferSrc);
        };

        return bufferSrc;
    }

    /**
     * Destroyes a given AudioBufferSourceNode and deletes it
     * from the sourceNode queue. This is used in the onended
     * callback of all BufferSourceNodes to avoid dead references.
     */
    private destroyBufferSrcNode(bufferSrc: AudioBufferSourceNode) {
        bufferSrc.disconnect();

        this.queue.forEach((node, index) => {
            if (bufferSrc === node) {
                this.queue.splice(index, 1);
            }
        });
    }

}
