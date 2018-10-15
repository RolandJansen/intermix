import "web-audio-test-api";
import Intermix from "../main";

let imx: Intermix;

beforeEach(() => {
    imx = new Intermix();
});

afterEach(() => {
    // imx = null;
});

test("Intermix instance initializes the audioContext", () => {
    expect(imx.audioContext).toBeInstanceOf(AudioContext);
});

test("Intermix instance creates a store object", () => {
    const storeType = typeof imx.store;
    console.log(imx.store);
    expect(storeType).toBe("object");
    // expect(imx.store.getState().controllers).toBeDefined();
});
