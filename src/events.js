'use strict';

/**
 * This is not about javascript events! It's just
 * a definition of the events that the sequencer can handle plus
 * some functions to create valid events.
 * The class defines which subsystem is invoked to process the event.
 * Every class can have several types and a type consists of one or
 * more properties.
 */
var evProp = [
  'tone',       // Int between 0 and 127 beginning at c0
  'duration',   // Int representing a number of 64th notes
  'velocity',   // Int between 0 and 127
  'pitch',
  'volume',
  'pan'
];

var evType = {
  'note': [evProp.tone, evProp.duration, evProp.velocity],
  'control': [evProp.pitch, evProp.volume, evProp.pan]
};

var evClass = {
  'audio': [evType.note, evType.control],
  'synth': [],
  'fx': [],
  'midi': [],
  'osc': []
};

/**
 * Lists all valid sequencer event properties
 * @return {String} All valid event properties
 */
var listProps = function() {
  return evProp.toString();
};

/**
 * Lists all valid sequencer event types
 * @return {String} All valid event types
 */
var listTypes = function() {
  var keys = Object.keys(evType);
  return keys.toString();
};

/**
 * Lists all valid sequencer event classes
 * @return {String} All valid event classes
 */
var listClasses = function() {
  var keys = Object.keys(evClass);
  return keys.toString();
};

/**
 * Validates the class of a sequencer event
 * @private
 * @param  {String} eClass Event class
 * @return {Void}
 */
var validateClass = function(eClass) {
  if (!evClass.hasOwnProperty(eClass)) {
    throw new Error('Invalid class. Must be one of ' + listClasses());
  }
};

/**
 * Validates the type of a sequencer event
 * @private
 * @param  {String} eType Event type
 * @return {Void}
 */
var validateType = function(eType) {
  if (!evType.hasOwnProperty(eType)) {
    throw new Error('Invalid type. Must be one of ' + listTypes());
  }
};

/**
 * Validates if a tone or velocity value is
 * an integer between 0 and 127.
 * @param  {Int}  value   The number that represents a tone
 * @return {boolean}      True if its a valid tone, false if not
 */
var validatePropToneVelo = function(value) {
  if (!isNaN(value) && Number.isInteger(value) && value >= 0 && value <= 127) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates if a duration is a positive integer.
 * @param  {Int}  value   Number representing multiple 64th notes
 * @return {boolean}      True if its a valid duration, false if not
 */
var validatePropDuration = function(value) {
  if (!isNaN(value) && Number.isInteger(value) && value >= 0) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates an object of event properties.
 * It checks if the properties are valid,
 * for the given type and if the values are
 * valid for the given property.
 * @private
 * @param  {Object} eProps Object with event properties
 * @param  {String} eType  Event type to validate against
 * @return {Void}
 */
var validateProps = function(eProps, eType) {
  var type = evType.eType;
  for(var key in eProps)  {
    if (evProp.indexOf(key) >= 0 &&
    evType.hasOwnProperty(key)) {
      throw new Error('Invalid property. Must be one of ' + listProps());
    }
  };
};

/**
 * Creates a sequencer event.
 * @param  {String} eClass Event class
 * @param  {String} eType  Event type
 * @param  {Object} eProps Object with event properties
 * @return {Object}        Sequencer event
 */
var createEvent = function(eClass, eType, eProps) {
  validateClass(eClass);
  validateType(eType);
  validateProps(eProps);
  return {
    'class': eClass,
    'type': eType,
    'props': eProps
  };
};

/**
 * Creates an audio note event
 * @param  {Int} tone     Tone between 0 and 127
 * @param  {Int} velocity Velocity between 0 and 127
 * @param  {Int} duration Duration in 64th notes
 * @return {Object}       All properties in one object
 */
var createAudioNote = function(tone, velocity, duration) {
  var props = {};
  if (tone && validatePropToneVelo(tone)) {
    props.tone = tone;
  }
  if (velocity && validatePropToneVelo(velocity)) {
    props.velocity = velocity;
  }
  if (duration && validatePropDuration(duration)) {
    props.duration = duration;
  }
  return createEvent('audio', 'note', props);
};

module.exports = {
  class: evClass,
  type: evType,
  property: evProp,
  createAudioNote: createAudioNote
};
