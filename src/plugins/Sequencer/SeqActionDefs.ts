export default [
    {
        type: "START",
        desc: "starts playback",
        defVal: false,
    },
    {
        type: "STOP",
        desc: "stops playback",
        defVal: true,
    },
    {
        type: "PAUSE",
        desc: "pauses playback",
        defVal: false,
    },
    {
        type: "RESUME",
        desc: "resumes from pause state",
        defVal: false,
    },
    {
        type: "SET_BPM",
        desc: "sets new BPM value",
        minVal: 0,
        maxVal: 240,
        defVal: 120,
    },
];
