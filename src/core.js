/**
 * This is the starting point of the library.
 * It spawns the audio context object and
 * connects it to the audio output.
 *
 * TODO: - Should we do backwards-compatibility for older api-versions?
 *       - Check for mobile/iOS compatibility.
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
  } else {
    //throw error, probably surround with try/catch
  }

  this.output = this.audioCtx.destination;
  console.log(this.output);

};

module.exports = Intermix;
