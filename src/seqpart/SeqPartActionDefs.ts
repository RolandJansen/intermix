// This is an action definition file
// All actions that should be recognized
// by the store should be defined here.
// Every actiondef should have type, desc and defVal fields.
// You can also set minVal/maxVal fields if it's a numeric value.
// Your plugin can compute addtional actions not defined here
// but they will not get recognized by the store.
const PREFIX = "/intermix/seqpart/<UID>";

export default [
    // {
    //     address: PREFIX + "/addAction",
    //     dataType: "???",
    //     target: "lastAddedAction",
    //     range: null,
    //     defValue: {},
    //     desc: "Adds an action to a sequencer part object",
    // },
    {
        type: "ADD_ACTION",
        desc: "Adds an action to a sequencer part object",
        defVal: {
            step: 0,
            action: {},
        },
    },
    {
        type: "REMOVE_ACTION",
        desc: "Removes an action from a sequencer part object",
        defVal: {
            step: 0,
            action: {},
        },
    },

];
