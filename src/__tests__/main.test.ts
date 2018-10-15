import "web-audio-test-api";
import Intermix from "../main";
import { initialState } from "../store/initialState";

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
    expect(imx.store.getState()).toEqual(initialState);
});
