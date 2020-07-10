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

// this should be in the types or interfaces or sth
export type TypedArray =
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

/**
 * Copies deeply nested (and other) data by value.
 * It's based on a gist by Erik Vullings, the author of "deep-copy-ts"
 * with a few improvements and additions for complex types
 * see https://gist.github.com/erikvullings/ada7af09925082cbb89f40ed962d475e
 * @param original The value to be cloned of any type
 */
export const deepCopy = <T>(original: T): T => {
    // what about:
    // * maps
    // * sets
    // * img data
    // are the results still of same type after casting to any?

    // null and undefined (==) should be returned not copied.
    if (original == null) {
        return original;
    }

    if (original instanceof Date) {
        return new Date(original.getTime()) as any;
    }

    if (original instanceof RegExp) {
        return new RegExp(original.source, original.flags) as any;
    }

    if (original instanceof ArrayBuffer) {
        return original.slice(0, original.byteLength) as any;
    }

    // TypedArrays are views for ArrayBuffers (binary data)
    if (isTypedArray(original)) {
        return copyTypedArray(original) as any;
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

const copyTypedArray = (original: TypedArray): TypedArray => {
    if (original instanceof Int8Array) {
        return new Int8Array(original);
    }
    if (original instanceof Uint8Array) {
        return new Uint8Array(original);
    }
    if (original instanceof Uint8ClampedArray) {
        return new Uint8ClampedArray(original);
    }
    if (original instanceof Int16Array) {
        return new Int16Array(original);
    }
    if (original instanceof Uint16Array) {
        return new Uint16Array(original);
    }
    if (original instanceof Int16Array) {
        return new Int16Array(original);
    }
    if (original instanceof Uint16Array) {
        return new Uint16Array(original);
    }
    if (original instanceof Int32Array) {
        return new Int32Array(original);
    }
    if (original instanceof Uint32Array) {
        return new Uint32Array(original);
    }
    if (original instanceof Float32Array) {
        return new Float32Array(original);
    }
    if (original instanceof Float64Array) {
        return new Float64Array(original);
    }
    if (original instanceof BigInt64Array) {
        return new BigInt64Array(original);
    }
    if (original instanceof BigUint64Array) {
        return new BigUint64Array(original);
    }
    return new Uint8Array(); // just to return something from every path
};

const isTypedArray = (item: any): item is TypedArray => {
    return (item as TypedArray).buffer !== undefined;
};
