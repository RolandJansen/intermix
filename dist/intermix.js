(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var Intermix = _dereq_('./core.js');
_dereq_('./SoundWave.js');

module.exports = Intermix;

},{"./SoundWave.js":2,"./core.js":3}],2:[function(_dereq_,module,exports){
'use strict';

var im = _dereq_('./core.js');

im.SoundWave = function(binaryData, collection) {

  this.bufferSource = null;

  if (binaryData) {
    //create an audio buffer with audioCtx.decodeAudioData
  } else {
    //throw error
  }

  if (collection) {
    //put buffer into soundbank
  }
  console.log('SoundWave');

  //todo:
  //put the buffer into a collection called soundbank
  //create methods to play, stop and loop the sound.
};

im.SoundWave.prototype.play = function(loop) {
  console.log(loop);
  //create audiobuffersource, attach to destination
  //when playing is stopped, destroy buffersource and routing
};

im.SoundWave.prototype.stop = function() {
  //stop playing the buffersource, destroy everything
};

module.exports = im.SoundWave;

},{"./core.js":3}],3:[function(_dereq_,module,exports){
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

},{}]},{},[1])(1)
});