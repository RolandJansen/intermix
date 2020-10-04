import { AudioEndpoint, IPluginState, IState } from "../interfaces/interfaces";
import { AnyAction } from "redux";
import { ADD_PLUGIN, REMOVE_PLUGIN, ADD_PART, REMOVE_PART, CONNECT_AUDIO_NODES } from "./rootActions";

const initialState: IState = {
    plugins: [],
    seqparts: [],
};

const rootReducer = (state: IState = initialState, action: AnyAction): IState => {
    if (action.type === ADD_PLUGIN) {
        if (isStringArray(state.plugins)) {
            const newPluginRefs = addItem(state.plugins, action.payload);
            const newState: IState = { ...state, plugins: newPluginRefs };
            return newState;
        }
        return state;
    } else if (action.type === REMOVE_PLUGIN) {
        const newState = JSON.parse(JSON.stringify(state));
        const pluginRef = action.payload as string;
        (newState.plugins as string[]).forEach((value, index) => {
            if (value === pluginRef) {
                newState.plugins.splice(index, 1);
            }
        });
        delete newState[pluginRef];
        return newState;
    } else if (action.type === ADD_PART) {
        if (isStringArray(state.seqparts)) {
            const newPartRefs = addItem(state.seqparts, action.payload);
            const newState: IState = { ...state, seqparts: newPartRefs };
            return newState;
        }
        return state;
    } else if (action.type === REMOVE_PART) {
        const newState = JSON.parse(JSON.stringify(state));
        const partRef = action.payload as string;
        (newState.seqparts as string[]).forEach((value, index) => {
            if (value === partRef) {
                newState.seqparts.splice(index, 1);
            }
        });
        delete newState[partRef];
        return newState;
    } else if (action.type === CONNECT_AUDIO_NODES) {
        const outEndpoint: AudioEndpoint = [action.payload[0], action.payload[1]];
        const inEndpoint: AudioEndpoint = [action.payload[2], action.payload[3]];

        // we also have to change the state of the former input
        const outPluginState = state[outEndpoint[0]];
        if (isPluginState(outPluginState)) {
            const formerInEndpoint: AudioEndpoint = outPluginState.outputs[outEndpoint[1]];
            if (
                formerInEndpoint[0] !== "destination" &&
                formerInEndpoint[0] !== "" &&
                typeof formerInEndpoint !== "undefined"
            ) {
                const newFormerInputPluginState = buildAudioConnectionState(formerInEndpoint, ["", 0], "input", state);
                state[formerInEndpoint[0]] = newFormerInputPluginState;
            }
        }

        const newOutputPluginState = buildAudioConnectionState(outEndpoint, inEndpoint, "output", state);
        state[outEndpoint[0]] = newOutputPluginState;

        if (inEndpoint[0] !== "destination") {
            const newInputPluginState = buildAudioConnectionState(inEndpoint, outEndpoint, "input", state);
            state[inEndpoint[0]] = newInputPluginState;
        }

        return state;
    }
    return state;
};

const buildAudioConnectionState = (
    pluginEndpoint: AudioEndpoint,
    destEndpoint: AudioEndpoint,
    endpointType: string,
    state: IState
): IState => {
    let channels: AudioEndpoint[];
    let newSubState = {};

    const pluginState = state[pluginEndpoint[0]];
    if (isPluginState(pluginState)) {
        if (endpointType === "output") {
            channels = Array.from(pluginState.outputs);
            newSubState = { outputs: channels };
        } else if (endpointType === "input") {
            channels = Array.from(pluginState.inputs);
            newSubState = { inputs: channels };
        } else {
            throw new Error("Unknown endpoint type " + endpointType + ".");
        }
        channels[pluginEndpoint[1]] = destEndpoint;
        const newPluginState = Object.assign({}, state[pluginEndpoint[0]], newSubState);
        return newPluginState;
    }
    return state;
};

const addItem = (oldItemRefs: string[], newItemId: string): string[] => {
    const newItemRefs: string[] = Array.from(oldItemRefs);
    newItemRefs.push(newItemId);
    return newItemRefs;
};

const isStringArray = (value: unknown): value is string[] => {
    return Array.isArray(value) && value.every((element) => typeof element === "string");
};

const isPluginState = (value: unknown): value is IPluginState => {
    const pluginState = value as IPluginState;
    return pluginState.inputs !== undefined && pluginState.outputs !== undefined;
};

export default rootReducer;
