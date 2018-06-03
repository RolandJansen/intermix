export interface IEventMessage {
    value: number | string | boolean;
    velocity?: number;
    steps?: number;
}

export interface IIntermixEvent {
    uid: string;
    type: string;
    timestamp: number;
    payload: IEventMessage;
}
