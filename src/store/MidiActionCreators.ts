import * as mat from "./midiActionTypes";

/**
 * These functions represents the midi standard.
 * They don't care about implementation details like MSB/LSB.
 */

export function midiBankSelect(bank: number) {
    return getMidiAction(mat.MIDI_BANK_SELECT, bank);
}

export function midiModulation(modulation: number) {
    return getMidiAction(mat.MIDI_MODULATION, modulation);
}

export function midiBreathController(modulation: number) {
    return getMidiAction(mat.MIDI_BREATH_CONTROLLER, modulation);
}

export function midiFootController(modulation: number) {
    return getMidiAction(mat.MIDI_FOOT_CONTROLLER, modulation);
}

export function midiPortamentoTime(time: number) {
    return getMidiAction(mat.MIDI_PORTAMENTO_TIME, time);
}

function getMidiAction(type: string, value: number, error = false) {
    let payload: number | RangeError;

    if (value < 0 || value > 127) {
        error = true;
        payload = new RangeError("The argument must be between 0 and 127.");
    } else {
        payload = value;
    }

    return {
        type,
        payload,
        error,
    };
}
