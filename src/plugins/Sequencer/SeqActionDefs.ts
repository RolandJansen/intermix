// This is an action definition file
// All actions that should be recognized
// by the store should be defined here.
// Every actiondef should have type, desc and defVal fields.
// You can also set minVal/maxVal fields if it's a numeric value.
// Your plugin can compute addtional actions not defined here
// but they will not get recognized by the store.
export default [
    {
        type: "STATE",
        desc: "0=stop, 1=start, 2=pause",
        defVal: 0,
    },
    {
        type: "BPM",
        desc: "sets new BPM value",
        minVal: 0,
        maxVal: 240,
        defVal: 120,
    },
    {
        type: "ADD_PART",
        desc: "adds a part to the sequencer",
        defVal: {},
    },
    {
        type: "REMOVE_PART",
        desc: "removes a part from the sequencer",
        defVal: "",
    },
    {
        type: "ADD_TO_SCORE",
        desc: "adds a part-reference to the score",
        defVal: {
            partID: "",
            position: 0,
        },
    },
    {
        type: "REMOVE_FROM_SCORE",
        desc: "removes a part-reference from the score",
        defVal: {
            partID: "",
            position: 0,
        },
    },
    {
        type: "QUEUE",
        desc: "saves the queue in the store - just for internal usage",
        defVal: [],
    },
    {
        type: "LOOP",
        desc: "sets the loop start- and endpoint in steps",
        defVal: { start: 0, end: 63 },
    },
    {
        type: "LOOP_ACTIVE",
        desc: "sets the loop active/inactive",
        defVal: false,
    },
    {
        type: "JUMP_TO_POSITION",
        desc: "jump to a specific step in the masterqueue",
        defVal: 0,
    },
];
