import { IOscActionDef } from "./interfaces";

/**
 * Definitions of actions that every
 * plugin can handle (but don't need to).
 */
const commonActionDefs: IOscActionDef[] = [
    {
        address: "/intermix/plugin/{UID}/note",
        typeTag: "iiff",
        value: [0, 0, 0.0, 0.0],
        description: "note-value, velocity, duration, starttime",
    },
];

export default commonActionDefs;
