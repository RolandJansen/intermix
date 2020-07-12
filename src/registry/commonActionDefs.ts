import { IOscActionDef } from "./interfaces";

/**
 * Definitions of actions that every
 * instrument plugin can handle (but don't need to).
 */
const commonActionDefs: IOscActionDef[] = [
    {
        address: "/intermix/plugin/{UID}/note",
        typeTag: ",siiff",
        value: ["note", 0, 0, 0.0, 0.0],
        description: "name, note-value, velocity, duration, starttime",
    },
    {
        address: "intermix/plugin/{UID}/volume",
        typeTag: ",sff",
        value: ["volume", 0.0, 0.0],
        description: "name, loudness-value, starttime",
    },
    {
        address: "intermix/plugin/{UID}/loadPreset",
        typeTag: "i",
        description: "loads a preset and changes the preset number accordingly",
    },
    {
        address: "intermix/plugin/{UID}/savePreset",
        typeTag: "i",
        description: "saves all properties defined in 'actionDefs' and changes the preset number accordingly",
    },
];

export default commonActionDefs;
