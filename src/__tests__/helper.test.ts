import { getRandomString, isKeyUnique } from "../helper";

describe("getRandomString()", () => {

    test("returns a random string of variable length", () => {
        const five = getRandomString(5);
        const twentythree = getRandomString(23);

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
