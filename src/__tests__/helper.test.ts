import { getRandomString, isKeyUnique, deepCopy } from "../helper";

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

    test("returns null if null is given", () => {
        const testValue = null;
        const result = deepCopy(testValue);
        expect(result).toBe(testValue);
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
});
