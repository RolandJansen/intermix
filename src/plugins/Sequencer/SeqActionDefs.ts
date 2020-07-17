// This is an action definition file
// All actions that should be recognized
// by the store (and the plugin) should be defined here.

import { IOscActionDef, IState } from "../../registry/interfaces";

const PREFIX = "/intermix/plugin/<UID>/";

// to reset the sequencer we have to reset "state" and "pointer" at once
const reset = (): IState => {
    return { running: 0, pointer: 0 };
};

const actionDefs: IOscActionDef[] = [
    {
        address: PREFIX + "start",
        typeTag: ",T",
        type: "running",
        description: "starts the sequencer and (if neccessary) the suspended audio context",
    },
    {
        address: PREFIX + "stop",
        typeTag: ",F",
        type: "running",
        description: "stops the sequencer at the current position and halts the audio context",
    },
    {
        address: PREFIX + "reset",
        typeTag: ",N",
        process: reset,
        description: "stops the sequencer (not the audio context) and resets the queue pointer",
    },
    {
        address: PREFIX + "position",
        typeTag: ",i",
        description: "jump to a specific step in the masterqueue",
    },
    {
        address: PREFIX + "BPM",
        typeTag: ",i",
        value: 120,
        range: [0, 240],
        description: "sets the BPM value",
    },
    {
        address: PREFIX + "loopStart",
        typeTag: ",i",
        description: "sets the loop startpoint in steps",
    },
    {
        address: PREFIX + "loopEnd",
        typeTag: ",i",
        description: "sets the loop endpoint in steps",
    },
    {
        address: PREFIX + "loopActivate",
        type: "loopActive",
        typeTag: ",T",
        description: "sets the loop active",
    },
    {
        address: PREFIX + "loopDeactivate",
        type: "loopActive",
        typeTag: ",F",
        description: "sets the loop inactive",
    },
    {
        address: PREFIX + "activeStep",
        typeTag: ",i",
        description: "The part will operate (add/remove items) on the active step.",
    },
    {
        address: PREFIX + "addToScore",
        typeTag: ",ss",
        description: "adds a tuple with part/plugin id to the score at the active step.",
    },
    {
        address: PREFIX + "removeFromScore",
        typeTag: ",ss",
        description: "removes a tuple with part/plugin id from the score at the active step.",
    },
    // {
    //     type: "QUEUE",
    //     desc: "saves the queue in the store and distributes it to other plugins",
    //     defVal: [],
    // },
    {
        address: PREFIX + "animate",
        typeTag: ",P",
        value: (): void => {
            /* empty; */
        },
        description: "a function that should be invoked by the sequencer at every step",
    },
];

export default actionDefs;
