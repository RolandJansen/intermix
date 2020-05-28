import { IOscActionDef } from "../registry/interfaces";
// This is an action definition file
// All actions that should be recognized
// by the store should be defined here.
// Every actiondef should have type, desc and defVal fields.
// You can also set minVal/maxVal fields if it's a numeric value.
// Your plugin can compute addtional actions not defined here


// but they will not get recognized by the store.
const PREFIX = "/intermix/seqpart/{UID}/";

const actionDefs: IOscActionDef[] = [
    {
        address: PREFIX + "activeStep",
        typeTag: ",i",
        description: "The part will record notes and controllers into the active step."
    },
    {
        address: PREFIX + "addNote",
        typeTag: ",iiff",
        value: [0, 0, 0.0, 0.0],
        description: "Adds a note to a SeqPart object",
    },
    {
        address: PREFIX + "addCtrl",
        typeTag: ",sff",
        value: ["initial-value", 0.0, 0.0],
        description: "Adds a controller to a SeqPart object",
    },
    {
        address: PREFIX + "deleteNote",
        typeTag: ",iiff",
        value: [0, 0, 0.0, 0.0],
        description: "Deletes a note from the SeqPart object",
    },
    {
        address: PREFIX + "deleteCtrl",
        typeTag: ",sff",
        value: ["initial-value", 0.0, 0.0],
        description: "Deletes a controller from the SeqPart object",
    },
];

export default actionDefs;
