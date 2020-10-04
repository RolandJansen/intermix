import { IOscActionDef } from "../interfaces/IActions";
import { addItem, removeItem, setStepActive } from "./seqPartReducerLogic";

const PREFIX = "/intermix/seqpart/<UID>/";

export const actionDefs: IOscActionDef[] = [
    {
        address: PREFIX + "activeStep",
        typeTag: ",i",
        process: setStepActive,
        description: "The part will operate (add/remove items) on the active step.",
    },
    {
        address: PREFIX + "addNote",
        typeTag: ",siiff",
        process: addItem,
        value: ["note", 0, 0, 0.0, 0.0],
        description: "Adds a note to a SeqPart object",
    },
    {
        address: PREFIX + "removeNote",
        typeTag: ",siiff",
        process: removeItem,
        value: ["note", 0, 0, 0.0, 0.0],
        description: "Removes a note from the SeqPart object",
    },
    {
        address: PREFIX + "addCtrl",
        typeTag: ",sff",
        process: addItem,
        value: ["initial-value", 0.0, 0.0],
        description: "Adds a controller to a SeqPart object",
    },
    {
        address: PREFIX + "removeCtrl",
        typeTag: ",sff",
        process: removeItem,
        value: ["initial-value", 0.0, 0.0],
        description: "Removes a controller from the SeqPart object",
    },
    {
        address: PREFIX + "name",
        typeTag: ",s",
        value: "Part",
        description: "Name of the part that can be displayed in the UI",
    },
    {
        address: PREFIX + "stepsPerBar",
        typeTag: ",i",
        value: 32,
        description: "Pattern resolution: A value of 16 means a resolution of 16th notes.",
    },
];
