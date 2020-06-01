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
        description: "note-value, velocity, duration, starttime",
    },
];

export default commonActionDefs;
