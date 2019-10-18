export default class ScheduleWorker {

    constructor(private workerFile: string) {
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
