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
    command?: string;
    intervalInMili?: number;
}

let timer: any; // should be number but typescript has a problem with the setInterval context
let intervalInMili = 0;

export function clock(e: MessageEvent): void {
    // we need an object that represents a worker context
    // to tell the compiler to use the right types.
    const ctx: Worker = self as any;
    const data = e.data as IClockMessage;

    if (data.intervalInMili) {
        intervalInMili = data.intervalInMili;
        if (typeof timer !== "undefined") {
            clearInterval(timer);
        }
    }

    if (data.command === "start") {
        timer = setInterval(() => {
            ctx.postMessage("tick");
        }, intervalInMili);
    } else if (data.command === "stop") {
        clearInterval(timer);
    } else if (data.command === "getIntervalInMili") {
        ctx.postMessage({ intervalInMili });
    }
}
