import Intermix from "../main";

beforeEach(() => {
    this.imx = new Intermix();
});

afterEach(() => {
    this.imx = null;
});

test("imx instance has an audioContext", () => {
    const ac = this.imx.audioContext;
    expect(ac).toBeInstanceOf(AudioContext);
});
