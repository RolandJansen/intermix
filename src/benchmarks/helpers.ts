export function getRandomNumberArray(arrLength: number, intLength: number): number[] {
    const numbers = new Array(arrLength);
    for (let i = 0; i <= arrLength; i++) {
        numbers[i] = getRandomInt(intLength);
    }
    return numbers;
}

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

export function getRandomStringArray(arrLength: number, strLength: number): string[] {
    const strings = new Array(arrLength);
    for (let i = 0; i <= arrLength; i++) {
        strings[i] = getRandomString(strLength);
    }
    return strings;
}

// same as in abstract plugin
function getRandomString(length: number): string {
    const randomChars: string[] = [];
    const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
        randomChars[i] = input.charAt(Math.floor(Math.random() * input.length));
    }

    return randomChars.join("");
}
