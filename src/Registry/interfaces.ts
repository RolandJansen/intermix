import { ActionCreatorsMapObject, AnyAction } from "redux";
import SeqPart from "../plugins/Sequencer/SeqPart";

export interface IPlugin  {
    unsubscribe: any;
    initState: IState;
    uid: string;
    readonly metaData: IPluginMetaData;
    readonly actionDefs: IActionDef[];
    actionCreators: ActionCreatorsMapObject;
    frequencyLookup: number[];
    [propName: string]: any;
}

export interface IPluginMetaData {
    type: string;
    name: string;
    version: string;
    author: string;
    desc: string;
}

export interface INote {
    noteNumber: number;
    velocity: number;
    duration: number;
}

export interface IDelayedNote extends INote {
    startTime: number;
}

export type Payload = number | string | boolean | INote | IDelayedNote;

export interface ISeqPartLoad {
    part: SeqPart;
    position: number;
}

export interface IAction extends AnyAction {
    dest: string;
    payload: Payload | ISeqPartLoad;
    meta?: string;
    error?: Error;
}

export interface IAudioAction extends IAction {
    duration?: number;
    delay?: number;
    sequencerSteps?: number;
}

// Is this in redux already?
// export type IActionCreator = (payload: number) => IAction;

export interface IActionDef {
    type: string;
    desc: string;
    defVal: Payload;
    minVal?: number;
    maxVal?: number;
    steps?: number;
}

export type Tuple = [string, any];
export interface IState {
    [propName: string]: Payload | IState;
}

export interface IActionHandlerMap {
    [propName: string]: ActionHandler;
}

// registry functions
export type Select = (state: IState, pluginUid: string) => any;
export type GetChanged = (oldState: any, newState: any) => Tuple;
export type OnChange = (change: Tuple) => boolean;
export type ActionHandler = (state: IState, action: AnyAction | IAction) => IState;
// export type GenericAction = IAction | AnyAction;
// export type Reducer = (state: IState, action: IAction) => IState;
