'use strict';

var core = require('./core.js');

var Sound = function(soundWave) {

  this.audioCtx = null;
  this.buffer = null;
  this.bufferSource = null;
  this.loop = false;
  this.gainNode = null;
  this.pannerNode = null;

  if (core.ac) {
    this.audioCtx = core.ac;
  }

  if (soundWave) {
    this.buffer = soundWave;
    this.setupAudioChain();
  } else {
    //TODO: throw error
    console.log('audiochain not ready');
  }
};

Sound.prototype.setupAudioChain = function() {
  this.gainNode = this.audioCtx.createGain();
  this.pannerNode = this.audioCtx.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(this.audioCtx.destination);
  this.gainNode.gain.value = 1;
  // test
  //
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
  }
  console.log('BufferSourceNode destroyed');
};

// Sound.prototype.resetBufferSource = function() {
//   this.destroyBufferSource();
//   this.createBufferSource();
// };

Sound.prototype.play = function(loop) {
  if (loop) {
    this.loop = loop;
  }
  this.createBufferSource();
  this.bufferSource.loop = this.loop;
  console.log(this.bufferSource);
  this.bufferSource.start();
  console.log('Sound started with loop = ' + loop);
};

Sound.prototype.stop = function() {
  if (this.bufferSource !== null) {
    this.bufferSource.stop();
    if (this.loop) {
      this.destroyBufferSource();
    }
  } else {
    //fail silently
  }
};

module.exports = Sound;
