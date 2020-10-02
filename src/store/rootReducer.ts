import { AudioEndpoint, IState } from "../registry/interfaces";
import { AnyAction } from "redux";
import { ADD_PLUGIN, REMOVE_PLUGIN, ADD_PART, REMOVE_PART, CONNECT_AUDIO_NODES } from "./rootActions";

const initialState: IState = {
    plugins: [],
    seqparts: [],
};

const rootReducer = (state: IState = initialState, action: AnyAction): IState => {
    if (action.type === ADD_PLUGIN) {
        // const newPluginRefs: string[] = Array.from(state.plugins);
        // const pluginRef = action.payload as string;
        // newPluginRefs.push(pluginRef);
        const newPluginRefs = addItem(state.plugins, action.payload);
        const newState: IState = { ...state, plugins: newPluginRefs };
        return newState;
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
        const newPartRefs = addItem(state.seqparts, action.payload);
        const newState: IState = { ...state, seqparts: newPartRefs };
        return newState;
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
        const formerInEndpoint: AudioEndpoint = state[outEndpoint[0]].outputs[outEndpoint[1]];

        if (
            formerInEndpoint[0] !== "destination" &&
            formerInEndpoint[0] !== "" &&
            typeof formerInEndpoint !== "undefined"
        ) {
            const newFormerInputPluginState = buildAudioConnectionState(formerInEndpoint, ["", 0], "input", state);
            state[formerInEndpoint[0]] = newFormerInputPluginState;
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

    if (endpointType === "output") {
        channels = Array.from(state[pluginEndpoint[0]].outputs);
        newSubState = { outputs: channels };
    } else if (endpointType === "input") {
        channels = Array.from(state[pluginEndpoint[0]].inputs);
        newSubState = { inputs: channels };
    } else {
        throw new Error("Unknown endpoint type " + endpointType + ".");
    }

    channels[pluginEndpoint[1]] = destEndpoint;
    const newPluginState = Object.assign({}, state[pluginEndpoint[0]], newSubState);
    return newPluginState;
};

const addItem = (oldItemRefs: string[], newItemId: string): string[] => {
    const newItemRefs: string[] = Array.from(oldItemRefs);
    newItemRefs.push(newItemId);
    return newItemRefs;
};

export default rootReducer;
