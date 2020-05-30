import clockImplementation from "../clock.implementation";
import ClockWorker from "../GenericWorkerMock";

const interval1 = 100;
const interval2 = 150;
let receivedInterval = 0;
let clock: any; // ClockWorker can't be used as a type here
let tickCounter: string[];

beforeEach(() => {
    jest.useFakeTimers();

    clock = new ClockWorker();
    clock.internal.onmessage = clockImplementation;
    tickCounter = [];
    receivedInterval = 0;

    clock.onmessage = async (e: MessageEvent): Promise<void> => {
        if (e.data === "tick") {
            tickCounter.push(e.data);
        } else if (e.data.interval) {
            receivedInterval = e.data.interval;
        }
    };
});

it("set the clock interval", () => {
    clock.postMessage({ interval: interval1 });
    expect(receivedInterval).toEqual(interval1);
});

it("sends the inverval time on request", () => {
    clock.postMessage("getIntervalInMili");
    expect(receivedInterval).toEqual(interval1);
});

it('calls setInterval when "start" is received', () => {
    clock.postMessage("start");
    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), interval1);
});

it('calls clearInterval when "stop" is received', () => {
    clock.postMessage("stop");
    expect(clearInterval).toHaveBeenCalledTimes(1);
});

it("restarts the interval when a new interval time is received in running state", () => {
    clock.postMessage("start");
    clock.postMessage({ interval: interval2 });

    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledTimes(2);
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), interval2);
});
