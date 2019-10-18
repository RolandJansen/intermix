import { IAction } from "../../../registry/interfaces";
import SeqPart from "../SeqPart";

describe("SeqPart", () => {
    let part: SeqPart;

    const action1: IAction = {
        type: "NOTE",
        dest: "abcd",
        payload: [0, 0],
    };
    const action2 = {
        type: "SYSEX",
        dest: "abcd",
        payload: 0x14a70f,
    };

    beforeEach(() => {
        part = new SeqPart();
    });

    test("has a default name", () => {
        expect(part.name).toBe("Part");
    });

    test("has 16 stepsPerBar by default", () => {
        expect(part.stepsPerBar).toEqual(16);
    });

    test("can have other stepsPerBar values", () => {
        const customPart = new SeqPart(undefined, 32);
        expect(customPart.stepsPerBar).toEqual(32);
    });

    test("throws if 64 is not divisible by stepsPerBar", () => {
        expect(() => {
            const sp = new SeqPart(undefined, 23);
        }).toThrow();
    });

    test("has one bar pattern-length", () => {
        expect(part.length).toEqual(16);
    });

    test("can have another pattern-length", () => {
        const otherPart = new SeqPart(224);
        expect(otherPart.length).toEqual(224);
    });

    describe(".addAction", () => {

        it("is chainable", () => {
            const ctx = part.addAction(action1, 2);
            expect(ctx).toEqual(part);
        });

        it("adds an action at a given position", () => {
            // cumbersome test because we want to avoid
            // the use of other high level api (part.getActionsAtStep())
            const stepMultiplyer = 64 / part.stepsPerBar;
            part.addAction(action1, 4);

            const actions = part.seqPattern[4 * stepMultiplyer];
            expect(actions[0]).toBe(action1);
        });

        it("throws if position is out of pattern bounds", () => {
            expect(() => {
                part.addAction(action1, 16);
            }).toThrow();
        });

    });

    describe(".getActionsAtStep", () => {

        it("returns an array with actions if any", () => {
            part.addAction(action1, 2);
            const actions = part.getActionsAtStep(2);
            expect(actions[0]).toBe(action1);
        });

        it("returns an empty array if step is out of bounds", () => {
            expect(part.getActionsAtStep(16)).toEqual([]);
        });

    });

    describe(".removeAction", () => {

        beforeEach(() => {
            part.addAction(action1, 4).addAction(action2, 4);
        });

        it("is chainable", () => {
            const ctx = part.removeAction(action1, 4);
            expect(ctx).toEqual(part);
        });

        it("removes an event from a given position", () => {
            // cumbersome test because we want to avoid
            // the use of other high level api (part.getActionsAtStep())
            const stepMultiplyer = 64 / part.stepsPerBar;
            part.removeAction(action1, 4);

            const actions = part.seqPattern[4 * stepMultiplyer];
            expect(actions[0]).toEqual(action2);
        });

        it("fails silently if event is not found at position", () => {
            const oldPattern = [...part.seqPattern];
            part.removeAction(action1, 3);
            expect(part.seqPattern).toEqual(oldPattern);
        });

        it("throws if position is out of pattern bounds", () => {
            expect(() => {
                part.removeAction(action1, 16);
            }).toThrow();
        });

    });

    describe(".getNotePositions", () => {

        it("returns an array with all positions where note events are found", () => {
            part.addAction(action1, 2)
                .addAction(action2, 4)
                .addAction(action2, 6)
                .addAction(action1, 6);

            expect(part.getNotePositions()).toEqual([2, 6]);
        });

    });

    describe(".getActionsAtStep", () => {

        it("returns an array with all actions at a given step", () => {
            part.addAction(action1, 4).addAction(action2, 4);

            const actions = part.getActionsAtStep(4);
            expect(actions.length).toEqual(2);
            expect(actions).toContain(action1);
            expect(actions).toContain(action2);
        });

        it("returns an empty array if step is out of bounds", () => {
            const actions = part.getActionsAtStep(23);
            expect(actions.length).toEqual(0);
        });

    });

    describe(".extendOnTop", () => {

        it("extends the pattern on top", () => {
            const newSteps = 23;
            const oldPatternLength = part.length;
            const oldPatternZero = newSteps * (64 / part.stepsPerBar);

            part.addAction(action1, 0);
            part.extendOnTop(newSteps);

            expect(part.length).toEqual(newSteps + oldPatternLength);
            expect(part.seqPattern[oldPatternZero][0]).toEqual(action1);
        });

    });

    describe(".extendOnEnd", () => {

        it("extends the pattern on end", () => {
            const newSteps = 23;
            const oldPatternLength = part.length;

            part.addAction(action1, 0);
            part.extendOnEnd(newSteps);

            expect(part.length).toEqual(newSteps + oldPatternLength);
            expect(part.seqPattern[0][0]).toEqual(action1);
        });

    });

});
