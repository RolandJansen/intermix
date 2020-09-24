import rootReducer from "./rootReducer";
import { createStore, Store, applyMiddleware } from "redux";
import preprocessOSC from "./preprocessOscMiddleware";

const store: Store = createStore(rootReducer, applyMiddleware(preprocessOSC));

export { store };
