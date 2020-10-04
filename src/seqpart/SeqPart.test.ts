import { IntermixNote, IntermixCtrl } from "../interfaces/interfaces";
import SeqPart from "./SeqPart";

describe("SeqPart", () => {
    let part: SeqPart;

    const noteEvent: IntermixNote = ["note", 0, 0, 0, 0];
    // {
    //     type: "NOTE",
    //     listener: "abcd",
    //     payload: {
    //         noteNumber: 0,
    //         velocity: 0,
    //         duration: 0,
    //     },
    // };
    const action2: IntermixCtrl = ["test-controller", 0, 0];
    // {
    //     type: "SYSEX",
    //     listener: "abcd",
    //     payload: 0x14a70f,
    // };

    beforeEach(() => {
        part = new SeqPart("abc");
    });

    test("has a default name", () => {
        // has to be tested through reducer
        // expect(part.name).toBe("Part");
    });

    test("has 16 stepsPerBar by default", () => {
        expect(part.stepsPerBar).toEqual(16);
    });

    test("can have other stepsPerBar values", () => {
        const customPart = new SeqPart("abc", 16, 32);
        expect(customPart.stepsPerBar).toEqual(32);
    });

    test("throws if 64 is not divisible by stepsPerBar", () => {
        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const sp = new SeqPart("abc", 64, 23);
        }).toThrow();
    });

    test("has one bar pattern-length", () => {
        expect(part).toHaveLength(64);
    });

    test("can have another pattern-length", () => {
        const otherPart = new SeqPart("abc", 224);
        const partLength = 224 * otherPart["stepMultiplier"];
        expect(otherPart).toHaveLength(partLength);
    });

    describe(".addAction", () => {
        it("is chainable", () => {
            const ctx = part.addEvent(noteEvent, 2);
            expect(ctx).toEqual(part);
        });

        it("adds an action at a given position", () => {
            // cumbersome test because we want to avoid
            // the use of other high level api (part.getActionsAtStep())
            const stepMultiplyer = 64 / part.stepsPerBar;
            part.addEvent(noteEvent, 4);

            const actions = part.seqPattern[4 * stepMultiplyer];
            expect(actions[0]).toBe(noteEvent);
        });

        it("doesn't add anything if position is out of pattern bounds", () => {
            part.addEvent(noteEvent, 16);

            const stepMultiplyer = 64 / part.stepsPerBar;
            const actions = part.seqPattern[16 * stepMultiplyer];
            expect(actions).not.toBeDefined();
        });
    });

    describe(".getActionsAtStep", () => {
        it("returns an array with actions if any", () => {
            part.addEvent(noteEvent, 2);
            const actions = part.getActionsAtStep(2);
            expect(actions[0]).toBe(noteEvent);
        });

        it("returns an empty array if step is out of bounds", () => {
            expect(part.getActionsAtStep(16)).toEqual([]);
        });
    });

    describe(".removeEvent", () => {
        beforeEach(() => {
            part.addEvent(noteEvent, 4).addEvent(action2, 4);
        });

        it("is chainable", () => {
            const ctx = part.removeEvent(noteEvent, 4);
            expect(ctx).toEqual(part);
        });

        it("removes an event from a given position", () => {
            // cumbersome test because we want to avoid
            // the use of other high level api (part.getActionsAtStep())
            const stepMultiplyer = 64 / part.stepsPerBar;
            part.removeEvent(noteEvent, 4);

            const actions = part.seqPattern[4 * stepMultiplyer];
            expect(actions[0]).toEqual(action2);
        });

        it("fails silently if event is not found at position", () => {
            const oldPattern = [...part.seqPattern];
            part.removeEvent(noteEvent, 3);
            expect(part.seqPattern).toEqual(oldPattern);
        });

        it("throws if position is out of pattern bounds", () => {
            expect(() => {
                part.removeEvent(noteEvent, 16);
            }).toThrow();
        });
    });

    // describe(".getNotePositions", () => {
    //     it("returns an array with all positions where note events are found", () => {
    //         part.addAction(noteEvent, 2).addAction(action2, 4).addAction(action2, 6).addAction(noteEvent, 6);

    //         expect(part.getNotePositions()).toEqual([2, 6]);
    //     });
    // });

    describe(".getActionsAtStep", () => {
        it("returns an array with all actions at step", () => {
            part.addEvent(noteEvent, 4).addEvent(action2, 4);

            const actions = part.getActionsAtStep(4);
            expect(actions).toHaveLength(2);
            expect(actions).toContain(noteEvent);
            expect(actions).toContain(action2);
        });

        it("returns an empty array if no actions at step", () => {
            part.addEvent(noteEvent, 4).addEvent(action2, 4);

            const actions = part.getActionsAtStep(3);
            expect(actions).toHaveLength(0);
        });

        it("returns an empty array if step is out of bounds", () => {
            const actions = part.getActionsAtStep(23);
            expect(actions).toHaveLength(0);
        });
    });

    describe(".extendOnTop", () => {
        it("extends the pattern on top", () => {
            const newSteps = 23;
            const oldPatternLength = part.length;
            const oldPatternZero = newSteps * part["stepMultiplier"];

            part.addEvent(noteEvent, 0);
            part.extendOnTop(newSteps);

            expect(part).toHaveLength(newSteps * part["stepMultiplier"] + oldPatternLength);
            expect(part.seqPattern[oldPatternZero][0]).toEqual(noteEvent);
        });
    });

    describe(".extendOnEnd", () => {
        it("extends the pattern on end", () => {
            const newSteps = 23;
            const oldPatternLength = part.length;

            part.addEvent(noteEvent, 0);
            part.extendOnEnd(newSteps);

            expect(part).toHaveLength(newSteps * part["stepMultiplier"] + oldPatternLength);
            expect(part.seqPattern[0][0]).toEqual(noteEvent);
        });
    });
});
