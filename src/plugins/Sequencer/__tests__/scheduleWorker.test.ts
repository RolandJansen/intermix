const interval1 = 100;
const inverval2 = 150;
let scheduleWorker: Worker;
let tickCounter: string[];

class WorkerMock {

    constructor(private workerFile: string) {
        // tslint:disable-next-line:no-empty
        this.onmessage = () => {};
    }

    // has to be overridden
    public onmessage(event: Event): any {
        return true;
    }

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

// beforeEach(() => {
//     scheduleWorker = new WorkerMock("../scheduleWorker");
//     tickCounter = [];

//     scheduleWorker.onmessage = (e) => {
//         if (e.data === "tick") {
//             tickCounter.push(e.data);
//         }
//     };
// });

// it("starts the timer", () => {
//     scheduleWorker.postMessage({ interval: interval1 });
// });
