import { ActionCreatorsMapObject, AnyAction, Action } from "redux";

// A generic type for a function, which returns something
export type ReturnFunction<ValueType> = () => ValueType;

// export type RegisterableClass = new (itemId: string, ac: AudioContext) => IRegistryItem;

export interface IRegistryItem {
    readonly uid: string;
    initState: IState;
    actionDefs: IOscActionDef[];
    actionCreators: ActionCreatorsMapObject;
    unboundActionCreators: ActionCreatorsMapObject;
    onChange(changed: Tuple): boolean;
    unsubscribe(): void;
}

export interface IPlugin extends IRegistryItem {
    readonly frequencyLookup: number[];
    inputs: AudioNode[];
    outputs: AudioNode[];
    getMyState(): IState;
    [propName: string]: any;
}

export interface IControllerPlugin extends IPlugin {
    sendAction: (action: IAction) => void;
}

export interface ISeqPart extends IRegistryItem {
    readonly initState: ISeqPartInitState;
}

export interface ISeqPartInitState extends IState {
    stepsPerBar: number;
    stepMultiplier: number;
    pattern: OscArgSequence[][];
}

export interface IPluginMetaData {
    type: string;
    name: string;
    version: string;
    authors: string;
    desc: string;
}

export interface IPluginConstructor {
    readonly metaData: IPluginMetaData;
    new (itemId: string, ac: AudioContext): IPlugin;
}

export interface IPluginClassContainer {
    [className: string]: IPluginConstructor;
}

export interface IGlobalActionCreators {
    [uid: string]: ISinglePluginActionCreators;
}

export interface ISinglePluginActionCreators {
    metadata: IPluginMetaData;
    actionCreators: ActionCreatorsMapObject;
}

// export interface IAudioController {
//     value: number; // e.g. note number (0-127)
// }

// export interface IDelayedAudioController extends IAudioController {
//     startTime: number; // delay in seconds
// }

// export interface INote extends IAudioController {
//     velocity: number;
//     steps: number; // note length in sequencer steps (default: 64th notes)
// }

// export interface IDelayedNote extends INote, IDelayedAudioController {
//     duration: number; // note length in seconds
// }

export type Payload = any;

/**
 * This is the action format that
 * is used by the intermix core.
 * If you dispatch an IOscAction,
 * it will be converted by an
 * OSC preprocessor middleware (see store).
 */
export interface IAction extends AnyAction {
    // listenerType: string;
    listener: string;
    payload: Payload;
    additional?: any;
    error?: Error;
}

/**
 * Action Definition format for
 * IAction. This is not in use
 * and will probably be removed.
 */
export interface IActionDef {
    type: string;
    desc: string;
    defVal: Payload;
    minVal?: number;
    maxVal?: number;
    steps?: number;
}

export type procedure = () => void;

export interface IOscAction extends Action {
    address: string;
    typeTag: string;
    payload?: number | string | (number | string)[] | ArrayBuffer | procedure;
}

/**
 * A list of OSC arguments that can hold
 * any number of int, float and string values
 * in any order.
 */
export type OscArgSequence = (number | string)[];

export type reducerLogic = (mySubState: IState, action: AnyAction | IAction) => IState;

export interface IOscActionDef {
    address: string;
    typeTag: string;
    type?: string;
    value?: number | string | OscArgSequence | ArrayBuffer | procedure;
    range?: [number, number];
    process?: reducerLogic;
    description?: string;
}

export type IntermixNote = [string, number, number, number, number];
export type IntermixCtrl = [string, number, number];

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
