import { IOscActionDef, reducerLogic, IState, IAction } from "./interfaces";
import { AnyAction } from "redux";
import { deepCopy } from "../helper";

const savePreset: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    const actionDefs: IOscActionDef[] = mySubState.actionDefs as IOscActionDef[];
    const newPreset: IState = {};
    const commonActionAddresses = new Set();

    // to ensure that we don't copy commonAction fields,
    // we have to prepare a set with their addresses to
    // sort them out efficiently.
    commonActionDefs.forEach((actionDef: IOscActionDef) => {
        commonActionAddresses.add(actionDef.address);
    });

    actionDefs.forEach((actionDef: IOscActionDef) => {
        // just copy non common-action fields
        if (!commonActionAddresses.has(actionDef.address)) {
            const addressParts = actionDef.address.split("/");
            const method = addressParts[addressParts.length - 1];

            let type: string;
            if (actionDef.type) {
                type = actionDef.type;
            } else {
                type = method;
            }

            newPreset[type] = deepCopy(mySubState[type]);
        }
    });

    const newPresets = new Map<string, IState>(mySubState.presets as Map<string, IState>);
    newPresets.set(action.payload, newPreset);
    const newSubState = Object.assign({}, mySubState, {
        savePreset: action.payload,
        presets: newPresets,
    });

    return newSubState;
};

const loadPreset: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    const presetName: string = action.payload as string;
    let preset: IState = {};

    if (mySubState.hasOwnProperty("presets")) {
        preset = deepCopy(mySubState.presets.get(presetName)) as IState;
    }
    const newSubState = Object.assign({}, mySubState, preset, {
        loadPreset: action.payload,
    });

    return newSubState;
};

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
        address: PREFIX + "savePreset",
        typeTag: ",s",
        process: savePreset,
        description: "saves all properties defined in 'actionDefs' to a preset. Payload is the preset name",
    },
    {
        address: PREFIX + "loadPreset",
        typeTag: ",s",
        process: loadPreset,
        description: "loads a preset and changes plugin settings accordingly. Payload is the preset name.",
    },
    // {
    //     address: PREFIX + "presetSlotNumber",
    //     typeTag: ",i",
    //     description: "changes the current preset slot that presets can be loaded from or saved to.",
    // },
    // {
    //     address: PREFIX + "savePresetToSlot",
    //     typeTag: ",s",
    //     process:
    //     description: "saves the name of a preset to the current slot",
    // },
    // {
    //     address: PREFIX + "loadPresetFromSlot",
    //     typeTag: ",N",
    //     description: "load the preset stored in the current slot",
    // },
    // {
    //     address: PREFIX + "exportPreset",
    //     typeTag: ",s",
    //     description: "serializes a preset object into a json string",
    // },
    // {
    //     address: PREFIX + "importPreset",
    //     typeTag: ",s",
    //     description: "deserializes a json string into a preset object",
    // },
    // {
    //     address: PREFIX + "exportAllPresets",
    //     typeTag: ",s",
    //     description: "serializes all current presets into a json string",
    // },
    // {
    //     address: PREFIX + "importAllPresets",
    //     typeTag: ",s",
    //     description: "deserializes a json string into an array of presets and replaces the current one",
    // },
];

export default commonActionDefs;
