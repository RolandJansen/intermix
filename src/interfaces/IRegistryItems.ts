import { ActionCreatorsMapObject } from "redux";
import { ICoreAction, IOscActionDef, OscArgSequence } from "./IActions";
import { IState, Tuple } from "./interfaces";

/**
 * A basic interface for registry items that
 * shouldn't be used directly. It should be extended by
 * other interfaces to be used in registries (like PluginRegistry).
 */
export interface IRegistryItem {
    readonly uid: string;
    initState: IState;
    actionDefs: IOscActionDef[];
    actionCreators: ActionCreatorsMapObject;
    unboundActionCreators: ActionCreatorsMapObject;
    onChange(changed: Tuple): boolean;
    unsubscribe(): void;
}

/**
 * A plugin instance
 */
export interface IPlugin extends IRegistryItem {
    readonly frequencyLookup: number[];
    inputs: AudioNode[];
    outputs: AudioNode[];
    getMyState(): IState;
    [propName: string]: any;
}

/**
 * Controller plugins can send
 * actions to other plugins
 */
export interface IControllerPlugin extends IPlugin {
    sendAction: (action: ICoreAction) => void;
}

/**
 * Static field that has to be implemented by plugin classes
 */
export interface IPluginMetaData {
    type: string;
    name: string;
    version: string;
    authors: string;
    desc: string;
}

/**
 * A Plugin class
 */
export interface IPluginConstructor {
    readonly METADATA: IPluginMetaData;
    new (itemId: string, ac: AudioContext): IPlugin;
}

/**
 * An object that stores plugin classes.
 * Without this we wouldn't be able to load
 * external plugins at runtime.
 */
export interface IPluginClassContainer {
    [className: string]: IPluginConstructor;
}

///////////////////
// Sequencer Part

/**
 * The initial state of a sequencer part
 */
export interface ISeqPartInitState extends IState {
    stepsPerBar: number;
    stepMultiplier: number;
    pattern: OscArgSequence[][];
}

/**
 * A sequencer part
 */
export interface ISeqPart extends IRegistryItem {
    readonly initState: ISeqPartInitState;
}
