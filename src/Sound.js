'use strict';

var Sound = function(audioCtx, soundBuffer) {

  this.audioCtx = null;
  this.buffer = null;
  this.bufferSource = null;
  this.loop = false;
  this.isPaused = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.startOffset = 0;
  this.startTime = 0;

  if (soundBuffer && audioCtx) {
    this.audioCtx = audioCtx;
    this.buffer = soundBuffer;
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
  console.log('buffer is: ' + this.buffer);
  this.bufferSource = this.audioCtx.createBufferSource();
  this.bufferSource.buffer = this.buffer;
  this.bufferSource.connect(this.gainNode);
  this.bufferSource.onended = function() {
    self.destroyBufferSource();
    console.log('onended fired');
  };
};

Sound.prototype.destroyBufferSource = function() {
  if (this.bufferSource !== null) {
    this.bufferSource.disconnect();
    this.bufferSource = null;
    console.log('BufferSourceNode destroyed');
  }
};

Sound.prototype.play = function(loop) {
  if (typeof loop !== 'undefined') {
    this.loop = loop;
  }
  this.createBufferSource();
  this.bufferSource.loop = this.loop;

  if (this.startOffset === 0 || this.startOffset >= this.buffer.duration) {
    console.log('resetting starttime');
    this.startTime = this.audioCtx.currentTime;
  }

  this.bufferSource.start(this.startTime, this.startOffset);
  this.startOffset = 0;
};

Sound.prototype.stop = function(paused) {
  if (paused) {
    this.startOffset = this.audioCtx.currentTime - this.startTime;
    this.paused = false;
  } else {
    this.startOffset = 0;
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

module.exports = Sound;
