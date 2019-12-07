import { ActionCreatorsMapObject } from "redux";
import AbstractPlugin from "../Registry/AbstractPlugin";
import { IActionDef, IPlugin, IPluginMetaData, Tuple } from "../Registry/interfaces";

/**
 * This class will be used to indirectly
 * test the abstract class and registry.
 * Implementation doesn't matter and
 * is not subject to tests.
 */
export default class TestPlugin extends AbstractPlugin implements IPlugin {

    public readonly metaData: IPluginMetaData = {
        type:    "instrument",
        name:    "Testplugin",
        version: "1.0.0",
        author:  "Roland Jansen",
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

    public get inputs() {
        return [];
    }

    public get outputs() {
        return [];
    }

    constructor(private ac: AudioContext) {
        super();
    }

    public onChange(changed: Tuple) {
        return true;
    }
}
