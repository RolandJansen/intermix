import { ActionCreatorsMapObject, AnyAction, Action } from "redux";

// A generic type for a function, which returns something
export type ReturnFunction<ValueType> = () => ValueType;

export interface IRegistryItem {
    uid: string;
    actionDefs: IActionDef[] | IOscActionDef[];
    actionCreators: ActionCreatorsMapObject;
    unboundActionCreators: ActionCreatorsMapObject;
    onChange: (changed: Tuple) => boolean;
    unsubscribe: () => void;
}

export interface IPlugin extends IRegistryItem  {
    initState: IState;
    readonly metaData: IPluginMetaData;
    frequencyLookup: number[];
    outputs: AudioNode[];
    inputs: AudioNode[];
    [propName: string]: any;
}

export interface IControllerPlugin extends IPlugin {
    // if return type is IAction of void depends in if it's
    // bound (void) or not (IAction)
    sendAction: (action: IAction) => void;
}

export interface IPluginMetaData {
    type: string;
    name: string;
    version: string;
    authors: string;
    desc: string;
}

export interface IGlobalActionCreators {
    [uid: string]: ISinglePluginActionCreators;
}

export interface ISinglePluginActionCreators {
    metadata: IPluginMetaData;
    actionCreators: ActionCreatorsMapObject;
}

export interface IAudioController {
    value: number;  // e.g. note number (0-127)
}

export interface IDelayedAudioController extends IAudioController {
    startTime: number; // delay in seconds
}

export interface INote extends IAudioController {
    velocity: number;
    steps: number;  // note length in sequencer steps (default: 64th notes)
}

export interface IDelayedNote extends INote, IDelayedAudioController {
    duration: number; // note length in seconds
}

export type Payload = any;

// export interface ISeqPartLoad {
//     part: SeqPart;
//     position: number;
// }

export interface IAction extends AnyAction {
    // listenerType: string;
    listener: string;
    payload: Payload;
    additional?: any;
    error?: Error;
}

export interface IActionDef {
    type: string;
    desc: string;
    defVal: Payload;
    minVal?: number;
    maxVal?: number;
    steps?: number;
}

export interface IOscAction extends Action {
    address: string;
    typeTag: string;
    payload?: number | string | (number|string)[];
    valueName?: string;
}

export interface IOscActionDef {
    address: string;
    typeTag: string;
    valueName?: string;
    value?: number | string | (number|string)[];
    range?: [number, number];
    description?: string;
}

/**
 * An OSC timetag is a 64bit fixed point number
 * like a NTP timestamp.
 * The internal representation is a js number which
 * represents the time in seconds since the audio context
 * was started.
 */
export interface IOscBundleAction extends AnyAction {
    timetag: number;
    elements: IOscAction[];
}

export type Tuple = [string, any];
export interface IState {
    [propName: string]: Payload | IState;
}

export interface IActionHandlerMap {
    [propName: string]: ActionHandler;
}

export interface ILoop {
    start: number;
    end: number;
}

export interface IPartWithPosition {
    partID: string;
    position: number;
}

// registry functions
export type Select = (state: IState, pluginUid: string) => any;
export type GetChanged = (oldState: any, newState: any) => Tuple;
export type OnChange = (change: Tuple) => boolean;
export type ActionHandler = (state: IState, action: AnyAction | IAction) => IState;
export type BoundSendAction = (action: IAction, startTime: number) => IAction;
