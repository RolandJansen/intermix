import { AnyAction, Middleware } from "redux";
import { IOscAction, IOscBundleAction } from "../interfaces/IActions";

/**
 * We don't want to preprocess OSC actions in every
 * single reducer so we do it with middleware
 */
const preprocessOSC: Middleware = () => (next) => (action: AnyAction): AnyAction => {
    let toBeDispatched: AnyAction = action;

    if (itsAnOscAction(action)) {
        const address: string[] = action.address.split("/");

        if (address[1] === "intermix") {
            // const type = address[4]; // there could be an explicit value type action.valueName
            toBeDispatched = {
                type: action.type,
                listenerType: address[2],
                listener: address[3],
                payload: action.payload,
            };
        }
    } else if (itsAnOscBundleAction(action)) {
        // we send the whole package to the listener
        // and let it decides what to do.
        // In the store we just set "bundle" to the new timetag.
        const address: string[] = action.elements[0].address.split("/");
        if (address[1] === "intermix") {
            toBeDispatched = {
                type: "BUNDLE",
                listenerType: address[2],
                listener: address[3],
                payload: action.timetag,
                additional: action.elements,
            };
        }
    }

    return next(toBeDispatched);
};

// type guard for IOscAction
const itsAnOscAction = (action: AnyAction): action is IOscAction => {
    return (action as IOscAction).address !== undefined;
};

// type guard for IOscBundleAction
const itsAnOscBundleAction = (action: AnyAction): action is IOscBundleAction => {
    return (action as IOscBundleAction).timetag !== undefined;
};

export default preprocessOSC;
