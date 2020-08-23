// import clock from "./clock.implementation";

/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is more stable
 * than in the main thread.
 * The syntax is slidely different from vanilla workers
 * because of typescript and bundling.
 * Usage: See Sequencer.ts for details
 */

let timer = 0;
let interval = 0;

function clock(data: any, worker: any): void {
    // "sendMessage" is a workaround for a bug in webpack-dev-server 3.8.1.
    // Type "onMessage" expects two arguments which doesn't match with the api.
    const sendMessage: any = worker.postMessage.bind(worker);

    if (data.interval) {
        interval = data.interval;
        sendMessage({ interval });
        if (timer) {
            clearInterval(timer);
            timer = worker.setInterval(() => {
                sendMessage("tick");
            }, interval);
        }
    }

    if (data === "start") {
        timer = worker.setInterval(() => {
            sendMessage("tick");
        }, interval);
    } else if (data === "stop") {
        clearInterval(timer);
    } else if (data === "getIntervalInMili") {
        sendMessage({ interval });
    }
}

self.addEventListener("message", (e) => {
    const data: any = e.data || e;
    clock(data, self);
});

// we have to export anything to calm the compiler
export default null;
