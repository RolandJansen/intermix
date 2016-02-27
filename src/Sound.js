'use strict';

var Sound = function(audioCtx, soundBuffer) {

  this.audioCtx = null;
  this.buffer = null;
  this.queue = [];          //all currently active streams
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
  var bufferSource = this.audioCtx.createBufferSource();
  bufferSource.buffer = this.buffer;
  bufferSource.connect(this.gainNode);
  bufferSource.onended = function() {
    console.log('onended fired');
    self.destroyBufferSource(bufferSource);
  };
  return bufferSource;
};

Sound.prototype.destroyBufferSource = function(bsNode) {
  var self = this;
  bsNode.disconnect();
  this.queue.forEach(function(node, index) {
    if (node === bsNode) {
      self.queue.splice(index, 1);
    }
  });
  bsNode = null; //probably futile
  console.log('BufferSourceNode destroyed');
};

Sound.prototype.play = function(delay, playLooped) {
  var startTime = 0;

  if (delay) {
    console.log('set start time: ' + delay);
    startTime = delay;
  } else {
    startTime = this.audioCtx.currentTime;
  }
  var bs = this.createBufferSource();
  bs.loop = playLooped;

  // if (playLooped) {
  //   bs.loopStart = this.loopStart;
  //   bs.loopEnd = this.loopEnd;
  // }

  // if (this.startOffset === 0 || this.startOffset >= this.buffer.duration) {
  //   console.log('resetting starttime');
  //   this.startTime = this.audioCtx.currentTime;
  // }
  this.queue.push(bs);
  //bs.start(startTime, this.startOffset);
  bs.start(startTime);

  this.startOffset = 0;
};

Sound.prototype.stop = function(paused) {
  if (paused) { //this has to be rewritten since there could be multiple start times.
    this.startOffset = this.audioCtx.currentTime - this.startTime;
    this.paused = false;
  }
  if (this.queue.length > 0) {
    this.queue.forEach(function(node) {
      node.stop();
    });
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
