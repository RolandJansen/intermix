import { IState, reducerLogic, IAction, OscArgSequence, IntermixNote, IntermixCtrl } from "../registry/interfaces";
import { AnyAction } from "redux";

export const setStepActive: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    const newSubState: IState = {};
    const step = action.payload as number;
    const maxStepValue = mySubState.pattern.length / mySubState.stepMultiplier - 1;
    if (step <= maxStepValue) {
        newSubState["activeStep"] = step;
    } else {
        throw new Error(`Position out of pattern bounds. Step is ${step} but should be within 0 and ${maxStepValue}`);
    }
    return newSubState;
};

export const addItem: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    const newSubState: IState = {};
    let newItem: IntermixNote | IntermixCtrl;

    if (itsANote(action.payload)) {
        newItem = action.payload as IntermixNote;
        newSubState.addNote = newItem;
    } else if (itsAController(action.payload)) {
        newItem = action.payload as IntermixCtrl;
        newSubState.addCtrl = newItem;
    } else {
        return newSubState;
    }

    const position = mySubState.activeStep * mySubState.stepMultiplier;
    const oldStep: OscArgSequence[] = mySubState.pattern[position];
    const newPatternStep = addItemToPatternStep(oldStep, newItem);

    const newPattern = Array.from(mySubState.pattern);
    newPattern[position] = newPatternStep;
    newSubState.pattern = newPattern;

    return newSubState;
};

/**
 * Selects the active step in the pattern, makes a deep copy
 * and inserts the new item. If an item of the same type is
 * already there, it will be overwritten with the new item.
 * @param mySubState the plugins sub-state
 * @param item a note or a controller (array of string and numbers)
 * @return A deep copy of the pattern step including the new item
 */
const addItemToPatternStep = (oldStep: OscArgSequence[], item: IntermixNote | IntermixCtrl): OscArgSequence[] => {
    const newStep: OscArgSequence[] = [];

    const itemCount = oldStep.length;
    if (itemCount === 0) {
        newStep.push(item);
    } else if (itemCount === 1) {
        if (itemsHaveSameValue(oldStep[0], item)) {
            newStep[0] = item;
        } else {
            newStep[0] = Array.from(oldStep[0]);
            newStep.push(item);
        }
    } else if (itemCount > 1) {
        oldStep.forEach((item, index) => {
            if (itemsHaveSameValue(oldStep[index], item)) {
                newStep[index] = item;
            } else {
                newStep[index] = Array.from(oldStep[index]);
                newStep.push(item);
            }
        });
    }

    return newStep;
};

export const removeItem: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    const newSubState: IState = {};

    let item: IntermixNote | IntermixCtrl;

    if (itsANote(action.payload)) {
        item = action.payload as IntermixNote;
        newSubState.removeNote = item;
    } else if (itsAController(action.payload)) {
        item = action.payload as IntermixCtrl;
        newSubState.removeCtrl = item;
    } else {
        return newSubState;
    }

    const position = mySubState.activeStep * mySubState.stepMultiplier;
    const oldStep: OscArgSequence[] = mySubState.pattern[position];
    const newStep: OscArgSequence[] = removeItemFromPatternStep(oldStep, item);

    const newPattern = Array.from(mySubState.pattern);
    newPattern[position] = newStep;
    newSubState.pattern = newPattern;

    return newSubState;
};

const removeItemFromPatternStep = (oldStep: OscArgSequence[], item: IntermixNote | IntermixCtrl): OscArgSequence[] => {
    const newStep: OscArgSequence[] = [];

    const itemCount = oldStep.length;
    if (itemCount === 1) {
        if (itemsHaveSameValue(oldStep[0], item)) {
            return newStep;
        }
    } else if (itemCount > 1) {
        oldStep.forEach((item, index) => {
            if (!itemsHaveSameValue(oldStep[index], item)) {
                newStep[index] = Array.from(oldStep[index]);
            }
        });
    }

    return newStep;
};

const itemsHaveSameValue = (itemOne: OscArgSequence, itemTwo: OscArgSequence): boolean => {
    return itemOne[0] === itemTwo[0] && itemOne[1] === itemTwo[1] ? true : false;
};

// type guard for intermixNote
const itsANote = (item: any): item is IntermixNote => {
    return (item as IntermixNote)[0] === "note" && (item as IntermixNote).length === 5;
};

// type guard for intermixCtrl
const itsAController = (item: any): item is IntermixCtrl => {
    return typeof (item as IntermixCtrl)[0] === "string" && (item as IntermixCtrl).length === 3;
};
