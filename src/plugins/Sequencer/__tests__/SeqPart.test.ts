import SeqPart from "../SeqPart";

let part: SeqPart;

// var evt1 = { 'uid': '123', 'msg': { 'type': 'note', 'value': 60, 'velocity': 1 } };
// var evt2 = { 'uid': '456', 'msg': { 'type': 'volume', 'value': 72 } };

beforeEach(() => {
    part = new SeqPart(16);
});

afterEach(() => {
    // part = null;
});

test("get the default name", () => {
    expect(part.name).toBe("Part");
});

// it('should get initialized by default with one bar pattern-length', function () {
//     expect(part.getLength()).toEqual(64);
// });

// it('should get initialized with a given pattern-length', function () {
//     var otherPart = new Part(224);
//     expect(otherPart.getLength()).toEqual(224);
// });

// describe('.addEvent', function () {

//     it('is chainable', function () {
//         var ctx = part.addEvent(evt1, 2);
//         expect(ctx).toEqual(part);
//     });

//     it('on success adds an event at a given position', function () {
//         part.addEvent(evt1, 4);
//         expect(part.pattern[16][0]).toBe(evt1);
//     });

//     it('on failure throws an error if position is out of pattern bounds', function () {
//         expect(function () { part.addEvent(17); }).toThrowError('Position out of pattern bounds.');
//     });

// });

// describe('.removeEvent', function () {

//     beforeEach(function () {
//         part.addEvent(evt1, 4);
//         part.addEvent(evt2, 4);
//     });

//     afterEach(function () {
//         part.pattern[16] = [];
//     });

//     it('is chainable', function () {
//         var ctx = part.removeEvent(evt1, 4);
//         expect(ctx).toEqual(part);
//     });

//     it('removes an event from a given position', function () {
//         part.removeEvent(evt1, 4);
//         expect(part.pattern[16][0]).toBe(evt2);
//     });

//     it('does nothing if event is not found at position', function () {
//         part.removeEvent(evt1, 3);
//     });

//     it('does nothing if a wrong event is passed in', function () {
//         var evt = {};
//         part.removeEvent(evt, 4);
//         expect(part.pattern[16].length).toEqual(2);
//     });

// });

// describe('.getLength', function () {

//     it('returns the length of the pattern in 64th notes', function () {
//         expect(part.getLength()).toEqual(part.pattern.length);
//     });

// });

// describe('.getNotePositions', function () {

//     it('returns an array with all positions where note events are found', function () {
//         part.addEvent(evt1, 2)
//             .addEvent(evt2, 4)
//             .addEvent(evt2, 6)
//             .addEvent(evt1, 6);

//         expect(part.getNotePositions()).toEqual([2, 6]);
//     });

// });

// describe('.extendOnTop', function () {

//     it('extends the pattern on top', function () {
//         part.addEvent(evt1, 0);
//         part.extendOnTop(32);
//         expect(part.getLength()).toEqual(96);
//         expect(part.pattern[32][0]).toBe(evt1);
//     });

// });

// describe('.extendOnEnd', function () {

//     it('extends the pattern on end', function () {
//         part.addEvent(evt1, 0);
//         part.extendOnEnd(32);
//         expect(part.getLength()).toEqual(96);
//         expect(part.pattern[0][0]).toBe(evt1);
//     });

// });
