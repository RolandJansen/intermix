
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
