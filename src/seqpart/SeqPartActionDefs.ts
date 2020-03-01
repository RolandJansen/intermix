// This is an action definition file
// All actions that should be recognized
// by the store should be defined here.
// Every actiondef should have type, desc and defVal fields.
// You can also set minVal/maxVal fields if it's a numeric value.
// Your plugin can compute addtional actions not defined here
// but they will not get recognized by the store.
export default [
    {
        type: "ADD_ACTION",
        desc: "Adds an action to a sequencer part object",
        defVal: {},
    },
    {
        type: "REMOVE_ACTION",
        desc: "Removes an action from a sequencer part object",
        defVal: {},
    },

];
