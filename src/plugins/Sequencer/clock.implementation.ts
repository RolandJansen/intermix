/**
 * The implementation of the clock to be used by the worker.
 * This way we can test the code easily in a worker mock.
 *
 * Since the whole worker thing seems terribly broken in ts/webpack
 * we have to use a worker of type any.
 */
let timer: number = 0;
let interval: number = 0;

export default function clock(data: any, worker: any) {
    // "sendMessage" is a workaround for a bug in webpack-dev-server 3.8.1.
    // Type "onMessage" expects two arguments which doesn't match with the api.
    const sendMessage: any = worker.postMessage;

    if (data.interval) {
        interval = data.interval;
        if (timer) {
            clearInterval(timer);
            timer = worker.setInterval(() => { sendMessage("tick"); }, interval);
        }
    }

    if (data === "start") {
        timer = worker.setInterval(() => { sendMessage("tick"); }, interval);
    } else if (data === "stop") {
        clearInterval(timer);
    }
}
