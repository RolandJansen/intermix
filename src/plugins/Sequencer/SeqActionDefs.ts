// This is an action definition file
// All actions that should be recognized
// by the store (and the plugin) should be defined here.

import { IOscActionDef, IState } from "../../registry/interfaces";

const PREFIX = "/intermix/plugin/{UID}/";

// to reset the sequencer we have to reset "state" and "pointer" at once
const reset = (): IState => {
    return { state: 0, pointer: 0 };
};

const actionDefs: IOscActionDef[] = [
    {
        address: PREFIX + "START",
        typeTag: ",T",
        valueName: "state",
        description: "starts the sequencer and (if neccessary) the suspended audio context",
    },
    {
        address: PREFIX + "STOP",
        typeTag: ",F",
        valueName: "state",
        description: "stops the sequencer at the current position and halts the audio context",
    },
    {
        address: PREFIX + "state",
        typeTag: ",i",
        range: [0, 1],
        description: "starts or stops the sequencer",
    },
    {
        address: PREFIX + "reset",
        typeTag: ",T",
        process: reset,
        description: "stops the sequencer (not the audio context) and resets the queue pointer",
    },
    {
        address: PREFIX + "BPM",
        typeTag: ",i",
        value: 120,
        range: [0, 240],
        description: "sets the BPM value",
    },
    // {
    //     type: "ADD_PART",
    //     desc: "adds a part to the sequencer",
    //     defVal: {},
    // },
    // {
    //     type: "REMOVE_PART",
    //     desc: "removes a part from the sequencer",
    //     defVal: "",
    // },
    // {
    //     type: "ADD_TO_SCORE",
    //     desc: "adds a part-reference to the score",
    //     defVal: {
    //         partID: "",
    //         position: 0,
    //     },
    // },
    // {
    //     type: "REMOVE_FROM_SCORE",
    //     desc: "removes a part-reference from the score",
    //     defVal: {
    //         partID: "",
    //         position: 0,
    //     },
    // },
    // {
    //     type: "QUEUE",
    //     desc: "saves the queue in the store and distributes it to other plugins",
    //     defVal: [],
    // },

    // {
    //     type: "LOOP",
    //     desc: "sets the loop start- and endpoint in steps",
    //     defVal: { start: 0, end: 63 },
    // },
    // {
    //     type: "LOOP_ACTIVE",
    //     desc: "sets the loop active/inactive",
    //     defVal: false,
    // },
    // {
    //     type: "JUMP_TO_POSITION",
    //     desc: "jump to a specific step in the masterqueue",
    //     defVal: 0,
    // },
    // {
    //     type: "ANIMATE",
    //     desc: "a function that should be invoked by the sequencer at every step",
    //     defVal: (): boolean => true,
    // },
];

export default actionDefs;
