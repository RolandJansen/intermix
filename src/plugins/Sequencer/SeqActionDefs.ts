export default [
    {
        type: "RUNNING",
        desc: "starts or stopps playback",
        defVal: false,
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
