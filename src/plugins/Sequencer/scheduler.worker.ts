// import { worker } from "cluster";

/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is more stable
 * than in the main thread.
 * The syntax is slidely different from vanilla workers
 * because of typescript and webpack.
 * Usage: See Sequencer.js for details
 */
const ctx: Worker = self as any;

let timer: number = 0;
let interval: number = 0;

ctx.addEventListener("message", (e) => {

    if (e.data.interval) {
        interval = e.data.interval;
        if (timer) {
            clearInterval(timer);
            timer = window.setInterval(() => { postMessage("tick", "*"); }, interval);
        }
    } else if (e.data === "start") {
        timer = window.setInterval(() => { postMessage("tick", "*"); }, interval);
    } else if (e.data === "stop") {
        clearInterval(timer);
    }
});

// we have to export anything,
// otherwise ts would complain that this is not a module
export default null as any;
