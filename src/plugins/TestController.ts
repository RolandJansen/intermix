/* eslint-disable @typescript-eslint/no-unused-vars */
import { ActionCreatorsMapObject } from "redux";
import AbstractPlugin from "../registry/AbstractPlugin";
import { IActionDef, IPlugin, IPluginMetaData, Tuple, IControllerPlugin, IAction } from "../registry/interfaces";

/**
 * This class will be used to indirectly
 * test the abstract class and registry.
 * Implementation doesn't matter and
 * is not subject to tests.
 */
export default class TestPlugin extends AbstractPlugin implements IControllerPlugin {

    public readonly metaData: IPluginMetaData = {
        type:    "controller",
        name:    "Test-Controller",
        version: "1.0.0",
        authors:  "Roland Jansen",
        desc:    "The simplest possible controller plugin to be used in tests",
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

    /**
     * This is where you just drop in actions that should be dispatched for
     * other plugins (not in this plugins actionCreators list).
     * The implementation will be injected by the registry so we just have to
     * provide an empty method here. It has to be public so the registry can see it.
     * @param action An action object that normally holds data for an audio device
     */
    public sendAction(action: IAction): void { /* nothing */ }

    /**
     * onChange gets called on every state change
     * @param changed A tuple with actiontype and payload
     */
    public onChange(changed: Tuple): boolean {
        return true;
    }
}
