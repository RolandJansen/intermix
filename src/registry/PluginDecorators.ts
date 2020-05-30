import { bindActionCreators } from "redux";
import { store } from "../store/store";
import { IAction, IActionDef } from "./interfaces";

/**
 * The whole file is obsolete. It's still here to demonstrate
 * how decorators work. Could be handy in the near future.
 */

/**
 * Obsolete
 * @param target
 * @param propertyKey
 */
export function makePluginId(target: any, propertyKey: string | symbol): void {
    const pluginId = target.name + target.version + target.author;
    Object.defineProperty(target, propertyKey, btoa(pluginId));
}

/**
 * Obsolete
 * @param actionDefs
 */
export function makeActionCreators(actionDefs: IActionDef[]) {
    return (target: any, propertyKey: string | symbol) => {
        const actionCreators = {};

        actionDefs.forEach((actionDef) => {
            const min = actionDef.minVal;
            const max = actionDef.maxVal;

            actionCreators[actionDef.type] = (payload: number): IAction => {
                const action: IAction = {
                    type: actionDef.type,
                    payload,
                };

                if (payload >= min && payload <= max) {
                    return action;
                }
                action.error = new RangeError(`payload ${payload} out of bounds.
                    Must be within ${min} and ${max}`);

                return action;
            };
        });

        // replace property with actionCreators
        Object.defineProperty(target, propertyKey, actionCreators);
    };
}

/**
 * Obsolete
 * @param target Class object
 * @param propertyKey class property to be transformed
 */
export function connectActionCreators(target: any, propertyKey: string | symbol): void {
    const actionCreators = target.propertyKey;
    const boundActionCreators = {};
    let ac: string;

    for (ac in actionCreators) {
        if (actionCreators.hasOwnProperty(ac)) {
            boundActionCreators[ac] = bindActionCreators(actionCreators.ac, store.dispatch);
        }
    }

    Object.defineProperty(target, propertyKey, boundActionCreators);
}
