import { getRandomString, isKeyUnique, deepCopy, TypedArray } from "../helper";

describe("getRandomString()", () => {
    test("returns a random string of variable length", () => {
        const five = getRandomString(5);

        expect(five).toHaveLength(5);
    });

    test("throws if length is <= 0", () => {
        expect(getRandomString).toThrow();
    });
});

describe("isKeyUnique()", () => {
    const hashmap = {
        abc: "123",
        def: "456",
    };

    test("returns false if key is in hashmap", () => {
        const keyIsNotUnique = isKeyUnique("abc", hashmap);
        expect(keyIsNotUnique).toBeFalsy();
    });

    test("returns true if key is not in hashmap", () => {
        const keyIsUnique = isKeyUnique("ghi", hashmap);
        expect(keyIsUnique).toBeTruthy();
    });
});

/**
 * The problem with copy-by-value is that
 * complex data inside the copy is still referenced, not copied.
 * The "toBe" matcher uses Object.is to compare object equality.
 * This means that a "not.toBe" check passes even if data
 * inside the object is the same by reference.
 *
 * If a deeply nested copy is examined, there have to be additional
 * tests for one or more data objects.
 */
describe("deepCopy()", () => {
    const testArrayFlat: number[] = [23, 42, 237];
    const testArrayNested: number[][] = [[23], [42], [237]];
    const testObjectFlat = {
        one: 1,
        two: "zwei",
        three: true,
    };
    const testObjectNested = {
        one: { two: "zwei" },
        three: { drei: true },
    };
    const testArrayMixed: any = ["astring", 23, testArrayNested, testObjectNested];
    const testObjectMixed: any = {
        one: "eins",
        two: 2,
        superList: testArrayNested,
        superDuperList: testArrayMixed,
        superDuperObject: { testObjectNested },
    };
    const testMapFlat = new Map();
    testMapFlat.set("one", "eins");
    testMapFlat.set("two", "zwei");
    testMapFlat.set("three", "drei");
    const testMapNested = new Map();
    testMapNested.set("one", testArrayNested);
    testMapNested.set("two", testObjectNested);
    testMapNested.set("three", testMapFlat);
    const testSetFlat = new Set();
    testSetFlat.add(23).add(42).add(237);
    const testSetMixed = new Set();
    testSetMixed.add(testArrayNested);
    testSetMixed.add(testObjectNested);
    testSetMixed.add(5);

    test("returns undefined if undefined is given", () => {
        const testValue = undefined;
        const result = deepCopy(testValue);
        expect(result).toBe(testValue);
    });

    test("returns null if null is given", () => {
        let testValue = null;
        const result = deepCopy(testValue);
        expect(result).toBe(testValue);
        testValue = 5; // just to enshure that it's not the same
        expect(result).toBe(null);
    });

    test("returns infinity if inf is given", () => {
        const testValue = Infinity;
        const result = deepCopy(testValue);
        expect(result).toBe(Infinity);
    });

    test("copies numbers", () => {
        const testValue = 23;
        const result = deepCopy(testValue);
        expect(typeof result).toMatch("number");
        expect(result).toEqual(testValue);
    });

    test("copies strings", () => {
        const testValue = "hello";
        const result = deepCopy(testValue);
        expect(typeof result).toMatch("string");
        expect(result).toEqual(testValue);
    });

    test("copies booleans", () => {
        const testValue = true;
        const result = deepCopy(testValue);
        expect(typeof result).toMatch("boolean");
        expect(result).toEqual(testValue);
    });

    test("copies date objects", () => {
        const testValue = new Date();
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies regular expressions", () => {
        const testValue = new RegExp(/ab+c/, "i");
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies array buffers", () => {
        const testValue = new ArrayBuffer(8);
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies empty maps", () => {
        const testValue = new Map();
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies flat maps", () => {
        const testValue = testMapFlat;
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies nested maps", () => {
        const testValue = testMapNested;
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);

        // the former 'toBe' doesn't check for deep equality
        // so we have to examine one data object, too:
        expect(result.get("one")).toEqual(testArrayNested);
        expect(result.get("one")).not.toBe(testArrayNested);
    });

    test("copies empty sets", () => {
        testFlatInput(new Set());
    });

    test("copies flat sets", () => {
        testFlatInput(testSetFlat);
    });

    test("copies nested sets", () => {
        const testValue = testSetMixed;
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);

        // the former 'toBe' doesn't check for deep equality
        // so we have to examine one data object, too:
        expect(result.has(testObjectNested)).toBeFalsy();
        expect(result.has(5)).toBeTruthy();
    });

    test("copies empty arrays", () => {
        const testValue: any[] = [];
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies flat arrays", () => {
        const result = deepCopy(testArrayFlat);
        expect(result).toEqual(testArrayFlat);
        expect(result).not.toBe(testArrayFlat);
    });

    test("copies nested arrays", () => {
        const result = deepCopy(testArrayNested);
        expect(result).toEqual(testArrayNested);
        expect(result).not.toBe(testArrayNested);
    });

    test("copies mixed arrays", () => {
        const result = deepCopy(testArrayMixed);
        expect(result).toEqual(testArrayMixed);
        expect(result).not.toBe(testArrayMixed);

        // the former 'toBe' doesn't check for deep equality
        // so we have to examine one data object, too:
        expect(result[2]).toEqual(testArrayNested);
        expect(result[2]).not.toBe(testArrayNested);
    });

    test("copies empty objects", () => {
        const testValue = {};
        const result = deepCopy(testValue);
        expect(result).toEqual(testValue);
        expect(result).not.toBe(testValue);
    });

    test("copies flat objects", () => {
        const result = deepCopy(testObjectFlat);
        expect(result).toEqual(testObjectFlat);
    });

    test("copies nested objects", () => {
        const result = deepCopy(testObjectNested);
        expect(result).toEqual(testObjectNested);
        expect(result).not.toBe(testObjectNested);
    });

    test("copies mixed objects", () => {
        const result = deepCopy(testObjectMixed);
        expect(result).toEqual(testObjectMixed);
        expect(result).not.toBe(testObjectMixed);

        // the former 'toBe' doesn't check for deep equality
        // so we have to examine one data object, too:
        expect(result.superList).toEqual(testArrayNested);
        expect(result.superList).not.toBe(testArrayNested);
    });

    const testFlatInput = <T>(flatInput: T): void => {
        const result = deepCopy(flatInput);
        expect(result).toEqual(flatInput);
        expect(result).not.toBe(flatInput);
    };

    // TypedArrays are array-like "views" for ArrayBuffers
    // we create then with data from a flat array
    describe("typed arrays", () => {
        interface ITypedArrays {
            [propName: string]: TypedArray;
        }

        const typedArrays: ITypedArrays = {
            Int8Array: new Int8Array(testArrayFlat),
            Uint8Array: new Uint8Array(testArrayFlat),
            Uint8ClampedArray: new Uint8ClampedArray(testArrayFlat),
            Int16Array: new Int16Array(testArrayFlat),
            Uint16Array: new Uint16Array(testArrayFlat),
            Int32Array: new Int32Array(testArrayFlat),
            Uint32Array: new Uint32Array(testArrayFlat),
            Float32Array: new Float32Array(testArrayFlat),
            Float64Array: new Float64Array(testArrayFlat),
            BigInt64Array: new BigInt64Array(8),
            BigUint64Array: new BigUint64Array(8),
        };

        for (const key in typedArrays) {
            test(`copies ${key}`, () => {
                const testValue = typedArrays[key];
                const result = deepCopy(testValue);
                expect(result).toEqual(testValue);
                expect(result).not.toBe(testValue);
            });
        }
    });
});
