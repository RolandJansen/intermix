/**
 * The implementation of the clock generator
 * to be used by the worker.
 * This way we can test the code without a
 * complicated worker mock.
 */
let timer: number = 0;
let interval: number = 0;

export default function clock(data: any) {
    if (data.interval) {
        interval = data.interval;
        if (timer) {
            clearInterval(timer);
            timer = window.setInterval(() => { postMessage("tick", "*"); }, interval);
        }
    }

    if (data === "start") {
        timer = window.setInterval(() => { postMessage("tick", "*"); }, interval);
    } else if (data === "stop") {
        clearInterval(timer);
    }
}
