'use strict';

/**
 * This class provides some functions that makes
 * working with Intermix even more easier.
 * @return {Object}      An instance(!) of the Helper class
 * @example <caption>Create a note event. Uid is the unique id of the
 * event receiver.</caption>
 * var noteEvent = intermix.helper.createNoteEvent(<uid>, 'c3', 0.5);
 * @example <caption>Get the frequency of a note</caption>
 * var frequencyOfGis4 = intermix.helper.getNoteFrequency('g#4');
 */
var Helper = function() {

  this.frequencyLookup = this.getNoteFrequencies();

};

/**
 * Computes the frequencies of all midi notes and returns
 * them as an array.
 * @private
 * @return {Array} Frequency table
 */
Helper.prototype.getNoteFrequencies = function() {
  var frequencies = new Array(128);
  var a4 = 440, posA4 = 69;
  for (var i = 0; i < 128; i++) {
    frequencies[i] = a4 * Math.pow(2, ((i - posA4) / 12));
  }
  return frequencies;
};

/**
 * Creates an event of type "note".
 * @param  {String}      uid      Unique ID of the event receiver
 * @param  {String|Int}  note     Note (like "c3", "a#5") or midi note number
 * @param  {Float}       velocity Like Midi velocity but high res float of range [0, 1]
 * @return {Object}               A note event
 */
Helper.prototype.createNoteEvent = function(uid, tone, velocity) {
  var noteNum, evt;

  if (typeof tone === 'number') {
    noteNum = tone;
  } else {
    noteNum = this.getNoteNumber(tone);
  }

  evt = {
    uid: uid,
    msg: {
      type: 'note',
      value: noteNum,
      velocity: velocity
    }
  };

  if (this.validateEvent(evt)) {
    if (typeof velocity !== 'number') {
      throw new TypeError('Velocity not of type number.');
    }
    if (velocity < 0 || velocity > 1) {
      throw new Error('Velocity out of bounds: ' + velocity);
    }
    return evt;
  } else {
    throw new TypeError('Unexpected type of "uid" or "note".');
  }

};

/**
 * Creates an event of type "volume".
 * @param  {String} uid    Unique ID of the event receiver.
 * @param  {Int}    volume Like Midi Volume (Integer of range [0, 127])
 * @return {Object}        A volume event
 */
Helper.prototype.createVolumeEvent = function(uid, volume) {
  var evt = {
    uid: uid,
    msg: {
      type: 'volume',
      value: volume
    }
  };
  if (this.validateEvent(evt)) {
    if (typeof volume !== 'number') {
      throw new TypeError('Volume is not a number: ' + volume);
    }
    if (volume < 0 || volume > 127) {
      throw new Error('Volume out of bounds: ' + volume);
    }
    return evt;
  } else {
    throw new TypeError('Unexpected type of "uid" or "volume"');
  }
};

/**
 * Validate the datastructure of an event.
 * @param  {Object}  evt An intermix event
 * @return {Boolean}     True if event is valid, false if not.
 */
Helper.prototype.validateEvent = function(evt) {
  if (typeof evt.uid === 'string' &&
  this.isPlainObject(evt.msg) &&
  typeof evt.msg.type === 'string' &&
  typeof evt.msg.value !== 'undefined') {
    return true;
  } else {
    return false;
  }
};

/**
 * Returns the frequency of a note.
 * @param  {String|Int} note Note (like "c3", "a#5") or midi note number
 * @return {Float}           Frequency
 */
Helper.prototype.getNoteFrequency = function(note) {
  var noteNum;
  if (typeof note === 'number') {
    noteNum = note;
  } else {
    noteNum = this.getNoteNumber(note);
  }
  return this.frequencyLookup[noteNum];
};

/**
 * Takes a string of the form c3 or d#4 and
 * returns the corresponding number. Upper classes
 * strings are allowed and "h" will be converted to "b".
 * @param  {String} tone String representing a note
 * @return {Int}         Number representing a note
 */
Helper.prototype.getNoteNumber = function(tone) {
  var notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  var str = tone.toLowerCase();

  if (str.match(/^[a-h]#?[0-9]$/)) {
    var note = str.substring(0, str.length - 1);
    var oct = parseInt(str.slice(-1));

    if (note === 'h') {
      note = 'b';
    }
    return notes.indexOf(note) + (oct + 1) * 12;  // +1: because 1st midi octave is -1
  } else {
    throw new Error('Unvalid string. Has to be like [a-h]<#>[0-9]');
  }
};

/**
 * Tests if an object is a plain javascript object (object literal)
 * and not a constructor, instance, null or anything else.
 * as suggested by RobG:
 * http://stackoverflow.com/questions/5876332/how-can-i-differentiate-between-an-object-literal-other-javascript-objects
 * @param  {Object} obj Any javascript object
 * @return {Boolean}    True if plain js object, false if not
 */
Helper.prototype.isPlainObject = function(obj) {
  if (typeof obj === 'object' && obj !== null) {
    var proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }
  return false;
};

module.exports = new Helper();
