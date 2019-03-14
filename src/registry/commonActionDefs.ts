import { IActionDef } from "./interfaces";

export const commonActionTypes: string[] = [
    "NOTE",
];

export const commonActionDefs: IActionDef[] = [
    {
        type: "NOTE",
        desc: "Midi Note Number",
        minVal: 0,
        maxVal: 127,
        defVal: [0, 0],
        steps: 128,
    },
];
