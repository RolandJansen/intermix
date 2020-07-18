import { IOscActionDef, reducerLogic, IState, IAction } from "./interfaces";
import { AnyAction } from "redux";

// const savePreset: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
//     const newSubState: IState = {};

//     return newSubState;
// };

// const loadPreset: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
//     const newSubState: IState = {};

//     return newSubState;
// };

const PREFIX = "/intermix/plugin/<UID>/";

/**
 * Definitions of actions that every
 * instrument plugin can handle (but don't need to).
 */
const commonActionDefs: IOscActionDef[] = [
    {
        address: PREFIX + "note",
        typeTag: ",siiff",
        value: ["note", 0, 0, 0.0, 0.0],
        description: "name, note-value, velocity, duration, starttime",
    },
    {
        address: PREFIX + "volume",
        typeTag: ",sff",
        value: ["volume", 0.0, 0.0],
        description: "name, loudness-value, starttime",
    },
    {
        address: PREFIX + "change",
        typeTag: ",i",
        description: "changes the preset number",
    },
    {
        address: PREFIX + "savePreset",
        typeTag: ",s",
        // process: savePreset,
        description: "saves all properties defined in 'actionDefs' and changes the preset number accordingly",
    },
    {
        address: PREFIX + "loadPreset",
        typeTag: ",N",
        // process: loadPreset,
        description: "loads a preset and changes the preset number accordingly",
    },
    {
        address: PREFIX + "exportPreset",
        typeTag: ",s",
        description: "serializes a preset object into a json string",
    },
    {
        address: PREFIX + "importPreset",
        typeTag: ",s",
        description: "deserializes a json string into a preset object",
    },
    {
        address: PREFIX + "exportPresetList",
        typeTag: ",s",
        description: "serializes all current presets into a json string",
    },
    {
        address: PREFIX + "importPresetList",
        typeTag: ",s",
        description: "deserializes a json string into an array of presets and replaces the current one",
    },
];

export default commonActionDefs;
