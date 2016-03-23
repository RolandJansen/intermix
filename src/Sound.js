'use strict';

var core = require('./core.js');

/**
 * <p>
 * Plays a sound from a SoundWave object.
 * The sound can be started/stopped/paused.
 * It can also be looped with an adjustable loop range.
 * </p>
 *
 * @example
 * var soundWave = new Intermix.SoundWave('audiofile.wav');
 * var sound = new Intermix.Sound(soundWave);
 * @param  {AudioBuffer} soundBuffer The buffer with audio data to be played
 */
var Sound = function(soundWave) {

  this.buffer = null;
  this.queue = [];          //all currently active streams
  this.loop = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.soundLength = 0;
  this.startOffset = 0;
  this.startTime = 0;
  this.loopStart = 0;
  this.loopEnd = null;

  if (soundWave) {
    this.buffer = soundWave.buffer;
    this.soundLength = this.loopEnd = this.buffer.duration;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

/**
 * [function description]
 * @return {[type]} [description]
 */
Sound.prototype.setupAudioChain = function() {
  this.gainNode = core.createGain();
  this.pannerNode = core.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(core.destination);
  this.gainNode.gain.value = 1;
  console.log('audiochain ready');
};

/**
 * [function description]
 * @return {[type]} [description]
 */
Sound.prototype.createBufferSource = function() {
  var self = this;
  var bufferSource = core.createBufferSource();
  bufferSource.buffer = this.buffer;
  bufferSource.connect(this.gainNode);
  bufferSource.onended = function() {
    console.log('onended fired');
    self.destroyBufferSource(bufferSource);
  };
  return bufferSource;
};

/**
 * [function description]
 * @param  {[type]} bsNode [description]
 * @return {[type]}        [description]
 */
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

/**
 * [function description]
 * @param  {[type]} delay      [description]
 * @param  {[type]} playLooped [description]
 * @return {[type]}            [description]
 */
Sound.prototype.play = function(delay, playLooped) {
  var startTime = 0;

  if (delay) {
    console.log('set start time: ' + delay);
    startTime = delay;
  } else {
    startTime = core.currentTime;
  }
  var bs = this.createBufferSource();
  bs.loop = playLooped;

  // if (playLooped) {
  //   bs.loopStart = this.loopStart;
  //   bs.loopEnd = this.loopEnd;
  // }

  // if (this.startOffset === 0 || this.startOffset >= this.buffer.duration) {
  //   console.log('resetting starttime');
  //   this.startTime = core.currentTime;
  // }
  this.queue.push(bs);
  //bs.start(startTime, this.startOffset);
  bs.start(startTime);

  this.startOffset = 0;
};

/**
 * [function description]
 * @param  {[type]} paused [description]
 * @return {[type]}        [description]
 */
Sound.prototype.stop = function(paused) {
  if (paused) { //this has to be rewritten since there could be multiple start times.
    this.startOffset = core.currentTime - this.startTime;
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

/**
 * [function description]
 * @return {[type]} [description]
 */
Sound.prototype.pause = function() {
  this.stop(true);
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
