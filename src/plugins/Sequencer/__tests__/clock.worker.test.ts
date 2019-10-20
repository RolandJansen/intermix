import clock from "../clock.implementation";

const interval1 = 100;
const inverval2 = 150;
let clockWorker: any;
let tickCounter: string[];

class WorkerMock {
    constructor() {
        // tslint:disable-next-line:no-empty
        this.onmessage = () => {};
    }

    // should be overwritten by the code using the worker
    public onmessage(event: Event): any {
        return true;
    }

    // mock expects data: { } instead of e: { data: { } }
    public postMessage(msg: string | JSON): void {
        const event: any = {};
        if (typeof msg === "string") {
            event.data = msg;
        } else {
            event.data = msg;
        }
        this.onmessage(event);
    }
}

beforeEach(() => {
    clockWorker = new WorkerMock();
    tickCounter = [];

    clockWorker.addEventListener("message", (e) => {
        const data: any = e.data;

        clock(data, self);
    });

    clockWorker.onmessage = (e) => {
        if (e.data === "tick") {
            tickCounter.push(e.data);
        }
    };
});

// it("starts the timer", () => {
//     scheduleWorker.postMessage({ interval: interval1 });
// });
