(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//Intermix = require('./core.js');
var Intermix = _dereq_('./core.js') || {};
Intermix.SoundWave = _dereq_('./SoundWave.js');
Intermix.Sound = _dereq_('./Sound.js');

module.exports = Intermix;

},{"./Sound.js":2,"./SoundWave.js":3,"./core.js":4}],2:[function(_dereq_,module,exports){
'use strict';

var Sound = function(audioCtx, soundBuffer) {

  this.audioCtx = null;
  this.buffer = null;
  this.bufferSource = null;
  this.loop = false;
  this.isPaused = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.soundLength = 0;
  this.startOffset = 0;
  this.startTime = 0;
  this.loopStart = 0;
  this.loopEnd = null;

  if (soundBuffer && audioCtx) {
    this.audioCtx = audioCtx;
    this.buffer = soundBuffer;
    this.soundLength = this.loopEnd = soundBuffer.duration;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

Sound.prototype.setupAudioChain = function() {
  this.gainNode = this.audioCtx.createGain();
  this.pannerNode = this.audioCtx.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(this.audioCtx.destination);
  this.gainNode.gain.value = 1;
  console.log('audiochain ready');
};

Sound.prototype.createBufferSource = function() {
  var self = this;
  this.bufferSource = this.audioCtx.createBufferSource();
  this.bufferSource.buffer = this.buffer;
  this.bufferSource.connect(this.gainNode);
  this.bufferSource.onended = function() {
    console.log('onended fired');
    self.destroyBufferSource();
  };
};

Sound.prototype.destroyBufferSource = function() {
  if (this.bufferSource !== null) {
    this.bufferSource.disconnect();
    this.bufferSource = null;
    console.log('BufferSourceNode destroyed');
  }
};

Sound.prototype.play = function(loop, time) {
  if (typeof loop !== 'undefined') {
    this.loop = loop;
  }

  if (time) {
    console.log('set time: ' + time);
    this.startTime = time;
  } else {
    this.startTime = this.audioCtx.currentTime;
  }

  this.createBufferSource();
  this.bufferSource.loop = this.loop;

  if (this.loop) {
    this.bufferSource.loopStart = this.loopStart;
    this.bufferSource.loopEnd = this.loopEnd;
  }

  // if (this.startOffset === 0 || this.startOffset >= this.buffer.duration) {
  //   console.log('resetting starttime');
  //   this.startTime = this.audioCtx.currentTime;
  // }

  this.bufferSource.start(this.startTime, this.startOffset);
  this.startOffset = 0;
};

Sound.prototype.stop = function(paused) {
  if (paused) {
    this.startOffset = this.audioCtx.currentTime - this.startTime;
    this.paused = false;
  }
  if (this.bufferSource !== null) {
    this.bufferSource.stop();
  } else {
    //fail silently
  }
};

Sound.prototype.pause = function() {
  this.isPaused = true;
  this.stop(this.isPaused);
};

Sound.prototype.setLoopStart = function(value) {
  this.loopStart = value * this.soundLength;
  this.bufferSource.loopStart = this.loopStart;
};

Sound.prototype.setLoopEnd = function(value) {
  this.loopEnd = value * this.soundLength;
  this.bufferSource.loopEnd = this.loopEnd;
};

Sound.prototype.resetLoop = function() {
  this.loopStart = 0;
  this.loopEnd = this.soundLength;
};

Sound.prototype.setFrequency = function(freq) {
  this.bufferSource.playbackRate.value = freq;
};

Sound.prototype.getFrequency = function() {
  return this.bufferSource.playbackRate.value;
};

Sound.prototype.setTone = function(semiTone) {
  this.bufferSource.detune.value = semiTone * 100;
};

Sound.prototype.getTone = function() {
  return this.bufferSource.detune.value;
};

Sound.prototype.getUID = function() {
  return Math.random().toString().substr(2, 8);
};

module.exports = Sound;

},{}],3:[function(_dereq_,module,exports){
'use strict';

var SoundWave = function(audioCtx, binaryData, collection) {

  this.audioCtx = null;
  this.buffer = null;


  if (audioCtx) {
    this.audioCtx = audioCtx;
  } else {
    console.log('No AudioContext found');
  }

  var self = this;

  if (binaryData) {
    this.audioCtx.decodeAudioData(binaryData).then(function(decoded) {
      self.buffer = decoded;
      console.log('buffer created');
    });
  } else {
    //TODO: throw error
  }

  if (collection) {
    //TODO: put buffer into soundbank
  }

};

module.exports = SoundWave;

},{}],4:[function(_dereq_,module,exports){
/**
 * This simply creates the audio context objects
 * and exports it.
 *
 * TODO: - Should we do backwards-compatibility for older api-versions?
 *       - Check for mobile/iOS compatibility.
 *       - Check if we're running on node (and throw an error if so)
 */
'use strict';

var audioCtx = null;

(function() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if (window.AudioContext) {
    audioCtx = new window.AudioContext();
  } else {
    //TODO: throw error, probably surround with try/catch
  }

})();

module.exports = {
  audioCtx: audioCtx
};

},{}]},{},[1])(1)
});