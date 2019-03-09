import "web-audio-test-api";
import TestPlugin from "../../plugins/TestPlugin";
import { store } from "../../store/store";
import { IPlugin, IState } from "../interfaces";
import Registry from "../Registry";

// instruct Jest to use the
// mock class instead of the real one
jest.mock("../../store/store");

let registry: Registry;
let globalState: IState;
const ac = new AudioContext();
const tempPlugin = new TestPlugin(ac);

beforeEach(() => {
    globalState = {};

    // doesn't attach reducers but builds the plugin state
    // and mounts it to the global state.
    (store.attachReducers as jest.Mock).mockImplementation((reducers) => {
        const pluginState: IState = {};
        const uid = Object.keys(reducers)[0];
        tempPlugin.actionDefs.forEach((aDef) => {
            pluginState[aDef.type] = aDef.defVal;
        });

        globalState[uid] = pluginState;
    });

    (store.getState as jest.Mock).mockReturnValue(globalState);

    registry = new Registry(ac);
});

describe("registerPlugin", () => {

    let plug: IPlugin;

    beforeEach(() => {
        registry.registerPlugin(TestPlugin);
        plug = registry.pluginStore[0];
    });

    test("dumps a plugin instance to the pluginStore", () => {
        // this is pretty obvious but anyway...
        expect(registry.pluginStore.length).toEqual(1);
    });

    test("Adds action creator functions to the plugin instance", () => {
        const acKeys = Object.keys(plug.actionCreators);
        expect(acKeys.length).toBe(2);
        expect(acKeys).toContain("ACTION1");
        expect(acKeys).toContain("ACTION2");
    });

    test("Action creators are bound to dispatch", () => {
        plug.actionCreators.ACTION1(15);
        expect((store.dispatch as jest.Mock)).toBeCalled();
    });

    test("Attaches reducers to the store", () => {
        expect(store.attachReducers).toHaveBeenCalled();
    });

});
