
export const getRandomString = (length: number): string => {
    const randomChars: string[] = [];
    const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
        randomChars[i] = input.charAt(Math.floor(Math.random() * input.length));
    }

    return randomChars.join("");
};
