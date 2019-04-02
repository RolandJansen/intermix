import { IAction } from "../../registry/interfaces";

type Pattern = IAction[][];

/**
 * Represents a part of a sequence. It can be
 * used in many ways:
 * <ul>
 * <li>A part of a track like in piano-roll sequencers</li>
 * <li>A pattern like in step sequencers, drum computers and trackers</li>
 * <li>A loop like in live sequencers</li>
 * </ul>
 * Technically it can store any type of event your system is capable of.
 * This means it is not limited to audio, midi, osc or dmx but can hold
 * any type of javascript object. A possible usecase would be to trigger
 * screen events with the draw function of the sequencer object.
 * @example
 * var sound = new intermix.Sound(soundWaveObject);
 * var seq = new intermix.Sequencer();
 * var part = new intermix.Part();
 * var note = intermix.events.createAudioNote('a3', 1, 0, sound);
 * part.addEvent(note, 0);
 * part.addEvent(note, 4);
 * seq.addPart(part, 0);
 * @constructor
 * @param  pLength       Length of the part in 64th notes (default: 64)
 */
export default class SeqPart {

    public static stepsPerBarDefault = 16; // global pattern resolution: 1bar = 1 full note
    public name = "Part";
    private stepMultiplier: number; // 64 = stepsPerBar * stepMultiplier
    private pattern: Pattern;       // holds the sequence data

    /**
     * Initializes the pattern
     * @param length      length in stepsPerBar (if sPB=16: 16=1bar; 8=1/2bar)
     * @param stepsPerBar pattern resolution: 1bar = 1 full note
     */
    constructor(length: number, public stepsPerBar = SeqPart.stepsPerBarDefault) {
        if ((64 % stepsPerBar) === 0) {
            this.stepMultiplier = 64 / stepsPerBar;
            this.pattern = this.initPattern(length);
        } else {
            throw new Error("stepsPerBar must be a divisor of 64.");
        }
    }

    /**
     * Adds an event to the pattern at a given position
     * @param  action  The event (note, controller, whatever)
     * @param  position  Position in the pattern
     * @return The part object to make the function chainable.
     */
    public addAction(action: IAction, position: number): SeqPart {
        if (position <= this.pattern.length) {
            const pos = position * this.stepMultiplier;
            this.pattern[pos].push(action);
        } else {
            throw new Error("Position out of pattern bounds.");
        }
        return this;
    }

    /**
     * Removes an event at a given position
     * @param  action  The event (note, controller, whatever)
     * @param  position  Position in the pattern
     * @return The part object to make the function chainable
     */
    public removeAction(action: IAction, position: number): SeqPart {
        const pos = (position) * this.stepMultiplier;
        const index = this.pattern[pos].indexOf(action);
        if (index >= 0) {
            this.pattern[pos].splice(index, 1);
        }
        return this;
    }

    /**
     * Get all positions that contain at least one event.
     * Can be handy to draw events on the screen.
     * @example <caption>from {@tutorial Stepsequencer}</caption>
     * bdSteps = bdPart.getNotePositions();
     * bdSteps.forEach(function(pos) {
     *   document.getElementById('bd' + pos).style.backgroundColor = 'red';
     * });
     * @return List with all non-empty pattern entries
     */
    public getNotePositions() {
        // Sollte für jede Note ein Array oder Objekt zurückgeben (note, position, länge)
        const positions: number[] = [];
        this.pattern.forEach((actions, index) => {
            if (actions.length > 0) {
                actions.forEach((action) => {
                    if (action.type === "NOTE") {
                        positions.push(index / this.stepMultiplier);
                    }
                });
            }
        });
        return positions;
    }

    /**
     * Get the length of the pattern in 64th notes
     * @return Length of the pattern
     */
    public getLength(): number {
        return this.pattern.length;
    }

    /**
     * Extends a part at the top/start.
     * @param  extLength Length in stepsPerBar
     */
    public extendOnTop(extLength: number) {
        const extension = this.initPattern(extLength);
        this.pattern = extension.concat(this.pattern);
    }

    /**
     * Extends a part at the end
     * @param  extLength Length in stepsPerBar
     */
    public extendOnEnd(extLength: number) {
        const extension = this.initPattern(extLength);
        this.pattern = this.pattern.concat(extension);
    }

    /**
     * Initialize an empty pattern for the part.
     * @param  lengthInStepsPerBar  Length of the pattern
     * @return An empty pattern
     */
    private initPattern(lengthInStepsPerBar: number): Pattern {
        const pattern: Pattern = [];
        const patternLength = lengthInStepsPerBar * this.stepMultiplier;
        for (let i = 0; i < patternLength; i++) {
            pattern[i] = [];
        }
        return pattern;
    }

    /**
     * Removes all events at a given position
     * @param  position Position in the pattern
     * @return The part object to make the function chainable
     */
    // private removeEvents(position) {
    //     const pos = (position) * this._multiply;
    //     this.pattern[pos] = [];
    //     return this;
    // }

}
