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
 * sound.start();
 * @param  {Object} soundWave SoundWave object including the buffer with audio data to be played
 */
var Sound = function(soundWave) {

  this.wave = null;
  this.ac = core;           //currently just used for tests
  this.queue = [];          //all currently active streams
  this.loop = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.soundLength = 0;
  this.startOffset = 0;     //the offset within the waveform
  this.startTime = 0;       //when the sound starts to play
  this.loopStart = 0;
  this.loopEnd = null;
  this.playbackRate = 1;
  this.detune = 0;

  if (soundWave) {
    this.wave = soundWave;
    this.buffer = soundWave.buffer;
    this.soundLength = this.loopEnd = this.buffer.duration;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

/**
 * Creates a gain and stereo-panner node, connects them
 * (gain -> panner) and sets gain to 1 (max value).
 */
Sound.prototype.setupAudioChain = function() {
  this.gainNode = core.createGain();
  this.pannerNode = core.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(core.destination);
  this.gainNode.gain.value = 1;
};

/**
 * Creates and configures a BufferSourceNode
 * that can be played once and then destroys itself.
 * @return {BufferSourceNode} The BufferSourceNode
 */
Sound.prototype.createBufferSource = function() {
  var self = this;
  var bufferSource = core.createBufferSource();
  bufferSource.buffer = this.buffer;
  bufferSource.connect(this.gainNode);
  bufferSource.onended = function() {
    //console.log('onended fired');
    self.destroyBufferSource(bufferSource);
  };
  return bufferSource;
};

/**
 * Destroyes a given AudioBufferSourceNode and deletes it
 * from the sourceNode queue. This is used in the onended
 * callback of all BufferSourceNodes.
 * This is probably futile since we already delete all node
 * references in the stop method.
 * @todo   Check if this can be removed
 * @param  {AudioBufferSourceNode} bsNode the bufferSource to be destroyed.
 */
Sound.prototype.destroyBufferSource = function(bsNode) {
  bsNode.disconnect();
  this.queue.forEach(function(node, index) {
    if (node === bsNode) {
      this.queue.splice(index, 1);
    }
  }, this);
};

/**
 * Starts a sound (AudioBufferSourceNode) and stores a references
 * in a queue. This enables you to play multiple sounds at once
 * and even stop them all at a given time.
 * @param  {float}   delay      Time in seconds the sound pauses before the stream starts
 * @param  {Boolean} playLooped Whether the sound should be looped or not
 * @return {Void}
 */
Sound.prototype.start = function(delay, playLooped, duration) {
  var startTime = 0;

  if (delay) {
    startTime = delay;
  } else {
    startTime = core.currentTime;
  }
  var bs = this.createBufferSource();

  if (playLooped) {
    bs.loop = playLooped;
    bs.loopStart = this.loopStart;
    bs.loopEnd = this.loopEnd;
  }

  bs.playbackRate.value = this.playbackRate;
  bs.detune.value = this.detune;

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

  if (duration) {
    bs.start(startTime, this.startOffset, duration);
  } else {
    bs.start(startTime, this.startOffset);
  }

  this.startOffset = 0;
};

/**
 * Stops all audio stream, even the ones that are just scheduled.
 * It also cleans the queue so that the sound object is ready for another round.
 * @return {Void}
 */
Sound.prototype.stop = function() {
  if (this.queue.length > 0) {
    this.queue.forEach(function(node) {
      node.stop();
      node.disconnect();
    });
    this.queue = [];  //release all references
  } else {
    //fail silently
  }
};

/**
 * Stops the audio stream and store the current positions
 * as an offset for when the sound get restarted.
 * Remember that this doesn't work with loops that are shorter
 * than the buffer itself. If you want a global, accurate pause function
 * use suspend/resume from the core module.
 * @todo    Needs to be rewritten since there could be multiple start times.
 * @return  {Void}
 */
Sound.prototype.pause = function() {
  this.startOffset = (core.currentTime - this.startTime) % this.soundLength;
  this.stop();
};

/**
 * Sets the startpoint of the loop
 * @param  {float} value  loop start in seconds
 * @return {Void}
 */
Sound.prototype.setLoopStart = function(value) {
  //this.loopStart = value * this.soundLength;
  this.loopStart = value;
};

/**
 * Sets the endpoint of the loop
 * @param  {float} value  loop end in seconds
 * @return {Void}
 */
Sound.prototype.setLoopEnd = function(value) {
  this.loopEnd = value;
};

/**
 * Resets the start and endpoint to start end endpoint of the AudioBuffer
 * @return {Void}
 */
Sound.prototype.resetLoop = function() {
  this.loopStart = 0;
  this.loopEnd = this.soundLength;
};

/**
 * Set the playback rate of the sound in percentage
 * (1 = 100%, 2 = 200%)
 * @param  {float}   rate Rate in percentage
 * @return {Void}
 */
Sound.prototype.setPlaybackRate = function(rate) {
  this.playbackRate = rate;
};

/**
 * Get the current playback rate
 * @return {float}  The playback rate in percentage (1.25 = 125%)
 */
Sound.prototype.getPlaybackRate = function() {
  return this.playbackRate;
};

/**
 * Set the tone within two octave (+/-12 tones)
 * @param  {Integer}  semi tone
 * @return {Void}
 */
Sound.prototype.setTone = function(semiTone) {
  if (semiTone >= -12 && semiTone <= 12) {
    this.detune = semiTone * 100;
  } else {
    throw new Error('Semi tone is ' + semiTone + '. Must be between +/-12.');
  }
};

/**
 * Get the last played semitone. This doesn't has to be an
 * integer between -/+12 as the sound can be detuned with
 * more precision.
 * @return {float}  Semitone between -/+12
 */
Sound.prototype.getTone = function() {
  return this.detune / 100;
};

/**
 * Detune the sound oscillation in cents (+/- 1200)
 * @param  {Integer}  detune  detune in cents
 * @return {Void}
 */
Sound.prototype.setDetune = function(detune) {
  if (detune >= -1200 && detune <= 1200) {
    this.detune = detune;
  } else {
    throw new Error('Detune parameter is ' + detune + '. Must be between +/-1200.');
  }
};

/**
 * get the current detune in cents (+/- 1200)
 * @return {Integer}  Detune in cents
 */
Sound.prototype.getDetune = function() {
  return this.detune;
};

Sound.prototype.getUID = function() {
  return Math.random().toString().substr(2, 8);
};

module.exports = Sound;
