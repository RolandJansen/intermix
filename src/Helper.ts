import { IEventMessage, IIntermixEvent } from "./IHelper";
/**
 * This class provides functions that makes
 * working with Intermix easier.
 * @example <caption>Create a note event. Uid is the unique id of the
 * event receiver.</caption>
 * var noteEvent = helper.createNoteEvent(<uid>, 'c3', 0.5);
 * @example <caption>Get the frequency of a note</caption>
 * var frequencyOfGis4 = helper.getNoteFrequency('g#4');
 */
export default class Helper {
  private frequencyLookup: number[];

  constructor() {
    this.frequencyLookup = this.getNoteFrequencies();
  }

  /**
   * Creates an event of any type.
   * @param uid     Unique ID of the event receiver
   * @param type    Event type (note, volume, etc)
   * @param payload value of the event
   * @return        An intermix event object (not a js event)
   */
  public getGenericEvent(uid: string,
                         type: string,
                         payload: IEventMessage): IIntermixEvent {
    return {
      uid,
      type,
      timestamp: Date.now(),
      payload,
    };
  }

  /**
   * Creates an event of type "note".
   * @param  uid      Unique ID of the event receiver
   * @param  note     Note (like "c3", "a#5") or midi note number
   * @param  velocity Like Midi velocity but high res float of range [0, 1]
   * @param  steps    Length of a tone in 64th note steps
   * @return          A note event
   */
  public createNoteEvent(uid: string,
                         tone: number | string,
                         velocity: number,
                         steps: number): IIntermixEvent {
    if (typeof tone === "string") {
      tone = this.getNoteNumber(tone);
    }
    if (velocity < 0 || velocity > 1) {
      throw new Error("Velocity out of bounds: " + velocity);
    }

    return {
      uid,
      type: "note",
      timestamp: Date.now(),
      payload: {
        value: tone,
        velocity,
        steps,
      },
    };
  }

  /**
   * Creates an event of type "volume".
   * @param  uid    Unique ID of the event receiver.
   * @param  volume Like Midi Volume (Integer of range [0, 127])
   * @return        A volume event
   */
  public createVolumeEvent(uid: string, volume: number): IIntermixEvent {
    if (volume < 0 || volume > 127) {
      throw new Error("Volume out of bounds: " + volume);
    }

    return {
      uid,
      type: "volumeChange",
      timestamp: Date.now(),
      payload: {
        value: volume,
      },
    };
  }

  /**
   * Returns the frequency of a note.
   * @param  note Note (like "c3", "a#5") or midi note number
   * @return      Frequency
   */
  public getNoteFrequency(note: number|string): number {
    if (typeof note === "string") {
      note = this.getNoteNumber(note);
    }
    return this.frequencyLookup[note];
  }

  /**
   * Computes the frequencies of all midi notes and returns
   * them as an array.
   * @private
   * @return    Frequency table
   */
  private getNoteFrequencies(): number[] {
    const frequencies = new Array(128);
    const a4 = 440;
    const posa4 = 69;
    for (let i = 0; i < 128; i++) {
      frequencies[i] = a4 * Math.pow(2, ((i - posa4) / 12));
    }
    return frequencies;
  }

  /**
   * Takes a string of the form c3 or d#4 and
   * returns the corresponding number. Upper classes
   * strings are allowed and "h" will be converted to "b".
   * @param  tone String representing a note
   * @return      Number representing a note
   */
  private getNoteNumber(tone: string): number {
    const notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
    const str = tone.toLowerCase();

    if (str.match(/^[a-h]#?[0-9]$/)) {
      let note = str.substring(0, str.length - 1);
      const oct = parseInt(str.slice(-1), 10);

      if (note === "h") {
        note = "b";
      }
      return notes.indexOf(note) + (oct + 1) * 12;  // +1: because 1st midi octave is -1
    } else {
      throw new Error("Unvalid string. Has to be like [a-h]<#>[0-9]");
    }
  }

}

/**
 * Tests if an object is a plain javascript object (object literal)
 * and not a constructor, instance, null or anything else.
 * as suggested by RobG:
 * http://stackoverflow.com/questions/5876332/how-can-i-differentiate-between-an-object-literal-other-javascript-objects
 * @param  {Object} obj Any javascript object
 * @return {Boolean}    True if plain js object, false if not
 */
// Helper.prototype.isPlainObject = function(obj) {
//   if (typeof obj === "object" && obj !== null) {
//     var proto = Object.getPrototypeOf(obj);
//     return proto === Object.prototype || proto === null;
//   }
//   return false;
// };

// module.exports = new Helper();
