import { IState, IntermixNote, IntermixCtrl, ISeqPartState } from "../interfaces/interfaces";
import { reducerLogic, InternalAction, OscArgSequence } from "../interfaces/IActions";
import { AnyAction } from "redux";

export const setStepActive: reducerLogic = (mySubState: IState, action: InternalAction): IState => {
    if (isSeqPartState(mySubState)) {
        const newSubState: IState = {};
        const step = action.payload as number;
        const maxStepValue = mySubState.pattern.length / mySubState.stepMultiplier - 1;
        if (step <= maxStepValue) {
            newSubState["activeStep"] = step;
        }
        return newSubState;
    }
    return mySubState;
};

export const addItem: reducerLogic = (mySubState: IState, action: InternalAction): IState => {
    if (isSeqPartState(mySubState)) {
        const newSubState: IState = {};
        let newItem: IntermixNote | IntermixCtrl;

        if (isIntermixNote(action.payload)) {
            newItem = action.payload as IntermixNote;
            newSubState.addNote = newItem;
        } else if (isIntermixCtrl(action.payload)) {
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
    }
    return mySubState;
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

export const removeItem: reducerLogic = (mySubState: IState, action: AnyAction | InternalAction): IState => {
    if (isSeqPartState(mySubState)) {
        const newSubState: IState = {};
        let item: IntermixNote | IntermixCtrl;

        if (isIntermixNote(action.payload)) {
            item = action.payload as IntermixNote;
            newSubState.removeNote = item;
        } else if (isIntermixCtrl(action.payload)) {
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
    }
    return mySubState;
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

// type guard for SeqPartState
const isSeqPartState = (item: IState): item is ISeqPartState => {
    const seqPartState = item as ISeqPartState;
    return seqPartState.stepMultiplier !== undefined && seqPartState.stepsPerBar !== undefined;
};

// type guard for intermixNote
const isIntermixNote = (item: any): item is IntermixNote => {
    return (item as IntermixNote)[0] === "note" && (item as IntermixNote).length === 5;
};

// type guard for intermixCtrl
const isIntermixCtrl = (item: any): item is IntermixCtrl => {
    return typeof (item as IntermixCtrl)[0] === "string" && (item as IntermixCtrl).length === 3;
};
