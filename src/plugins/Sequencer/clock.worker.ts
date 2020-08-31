/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is more stable
 * than in the main thread.
 * The syntax is slidely different from vanilla workers
 * because of typescript and bundling.
 * Usage: See Sequencer.ts for details
 */

export interface IClockMessage {
    interval?: number;
    command?: string;
}

export function clock(e: MessageEvent): void {
    // we need an object that represents a worker context
    // to tell the compiler to use the right types.
    const ctx: Worker = self as any;
    const data = e.data as IClockMessage;
    let timer: any; // should be number but typescript has a problem with the setInterval context
    let interval = 0;

    if (data.interval) {
        interval = data.interval;
        ctx.postMessage({ interval });
        if (timer) {
            clearInterval(timer);
            timer = setInterval(() => {
                ctx.postMessage("tick");
            }, interval);
        }
    }

    if (data.command === "start") {
        timer = setInterval(() => {
            ctx.postMessage("tick");
        }, interval);
    } else if (data.command === "stop") {
        clearInterval(timer);
    } else if (data.command === "getIntervalInMili") {
        ctx.postMessage({ interval });
    }
}
