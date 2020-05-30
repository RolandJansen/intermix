import { AnyAction, Reducer, ReducersMapObject } from "redux";
import { IAction, IState } from "./interfaces";

// tslint:disable:max-line-length
/**
 * This does basically the same like redux combineReducers
 * but also takes a pre-configured root reducer as second argument.
 * This is especially useful to handle utility actions (e.g. loading/loaded)
 * or operate on the root state (e.g. delete a sub-state tree).
 * Notice that the function doesn't support deep nesting of reducers
 * so you have to do this manually (if desired).
 *
 * This is based on a post by Chris Nitchie:
 * https://stackoverflow.com/questions/39261092/redux-create-root-reducer-from-combinereducers-and-loose-properties?answertab=active#tab-top
 */
// tslint:enable:max-line-length
export default (reducers: ReducersMapObject, rootReducer: Reducer) => {
    return (prevState: IState, action: AnyAction | IAction): IState => {
        // create an object that contains the
        // return value of the root reducer ...
        const nextState: IState = { ...rootReducer(prevState, action) };

        // ... then cycle through the other reducers
        // and add their return values to this object
        Object.keys(reducers).forEach((key) => {
            const ps = prevState ? prevState[key] : undefined;
            nextState[key] = reducers[key](ps, action);
        });
        return nextState;
    };
};
