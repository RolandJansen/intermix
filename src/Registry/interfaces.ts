
export interface IPlugin  {
    name: string;
    version: string;
    author: string;
    actionDefs: IActionDef[];
    actionCreators: {};
    getInstance(pluginId: string, ac: AudioContext);
}

export interface IAction {
    type: string;
    payload: number | string;
    meta?: string;
    error?: Error;
}

export interface IActionDef {
    type: string;
    desc: string;
    minVal: number;
    maxVal: number;
    steps?: number;
}
