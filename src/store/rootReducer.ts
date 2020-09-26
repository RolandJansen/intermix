import { IState, Tuple } from "../registry/interfaces";
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
        const outputIdAndChnnelNum = (action.payload as Tuple)[0];
        const inputIdAndChannelNum = (action.payload as Tuple)[1];

        const output = outputIdAndChnnelNum.split(":");
        const input = inputIdAndChannelNum.split(":");
        const outputPluginId: string = output[0];
        const outputNumber = parseInt(output[1]);
        const inputPluginId: string = input[0];
        const inputNumber = parseInt(input[1]);

        const newOutputState: string[] = Array.from(state[outputPluginId].outputs);
        newOutputState[outputNumber] = inputIdAndChannelNum;
        const newInputState: string[] = Array.from(state[inputPluginId].inputs);
        newInputState[inputNumber] = outputIdAndChnnelNum;

        const newOutputPlugin = Object.assign({}, state[outputPluginId], {
            outputs: newOutputState,
        });
        const newInputPlugin = Object.assign({}, state[inputPluginId], {
            inputs: newInputState,
        });

        state[outputPluginId] = newOutputPlugin;
        state[inputPluginId] = newInputPlugin;
        return state;
    }
    return state;
};

const addItem = (oldItemRefs: string[], newItemId: string): string[] => {
    const newItemRefs: string[] = Array.from(oldItemRefs);
    newItemRefs.push(newItemId);
    return newItemRefs;
};

export default rootReducer;
