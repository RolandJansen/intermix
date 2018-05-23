export interface IEventMessage {
    type: string;
    value: number | string | boolean;
    velocity?: number;
    steps?: number;
}

export interface IGenericEvent {
    uid: string;
    msg: IEventMessage;
}
