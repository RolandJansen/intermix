/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is  more stable
 * than in the main thread.
 * The syntax is adapted to the commonjs module pattern.
 * @example <caption>It is just for library internal
 * usage. See Sequencer.js for details.</caption>
 * worker.postMessage({ 'interval': 200 });
 * worker.postMessage('start');
 * worker.postMessage('stop');
 * worker.terminate();  //webworker internal function, just for completeness
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
