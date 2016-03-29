(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//Intermix = require('./core.js');
var Intermix = _dereq_('./core.js') || {};
Intermix.SoundWave = _dereq_('./SoundWave.js');
Intermix.Sound = _dereq_('./Sound.js');
Intermix.Sequencer = _dereq_('./Sequencer.js');
Intermix.Part = _dereq_('./Part.js');

module.exports = Intermix;

},{"./Part.js":3,"./Sequencer.js":4,"./Sound.js":5,"./SoundWave.js":6,"./core.js":7}],2:[function(_dereq_,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    return new Worker(URL.createObjectURL(
        new Blob([src], { type: 'text/javascript' })
    ));
};

},{}],3:[function(_dereq_,module,exports){
/**
 * Part.js
 */
'use strict';

var Part = function(audioCtx, instrument, length) {
  this.audioCtx;
  this.instrument;
  this.resolution = 16;
  this.multiply = 4;
  this.length = 1;      //1 = one bar (4 beats)
  this.name = 'Part';
  this.data;
  this.pattern = [];
  this.monophonic = false; //probably futile
  this.zeroPoint = 0;

  if (audioCtx && instrument) {
    this.audioCtx = audioCtx;
    this.instrument = instrument;
    this.initPart();
  } else {
    throw new Error('Failed to initialize part. AudioCtx and/or instrument missing.');
  }

  if (length) {
    this.length = length;
  }

};

Part.prototype.initPart = function() {
  this.pattern = this.initPattern(this.length);
  //do we really need this? And, if yes, why?
  this.data = {
    'name': this.name,
    'instrument': this.instrument,
    'resolution': this.resolution,
    'pattern': this.pattern
  };
};

/**
 * initPattern: Initialize an empty pattern in this part
 * @param  {Float}  length  Length of the pattern mesured in bars
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.initPattern = function(length) {
  var pattern = [];
  for (var i = 0; i < (length * 64); i++) {
    pattern[i] = [];
  }
  return pattern;
};

/**
 * addEvent: adds an event to the pattern at a given position
 * @param  {Object} seqEvent  The event (note or controller)
 * @param  {Int}    position  Position in the pattern
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.addEvent = function(seqEvent, position) {
  if (position <= this.resolution) {
    var pos = (position - 1) * this.multiply;
    this.pattern[pos].push(seqEvent);
  }
  return this;
};

Part.prototype.removeEvent = function(position) {
  //removes all entries at a specific position.
  //this is not exactly what it should do.
  var pos = position * this.multiply;
  this.pattern[pos] = [];
};

/**
 * clearPattern: Delete all events in this part
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.clearPattern = function() {
  this.pattern = [];
  return this;
};

Part.prototype.getLength = function() {
  return this.pattern.length;
};

Part.prototype.getNotePositions = function() {
  var positions = [];
  this.pattern.forEach(function(el, index) {
    if (el.length > 0) {
      positions.push(index / this.multiply);
    }
  }, this);
  return positions;
};

Part.prototype.extendOnStart = function(pattern, extLength) {
  var entries = extLength * 64;
  var extension = this.initPattern(entries);
  return pattern.push.apply(extension, pattern);
};

Part.prototype.extendOnEnd = function(pattern, extLength) {
  var entries = extLength * 64;
  var extension = this.initPattern(entries);
  return pattern.push.apply(pattern, extension);
};

module.exports = Part;

},{}],4:[function(_dereq_,module,exports){
/**
 * Sequencer
 *
 * Scheduling inspired by "A Tale of Two Clocks" by Chris Wilson:
 * http://www.html5rocks.com/en/tutorials/audio/scheduling/
 */
'use strict';

var work = _dereq_('webworkify');

var Sequencer = function(audioCtx) {

  var self = this;
  this.audioCtx = audioCtx;
  this.beatsPerMinute = 120;  //beats per minute
  this.resolution = 64;       //shortest possible note. You normally don't want to touch this.
  this.interval = 100;        //the interval in miliseconds the scheduler gets invoked.
  this.lookahead = 0.3;       //time in seconds the scheduler looks ahead.
                              //should be longer than interval.
  this.queue = [];            //List with all parts of the score
  this.runQueue = [];         //list with parts that are playing or will be played shortly

  this.now;                    //timestamp from audiocontext when the scheduler is invoked.
  this.timePerStep;           //period of time between two steps
  this.nextStepTime = 0;      //time in seconds when the next step will be triggered
  this.nextStep = 0;          //position in the queue that will get triggered next
  this.lastPlayedStep = 0;    //step in queue that was played (not triggered) recently (used for drawing).
  this.loop = false;          //play a section of the queue in a loop
  this.loopStart;             //first step of the loop
  this.loopEnd;               //last step of the loop
  this.isRunning = false;     //true if sequencer is running, otherwise false
  this.animationFrame;        //has to be overridden with a function. Will be called in the
                              //draw function with the lastPlayedStep int as parameter.

  // set time per setTimePerStep
  this.timePerStep = this.setTimePerStep(this.beatsPerMinute, this.resolution);

  // Initialize the scheduler-timer
  this.scheduleWorker = work(_dereq_('./scheduleWorker.js'));

  /*eslint-enable */

  this.scheduleWorker.onmessage = function(e) {
    if (e.data === 'tick') {
      self.scheduler();
    }
  };

  this.scheduleWorker.postMessage({'message': this.interval});
};

Sequencer.prototype.scheduler = function() {
  this.now = this.audioCtx.currentTime;

  if (this.nextStepTime === 0) {
    this.nextStepTime = this.now;
  }

  while (this.nextStepTime < this.now + this.lookahead) {
    if (this.queue[this.nextStep]) {
      this.queue[this.nextStep].forEach(function(part) {
        this.runQueue.push({
          'instrument': part.instrument,
          'pattern': this.copyArray(part.pattern)
        });
      }, this);
    }

    this.runQueue.forEach(function(part, index) {
      var seqEvents = part.pattern.shift();  //return first element and remove it from part
      if (seqEvents) {
        //var instrument = part.instrument;
        seqEvents.forEach(function(seqEvent) {
          if (seqEvent.note) {
            //TODO: should be extended to play real notes
            part.instrument.play(this.nextStepTime);
          } else if (seqEvent.controller) {
            // process controller event;
          }

          //remove part from runQueue if empty
          if (part.pattern.length === 0) {
            this.runQueue.splice(index, 1);
          }
        }, this);
      }

    }, this);

    this.nextStepTime += this.timePerStep;

    // set pointer to the next step in the queue that should be played.
    // If we're playing in loop mode, jump back to loopstart when
    // end of loop is reached.
    if (this.loop) {
      if (this.nextStep >= this.loopEnd) {
        this.nextStep = this.loopStart;
        this.runQueue = [];
      } else {
        this.nextStep++;
      }
    } else {
      this.nextStep++;
    }
  }
};

Sequencer.prototype.start = function() {
  this.scheduleWorker.postMessage('start');
  this.isRunning = true;
  window.requestAnimationFrame(this.draw);
};

Sequencer.prototype.stop = function() {
  this.scheduleWorker.postMessage('stop');
  this.runQueue = [];
  this.isRunning = false;
};

Sequencer.prototype.draw = function() {
  // first we'll have to find out, what step was recently played.
  // this is somehow clumsy because the sequencer doesn't keep track of that.
  var lookAheadDelta = this.nextStepTime - this.audioCtx.currentTime;
  var stepsAhead = Math.floor(lookAheadDelta / this.timePerStep) + 1;
  this.lastPlayedStep = this.nextStep - stepsAhead;

  //should be overridden by the application
  this.animationFrame(this.lastPlayedStep);

  if (this.isRunning) {
    window.requestAnimationFrame(this.draw);
  }
};

Sequencer.prototype.addPart = function(part, position) {
  if (!this.queue[position]) {
    this.queue[position] = [];
  }
  this.queue[position].push(part);
};

Sequencer.prototype.createNoteEvent = function(note, length) {
  return {
    'note': note,
    'length': length
  };
};

Sequencer.prototype.setTimePerStep = function(bpm, resolution) {
  return (60 * 4) / (bpm * resolution);
};

/**
 * copyArray: Makes a copy of a flat array.
 * 						Uses a pre-allocated while-loop
 * 						which seems to be the fasted way
 * 						(by far) of doing this:
 * 						http://jsperf.com/new-array-vs-splice-vs-slice/113
 * @param  {Array} sourceArray Array that should be copied.
 * @return {Array}             Copy of the source array.
 */
Sequencer.prototype.copyArray = function(sourceArray) {
  var destArray = new Array(sourceArray.length);
  var i = sourceArray.length;
  while (i--) {
    destArray[i] = sourceArray[i];
  }
  return destArray;
};

module.exports = Sequencer;

},{"./scheduleWorker.js":8,"webworkify":2}],5:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');

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

},{"./core.js":7}],6:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');

/**
 * <p>
 * Creates a wrapper in which an audio buffer lives.
 * A SoundWave object just holds audio data and does nothing else.
 * If you want to play the sound, you have to additionally create a
 * <a href="Sound.html">Sound</a> object.
 * It can handle one or more ArrayBuffers or filenames
 * (*.wav, *.mp3) as data sources.
 * </p><p>
 * Multiple sources will be concatenated into one audio buffer.
 * This is not the same as creating multiple SoundWave objects.
 * It's like a wavetable: All start/end positions will be saved so
 * you can trigger the original samples without using multiple buffers.
 * Possible usages are multisampled sounds, loops or wavesequences (kind of).
 * </p>
 *
 * @example <caption>Play a sound from an audio file:</caption>
 * var soundWave = new Intermix.SoundWave('file.wav');
 * var sound = new Intermix.Sound(soundWave);
 * sound.play;
 * @example <caption>Concatenate multiple source files into one buffer<br>
 * in the given order and play them:</caption>
 * var soundWave = new Intermix.SoundWave('file1.wav,file2.wav,file3.wav');
 * var sound = new Intermix.Sound(soundWave);
 * sound.play;
 * @example <caption>
 * Using ArrayBuffers instead of filenames will come in handy if you want<br>
 * to have full control over XHR or use a preloader (here: preload.js):
 * </caption>
 * var queue = new createjs.LoadQueue();
 * queue.on('complete', handleComplete);
 * queue.loadManifest([
 *     {id: 'src1', src:'file1.wav', type:createjs.AbstractLoader.BINARY},
 *     {id: 'src2', src:'file2.wav', type:createjs.AbstractLoader.BINARY}
 * ]);
 *
 * function handleComplete() {
 *     var binData1 = queue.getResult('src1');
 *     var binData2 = queue.getResult('src2');
 *     var wave1 = new Intermix.SoundWave(binData1);
 *     var wave2 = new Intermix.SoundWave(binData2);
 *     var concatWave = new Intermix.SoundWave([binData1, binData2]);
 * };
 * @constructor
 * @param  {(Object|Object[]|string)} audioSrc   One or more ArrayBuffers or filenames
 */
var SoundWave = function(audioSrc) {

  this.buffer = null;             //AudioBuffer
  this.metaData = [];                //start-/endpoints and length of single waves

  if (audioSrc) {
    if (audioSrc instanceof ArrayBuffer) {
      //one audio buffer to decode
      this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple audio buffers to decode and concatenate
      this.concatBinariesToAudioBuffer(audioSrc);
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') === -1) {
      //one file to load/decode
      var binBuffer;
      this.loadFile(audioSrc, function(response) {
        binBuffer = response;
      });
      this.buffer = this.decodeAudioData(binBuffer);
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') > -1) {
      //multiple files to load/decode and cancatinate
      var binBuffers = this.loadFiles(audioSrc);
      this.buffer = this.concatBinariesToAudioBuffer(binBuffers, this.buffer);
    } else {
      throw new Error('Cannot create SoundWave object: Unsupported data format');
    }
  } else {
    //start the object with empty buffer. Usefull for testing and advanced usage.
  }

};

/**
 * Takes binary audio data and turns it into an audio buffer object.
 * This is a wrapper for the web-audio-api decodeAudioData function.
 * It uses the new promise syntax so it probably won't work in all browsers by now.
 * @param  {ArrayBuffer}  rawAudioSrc Audio data in raw binary format
 * @param  {function}     [func]      Can be used to run code inside the inner decode function.
 * @return {Promise}                  Promise object that will be replaced with the audio buffer after decoding.
 */
SoundWave.prototype.decodeAudioData = function(rawAudioSrc, func) {
  var self = this;

  //new promise based syntax currently not available in Chrome <49, IE, Safari
  //TODO: monkeypatch with call
  this.buffer = core.decodeAudioData(rawAudioSrc).then(function(decoded) {
    self.buffer = decoded;
    if (func) {
      func();
    }
  });
};

/**
 * Concatenates one or more ArrayBuffers to an AudioBuffer.
 * @param  {Array} binaryBuffers  Array holding one or more ArrayBuffers
 * @param  {AudioBuffer} audioBuffer   An existing AudioBuffer object
 * @return {AudioBuffer}               The concatenated AudioBuffer
 */
SoundWave.prototype.concatBinariesToAudioBuffer = function(binaryBuffers, audioBuffer) {
  binaryBuffers.forEach(function(binBuffer) {
    var tmpAudioBuffer = this.decodeAudioData(binBuffer);
    this.metaData.push(this.addWaveMetaData(audioBuffer, tmpAudioBuffer));
    audioBuffer = this.appendAudioBuffer(audioBuffer, tmpAudioBuffer);
  }, this);

  return audioBuffer;
};

/**
 * Appends two audio buffers. Suggested by Chris Wilson:<br>
 * http://stackoverflow.com/questions/14143652/web-audio-api-append-concatenate-different-audiobuffers-and-play-them-as-one-son
 * @param  {AudioBuffer} buffer1 The first audio buffer
 * @param  {AudioBuffer} buffer2 The second audio buffer
 * @return {AudioBuffer}         buffer1 + buffer2
 */
SoundWave.prototype.appendAudioBuffer = function(buffer1, buffer2) {
  var numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
  var tmp = core.createBuffer(numberOfChannels,
    (buffer1.length + buffer2.length),
    buffer1.sampleRate);
  for (var i = 0; i < numberOfChannels; i++) {
    var channel = tmp.getChannelData(i);
    channel.set( buffer1.getChannelData(i), 0);
    channel.set( buffer2.getChannelData(i), buffer1.length);
  }
  return tmp;
};

/**
 * Creates a dictionary with start/stop points and length in sample-frames
 * of an appended waveform and adds it to the metaData array.
 * @private
 * @param  {AudioBuffer} existingBuffer The 'old' buffer that gets appended
 * @param  {AudioBuffer} newBuffer      The buffer that gets appended
 * @return {Object}                     Dictionary with start/stop/length data
 */
SoundWave.prototype.addWaveMetaData = function(existingBuffer, newBuffer) {
  return {
    start: existingBuffer.length + 1,
    end: existingBuffer.length + newBuffer.length,
    length: newBuffer.length
  };
};

/**
 * Loads a binary file and calls a function with the
 * returned ArrayBuffer as its argument when done.
 * @param  {string}   filename       The file to be loaded
 * @param  {function} onloadCallback The function to be called
 * @param  {boolean}  [async=true]   Asynchronous loading
 * @example
 * var arrayBuffer;
 * this.loadFile('file1.wav', function(response) {
 *   arrayBuffer = response;
 * });
 */
SoundWave.prototype.loadFile = function(filename, onloadCallback, async) {
  var asynchronously = true;
  var request = new window.XMLHttpRequest();

  if (async) {
    asynchronously = async;
  }

  request.open('GET', filename, asynchronously);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    onloadCallback(request.response);
  };

  request.send();
};

/**
 * Loads multiple binary files and returns an array
 * with the data from the files in the given order.
 * @param  {Array}  filenames List with filenames
 * @return {Array}            Array of ArrayBuffers
 */
SoundWave.prototype.loadFiles = function(filenames) {
  var self = this;
  var binBuffers = [];
  var names = filenames.split(',');
  names.forEach(function(name) {
    self.loadFile(name, function(response) {
      binBuffers[name] = response;
    });
  });

  return this.sortBinBuffers(names, binBuffers);
};

SoundWave.prototype.sortBinBuffers = function(filenames, binBuffers) {
  return filenames.map(function(el) {
    return binBuffers[el];
  });
};

module.exports = SoundWave;

},{"./core.js":7}],7:[function(_dereq_,module,exports){
/**
 * This is the foundation of the Intermix library.
 * It simply creates the audio context objects
 * and exports it so it can be easily consumed
 * from all classes of the library.
 *
 * @return {AudioContext} The AudioContext object
 *
 * @todo Should we do backwards-compatibility for older api-versions?
 * @todo Check for mobile/iOS compatibility.
 * @todo Check if we're running on node
 *
 * @example <caption>Suspend and resume the audio context to
 * create a pause button. This should be used with createAudioWorker
 * as an error will be thrown when suspend is called on an offline audio context.
 * You can also pause single sounds with <i>Sound.pause()</i>.
 * Please read <a href="https://developer.mozilla.org/de/docs/Web/API/AudioContext/suspend">the developer docs at MDN</a>
 * to get a better idea of this.</caption>
 * susresBtn.onclick = function() {
 *   if(Intermix.state === 'running') {
 *     Intermix.suspend().then(function() {
 *       susresBtn.textContent = 'Resume context';
 *     });
 *   } else if (Intermix.state === 'suspended') {
 *     Intermix.resume().then(function() {
 *       susresBtn.textContent = 'Suspend context';
 *     });
 *   }
 * }
 */
'use strict';

var audioCtx = null;

(function() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if (window.AudioContext) {
    audioCtx = new window.AudioContext();
  } else {
    throw new Error('Couldn\'t initialize the audio context.');
  }

})();

module.exports = audioCtx;

},{}],8:[function(_dereq_,module,exports){
/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is much more stable
 * than in the main thread.
 *
 * The syntax is adapted to the commonjs module pattern.
 */
'use strict';

var timer = null;
var interval = 100;

var worker = function(self) {
  self.addEventListener('message', function(e) {
    if (e.data === 'start') {
      timer = setInterval(function() {self.postMessage('tick');}, interval);
    } else if (e.data === 'stop') {
      clearInterval(timer);
    } else if (e.data.interval) {
      interval = e.data.interval;
      if (timer) {
        clearInterval(timer);
        timer = setInterval(function() {self.postMessage('tick');}, interval);
      }
    }
  });
};

module.exports = worker;

/*eslint-disable */
// self.onmessage = function(e) {
//   if (e.data === 'start') {
//     timer = setInterval(function() {postMessage('tick');}, interval);
//   } else if (e.data === 'stop') {
//     clearInterval(timer);
//   } else if (e.data.interval) {
//     interval = e.data.interval;
//     if (timer) {
//       clearInterval(timer);
//       timer = setInterval(function() {postMessage('tick');}, interval);
//     }
//   }
//
//   self.close();
// };

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy9JbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgSW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKSB8fCB7fTtcclxuSW50ZXJtaXguU291bmRXYXZlID0gcmVxdWlyZSgnLi9Tb3VuZFdhdmUuanMnKTtcclxuSW50ZXJtaXguU291bmQgPSByZXF1aXJlKCcuL1NvdW5kLmpzJyk7XHJcbkludGVybWl4LlNlcXVlbmNlciA9IHJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJyk7XHJcbkludGVybWl4LlBhcnQgPSByZXF1aXJlKCcuL1BhcnQuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW50ZXJtaXg7XHJcbiIsInZhciBidW5kbGVGbiA9IGFyZ3VtZW50c1szXTtcbnZhciBzb3VyY2VzID0gYXJndW1lbnRzWzRdO1xudmFyIGNhY2hlID0gYXJndW1lbnRzWzVdO1xuXG52YXIgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIgd2tleTtcbiAgICB2YXIgY2FjaGVLZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIHZhciBleHAgPSBjYWNoZVtrZXldLmV4cG9ydHM7XG4gICAgICAgIC8vIFVzaW5nIGJhYmVsIGFzIGEgdHJhbnNwaWxlciB0byB1c2UgZXNtb2R1bGUsIHRoZSBleHBvcnQgd2lsbCBhbHdheXNcbiAgICAgICAgLy8gYmUgYW4gb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgZXhwb3J0IGFzIGEgcHJvcGVydHkgb2YgaXQuIFRvIGVuc3VyZVxuICAgICAgICAvLyB0aGUgZXhpc3RpbmcgYXBpIGFuZCBiYWJlbCBlc21vZHVsZSBleHBvcnRzIGFyZSBib3RoIHN1cHBvcnRlZCB3ZVxuICAgICAgICAvLyBjaGVjayBmb3IgYm90aFxuICAgICAgICBpZiAoZXhwID09PSBmbiB8fCBleHAuZGVmYXVsdCA9PT0gZm4pIHtcbiAgICAgICAgICAgIHdrZXkgPSBrZXk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghd2tleSkge1xuICAgICAgICB3a2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgICAgIHZhciB3Y2FjaGUgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICAgICAgd2NhY2hlW2tleV0gPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlc1t3a2V5XSA9IFtcbiAgICAgICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZScsJ21vZHVsZScsJ2V4cG9ydHMnXSwgJygnICsgZm4gKyAnKShzZWxmKScpLFxuICAgICAgICAgICAgd2NhY2hlXG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBza2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG5cbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sIChcbiAgICAgICAgICAgIC8vIHRyeSB0byBjYWxsIGRlZmF1bHQgaWYgZGVmaW5lZCB0byBhbHNvIHN1cHBvcnQgYmFiZWwgZXNtb2R1bGVcbiAgICAgICAgICAgIC8vIGV4cG9ydHNcbiAgICAgICAgICAgICd2YXIgZiA9IHJlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpOycgK1xuICAgICAgICAgICAgJyhmLmRlZmF1bHQgPyBmLmRlZmF1bHQgOiBmKShzZWxmKTsnXG4gICAgICAgICkpLFxuICAgICAgICBzY2FjaGVcbiAgICBdO1xuXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICA7XG5cbiAgICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgICAgbmV3IEJsb2IoW3NyY10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSlcbiAgICApKTtcbn07XG4iLCIvKipcclxuICogUGFydC5qc1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhcnQgPSBmdW5jdGlvbihhdWRpb0N0eCwgaW5zdHJ1bWVudCwgbGVuZ3RoKSB7XHJcbiAgdGhpcy5hdWRpb0N0eDtcclxuICB0aGlzLmluc3RydW1lbnQ7XHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gMTY7XHJcbiAgdGhpcy5tdWx0aXBseSA9IDQ7XHJcbiAgdGhpcy5sZW5ndGggPSAxOyAgICAgIC8vMSA9IG9uZSBiYXIgKDQgYmVhdHMpXHJcbiAgdGhpcy5uYW1lID0gJ1BhcnQnO1xyXG4gIHRoaXMuZGF0YTtcclxuICB0aGlzLnBhdHRlcm4gPSBbXTtcclxuICB0aGlzLm1vbm9waG9uaWMgPSBmYWxzZTsgLy9wcm9iYWJseSBmdXRpbGVcclxuICB0aGlzLnplcm9Qb2ludCA9IDA7XHJcblxyXG4gIGlmIChhdWRpb0N0eCAmJiBpbnN0cnVtZW50KSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgICB0aGlzLmluc3RydW1lbnQgPSBpbnN0cnVtZW50O1xyXG4gICAgdGhpcy5pbml0UGFydCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIHBhcnQuIEF1ZGlvQ3R4IGFuZC9vciBpbnN0cnVtZW50IG1pc3NpbmcuJyk7XHJcbiAgfVxyXG5cclxuICBpZiAobGVuZ3RoKSB7XHJcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICB9XHJcblxyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhcnQgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLmluaXRQYXR0ZXJuKHRoaXMubGVuZ3RoKTtcclxuICAvL2RvIHdlIHJlYWxseSBuZWVkIHRoaXM/IEFuZCwgaWYgeWVzLCB3aHk/XHJcbiAgdGhpcy5kYXRhID0ge1xyXG4gICAgJ25hbWUnOiB0aGlzLm5hbWUsXHJcbiAgICAnaW5zdHJ1bWVudCc6IHRoaXMuaW5zdHJ1bWVudCxcclxuICAgICdyZXNvbHV0aW9uJzogdGhpcy5yZXNvbHV0aW9uLFxyXG4gICAgJ3BhdHRlcm4nOiB0aGlzLnBhdHRlcm5cclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGluaXRQYXR0ZXJuOiBJbml0aWFsaXplIGFuIGVtcHR5IHBhdHRlcm4gaW4gdGhpcyBwYXJ0XHJcbiAqIEBwYXJhbSAge0Zsb2F0fSAgbGVuZ3RoICBMZW5ndGggb2YgdGhlIHBhdHRlcm4gbWVzdXJlZCBpbiBiYXJzXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGF0dGVybiA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gIHZhciBwYXR0ZXJuID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAobGVuZ3RoICogNjQpOyBpKyspIHtcclxuICAgIHBhdHRlcm5baV0gPSBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHBhdHRlcm47XHJcbn07XHJcblxyXG4vKipcclxuICogYWRkRXZlbnQ6IGFkZHMgYW4gZXZlbnQgdG8gdGhlIHBhdHRlcm4gYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUgb3IgY29udHJvbGxlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbiAtIDEpICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAvL3JlbW92ZXMgYWxsIGVudHJpZXMgYXQgYSBzcGVjaWZpYyBwb3NpdGlvbi5cclxuICAvL3RoaXMgaXMgbm90IGV4YWN0bHkgd2hhdCBpdCBzaG91bGQgZG8uXHJcbiAgdmFyIHBvcyA9IHBvc2l0aW9uICogdGhpcy5tdWx0aXBseTtcclxuICB0aGlzLnBhdHRlcm5bcG9zXSA9IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGNsZWFyUGF0dGVybjogRGVsZXRlIGFsbCBldmVudHMgaW4gdGhpcyBwYXJ0XHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5jbGVhclBhdHRlcm4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnBhdHRlcm4gPSBbXTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBhdHRlcm4ubGVuZ3RoO1xyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuZ2V0Tm90ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwb3NpdGlvbnMgPSBbXTtcclxuICB0aGlzLnBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbihlbCwgaW5kZXgpIHtcclxuICAgIGlmIChlbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHBvc2l0aW9ucy5wdXNoKGluZGV4IC8gdGhpcy5tdWx0aXBseSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbiAgcmV0dXJuIHBvc2l0aW9ucztcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uU3RhcnQgPSBmdW5jdGlvbihwYXR0ZXJuLCBleHRMZW5ndGgpIHtcclxuICB2YXIgZW50cmllcyA9IGV4dExlbmd0aCAqIDY0O1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGVudHJpZXMpO1xyXG4gIHJldHVybiBwYXR0ZXJuLnB1c2guYXBwbHkoZXh0ZW5zaW9uLCBwYXR0ZXJuKTtcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24ocGF0dGVybiwgZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGVudHJpZXMgPSBleHRMZW5ndGggKiA2NDtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihlbnRyaWVzKTtcclxuICByZXR1cm4gcGF0dGVybi5wdXNoLmFwcGx5KHBhdHRlcm4sIGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIi8qKlxyXG4gKiBTZXF1ZW5jZXJcclxuICpcclxuICogU2NoZWR1bGluZyBpbnNwaXJlZCBieSBcIkEgVGFsZSBvZiBUd28gQ2xvY2tzXCIgYnkgQ2hyaXMgV2lsc29uOlxyXG4gKiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9hdWRpby9zY2hlZHVsaW5nL1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHdvcmsgPSByZXF1aXJlKCd3ZWJ3b3JraWZ5Jyk7XHJcblxyXG52YXIgU2VxdWVuY2VyID0gZnVuY3Rpb24oYXVkaW9DdHgpIHtcclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuYXVkaW9DdHggPSBhdWRpb0N0eDtcclxuICB0aGlzLmJlYXRzUGVyTWludXRlID0gMTIwOyAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5RdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLm5vdzsgICAgICAgICAgICAgICAgICAgIC8vdGltZXN0YW1wIGZyb20gYXVkaW9jb250ZXh0IHdoZW4gdGhlIHNjaGVkdWxlciBpcyBpbnZva2VkLlxyXG4gIHRoaXMudGltZVBlclN0ZXA7ICAgICAgICAgICAvL3BlcmlvZCBvZiB0aW1lIGJldHdlZW4gdHdvIHN0ZXBzXHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwOyAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIG5leHQgc3RlcCB3aWxsIGJlIHRyaWdnZXJlZFxyXG4gIHRoaXMubmV4dFN0ZXAgPSAwOyAgICAgICAgICAvL3Bvc2l0aW9uIGluIHRoZSBxdWV1ZSB0aGF0IHdpbGwgZ2V0IHRyaWdnZXJlZCBuZXh0XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IDA7ICAgIC8vc3RlcCBpbiBxdWV1ZSB0aGF0IHdhcyBwbGF5ZWQgKG5vdCB0cmlnZ2VyZWQpIHJlY2VudGx5ICh1c2VkIGZvciBkcmF3aW5nKS5cclxuICB0aGlzLmxvb3AgPSBmYWxzZTsgICAgICAgICAgLy9wbGF5IGEgc2VjdGlvbiBvZiB0aGUgcXVldWUgaW4gYSBsb29wXHJcbiAgdGhpcy5sb29wU3RhcnQ7ICAgICAgICAgICAgIC8vZmlyc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMubG9vcEVuZDsgICAgICAgICAgICAgICAvL2xhc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7ICAgICAvL3RydWUgaWYgc2VxdWVuY2VyIGlzIHJ1bm5pbmcsIG90aGVyd2lzZSBmYWxzZVxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWU7ICAgICAgICAvL2hhcyB0byBiZSBvdmVycmlkZGVuIHdpdGggYSBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgaW4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJhdyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0UGxheWVkU3RlcCBpbnQgYXMgcGFyYW1ldGVyLlxyXG5cclxuICAvLyBzZXQgdGltZSBwZXIgc2V0VGltZVBlclN0ZXBcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcCh0aGlzLmJlYXRzUGVyTWludXRlLCB0aGlzLnJlc29sdXRpb24pO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBzY2hlZHVsZXItdGltZXJcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyID0gd29yayhyZXF1aXJlKCcuL3NjaGVkdWxlV29ya2VyLmpzJykpO1xyXG5cclxuICAvKmVzbGludC1lbmFibGUgKi9cclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAndGljaycpIHtcclxuICAgICAgc2VsZi5zY2hlZHVsZXIoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKHsnbWVzc2FnZSc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5ub3cgPSB0aGlzLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xyXG5cclxuICBpZiAodGhpcy5uZXh0U3RlcFRpbWUgPT09IDApIHtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lID0gdGhpcy5ub3c7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCB0aGlzLm5vdyArIHRoaXMubG9va2FoZWFkKSB7XHJcbiAgICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXSkge1xyXG4gICAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICAgIHRoaXMucnVuUXVldWUucHVzaCh7XHJcbiAgICAgICAgICAnaW5zdHJ1bWVudCc6IHBhcnQuaW5zdHJ1bWVudCxcclxuICAgICAgICAgICdwYXR0ZXJuJzogdGhpcy5jb3B5QXJyYXkocGFydC5wYXR0ZXJuKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJ1blF1ZXVlLmZvckVhY2goZnVuY3Rpb24ocGFydCwgaW5kZXgpIHtcclxuICAgICAgdmFyIHNlcUV2ZW50cyA9IHBhcnQucGF0dGVybi5zaGlmdCgpOyAgLy9yZXR1cm4gZmlyc3QgZWxlbWVudCBhbmQgcmVtb3ZlIGl0IGZyb20gcGFydFxyXG4gICAgICBpZiAoc2VxRXZlbnRzKSB7XHJcbiAgICAgICAgLy92YXIgaW5zdHJ1bWVudCA9IHBhcnQuaW5zdHJ1bWVudDtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgaWYgKHNlcUV2ZW50Lm5vdGUpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBzaG91bGQgYmUgZXh0ZW5kZWQgdG8gcGxheSByZWFsIG5vdGVzXHJcbiAgICAgICAgICAgIHBhcnQuaW5zdHJ1bWVudC5wbGF5KHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoc2VxRXZlbnQuY29udHJvbGxlcikge1xyXG4gICAgICAgICAgICAvLyBwcm9jZXNzIGNvbnRyb2xsZXIgZXZlbnQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9yZW1vdmUgcGFydCBmcm9tIHJ1blF1ZXVlIGlmIGVtcHR5XHJcbiAgICAgICAgICBpZiAocGFydC5wYXR0ZXJuLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJ1blF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSArPSB0aGlzLnRpbWVQZXJTdGVwO1xyXG5cclxuICAgIC8vIHNldCBwb2ludGVyIHRvIHRoZSBuZXh0IHN0ZXAgaW4gdGhlIHF1ZXVlIHRoYXQgc2hvdWxkIGJlIHBsYXllZC5cclxuICAgIC8vIElmIHdlJ3JlIHBsYXlpbmcgaW4gbG9vcCBtb2RlLCBqdW1wIGJhY2sgdG8gbG9vcHN0YXJ0IHdoZW5cclxuICAgIC8vIGVuZCBvZiBsb29wIGlzIHJlYWNoZWQuXHJcbiAgICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICAgIGlmICh0aGlzLm5leHRTdGVwID49IHRoaXMubG9vcEVuZCkge1xyXG4gICAgICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgICAgICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSB0cnVlO1xyXG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIGZpcnN0IHdlJ2xsIGhhdmUgdG8gZmluZCBvdXQsIHdoYXQgc3RlcCB3YXMgcmVjZW50bHkgcGxheWVkLlxyXG4gIC8vIHRoaXMgaXMgc29tZWhvdyBjbHVtc3kgYmVjYXVzZSB0aGUgc2VxdWVuY2VyIGRvZXNuJ3Qga2VlcCB0cmFjayBvZiB0aGF0LlxyXG4gIHZhciBsb29rQWhlYWREZWx0YSA9IHRoaXMubmV4dFN0ZXBUaW1lIC0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuICB2YXIgc3RlcHNBaGVhZCA9IE1hdGguZmxvb3IobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKSArIDE7XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG5cclxuICAvL3Nob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHRoZSBhcHBsaWNhdGlvblxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWUodGhpcy5sYXN0UGxheWVkU3RlcCk7XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKCF0aGlzLnF1ZXVlW3Bvc2l0aW9uXSkge1xyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICB9XHJcbiAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ucHVzaChwYXJ0KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY3JlYXRlTm90ZUV2ZW50ID0gZnVuY3Rpb24obm90ZSwgbGVuZ3RoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICdub3RlJzogbm90ZSxcclxuICAgICdsZW5ndGgnOiBsZW5ndGhcclxuICB9O1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjb3B5QXJyYXk6IE1ha2VzIGEgY29weSBvZiBhIGZsYXQgYXJyYXkuXHJcbiAqIFx0XHRcdFx0XHRcdFVzZXMgYSBwcmUtYWxsb2NhdGVkIHdoaWxlLWxvb3BcclxuICogXHRcdFx0XHRcdFx0d2hpY2ggc2VlbXMgdG8gYmUgdGhlIGZhc3RlZCB3YXlcclxuICogXHRcdFx0XHRcdFx0KGJ5IGZhcikgb2YgZG9pbmcgdGhpczpcclxuICogXHRcdFx0XHRcdFx0aHR0cDovL2pzcGVyZi5jb20vbmV3LWFycmF5LXZzLXNwbGljZS12cy1zbGljZS8xMTNcclxuICogQHBhcmFtICB7QXJyYXl9IHNvdXJjZUFycmF5IEFycmF5IHRoYXQgc2hvdWxkIGJlIGNvcGllZC5cclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIENvcHkgb2YgdGhlIHNvdXJjZSBhcnJheS5cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY29weUFycmF5ID0gZnVuY3Rpb24oc291cmNlQXJyYXkpIHtcclxuICB2YXIgZGVzdEFycmF5ID0gbmV3IEFycmF5KHNvdXJjZUFycmF5Lmxlbmd0aCk7XHJcbiAgdmFyIGkgPSBzb3VyY2VBcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGktLSkge1xyXG4gICAgZGVzdEFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XHJcbiAgfVxyXG4gIHJldHVybiBkZXN0QXJyYXk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcXVlbmNlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogUGxheXMgYSBzb3VuZCBmcm9tIGEgU291bmRXYXZlIG9iamVjdC5cclxuICogVGhlIHNvdW5kIGNhbiBiZSBzdGFydGVkL3N0b3BwZWQvcGF1c2VkLlxyXG4gKiBJdCBjYW4gYWxzbyBiZSBsb29wZWQgd2l0aCBhbiBhZGp1c3RhYmxlIGxvb3AgcmFuZ2UuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoJ2F1ZGlvZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IEludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnN0YXJ0KCk7XHJcbiAqIEBwYXJhbSAge09iamVjdH0gc291bmRXYXZlIFNvdW5kV2F2ZSBvYmplY3QgaW5jbHVkaW5nIHRoZSBidWZmZXIgd2l0aCBhdWRpbyBkYXRhIHRvIGJlIHBsYXllZFxyXG4gKi9cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oc291bmRXYXZlKSB7XHJcblxyXG4gIHRoaXMud2F2ZSA9IG51bGw7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAvL2FsbCBjdXJyZW50bHkgYWN0aXZlIHN0cmVhbXNcclxuICB0aGlzLmxvb3AgPSBmYWxzZTtcclxuICB0aGlzLmdhaW5Ob2RlID0gbnVsbDtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBudWxsO1xyXG5cclxuICB0aGlzLnNvdW5kTGVuZ3RoID0gMDtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDsgICAgIC8vdGhlIG9mZnNldCB3aXRoaW4gdGhlIHdhdmVmb3JtXHJcbiAgdGhpcy5zdGFydFRpbWUgPSAwOyAgICAgICAvL3doZW4gdGhlIHNvdW5kIHN0YXJ0cyB0byBwbGF5XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IG51bGw7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSAxO1xyXG4gIHRoaXMuZGV0dW5lID0gMDtcclxuXHJcbiAgaWYgKHNvdW5kV2F2ZSkge1xyXG4gICAgdGhpcy53YXZlID0gc291bmRXYXZlO1xyXG4gICAgdGhpcy5idWZmZXIgPSBzb3VuZFdhdmUuYnVmZmVyO1xyXG4gICAgdGhpcy5zb3VuZExlbmd0aCA9IHRoaXMubG9vcEVuZCA9IHRoaXMuYnVmZmVyLmR1cmF0aW9uO1xyXG4gICAgdGhpcy5zZXR1cEF1ZGlvQ2hhaW4oKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgbWlzc2luZy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGdhaW4gYW5kIHN0ZXJlby1wYW5uZXIgbm9kZSwgY29ubmVjdHMgdGhlbVxyXG4gKiAoZ2FpbiAtPiBwYW5uZXIpIGFuZCBzZXRzIGdhaW4gdG8gMSAobWF4IHZhbHVlKS5cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXR1cEF1ZGlvQ2hhaW4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmdhaW5Ob2RlID0gY29yZS5jcmVhdGVHYWluKCk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gY29yZS5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcclxuICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5wYW5uZXJOb2RlKTtcclxuICB0aGlzLnBhbm5lck5vZGUuY29ubmVjdChjb3JlLmRlc3RpbmF0aW9uKTtcclxuICB0aGlzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW5kIGNvbmZpZ3VyZXMgYSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqIHRoYXQgY2FuIGJlIHBsYXllZCBvbmNlIGFuZCB0aGVuIGRlc3Ryb3lzIGl0c2VsZi5cclxuICogQHJldHVybiB7QnVmZmVyU291cmNlTm9kZX0gVGhlIEJ1ZmZlclNvdXJjZU5vZGVcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJ1ZmZlclNvdXJjZSA9IGNvcmUuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xyXG4gIGJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdvbmVuZGVkIGZpcmVkJyk7XHJcbiAgICBzZWxmLmRlc3Ryb3lCdWZmZXJTb3VyY2UoYnVmZmVyU291cmNlKTtcclxuICB9O1xyXG4gIHJldHVybiBidWZmZXJTb3VyY2U7XHJcbn07XHJcblxyXG4vKipcclxuICogRGVzdHJveWVzIGEgZ2l2ZW4gQXVkaW9CdWZmZXJTb3VyY2VOb2RlIGFuZCBkZWxldGVzIGl0XHJcbiAqIGZyb20gdGhlIHNvdXJjZU5vZGUgcXVldWUuIFRoaXMgaXMgdXNlZCBpbiB0aGUgb25lbmRlZFxyXG4gKiBjYWxsYmFjayBvZiBhbGwgQnVmZmVyU291cmNlTm9kZXMuXHJcbiAqIFRoaXMgaXMgcHJvYmFibHkgZnV0aWxlIHNpbmNlIHdlIGFscmVhZHkgZGVsZXRlIGFsbCBub2RlXHJcbiAqIHJlZmVyZW5jZXMgaW4gdGhlIHN0b3AgbWV0aG9kLlxyXG4gKiBAdG9kbyAgIENoZWNrIGlmIHRoaXMgY2FuIGJlIHJlbW92ZWRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJTb3VyY2VOb2RlfSBic05vZGUgdGhlIGJ1ZmZlclNvdXJjZSB0byBiZSBkZXN0cm95ZWQuXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZGVzdHJveUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKGJzTm9kZSkge1xyXG4gIGJzTm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUsIGluZGV4KSB7XHJcbiAgICBpZiAobm9kZSA9PT0gYnNOb2RlKSB7XHJcbiAgICAgIHRoaXMucXVldWUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgYSBzb3VuZCAoQXVkaW9CdWZmZXJTb3VyY2VOb2RlKSBhbmQgc3RvcmVzIGEgcmVmZXJlbmNlc1xyXG4gKiBpbiBhIHF1ZXVlLiBUaGlzIGVuYWJsZXMgeW91IHRvIHBsYXkgbXVsdGlwbGUgc291bmRzIGF0IG9uY2VcclxuICogYW5kIGV2ZW4gc3RvcCB0aGVtIGFsbCBhdCBhIGdpdmVuIHRpbWUuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge0Jvb2xlYW59IHBsYXlMb29wZWQgV2hldGhlciB0aGUgc291bmQgc2hvdWxkIGJlIGxvb3BlZCBvciBub3RcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGRlbGF5LCBwbGF5TG9vcGVkLCBkdXJhdGlvbikge1xyXG4gIHZhciBzdGFydFRpbWUgPSAwO1xyXG5cclxuICBpZiAoZGVsYXkpIHtcclxuICAgIHN0YXJ0VGltZSA9IGRlbGF5O1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuICB2YXIgYnMgPSB0aGlzLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICBpZiAocGxheUxvb3BlZCkge1xyXG4gICAgYnMubG9vcCA9IHBsYXlMb29wZWQ7XHJcbiAgICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgfVxyXG5cclxuICBicy5wbGF5YmFja1JhdGUudmFsdWUgPSB0aGlzLnBsYXliYWNrUmF0ZTtcclxuICBicy5kZXR1bmUudmFsdWUgPSB0aGlzLmRldHVuZTtcclxuXHJcbiAgLy8gaWYgKHBsYXlMb29wZWQpIHtcclxuICAvLyAgIGJzLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gIC8vICAgYnMubG9vcEVuZCA9IHRoaXMubG9vcEVuZDtcclxuICAvLyB9XHJcblxyXG4gIC8vIGlmICh0aGlzLnN0YXJ0T2Zmc2V0ID09PSAwIHx8IHRoaXMuc3RhcnRPZmZzZXQgPj0gdGhpcy5idWZmZXIuZHVyYXRpb24pIHtcclxuICAvLyAgIGNvbnNvbGUubG9nKCdyZXNldHRpbmcgc3RhcnR0aW1lJyk7XHJcbiAgLy8gICB0aGlzLnN0YXJ0VGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgLy8gfVxyXG4gIHRoaXMucXVldWUucHVzaChicyk7XHJcbiAgLy9icy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG5cclxuICBpZiAoZHVyYXRpb24pIHtcclxuICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCwgZHVyYXRpb24pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbSwgZXZlbiB0aGUgb25lcyB0aGF0IGFyZSBqdXN0IHNjaGVkdWxlZC5cclxuICogSXQgYWxzbyBjbGVhbnMgdGhlIHF1ZXVlIHNvIHRoYXQgdGhlIHNvdW5kIG9iamVjdCBpcyByZWFkeSBmb3IgYW5vdGhlciByb3VuZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgbm9kZS5zdG9wKCk7XHJcbiAgICAgIG5vZGUuZGlzY29ubmVjdCgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnF1ZXVlID0gW107ICAvL3JlbGVhc2UgYWxsIHJlZmVyZW5jZXNcclxuICB9IGVsc2Uge1xyXG4gICAgLy9mYWlsIHNpbGVudGx5XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBhdWRpbyBzdHJlYW0gYW5kIHN0b3JlIHRoZSBjdXJyZW50IHBvc2l0aW9uc1xyXG4gKiBhcyBhbiBvZmZzZXQgZm9yIHdoZW4gdGhlIHNvdW5kIGdldCByZXN0YXJ0ZWQuXHJcbiAqIFJlbWVtYmVyIHRoYXQgdGhpcyBkb2Vzbid0IHdvcmsgd2l0aCBsb29wcyB0aGF0IGFyZSBzaG9ydGVyXHJcbiAqIHRoYW4gdGhlIGJ1ZmZlciBpdHNlbGYuIElmIHlvdSB3YW50IGEgZ2xvYmFsLCBhY2N1cmF0ZSBwYXVzZSBmdW5jdGlvblxyXG4gKiB1c2Ugc3VzcGVuZC9yZXN1bWUgZnJvbSB0aGUgY29yZSBtb2R1bGUuXHJcbiAqIEB0b2RvICAgIE5lZWRzIHRvIGJlIHJld3JpdHRlbiBzaW5jZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBzdGFydCB0aW1lcy5cclxuICogQHJldHVybiAge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gKGNvcmUuY3VycmVudFRpbWUgLSB0aGlzLnN0YXJ0VGltZSkgJSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG4gIHRoaXMuc3RvcCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHN0YXJ0cG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIHN0YXJ0IGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wU3RhcnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIC8vdGhpcy5sb29wU3RhcnQgPSB2YWx1ZSAqIHRoaXMuc291bmRMZW5ndGg7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBlbmRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3AgZW5kIGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wRW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BFbmQgPSB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHN0YXJ0IGFuZCBlbmRwb2ludCB0byBzdGFydCBlbmQgZW5kcG9pbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzZXRMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IHRoaXMuc291bmRMZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBzb3VuZCBpbiBwZXJjZW50YWdlXHJcbiAqICgxID0gMTAwJSwgMiA9IDIwMCUpXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIHJhdGUgUmF0ZSBpbiBwZXJjZW50YWdlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0UGxheWJhY2tSYXRlID0gZnVuY3Rpb24ocmF0ZSkge1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gcmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRvbmUgd2l0aGluIHR3byBvY3RhdmUgKCsvLTEyIHRvbmVzKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgc2VtaSB0b25lXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgaWYgKHNlbWlUb25lID49IC0xMiAmJiBzZW1pVG9uZSA8PSAxMikge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBzZW1pVG9uZSAqIDEwMDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZW1pIHRvbmUgaXMgJyArIHNlbWlUb25lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxhc3QgcGxheWVkIHNlbWl0b25lLiBUaGlzIGRvZXNuJ3QgaGFzIHRvIGJlIGFuXHJcbiAqIGludGVnZXIgYmV0d2VlbiAtLysxMiBhcyB0aGUgc291bmQgY2FuIGJlIGRldHVuZWQgd2l0aFxyXG4gKiBtb3JlIHByZWNpc2lvbi5cclxuICogQHJldHVybiB7ZmxvYXR9ICBTZW1pdG9uZSBiZXR3ZWVuIC0vKzEyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZSAvIDEwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXR1bmUgdGhlIHNvdW5kIG9zY2lsbGF0aW9uIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIGRldHVuZSAgZGV0dW5lIGluIGNlbnRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RGV0dW5lID0gZnVuY3Rpb24oZGV0dW5lKSB7XHJcbiAgaWYgKGRldHVuZSA+PSAtMTIwMCAmJiBkZXR1bmUgPD0gMTIwMCkge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBkZXR1bmU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRGV0dW5lIHBhcmFtZXRlciBpcyAnICsgZGV0dW5lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyMDAuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgY3VycmVudCBkZXR1bmUgaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcmV0dXJuIHtJbnRlZ2VyfSAgRGV0dW5lIGluIGNlbnRzXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RGV0dW5lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgaW4gd2hpY2ggYW4gYXVkaW8gYnVmZmVyIGxpdmVzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcgZWxzZS5cclxuICogSWYgeW91IHdhbnQgdG8gcGxheSB0aGUgc291bmQsIHlvdSBoYXZlIHRvIGFkZGl0aW9uYWxseSBjcmVhdGUgYVxyXG4gKiA8YSBocmVmPVwiU291bmQuaHRtbFwiPlNvdW5kPC9hPiBvYmplY3QuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIDwvcD48cD5cclxuICogTXVsdGlwbGUgc291cmNlcyB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIG9uZSBhdWRpbyBidWZmZXIuXHJcbiAqIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIGNyZWF0aW5nIG11bHRpcGxlIFNvdW5kV2F2ZSBvYmplY3RzLlxyXG4gKiBJdCdzIGxpa2UgYSB3YXZldGFibGU6IEFsbCBzdGFydC9lbmQgcG9zaXRpb25zIHdpbGwgYmUgc2F2ZWQgc29cclxuICogeW91IGNhbiB0cmlnZ2VyIHRoZSBvcmlnaW5hbCBzYW1wbGVzIHdpdGhvdXQgdXNpbmcgbXVsdGlwbGUgYnVmZmVycy5cclxuICogUG9zc2libGUgdXNhZ2VzIGFyZSBtdWx0aXNhbXBsZWQgc291bmRzLCBsb29wcyBvciB3YXZlc2VxdWVuY2VzIChraW5kIG9mKS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db25jYXRlbmF0ZSBtdWx0aXBsZSBzb3VyY2UgZmlsZXMgaW50byBvbmUgYnVmZmVyPGJyPlxyXG4gKiBpbiB0aGUgZ2l2ZW4gb3JkZXIgYW5kIHBsYXkgdGhlbTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdmaWxlMS53YXYsZmlsZTIud2F2LGZpbGUzLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgSW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG5cclxuICB0aGlzLmJ1ZmZlciA9IG51bGw7ICAgICAgICAgICAgIC8vQXVkaW9CdWZmZXJcclxuICB0aGlzLm1ldGFEYXRhID0gW107ICAgICAgICAgICAgICAgIC8vc3RhcnQtL2VuZHBvaW50cyBhbmQgbGVuZ3RoIG9mIHNpbmdsZSB3YXZlc1xyXG5cclxuICBpZiAoYXVkaW9TcmMpIHtcclxuICAgIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIGF1ZGlvIGJ1ZmZlciB0byBkZWNvZGVcclxuICAgICAgdGhpcy5kZWNvZGVBdWRpb0RhdGEoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9tdWx0aXBsZSBhdWRpbyBidWZmZXJzIHRvIGRlY29kZSBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgdGhpcy5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA9PT0gLTEpIHtcclxuICAgICAgLy9vbmUgZmlsZSB0byBsb2FkL2RlY29kZVxyXG4gICAgICB2YXIgYmluQnVmZmVyO1xyXG4gICAgICB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgIGJpbkJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShiaW5CdWZmZXIpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA+IC0xKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgZmlsZXMgdG8gbG9hZC9kZWNvZGUgYW5kIGNhbmNhdGluYXRlXHJcbiAgICAgIHZhciBiaW5CdWZmZXJzID0gdGhpcy5sb2FkRmlsZXMoYXVkaW9TcmMpO1xyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyKGJpbkJ1ZmZlcnMsIHRoaXMuYnVmZmVyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBTb3VuZFdhdmUgb2JqZWN0OiBVbnN1cHBvcnRlZCBkYXRhIGZvcm1hdCcpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICAvL3N0YXJ0IHRoZSBvYmplY3Qgd2l0aCBlbXB0eSBidWZmZXIuIFVzZWZ1bGwgZm9yIHRlc3RpbmcgYW5kIGFkdmFuY2VkIHVzYWdlLlxyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYmluYXJ5IGF1ZGlvIGRhdGEgYW5kIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgW2Z1bmNdICAgICAgQ2FuIGJlIHVzZWQgdG8gcnVuIGNvZGUgaW5zaWRlIHRoZSBpbm5lciBkZWNvZGUgZnVuY3Rpb24uXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUHJvbWlzZSBvYmplY3QgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIGF1ZGlvIGJ1ZmZlciBhZnRlciBkZWNvZGluZy5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMsIGZ1bmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vbmV3IHByb21pc2UgYmFzZWQgc3ludGF4IGN1cnJlbnRseSBub3QgYXZhaWxhYmxlIGluIENocm9tZSA8NDksIElFLCBTYWZhcmlcclxuICAvL1RPRE86IG1vbmtleXBhdGNoIHdpdGggY2FsbFxyXG4gIHRoaXMuYnVmZmVyID0gY29yZS5kZWNvZGVBdWRpb0RhdGEocmF3QXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgc2VsZi5idWZmZXIgPSBkZWNvZGVkO1xyXG4gICAgaWYgKGZ1bmMpIHtcclxuICAgICAgZnVuYygpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbmNhdGVuYXRlcyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgdG8gYW4gQXVkaW9CdWZmZXIuXHJcbiAqIEBwYXJhbSAge0FycmF5fSBiaW5hcnlCdWZmZXJzICBBcnJheSBob2xkaW5nIG9uZSBvciBtb3JlIEFycmF5QnVmZmVyc1xyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYXVkaW9CdWZmZXIgICBBbiBleGlzdGluZyBBdWRpb0J1ZmZlciBvYmplY3RcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgICAgICAgVGhlIGNvbmNhdGVuYXRlZCBBdWRpb0J1ZmZlclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihiaW5hcnlCdWZmZXJzLCBhdWRpb0J1ZmZlcikge1xyXG4gIGJpbmFyeUJ1ZmZlcnMuZm9yRWFjaChmdW5jdGlvbihiaW5CdWZmZXIpIHtcclxuICAgIHZhciB0bXBBdWRpb0J1ZmZlciA9IHRoaXMuZGVjb2RlQXVkaW9EYXRhKGJpbkJ1ZmZlcik7XHJcbiAgICB0aGlzLm1ldGFEYXRhLnB1c2godGhpcy5hZGRXYXZlTWV0YURhdGEoYXVkaW9CdWZmZXIsIHRtcEF1ZGlvQnVmZmVyKSk7XHJcbiAgICBhdWRpb0J1ZmZlciA9IHRoaXMuYXBwZW5kQXVkaW9CdWZmZXIoYXVkaW9CdWZmZXIsIHRtcEF1ZGlvQnVmZmVyKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIGF1ZGlvQnVmZmVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIFN1Z2dlc3RlZCBieSBDaHJpcyBXaWxzb246PGJyPlxyXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTQzNjUyL3dlYi1hdWRpby1hcGktYXBwZW5kLWNvbmNhdGVuYXRlLWRpZmZlcmVudC1hdWRpb2J1ZmZlcnMtYW5kLXBsYXktdGhlbS1hcy1vbmUtc29uXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIxIFRoZSBmaXJzdCBhdWRpbyBidWZmZXJcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjIgVGhlIHNlY29uZCBhdWRpbyBidWZmZXJcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgYnVmZmVyMSArIGJ1ZmZlcjJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYXBwZW5kQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihidWZmZXIxLCBidWZmZXIyKSB7XHJcbiAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgdmFyIHRtcCA9IGNvcmUuY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHMsXHJcbiAgICAoYnVmZmVyMS5sZW5ndGggKyBidWZmZXIyLmxlbmd0aCksXHJcbiAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZDaGFubmVsczsgaSsrKSB7XHJcbiAgICB2YXIgY2hhbm5lbCA9IHRtcC5nZXRDaGFubmVsRGF0YShpKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIyLmdldENoYW5uZWxEYXRhKGkpLCBidWZmZXIxLmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiB0bXA7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGRpY3Rpb25hcnkgd2l0aCBzdGFydC9zdG9wIHBvaW50cyBhbmQgbGVuZ3RoIGluIHNhbXBsZS1mcmFtZXNcclxuICogb2YgYW4gYXBwZW5kZWQgd2F2ZWZvcm0gYW5kIGFkZHMgaXQgdG8gdGhlIG1ldGFEYXRhIGFycmF5LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gZXhpc3RpbmdCdWZmZXIgVGhlICdvbGQnIGJ1ZmZlciB0aGF0IGdldHMgYXBwZW5kZWRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IG5ld0J1ZmZlciAgICAgIFRoZSBidWZmZXIgdGhhdCBnZXRzIGFwcGVuZGVkXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBEaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcC9sZW5ndGggZGF0YVxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5hZGRXYXZlTWV0YURhdGEgPSBmdW5jdGlvbihleGlzdGluZ0J1ZmZlciwgbmV3QnVmZmVyKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBleGlzdGluZ0J1ZmZlci5sZW5ndGggKyAxLFxyXG4gICAgZW5kOiBleGlzdGluZ0J1ZmZlci5sZW5ndGggKyBuZXdCdWZmZXIubGVuZ3RoLFxyXG4gICAgbGVuZ3RoOiBuZXdCdWZmZXIubGVuZ3RoXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIGJpbmFyeSBmaWxlIGFuZCBjYWxscyBhIGZ1bmN0aW9uIHdpdGggdGhlXHJcbiAqIHJldHVybmVkIEFycmF5QnVmZmVyIGFzIGl0cyBhcmd1bWVudCB3aGVuIGRvbmUuXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICBmaWxlbmFtZSAgICAgICBUaGUgZmlsZSB0byBiZSBsb2FkZWRcclxuICogQHBhcmFtICB7ZnVuY3Rpb259IG9ubG9hZENhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWRcclxuICogQHBhcmFtICB7Ym9vbGVhbn0gIFthc3luYz10cnVlXSAgIEFzeW5jaHJvbm91cyBsb2FkaW5nXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBhcnJheUJ1ZmZlcjtcclxuICogdGhpcy5sb2FkRmlsZSgnZmlsZTEud2F2JywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICogICBhcnJheUJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gKiB9KTtcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbihmaWxlbmFtZSwgb25sb2FkQ2FsbGJhY2ssIGFzeW5jKSB7XHJcbiAgdmFyIGFzeW5jaHJvbm91c2x5ID0gdHJ1ZTtcclxuICB2YXIgcmVxdWVzdCA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgaWYgKGFzeW5jKSB7XHJcbiAgICBhc3luY2hyb25vdXNseSA9IGFzeW5jO1xyXG4gIH1cclxuXHJcbiAgcmVxdWVzdC5vcGVuKCdHRVQnLCBmaWxlbmFtZSwgYXN5bmNocm9ub3VzbHkpO1xyXG4gIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuXHJcbiAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIG9ubG9hZENhbGxiYWNrKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gIH07XHJcblxyXG4gIHJlcXVlc3Quc2VuZCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIGJpbmFyeSBmaWxlcyBhbmQgcmV0dXJucyBhbiBhcnJheVxyXG4gKiB3aXRoIHRoZSBkYXRhIGZyb20gdGhlIGZpbGVzIGluIHRoZSBnaXZlbiBvcmRlci5cclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgTGlzdCB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICBBcnJheSBvZiBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGVzID0gZnVuY3Rpb24oZmlsZW5hbWVzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBiaW5CdWZmZXJzID0gW107XHJcbiAgdmFyIG5hbWVzID0gZmlsZW5hbWVzLnNwbGl0KCcsJyk7XHJcbiAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBzZWxmLmxvYWRGaWxlKG5hbWUsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGJpbkJ1ZmZlcnNbbmFtZV0gPSByZXNwb25zZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdGhpcy5zb3J0QmluQnVmZmVycyhuYW1lcywgYmluQnVmZmVycyk7XHJcbn07XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnNvcnRCaW5CdWZmZXJzID0gZnVuY3Rpb24oZmlsZW5hbWVzLCBiaW5CdWZmZXJzKSB7XHJcbiAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoZnVuY3Rpb24oZWwpIHtcclxuICAgIHJldHVybiBiaW5CdWZmZXJzW2VsXTtcclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmRXYXZlO1xyXG4iLCIvKipcclxuICogVGhpcyBpcyB0aGUgZm91bmRhdGlvbiBvZiB0aGUgSW50ZXJtaXggbGlicmFyeS5cclxuICogSXQgc2ltcGx5IGNyZWF0ZXMgdGhlIGF1ZGlvIGNvbnRleHQgb2JqZWN0c1xyXG4gKiBhbmQgZXhwb3J0cyBpdCBzbyBpdCBjYW4gYmUgZWFzaWx5IGNvbnN1bWVkXHJcbiAqIGZyb20gYWxsIGNsYXNzZXMgb2YgdGhlIGxpYnJhcnkuXHJcbiAqXHJcbiAqIEByZXR1cm4ge0F1ZGlvQ29udGV4dH0gVGhlIEF1ZGlvQ29udGV4dCBvYmplY3RcclxuICpcclxuICogQHRvZG8gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqIEB0b2RvIENoZWNrIGZvciBtb2JpbGUvaU9TIGNvbXBhdGliaWxpdHkuXHJcbiAqIEB0b2RvIENoZWNrIGlmIHdlJ3JlIHJ1bm5pbmcgb24gbm9kZVxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5TdXNwZW5kIGFuZCByZXN1bWUgdGhlIGF1ZGlvIGNvbnRleHQgdG9cclxuICogY3JlYXRlIGEgcGF1c2UgYnV0dG9uLiBUaGlzIHNob3VsZCBiZSB1c2VkIHdpdGggY3JlYXRlQXVkaW9Xb3JrZXJcclxuICogYXMgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gd2hlbiBzdXNwZW5kIGlzIGNhbGxlZCBvbiBhbiBvZmZsaW5lIGF1ZGlvIGNvbnRleHQuXHJcbiAqIFlvdSBjYW4gYWxzbyBwYXVzZSBzaW5nbGUgc291bmRzIHdpdGggPGk+U291bmQucGF1c2UoKTwvaT4uXHJcbiAqIFBsZWFzZSByZWFkIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3N1c3BlbmRcIj50aGUgZGV2ZWxvcGVyIGRvY3MgYXQgTUROPC9hPlxyXG4gKiB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiB0aGlzLjwvY2FwdGlvbj5cclxuICogc3VzcmVzQnRuLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuICogICBpZihJbnRlcm1peC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XHJcbiAqICAgICBJbnRlcm1peC5zdXNwZW5kKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1Jlc3VtZSBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH0gZWxzZSBpZiAoSW50ZXJtaXguc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XHJcbiAqICAgICBJbnRlcm1peC5yZXN1bWUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnU3VzcGVuZCBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH1cclxuICogfVxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGF1ZGlvQ3R4ID0gbnVsbDtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbiAgaWYgKHdpbmRvdy5BdWRpb0NvbnRleHQpIHtcclxuICAgIGF1ZGlvQ3R4ID0gbmV3IHdpbmRvdy5BdWRpb0NvbnRleHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZG5cXCd0IGluaXRpYWxpemUgdGhlIGF1ZGlvIGNvbnRleHQuJyk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXVkaW9DdHg7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIGEgd2Vid29ya2VyIHRoYXQgcHJvdmlkZXMgYSB0aW1lclxyXG4gKiB0aGF0IGZpcmVzIHRoZSBzY2hlZHVsZXIgZm9yIHRoZSBzZXF1ZW5jZXIuXHJcbiAqIFRoaXMgaXMgYmVjYXVzZSB0aW1pbmcgaGVyZSBpcyBtdWNoIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRpbWVyID0gbnVsbDtcclxudmFyIGludGVydmFsID0gMTAwO1xyXG5cclxudmFyIHdvcmtlciA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAnc3RhcnQnKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhID09PSAnc3RvcCcpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4gICAgICBpbnRlcnZhbCA9IGUuZGF0YS5pbnRlcnZhbDtcclxuICAgICAgaWYgKHRpbWVyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtlcjtcclxuXHJcbi8qZXNsaW50LWRpc2FibGUgKi9cclxuLy8gc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbi8vICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4vLyAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtwb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuLy8gICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbi8vICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuLy8gICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4vLyAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbi8vICAgICBpZiAodGltZXIpIHtcclxuLy8gICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbi8vICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7cG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIHNlbGYuY2xvc2UoKTtcclxuLy8gfTtcclxuIl19
