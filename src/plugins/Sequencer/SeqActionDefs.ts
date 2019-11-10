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
];
