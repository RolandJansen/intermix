import { Action } from "redux";

function reducer(state = {}, action: Action) {
    switch (action.type) {
        case "fantasyAction":
            return Object.assign({}, state);
        default: return state;
    }
}

export default reducer;
