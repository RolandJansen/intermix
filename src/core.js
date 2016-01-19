/**
 * This is the starting point of the library.
 * It spawns the audio context object and
 * connects it to the audio output.
 */
'use strict';
var Intermix = function() {
  /**
   * create audio context
   */
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  this.audioCtx = null;
  this.output = null;

  if (AudioContext) {
    this.audioCtx = new AudioContext();
  }

  this.output = this.audioCtx.destination;

};

module.exports = Intermix;
