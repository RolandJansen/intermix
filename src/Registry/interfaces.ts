
export interface IPlugin  {
    productId: string;
    uid: string;
    name: string;
    version: string;
    author: string;
    actionDefs: IActionDef[];
    actionCreators: {};
    frequencyLookup: number[];
    [propName: string]: any;
}

export interface IAction {
    type: string;
    payload: number | string;
    meta?: string;
    error?: Error;
}

// Is this in redux already?
// export type IActionCreator = (payload: number) => IAction;

export interface IActionDef {
    type: string;
    desc: string;
    minVal: number;
    maxVal: number;
    defVal: number;
    steps?: number;
}

export type tuple = [string, any];
