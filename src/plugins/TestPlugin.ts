import { ActionCreatorsMapObject } from "redux";
import AbstractPlugin from "../registry/AbstractPlugin";
import { IActionDef, IPlugin, Tuple } from "../registry/interfaces";

/**
 * This class will be used to indirectly
 * test the abstract class and registry.
 * Implementation doesn't matter and
 * is not subject to tests.
 */
export default class TestPlugin extends AbstractPlugin implements IPlugin {

    public actionCreators: ActionCreatorsMapObject = {};
    public actionDefs: IActionDef[] = [
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
            defVal: 0,
        },
    ];

    public get inputs() {
        return [];
    }

    public get outputs() {
        return [];
    }

    constructor(private ac: AudioContext) {
        super("testplug", "v1.0.0", "Some Bloke");
    }

    public onChange(changed: Tuple) {
        return true;
    }

}
