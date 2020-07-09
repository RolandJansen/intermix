export const getRandomString = (length: number): string => {
    const randomChars: string[] = [];
    const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if (length > 0) {
        for (let i = 0; i < length; i++) {
            randomChars[i] = input.charAt(Math.floor(Math.random() * input.length));
        }

        return randomChars.join("");
    }
    throw new Error("Length must be > 0.");
};

export const isKeyUnique = (key: string, hashMap: object): boolean => {
    if (hashMap.hasOwnProperty(key)) {
        return false;
    }
    return true;
};

/**
 * Copies deeply nested (and other) data by value.
 * It's based on a gist by Erik Vullings,
 * the author of "deep-copy-ts".
 * see https://gist.github.com/erikvullings/ada7af09925082cbb89f40ed962d475e
 * @param original The value to be cloned of any type
 */
export const deepCopy = <T>(original: T): T => {
    // null should be handled before objects.
    // Otherwise an empty object would be returned.
    if (original === null) {
        return original;
    }

    if (original instanceof Date) {
        return new Date(original.getTime()) as any;
    }

    if (original instanceof Array && original.length !== 0) {
        const clone: T = original.map(<N>(arrayElement: N) => {
            return deepCopy(arrayElement);
        }) as any;
        return clone;
    }

    // objects have to be handled last since all other values
    // are objects, too.
    if (typeof original === "object" && original !== {}) {
        // not very efficient to shallow copy and then to deep copy
        // but didn't figure out how to initialize "clone" otherwise
        const clone: T = Object.assign({}, original);
        for (const key in original) {
            clone[key] = deepCopy(original[key]);
        }
        return clone;
    }

    // if its not an object/array/date,
    // it must be a primitive, empty array/object
    return original;
};
