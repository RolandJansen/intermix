import { ActionCreatorsMapObject, AnyAction } from "redux";

export interface IPlugin  {
    productId: string;
    uid: string;
    name: string;
    version: string;
    author: string;
    actionDefs: IActionDef[];
    actionCreators: ActionCreatorsMapObject;
    frequencyLookup: number[];
    [propName: string]: any;
}

// array with midi note number, duration in ms and delay in ms
export type Note = [number, number, number];
export type Payload = number | string | boolean | Note;

export interface IAction extends AnyAction {
    // type: string;
    dest: string;
    payload: Payload;
    meta?: string;
    error?: Error;
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
