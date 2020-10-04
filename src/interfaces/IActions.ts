import { Action, AnyAction } from "redux";
import { IState } from "./interfaces";

/**
 * Just an alias for a nicer action interface
 */
export type Payload = unknown;

/**
 * This is the action format that
 * is used by the intermix core.
 * If an IOscAction gets dispatched,
 * it will be converted into an IAction by the
 * OSC preprocessor middleware.
 */
export interface ICoreAction extends Action {
    listener: string;
    payload?: Payload;
    additional?: unknown;
    error?: Error;
}

/**
 * An internal action can be a core action or
 * a freely defined action. In fact,
 * there are only core messages used internally.
 * We just need this other type when working with
 * redux reducers to meet their requirements.
 */
export type InternalAction = ICoreAction | AnyAction;

/**
 * Action Definition for
 * IInternalAction. Since v0.5.0 IOscActionDef
 * should be used instead.
 * @deprecated
 */
export interface IInternalActionDef {
    type: string;
    desc: string;
    defVal: Payload;
    minVal?: number;
    maxVal?: number;
    steps?: number;
}

/**
 * Functions can be used as payload in an OscAction.
 * This can come in handy to pass event handlers around.
 */
export type procedure = () => void;

/**
 * A list of OSC arguments that can hold
 * any number of int, float and string values
 * in any order.
 */
export type OscArgSequence = (number | string)[];

/**
 * Values that are allowed as payload in an OSC action.
 */
export type OscPayload = number | string | ArrayBuffer | OscArgSequence | procedure;

/**
 * Common intermix action format, inspired by
 * Open Sound Control (OSC).
 */
export interface IOscAction extends Action {
    address: string;
    typeTag: string;
    payload?: OscPayload;
}

/**
 * A function that processes a (sub)state and an action
 * and returns a new state object. It should be pure without
 * any side effects, not even calls to built-in objects like Date or sth.
 */
export type reducerLogic = (mySubState: IState, action: InternalAction) => IState;

/**
 * An object used to define IOscActions.
 * It can also contain the reducer function
 * that will be used to process the action.
 */
export interface IOscActionDef {
    address: string;
    typeTag: string;
    type?: string;
    value?: OscPayload;
    range?: [number, number];
    process?: reducerLogic;
    description?: string;
}

/**
 * A special action that can carry many OSC actions
 * as "elements".
 * An OSC timetag is a 64bit fixed point number
 * like a NTP timestamp.
 * The internal representation is a 64bit double which
 * represents the time in seconds since the audio context
 * was started.
 */
export interface IOscBundleAction extends Action {
    timetag: number;
    elements: IOscAction[];
}
