import { IActionDef } from "./interfaces";

export const commonActionTypes: string[] = [
    "NOTE",
];

/**
 * Definitions of actions that every
 * plugin can handle (but don't need to).
 * They are not part of the plugins state.
 */
export const commonActionDefs: IActionDef[] = [
    {
        type: "NOTE",
        desc: "Midi Note Number",
        defVal: [0, 0],
    },
];
