/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * This is a fake implementation of a generic dedicated worker.
 * The implementation of the worker should be in a seperate
 * module and can be loaded like this:
 * @example
 * const worker = new GenericWorkerMock();
 * worker.internal.onmessage = functionWithActualImplementation;
 */
export default class GenericWorkerMock {
    public internal: InternalWorker;

    constructor() {
        this.internal = new InternalWorker(this);
    }

    public onmessage(event: MessageEvent): void {
        // should be overwritten by the code using the worker
    }

    public postMessage(msg: any): void {
        this.internal.onmessage(msg, this.internal);
    }
}

class InternalWorker {
    public setInterval = setInterval;
    public clearInterval = clearInterval;

    constructor(private external: GenericWorkerMock) {}

    public onmessage(data: any, worker: any): any {
        // should be overwritten by the worker implementation
        return true;
    }

    public postMessage(msg: any): void {
        const e: MessageEvent = new MessageEvent("worker", {
            data: msg,
        });
        this.external.onmessage(e);
    }
}
