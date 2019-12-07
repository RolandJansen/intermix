import clock from "./clock.implementation";

/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is more stable
 * than in the main thread.
 * The syntax is slidely different from vanilla workers
 * because of typescript and webpack.
 * Usage: See Sequencer.ts for details
 */
const ctx: Worker = self as any;

ctx.addEventListener("message", (e) => {
    const data: any = e.data;
    clock(data, self);
});

// we have to export anything,
// otherwise ts would complain that this is not a module
export default null as any;
