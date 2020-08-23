import clock from "./clock.implementation";

/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is more stable
 * than in the main thread.
 * The syntax is slidely different from vanilla workers
 * because of typescript and bundling.
 * Usage: See Sequencer.ts for details
 */
self.addEventListener("message", (e) => {
    const data: any = e.data || e;
    clock(data, self);
});

// we have to export anything to calm the compiler
export default null;
