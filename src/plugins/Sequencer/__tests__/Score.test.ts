import Score, { IRunqueue } from "../Score";
import { ILoop, OscArgSequence, IntermixNote } from "../../../registry/interfaces";

const partId1 = "abcd";
const partId2 = "efgh";
const pluginId = "ijkl";
const note1: IntermixNote = ["note", 23, 1, 1, 0];
const note2: IntermixNote = ["note", 42, 1, 1, 0];

let testScore: Score;
let pattern1: OscArgSequence[][];
let pattern2: OscArgSequence[][];

beforeEach(() => {
    pattern1 = [];
    pattern2 = [];

    for (let i = 0; i < 64; i++) {
        const subArray: OscArgSequence[] = [];
        pattern1[i] = subArray;
        pattern2[i] = Array.from(subArray);
    }

    const getState = jest.fn();
    getState.mockReturnValue({
        abcd: { pattern: pattern1 },
        efgh: { pattern: pattern2 },
    });

    testScore = new Score();
});

test("move the score pointer", () => {
    expect(testScore["nextStep"]).toEqual(0);
    testScore.moveScorePointerTo(23);
    expect(testScore["nextStep"]).toEqual(23);
});

test("increase the score pointer", () => {
    expect(testScore["nextStep"]).toEqual(0);
    testScore.increaseScorePointer();
    expect(testScore["nextStep"]).toEqual(1);
});

test("setting a new pointer position clears the runqueue", () => {
    testScore["runQueue"][0] = pattern1;

    const runQueueItemsBefore = Object.keys(testScore["runQueue"]);
    expect(runQueueItemsBefore).toHaveLength(1);

    testScore["setScorePointerTo"](42);
    const runQueueItemsAfter = Object.keys(testScore["runQueue"]);
    expect(runQueueItemsAfter).toHaveLength(0);
});

test("get the mainQueue", () => {
    // this function is bad design but should be tested anyway
    const queue = ([] = testScore.queue);
    expect(queue).toBe(testScore["mainQueue"]);
});

describe("Loop Mode", () => {
    test("activate loop mode", () => {
        testScore["loopActive"] = false;
        testScore.activateLoop();
        expect(testScore["loopActive"]).toBeTruthy();
    });

    test("deactivate loop mode", () => {
        testScore["loopActive"] = true;
        testScore.deactivateLoop();
        expect(testScore["loopActive"]).toBeFalsy();
    });

    test("sets loop start- and endpoint", () => {
        const loop: ILoop = { start: 23, end: 42 };
        testScore.loop = loop;
        expect(testScore["loopStart"]).toEqual(23);
        expect(testScore["loopEnd"]).toEqual(42);
    });

    test("ignores a loop setting if end is set prior to start", () => {
        const loop: ILoop = { start: 42, end: 23 }; // end < start
        testScore.loop = loop;
        expect(testScore["loopStart"]).toEqual(0);
        expect(testScore["loopEnd"]).toEqual(63);
    });

    test("ignores a loop setting if it contains no steps", () => {
        const loop: ILoop = { start: 23, end: 23 }; // start === end
        testScore.loop = loop;
        expect(testScore["loopStart"]).toEqual(0);
        expect(testScore["loopEnd"]).toEqual(63);
    });

    test("sets the pointer back to start when end of loop is reached", () => {
        const loop: ILoop = { start: 23, end: 42 };
        testScore.loop = loop;
        testScore.activateLoop();

        testScore.moveScorePointerTo(42);
        expect(testScore["nextStep"]).toEqual(42);
        testScore.increaseScorePointer();
        expect(testScore["nextStep"]).toEqual(23);
    });
});

describe("main queue", () => {
    test("add a part id", () => {
        testScore.activeStep = 5;
        testScore.addPartToScore([partId1, pluginId]);
        const queuePosition = testScore["mainQueue"][5];

        expect(queuePosition).toHaveLength(1);
        expect(queuePosition).toContainEqual([partId1, pluginId]);
    });

    test("can have many parts at the same position", () => {
        testScore.activeStep = 5;
        testScore.addPartToScore([partId1, pluginId]);
        testScore.addPartToScore([partId2, pluginId]);
        const queuePosition = testScore["mainQueue"][5];

        expect(queuePosition).toHaveLength(2);
        expect(queuePosition).toContainEqual([partId1, pluginId]);
        expect(queuePosition).toContainEqual([partId2, pluginId]);
    });

    test("remove a part", () => {
        testScore.activeStep = 5;
        testScore.addPartToScore([partId1, pluginId]);
        testScore.removePartFromScore([partId1, pluginId]);
        const queuePosition = testScore["mainQueue"][5];

        expect(queuePosition).toHaveLength(0);
        expect(queuePosition).not.toContain(partId1);
    });

    test("removes nothing if part not found", () => {
        testScore.activeStep = 5;
        testScore.addPartToScore([partId1, pluginId]);
        const queuePosition = testScore["mainQueue"][5];
        expect(queuePosition).toHaveLength(1);

        testScore.removePartFromScore(["mnop", "qrst"]);
        expect(queuePosition).toHaveLength(1);
    });
});

describe("runqueue", () => {
    let runqueue: IRunqueue;

    beforeEach(() => {
        pattern1[0].push(Array.from(note1));
        pattern1[1].push(Array.from(note2));
        pattern2[0].push(Array.from(note2));
        pattern2[1].push(Array.from(note1));

        // add them to the queue
        // testScore.addPartToScore([partId1, pluginId]);
        // testScore.addPartToScore([partId2, pluginId]);
        // testScore.resetScorePointer();
        testScore.addPatternToRunqueue([partId1, pluginId], pattern1);
        testScore.addPatternToRunqueue([partId2, pluginId], pattern2);

        runqueue = testScore["runQueue"];
    });

    test("adds SeqParts from the main queue to the runqueue", () => {
        const pointerIds = Object.keys(runqueue);
        const pattern1InRunqueue = runqueue[pointerIds[0]];
        const pattern2InRunqueue = runqueue[pointerIds[1]];

        // just references so they should be the same object
        expect(pattern1InRunqueue).toBe(pattern1);
        expect(pattern2InRunqueue).toBe(pattern2);
    });

    test("removes a part reference from runqueue when the part pointer expires", () => {
        const pointerIdsBefore = Object.keys(runqueue);
        expect(pointerIdsBefore).toHaveLength(2);

        // set one pointer to end of pattern
        const pointerId = pointerIdsBefore[0];
        const expiringPart = runqueue[pointerId];
        const pointer = testScore["pointers"][pointerId];
        pointer.position = expiringPart.length - 1;

        // expiringPart.pointers[pointerId] = expiringPart.length - 1;

        testScore.getAllActionsForNextStep();
        const pointerIdsAfter = Object.keys(runqueue);
        expect(pointerIdsAfter).toHaveLength(1);
    });

    test("deletes an expired pointer from the part", () => {
        const pointerId = Object.keys(runqueue)[0];
        const expiredPart = runqueue[pointerId];
        const expiredPartPointersBefore = Object.keys(testScore["pointers"]);
        expect(expiredPartPointersBefore).toContain(pointerId);

        // expire the pointer, see what happens
        testScore["pointers"][pointerId].position = expiredPart.length - 1;
        testScore.getAllActionsForNextStep();

        const expiredPartPointersAfter = Object.keys(testScore["pointers"]);
        expect(expiredPartPointersAfter).not.toContain(pointerId);
    });
});
