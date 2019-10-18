// import clockGenerator from "./clockGenerator.implementation";

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

// this is a workaround for a bug in webpack-devsserver 3.8.1.
// onmessage expects two arguments which doesn't match the api.
const sendMessage: any = self.postMessage;

let timer: number = 0;
let interval: number = 0;

ctx.addEventListener("message", (e) => {
    const data: any = e.data;

    if (data.interval) {
        interval = data.interval;
        if (timer) {
            self.clearInterval(timer);
            timer = self.setInterval(() => { sendMessage("tick"); }, interval);
        }
    }

    if (data === "start") {
        timer = self.setInterval(() => { sendMessage("tick"); }, interval);
    } else if (data === "stop") {
        self.clearInterval(timer);
    }
});

// we have to export anything,
// otherwise ts would complain that this is not a module
export default null as any;
