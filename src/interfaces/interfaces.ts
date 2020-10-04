import { Pattern } from "../plugins/Sequencer/Score";
import { ICoreAction, InternalAction } from "./IActions";

export interface IState {
    [propName: string]: unknown; // probably a union type would be better
}

/**
 * The minimal state of a plugin
 */
export interface IPluginState extends IState {
    uid: string;
    inputCount: number;
    outputCount: number;
    inputs: AudioEndpoint[];
    outputs: AudioEndpoint[];
    presets: Map<string, IState>;
    presetSlots: string[];
    presetSlotNumber: number;
    presetSlotName: string;
}

// should be extended further
export interface ISeqPartState extends IState {
    stepsPerBar: number;
    stepMultiplier: number;
    activeStep: number;
    pattern: Pattern;
}

/**
 * A generic type for a function, which returns something
 */
export type ReturnFunction<ValueType> = () => ValueType;

export type IntermixNote = [string, number, number, number, number];
export type IntermixCtrl = [string, number, number];

export type Tuple = [string, any];

/**
 * First part is the plugin id,
 * second part is the in/out audio-channel number.
 */
export type AudioEndpoint = [string, number];

// registry functions
export type Select = (state: IState, pluginUid: string) => any;
export type GetChanged = (oldState: any, newState: any) => Tuple;
export type OnChange = (change: Tuple) => boolean;
export type ActionHandler = (state: IState, action: InternalAction) => IState;
export type BoundSendAction = (action: ICoreAction, startTime: number) => ICoreAction;

export interface IActionHandlerMap {
    [propName: string]: ActionHandler;
}

// export interface IInternalActionHandlerMap {
//     [propName: string]: ActionHandler;
// }

// export interface IPartWithPosition {
//     partID: string;
//     position: number;
// }

// export interface IGlobalActionCreators {
//     [uid: string]: ISinglePluginActionCreators;
// }

// export interface ISinglePluginActionCreators {
//     metadata: IPluginMetaData;
//     actionCreators: ActionCreatorsMapObject;
// }
