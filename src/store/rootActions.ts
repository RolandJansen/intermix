import { IOscAction, Tuple } from "../registry/interfaces";

/**
 * action types
 */
export const ADD_PLUGIN = "ADD_PLUGIN";
export const REMOVE_PLUGIN = "REMOVE_PLUGIN";
export const ADD_PART = "ADD_PART";
export const REMOVE_PART = "REMOVE_PART";
export const CONNECT_AUDIO_NODES = "CONNECT_AUDIO_NODES";

/**
 * other constants
 */
const OSC_PREFIX = "/intermix/system/";

/**
 * action creators
 */
export const addPlugin = (itemId: string): IOscAction => {
    return {
        address: OSC_PREFIX + ADD_PLUGIN,
        type: ADD_PLUGIN,
        typeTag: ",s",
        payload: itemId,
    };
};

export const removePlugin = (itemId: string): IOscAction => {
    return {
        address: OSC_PREFIX + REMOVE_PLUGIN,
        type: REMOVE_PLUGIN,
        typeTag: ",s",
        payload: itemId,
    };
};

export const addPart = (itemId: string): IOscAction => {
    return {
        address: OSC_PREFIX + ADD_PART,
        type: ADD_PART,
        typeTag: ",s",
        payload: itemId,
    };
};

export const removePart = (itemId: string): IOscAction => {
    return {
        address: OSC_PREFIX + REMOVE_PART,
        type: REMOVE_PART,
        typeTag: ",s",
        payload: itemId,
    };
};

export const connectAudioNodes = (connection: Tuple): IOscAction => {
    return {
        address: OSC_PREFIX + CONNECT_AUDIO_NODES,
        type: CONNECT_AUDIO_NODES,
        typeTag: ",ss",
        payload: connection,
    };
};
