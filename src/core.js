/**
 * This is the starting point of the library.
 * It spawns the audio context object and
 * connects it to the audio output.
 */

var intermix = function() {
  /**
   * create audio context
   */
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  this.audioCtx = null;
  this.output = null;

  if(AudioContext) {
    this.audioCtx = new AudioContext();
  }

  this.output = audioCtx.destination;

};

module.exports = intermix;
