/**
 *
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
