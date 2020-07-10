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
    const testMixedArray: any = ["astring", 23, testArrayNested, testObjectNested];
    const testMixedObject: any = {
        one: "eins",
        two: 2,
        superList: testArrayNested,
        superDuperList: testMixedArray,
        superDuperObject: { testObjectNested },
    };

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

    test("copies flat arrays", () => {
        const result = deepCopy(testArrayFlat);
        expect(result).toEqual(testArrayFlat);
        expect(result).not.toBe(testArrayFlat);
    });

    test("copies flat objects", () => {
        const result = deepCopy(testObjectFlat);
        expect(result).toEqual(testObjectFlat);
    });

    test("copies nested arrays", () => {
        const result = deepCopy(testArrayNested);
        expect(result).toEqual(testArrayNested);
        expect(result).not.toBe(testArrayNested);
    });

    test("copies nested objects", () => {
        const result = deepCopy(testObjectNested);
        expect(result).toEqual(testObjectNested);
        expect(result).not.toBe(testObjectNested);
    });

    test("copies mixed arrays", () => {
        const result = deepCopy(testMixedArray);
        expect(result).toEqual(testMixedArray);
        expect(result).not.toBe(testMixedArray);
    });

    test("copies mixed objects", () => {
        const result = deepCopy(testMixedObject);
        expect(result).toEqual(testMixedObject);
        expect(result).not.toBe(testMixedObject);
    });

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
