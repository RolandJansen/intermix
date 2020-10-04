import { AnyAction, Reducer } from "redux";
import combineReducersWithRoot from "../combineReducersWithRoot";
import { IState } from "../../interfaces/interfaces";

// test-reducers are also from the posting by Chris Nitchi
// see combineReducersWithRoot.ts

const testState = {
    loading: false,
    loaded: false,
    data: {
        filter: "",
        arr: [],
    },
};

function rootReducer(state = { loading: false, loaded: false }, action: AnyAction): IState {
    switch (action.type) {
        case "STARTED_LOADING":
            return { ...state, loading: true, loaded: false };
        case "FINISHED_LOADING":
            return { ...state, loading: false, loaded: true };
        default:
            return state;
    }
}

function dataReducer(state = { filter: "", arr: [] }, action: AnyAction): IState {
    switch (action.type) {
        case "SET_FILTER":
            return { ...state, filter: action.value };
        case "SET_DATA":
            return { ...state, arr: action.arr };
        default:
            return state;
    }
}

describe("combineReducersWithRoot", () => {
    let reducer: Reducer;

    beforeEach(() => {
        reducer = combineReducersWithRoot({ data: dataReducer }, rootReducer);
    });

    test("returns a root reducer", () => {
        expect(typeof reducer).toBe("function");
    });

    describe("the root reducer", () => {
        test("builds the initial state if the given state is undefined", () => {
            const state = reducer(undefined, { type: "init" });
            expect(state).toEqual(testState);
        });

        test("returns a new state object", () => {
            const state = reducer(undefined, { type: "init" });
            expect(state).toEqual(testState);
            expect(state).not.toBe(testState);
        });

        test("can operate on the root state", () => {
            const state = reducer(testState, { type: "STARTED_LOADING" });
            expect(state.loading).toBeTruthy();
            expect(testState.loading).toBeFalsy();
        });

        test("can operate on a sub state", () => {
            const state = reducer(testState, { type: "SET_FILTER", value: "hidden" });
            expect(state.data.filter).toBe("hidden");
            expect(testState.data.filter).toBe("");
        });
    });
});
