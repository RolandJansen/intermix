import { IActionDef } from "./interfaces";

export const commonActionTypes: string[] = [
    "NOTE",
];

const testnote = {
    address: "/intermix/plugin/<UID>/note",
    valueName: "lastPlayedNote",
    valueType: "iiff",
    value: [0, 0, 0.0, 0.0],
    description: "note-value, velocity, duration, starttime",
}

const testSeqNote = {
    address: "/intermix/seqpart/<UID>/addNote",
    valueName: "lastAddedNote",
    valueType: "iiff",
    value: [0, 0, 0.0, 0.0],
    description: "note-value, velocity, duration, starttime",
}

/**
 * Definitions of actions that every
 * plugin can handle (but don't need to).
 * They are not part of the plugins state.
 */
export const commonActionDefs: IActionDef[] = [
    {
        type: "NOTE",
        desc: "Midi Note Number alike",
        defVal: {
            value: 0,
            velocity: 1,
            steps: 0,
            duration: 0,
        },
    },
];
