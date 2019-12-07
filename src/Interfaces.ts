
export interface IMidiAction {
    type: string;
    payload: number | RangeError;
    error?: boolean;
}
