import AbstractPlugin from "../registry/AbstractPlugin";
import { IActionDef, IPlugin, IPluginMetaData, Tuple } from "../registry/interfaces";

/**
 * This class will be used to indirectly
 * test the abstract class and registry.
 * Implementation doesn't matter and
 * is not subject to tests.
 */
export default class TestPlugin extends AbstractPlugin implements IPlugin {

    public readonly metaData: IPluginMetaData = {
        type:    "instrument",
        name:    "Test-Instrument",
        version: "1.0.0",
        authors:  "Roland Jansen",
        desc:    "The simplest possible plugin to be used in tests",
    };
    public readonly actionDefs: IActionDef[] = [
        {
            type: "ACTION1",
            desc: "action one",
            minVal: 0,
            maxVal: 127,
            defVal: 0,
        },
        {
            type: "ACTION2",
            desc: "action two",
            minVal: 0,
            maxVal: 127,
            defVal: 1,
        },
    ];

    public get inputs(): AudioNode[] {
        return [];
    }

    public get outputs(): AudioNode[] {
        return [];
    }

    constructor(private ac: AudioContext) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onChange(changed: Tuple): boolean {
        return true;
    }
}
