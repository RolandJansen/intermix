import { Action, createStore, Store } from "redux";

/**
 * The main reducer that's called by the store every time an action
 * gets dispatched. By default it just returns an empty state object
 * but will be hydrated with higher-order reducers at runtime as plugins
 * get loaded.
 * @param state The state object. If undefined, an empty object will be assigned
 * @param action An action object that alters the state
 */
export function rootReducer(state = {}, action: Action) {
    return state;
}

/**
 * There is no initial state because the only object known
 * to intermix are plugin classes and instances that are
 * not present at startup.
 */
export const store: Store = createStore(rootReducer);
