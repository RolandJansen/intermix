import { IIntermixEvent } from "./IHelper";

export interface IPlugin {
    onParamChange(evt: IIntermixEvent): boolean;
    changeParam(): boolean;
}
