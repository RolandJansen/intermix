export default class ClockWorker {
    constructor() {
        // tslint:disable-next-line:no-empty
        this.onmessage = () => {};
    }

    // should be overwritten by the code using the worker
    public onmessage(event: Event): any {
        return true;
    }

    // mock expects data: { } instead of e: { data: { } }
    public postMessage(msg: any): void {
        const event: any = {};
        event.data = msg;
        this.onmessage(event);
    }
}
