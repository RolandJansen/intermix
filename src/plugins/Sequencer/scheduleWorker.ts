/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is more stable
 * than in the main thread.
 * The syntax is slidely different from vanilla workers
 * because of typescript and webpack.
 * Usage: See Sequencer.js for details
 */

let timer = null;
let interval = 100;

addEventListener("message", (e) => {
    if (e.data === "start") {
        timer = setInterval(() => { postMessage("tick", "*"); }, interval);
    } else if (e.data === "stop") {
        clearInterval(timer);
    } else if (e.data.interval) {
        interval = e.data.interval;
        if (timer) {
            clearInterval(timer);
            timer = setInterval(() => { postMessage("tick", "*"); }, interval);
        }
    }
});
