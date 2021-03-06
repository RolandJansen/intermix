import { AbstractPlugin } from "../registry/AbstractPlugin";
import { Tuple } from "../interfaces/interfaces";
import { IOscActionDef } from "../interfaces/IActions";
import { IPlugin, IPluginMetaData, IPluginConstructor } from "../interfaces/IRegistryItems";

/**
 * This class will be used to indirectly
 * test the abstract class and registry.
 * Implementation doesn't matter and
 * is not subject to tests.
 */
const Plugin: IPluginConstructor = class TestInstrument extends AbstractPlugin implements IPlugin {
    public static readonly METADATA: IPluginMetaData = {
        type: "instrument",
        name: "Test-Instrument",
        version: "1.0.0",
        authors: "Roland Jansen",
        desc: "The simplest possible plugin to be used in tests",
    };
    public actionDefs: IOscActionDef[] = [
        {
            address: "/intermix/plugin/<UID>/ACTION1",
            typeTag: ",i",
            value: 0,
            range: [0, 127],
            description: "action one",
        },
        {
            address: "/intermix/plugin/<UID>/ACTION2",
            typeTag: ",i",
            value: 1,
            range: [0, 127],
            description: "action two",
        },
    ];

    // something to test the inputs/outputs
    private testNode: AudioNode;

    // here we can check if onChange was called correctly without mocking
    public testValue: Tuple = ["", 0];

    public get inputs(): AudioNode[] {
        return [];
    }

    public get outputs(): AudioNode[] {
        return [this.testNode];
    }

    constructor(public readonly uid: string, private ac: AudioContext) {
        super();
        this.testNode = ac.createGain();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onChange(changed: Tuple): boolean {
        if (changed[0] === "loadPreset") {
            this.refreshAllValues();
        }
        this.testValue = changed;
        return true;
    }
};
export default Plugin;
