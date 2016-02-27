/**
 * Part.js
 */
'use strict';

var Part = function(audioCtx, instrument, length) {
  this.audioCtx;
  this.instrument;
  this.resolution = 16;
  this.multiply = 4;
  this.length = 1;      //1 = one bar (4 beats)
  this.name = 'Part';
  this.data;
  this.pattern = [];
  this.monophonic = false; //probably futile
  this.zeroPoint = 0;

  if (audioCtx && instrument) {
    this.audioCtx = audioCtx;
    this.instrument = instrument;
    this.initPart();
  } else {
    throw new Error('Failed to initialize part. AudioCtx and/or instrument missing.');
  }

  if (length) {
    this.length = length;
  }

};

Part.prototype.initPart = function() {
  this.pattern = this.initPattern(this.length);
  //do we really need this? And, if yes, why?
  this.data = {
    'name': this.name,
    'instrument': this.instrument,
    'resolution': this.resolution,
    'pattern': this.pattern
  };
};

/**
 * initPattern: Initialize an empty pattern in this part
 * @param  {Float}  length  Length of the pattern mesured in bars
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.initPattern = function(length) {
  var pattern = [];
  for (var i = 0; i < (length * 64); i++) {
    pattern[i] = [];
  }
  return pattern;
};

/**
 * addEvent: adds an event to the pattern at a given position
 * @param  {Object} seqEvent  The event (note or controller)
 * @param  {Int}    position  Position in the pattern
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.addEvent = function(seqEvent, position) {
  if (position <= this.resolution) {
    var pos = (position - 1) * this.multiply;
    this.pattern[pos].push(seqEvent);
  }
  return this;
};

Part.prototype.removeEvent = function(position) {
  //removes all entries at a specific position.
  //this is not exactly what it should do.
  var pos = position * this.multiply;
  this.pattern[pos] = [];
};

/**
 * clearPattern: Delete all events in this part
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.clearPattern = function() {
  this.pattern = [];
  return this;
};

Part.prototype.getLength = function() {
  return this.pattern.length;
};

Part.prototype.getNotePositions = function() {
  var positions = [];
  this.pattern.forEach(function(el, index) {
    if (el.length > 0) {
      positions.push(index / this.multiply);
    }
  }, this);
  return positions;
};

Part.prototype.extendOnStart = function(pattern, extLength) {
  var entries = extLength * 64;
  var extension = this.initPattern(entries);
  return pattern.push.apply(extension, pattern);
};

Part.prototype.extendOnEnd = function(pattern, extLength) {
  var entries = extLength * 64;
  var extension = this.initPattern(entries);
  return pattern.push.apply(pattern, extension);
};

module.exports = Part;
