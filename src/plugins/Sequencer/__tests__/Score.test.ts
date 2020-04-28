import Score, { IRunqueue } from "../Score"
import { ILoop, IAction } from "../../../registry/interfaces";
import SeqPart from "../../../seqpart/SeqPart";

let testScore: Score;

beforeEach(() => {
    testScore = new Score();
})

test("move the score pointer", () => {
    expect(testScore["nextStep"]).toEqual(0);
    testScore.moveScorePointerTo(23);
    expect(testScore["nextStep"]).toEqual(23);
})

test("increase the score pointer", () => {
    expect(testScore["nextStep"]).toEqual(0);
    testScore.increaseScorePointer();
    expect(testScore["nextStep"]).toEqual(1);
})

test("setting a new pointer position clears the runqueue", () => {
    const part1 = new SeqPart();
    testScore["runQueue"]["abcd"] = part1;

    const runQueueItemsBefore = Object.keys(testScore["runQueue"]);
    expect(runQueueItemsBefore).toHaveLength(1);

    testScore["setScorePointerTo"](42);
    const runQueueItemsAfter = Object.keys(testScore["runQueue"]);
    expect(runQueueItemsAfter).toHaveLength(0);
})

test("get the mainQueue", () => {
    // this function is bad design but should be tested anyway
    const queue: string[][] = [] = testScore.queue;
    expect(queue).toBe(testScore["mainQueue"]);
})

describe("Loop Mode", () => {

    test("activate loop mode", () => {
        testScore["loopActivated"] = false;
        testScore.activateLoop();
        expect(testScore["loopActivated"]).toBeTruthy();
    })

    test("deactivate loop mode", () => {
        testScore["loopActivated"] = true;
        testScore.deactivateLoop();
        expect(testScore["loopActivated"]).toBeFalsy();
    })

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

})

describe("main queue", () => {

    const partId1 = "abcd";
    const partId2 = "efgh";

    test("add a part id", () => {
        testScore.addPartToScore(partId1, 5);
        const queuePosition = testScore["mainQueue"][5];

        expect(queuePosition).toHaveLength(1);
        expect(queuePosition).toContain(partId1);
    })

    test("can have many parts at the same position", () => {
        testScore.addPartToScore(partId1, 5);
        testScore.addPartToScore(partId2, 5);
        const queuePosition = testScore["mainQueue"][5];

        expect(queuePosition).toHaveLength(2);
        expect(queuePosition).toContain(partId1);
        expect(queuePosition).toContain(partId2);
    })

    test("remove a part", () => {
        testScore.addPartToScore(partId1, 5);
        testScore.removePartFromScore(partId1, 5);
        const queuePosition = testScore["mainQueue"][5];

        expect(queuePosition).toHaveLength(0);
        expect(queuePosition).not.toContain(partId1);
    })

    test("removes nothing if part not found", () => {
        testScore.addPartToScore(partId1, 5);
        const queuePosition = testScore["mainQueue"][5];
        expect(queuePosition).toHaveLength(1);

        testScore.removePartFromScore("ijkl", 5);
        expect(queuePosition).toHaveLength(1);
    })
})

describe("runqueue", () => {

    let part1: SeqPart;
    let part2: SeqPart;
    let part1Uid: string;
    let part2Uid: string;
    let runqueue: IRunqueue;

    beforeEach(() => {
        // add parts to the part-list
        part1 = new SeqPart();
        part2 = new SeqPart();
        part1Uid = testScore.parts.add(part1);
        part2Uid = testScore.parts.add(part2);

        // add them to the queue
        testScore.addPartToScore(part1Uid, 0);
        testScore.addPartToScore(part2Uid, 0);
        testScore.resetScorePointer();
        testScore.addPartsToRunqueue();

        runqueue = testScore["runQueue"];
    })

    test("adds SeqParts from the main queue to the runqueue", () => {
        const pointerIds = Object.keys(runqueue);
        const part1InRunqueue = runqueue[pointerIds[0]];
        const part2InRunqueue = runqueue[pointerIds[1]];

        // just references so they should be the same object
        expect(part1InRunqueue).toBe(part1);
        expect(part2InRunqueue).toBe(part2);
    })

    test("removes a part reference from runqueue when the part pointer expires", () => {
        const pointerIdsBefore = Object.keys(runqueue);
        expect(pointerIdsBefore).toHaveLength(2);

        // set one pointer to end of pattern
        const pointerId = pointerIdsBefore[0];
        const expiredPart = runqueue[pointerId];
        expiredPart.pointers[pointerId] = expiredPart.length - 1;

        testScore.getAllActionsInNextStep();
        const pointerIdsAfter = Object.keys(runqueue);
        expect(pointerIdsAfter).toHaveLength(1);
    })

    test("deletes an expired pointer from the part", () => {
        const pointerId = Object.keys(runqueue)[0];
        const expiredPart = runqueue[pointerId];
        const expiredPartPointersBefore = Object.keys(expiredPart.pointers);
        expect(expiredPartPointersBefore).toContain(pointerId);

        // expire the pointer, see what happens
        expiredPart.pointers[pointerId] = expiredPart.length - 1;
        testScore.getAllActionsInNextStep();

        const expiredPartPointersAfter = Object.keys(expiredPart.pointers);
        expect(expiredPartPointersAfter).not.toContain(pointerId);
    })

})