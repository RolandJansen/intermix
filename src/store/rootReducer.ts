import { IState } from "../registry/interfaces";
import { AnyAction } from "redux";
import { ADD_PLUGIN, REMOVE_PLUGIN, ADD_PART, REMOVE_PART } from "./rootActions";

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
        // const newPartRefs: string[] = Array.from(state.seqparts);
        // const partRef = action.payload as string;
        // newPartRefs.push(partRef);
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
    }
    return state;
};

const addItem = (oldItemRefs: string[], newItemId: string): string[] => {
    const newItemRefs: string[] = Array.from(oldItemRefs);
    newItemRefs.push(newItemId);
    return newItemRefs;
};

export default rootReducer;
