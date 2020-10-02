import { AbstractPlugin } from "../registry/AbstractPlugin";
import { IOscActionDef, IPlugin, IPluginConstructor, IPluginMetaData, Tuple } from "../registry/interfaces";

const Plugin: IPluginConstructor = class Delay extends AbstractPlugin implements IPlugin {
    public static readonly METADATA: IPluginMetaData = {
        type: "fx",
        name: "Intermix Delay",
        version: "1.0.0",
        authors: "R. Jansen",
        desc: "A simple echo effect",
    };
    private static readonly PREFIX = "/intermix/plugin/<UID>/";
    private static readonly DELAYTIME_SEC = 0.125; // 1/8 note at 120bpm

    public readonly actionDefs: IOscActionDef[] = [
        {
            address: Delay.PREFIX + "delayTime_sec",
            typeTag: ",i",
            value: Delay.DELAYTIME_SEC,
            description: "The delay time in seconds",
        },
    ];

    private inputSplitter = this.ac.createChannelSplitter(2);
    private delayBuffer = this.ac.createDelay();
    private delayLoop = this.ac.createGain();
    private outGain = this.ac.createGain();

    public get inputs(): AudioNode[] {
        return [this.inputSplitter];
    }

    public get outputs(): AudioNode[] {
        return [this.outGain];
    }

    constructor(public readonly uid: string, private ac: AudioContext) {
        super();
        this.wireAudioNodes();
        this.delayBuffer.delayTime.value = Delay.DELAYTIME_SEC;
        this.delayLoop.gain.value = 0.3;
    }

    public onChange(changed: Tuple): boolean {
        switch (changed[0]) {
            case "delayTime_sec":
                return true;
            default:
                return this.onChangeDefault(changed);
        }
    }

    private wireAudioNodes(): void {
        this.inputSplitter.connect(this.delayBuffer);
        this.inputSplitter.connect(this.outGain);

        this.delayBuffer.connect(this.delayLoop);
        this.delayLoop.connect(this.delayBuffer);

        this.delayBuffer.connect(this.outGain);
    }
};
export default Plugin;
