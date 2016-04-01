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
'use strict';

/**
 * Represents a part of a sequence. It can be
 * used in many ways:
 * <ul>
 * <li>A part of a track like in piano-roll sequencers</li>
 * <li>A pattern like in step sequencers, drum computers and trackers</li>
 * <li>A loop like in live sequencers</li>
 * </ul>
 * Technically it can store any type of event your system is capable of.
 * This means it is not limited to audio, midi, osc or dmx but can hold
 * any type of javascript object. A possible usecase would be to trigger
 * screen events with the draw function of the sequencer object.
 * @todo Add at least one usage example
 * @param  {float}  length       Length of the part in bars (4 beats)
 */
var Part = function(length) {

  this.resolution = 16; // (resolution * multiply) should alwasy be 64
  this.multiply = 4;    // resolution multiplier
  this.length = 1;      // 1 = one bar (4 beats = 1 bar)
  this.name = 'Part';   // name of this part
  this.pattern = [];    // the actual pattern with notes etc.

  if (length) {
    this.length = length;
  }

  this.pattern = this.initPattern(this.length);
};

/**
 * Initialize an empty pattern for the part.
 * @private
 * @param  {float}  length  Length of the pattern mesured in bars (4 beats = 1 bar)
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
 * Adds an event to the pattern at a given position
 * @param  {Object} seqEvent  The event (note, controller, whatever)
 * @param  {Int}    position  Position in the pattern
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.addEvent = function(seqEvent, position) {
  if (position <= this.resolution) {
    var pos = (position - 1) * this.multiply;
    this.pattern[pos].push(seqEvent);
  } else {
    throw new Error('Position out of pattern bounds.');
  }
  return this;
};

/**
 * Removes an event at a given position
 * @param  {Object} seqEvent  The event (note, controller, whatever)
 * @param  {Int}    position  Position in the pattern
 * @return {Void}
 */
Part.prototype.removeEvent = function(seqEvent, position) {
  var pos = (position - 1) * this.multiply;
  var index = this.pattern[pos].indexOf(seqEvent);
  this.pattern[pos].splice(index, 1);
};

/**
 * Get the length of the pattern in 64th notes
 * @return {Int}    Length of the pattern
 */
Part.prototype.getLength = function() {
  return this.pattern.length;
};

/**
 * Get all positions that contain at least one event.
 * This is currently unused and will probably deleted
 * in future versions.
 * @return {Array}  List with all non-empty pattern entries
 */
Part.prototype.getNotePositions = function() {
  var positions = [];
  this.pattern.forEach(function(el, index) {
    if (el.length > 0) {
      positions.push(index / this.multiply);
    }
  }, this);
  return positions;
};

/**
 * Extends a part at the top/start.
 * @param  {float}  extLength Length in bars (4 beats = 1 bar)
 * @return {Void}
 */
Part.prototype.extendOnTop = function(extLength) {
  var extension = this.initPattern(extLength);
  this.pattern = extension.concat(this.pattern);
};

/**
 * Extends a part at the end
 * @param  {float}  extLength Length in bars (4 beats = 1 bar)
 * @return {Void}
 */
Part.prototype.extendOnEnd = function(extLength) {
  var extension = this.initPattern(extLength);
  this.pattern = this.pattern.concat(extension);
};

module.exports = Part;

},{}],4:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');
var work = _dereq_('webworkify');

/**
 * Sequencer
 *
 * Scheduling inspired by "A Tale of Two Clocks" by Chris Wilson:
 * http://www.html5rocks.com/en/tutorials/audio/scheduling/
 */
var Sequencer = function() {

  var self = this;
  this.ac = core;             //currently just used for tests
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

  this.scheduleWorker.postMessage({'interval': this.interval});
};

Sequencer.prototype.scheduler = function() {
  this.now = core.currentTime;

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
  var lookAheadDelta = this.nextStepTime - core.currentTime;
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
 * Makes a copy of a flat array.
 * Uses a pre-allocated while-loop
 * which seems to be the fasted way
 * (by far) of doing this:
 * http://jsperf.com/new-array-vs-splice-vs-slice/113
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

},{"./core.js":7,"./scheduleWorker.js":8,"webworkify":2}],5:[function(_dereq_,module,exports){
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
 * This is because timing here is  more stable
 * than in the main thread.
 * The syntax is adapted to the commonjs module pattern.
 * @example <caption>It is just for library internal
 * usage. See Sequencer.js for details.</caption>
 * worker.postMessage({ 'interval': 200 });
 * worker.postMessage('start');
 * worker.postMessage('stop');
 * worker.terminate();  //webworker internal function, just for completeness
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vSW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIEludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbkludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbkludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5JbnRlcm1peC5TZXF1ZW5jZXIgPSByZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpO1xyXG5JbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEludGVybWl4O1xyXG4iLCJ2YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcblxudmFyIHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgdmFyIHdrZXk7XG4gICAgdmFyIGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICB2YXIgZXhwID0gY2FjaGVba2V5XS5leHBvcnRzO1xuICAgICAgICAvLyBVc2luZyBiYWJlbCBhcyBhIHRyYW5zcGlsZXIgdG8gdXNlIGVzbW9kdWxlLCB0aGUgZXhwb3J0IHdpbGwgYWx3YXlzXG4gICAgICAgIC8vIGJlIGFuIG9iamVjdCB3aXRoIHRoZSBkZWZhdWx0IGV4cG9ydCBhcyBhIHByb3BlcnR5IG9mIGl0LiBUbyBlbnN1cmVcbiAgICAgICAgLy8gdGhlIGV4aXN0aW5nIGFwaSBhbmQgYmFiZWwgZXNtb2R1bGUgZXhwb3J0cyBhcmUgYm90aCBzdXBwb3J0ZWQgd2VcbiAgICAgICAgLy8gY2hlY2sgZm9yIGJvdGhcbiAgICAgICAgaWYgKGV4cCA9PT0gZm4gfHwgZXhwLmRlZmF1bHQgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXdrZXkpIHtcbiAgICAgICAgd2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgd2NhY2hlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgICAgIHdjYWNoZVtrZXldID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZXNbd2tleV0gPSBbXG4gICAgICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnLCdtb2R1bGUnLCdleHBvcnRzJ10sICcoJyArIGZuICsgJykoc2VsZiknKSxcbiAgICAgICAgICAgIHdjYWNoZVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgc2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuXG4gICAgdmFyIHNjYWNoZSA9IHt9OyBzY2FjaGVbd2tleV0gPSB3a2V5O1xuICAgIHNvdXJjZXNbc2tleV0gPSBbXG4gICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZSddLCAoXG4gICAgICAgICAgICAvLyB0cnkgdG8gY2FsbCBkZWZhdWx0IGlmIGRlZmluZWQgdG8gYWxzbyBzdXBwb3J0IGJhYmVsIGVzbW9kdWxlXG4gICAgICAgICAgICAvLyBleHBvcnRzXG4gICAgICAgICAgICAndmFyIGYgPSByZXF1aXJlKCcgKyBzdHJpbmdpZnkod2tleSkgKyAnKTsnICtcbiAgICAgICAgICAgICcoZi5kZWZhdWx0ID8gZi5kZWZhdWx0IDogZikoc2VsZik7J1xuICAgICAgICApKSxcbiAgICAgICAgc2NhY2hlXG4gICAgXTtcblxuICAgIHZhciBzcmMgPSAnKCcgKyBidW5kbGVGbiArICcpKHsnXG4gICAgICAgICsgT2JqZWN0LmtleXMoc291cmNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdpZnkoa2V5KSArICc6WydcbiAgICAgICAgICAgICAgICArIHNvdXJjZXNba2V5XVswXVxuICAgICAgICAgICAgICAgICsgJywnICsgc3RyaW5naWZ5KHNvdXJjZXNba2V5XVsxXSkgKyAnXSdcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSkuam9pbignLCcpXG4gICAgICAgICsgJ30se30sWycgKyBzdHJpbmdpZnkoc2tleSkgKyAnXSknXG4gICAgO1xuXG4gICAgdmFyIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCB8fCB3aW5kb3cubW96VVJMIHx8IHdpbmRvdy5tc1VSTDtcblxuICAgIHJldHVybiBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgIG5ldyBCbG9iKFtzcmNdLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pXG4gICAgKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBwYXJ0IG9mIGEgc2VxdWVuY2UuIEl0IGNhbiBiZVxyXG4gKiB1c2VkIGluIG1hbnkgd2F5czpcclxuICogPHVsPlxyXG4gKiA8bGk+QSBwYXJ0IG9mIGEgdHJhY2sgbGlrZSBpbiBwaWFuby1yb2xsIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8bGk+QSBwYXR0ZXJuIGxpa2UgaW4gc3RlcCBzZXF1ZW5jZXJzLCBkcnVtIGNvbXB1dGVycyBhbmQgdHJhY2tlcnM8L2xpPlxyXG4gKiA8bGk+QSBsb29wIGxpa2UgaW4gbGl2ZSBzZXF1ZW5jZXJzPC9saT5cclxuICogPC91bD5cclxuICogVGVjaG5pY2FsbHkgaXQgY2FuIHN0b3JlIGFueSB0eXBlIG9mIGV2ZW50IHlvdXIgc3lzdGVtIGlzIGNhcGFibGUgb2YuXHJcbiAqIFRoaXMgbWVhbnMgaXQgaXMgbm90IGxpbWl0ZWQgdG8gYXVkaW8sIG1pZGksIG9zYyBvciBkbXggYnV0IGNhbiBob2xkXHJcbiAqIGFueSB0eXBlIG9mIGphdmFzY3JpcHQgb2JqZWN0LiBBIHBvc3NpYmxlIHVzZWNhc2Ugd291bGQgYmUgdG8gdHJpZ2dlclxyXG4gKiBzY3JlZW4gZXZlbnRzIHdpdGggdGhlIGRyYXcgZnVuY3Rpb24gb2YgdGhlIHNlcXVlbmNlciBvYmplY3QuXHJcbiAqIEB0b2RvIEFkZCBhdCBsZWFzdCBvbmUgdXNhZ2UgZXhhbXBsZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgICAgICBMZW5ndGggb2YgdGhlIHBhcnQgaW4gYmFycyAoNCBiZWF0cylcclxuICovXHJcbnZhciBQYXJ0ID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcblxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDE2OyAvLyAocmVzb2x1dGlvbiAqIG11bHRpcGx5KSBzaG91bGQgYWx3YXN5IGJlIDY0XHJcbiAgdGhpcy5tdWx0aXBseSA9IDQ7ICAgIC8vIHJlc29sdXRpb24gbXVsdGlwbGllclxyXG4gIHRoaXMubGVuZ3RoID0gMTsgICAgICAvLyAxID0gb25lIGJhciAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gIHRoaXMubmFtZSA9ICdQYXJ0JzsgICAvLyBuYW1lIG9mIHRoaXMgcGFydFxyXG4gIHRoaXMucGF0dGVybiA9IFtdOyAgICAvLyB0aGUgYWN0dWFsIHBhdHRlcm4gd2l0aCBub3RlcyBldGMuXHJcblxyXG4gIGlmIChsZW5ndGgpIHtcclxuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5pbml0UGF0dGVybih0aGlzLmxlbmd0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhbiBlbXB0eSBwYXR0ZXJuIGZvciB0aGUgcGFydC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggIExlbmd0aCBvZiB0aGUgcGF0dGVybiBtZXN1cmVkIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmluaXRQYXR0ZXJuID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcbiAgdmFyIHBhdHRlcm4gPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IChsZW5ndGggKiA2NCk7IGkrKykge1xyXG4gICAgcGF0dGVybltpXSA9IFtdO1xyXG4gIH1cclxuICByZXR1cm4gcGF0dGVybjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IHRvIHRoZSBwYXR0ZXJuIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbiAtIDEpICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvc2l0aW9uIG91dCBvZiBwYXR0ZXJuIGJvdW5kcy4nKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbiBldmVudCBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIHZhciBwb3MgPSAocG9zaXRpb24gLSAxKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgdmFyIGluZGV4ID0gdGhpcy5wYXR0ZXJuW3Bvc10uaW5kZXhPZihzZXFFdmVudCk7XHJcbiAgdGhpcy5wYXR0ZXJuW3Bvc10uc3BsaWNlKGluZGV4LCAxKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge0ludH0gICAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wYXR0ZXJuLmxlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYWxsIHBvc2l0aW9ucyB0aGF0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGV2ZW50LlxyXG4gKiBUaGlzIGlzIGN1cnJlbnRseSB1bnVzZWQgYW5kIHdpbGwgcHJvYmFibHkgZGVsZXRlZFxyXG4gKiBpbiBmdXR1cmUgdmVyc2lvbnMuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpO1xyXG5cclxuLyoqXHJcbiAqIFNlcXVlbmNlclxyXG4gKlxyXG4gKiBTY2hlZHVsaW5nIGluc3BpcmVkIGJ5IFwiQSBUYWxlIG9mIFR3byBDbG9ja3NcIiBieSBDaHJpcyBXaWxzb246XHJcbiAqIGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2F1ZGlvL3NjaGVkdWxpbmcvXHJcbiAqL1xyXG52YXIgU2VxdWVuY2VyID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMuYmVhdHNQZXJNaW51dGUgPSAxMjA7ICAvL2JlYXRzIHBlciBtaW51dGVcclxuICB0aGlzLnJlc29sdXRpb24gPSA2NDsgICAgICAgLy9zaG9ydGVzdCBwb3NzaWJsZSBub3RlLiBZb3Ugbm9ybWFsbHkgZG9uJ3Qgd2FudCB0byB0b3VjaCB0aGlzLlxyXG4gIHRoaXMuaW50ZXJ2YWwgPSAxMDA7ICAgICAgICAvL3RoZSBpbnRlcnZhbCBpbiBtaWxpc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGdldHMgaW52b2tlZC5cclxuICB0aGlzLmxvb2thaGVhZCA9IDAuMzsgICAgICAgLy90aW1lIGluIHNlY29uZHMgdGhlIHNjaGVkdWxlciBsb29rcyBhaGVhZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9zaG91bGQgYmUgbG9uZ2VyIHRoYW4gaW50ZXJ2YWwuXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAgIC8vTGlzdCB3aXRoIGFsbCBwYXJ0cyBvZiB0aGUgc2NvcmVcclxuICB0aGlzLnJ1blF1ZXVlID0gW107ICAgICAgICAgLy9saXN0IHdpdGggcGFydHMgdGhhdCBhcmUgcGxheWluZyBvciB3aWxsIGJlIHBsYXllZCBzaG9ydGx5XHJcblxyXG4gIHRoaXMubm93OyAgICAgICAgICAgICAgICAgICAgLy90aW1lc3RhbXAgZnJvbSBhdWRpb2NvbnRleHQgd2hlbiB0aGUgc2NoZWR1bGVyIGlzIGludm9rZWQuXHJcbiAgdGhpcy50aW1lUGVyU3RlcDsgICAgICAgICAgIC8vcGVyaW9kIG9mIHRpbWUgYmV0d2VlbiB0d28gc3RlcHNcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7ICAgICAgLy90aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgbmV4dCBzdGVwIHdpbGwgYmUgdHJpZ2dlcmVkXHJcbiAgdGhpcy5uZXh0U3RlcCA9IDA7ICAgICAgICAgIC8vcG9zaXRpb24gaW4gdGhlIHF1ZXVlIHRoYXQgd2lsbCBnZXQgdHJpZ2dlcmVkIG5leHRcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gMDsgICAgLy9zdGVwIGluIHF1ZXVlIHRoYXQgd2FzIHBsYXllZCAobm90IHRyaWdnZXJlZCkgcmVjZW50bHkgKHVzZWQgZm9yIGRyYXdpbmcpLlxyXG4gIHRoaXMubG9vcCA9IGZhbHNlOyAgICAgICAgICAvL3BsYXkgYSBzZWN0aW9uIG9mIHRoZSBxdWV1ZSBpbiBhIGxvb3BcclxuICB0aGlzLmxvb3BTdGFydDsgICAgICAgICAgICAgLy9maXJzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5sb29wRW5kOyAgICAgICAgICAgICAgIC8vbGFzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTsgICAgIC8vdHJ1ZSBpZiBzZXF1ZW5jZXIgaXMgcnVubmluZywgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgdGhpcy5hbmltYXRpb25GcmFtZTsgICAgICAgIC8vaGFzIHRvIGJlIG92ZXJyaWRkZW4gd2l0aCBhIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBpbiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9kcmF3IGZ1bmN0aW9uIHdpdGggdGhlIGxhc3RQbGF5ZWRTdGVwIGludCBhcyBwYXJhbWV0ZXIuXHJcblxyXG4gIC8vIHNldCB0aW1lIHBlciBzZXRUaW1lUGVyU3RlcFxyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKHRoaXMuYmVhdHNQZXJNaW51dGUsIHRoaXMucmVzb2x1dGlvbik7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgdGhlIHNjaGVkdWxlci10aW1lclxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIgPSB3b3JrKHJlcXVpcmUoJy4vc2NoZWR1bGVXb3JrZXIuanMnKSk7XHJcblxyXG4gIC8qZXNsaW50LWVuYWJsZSAqL1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICd0aWNrJykge1xyXG4gICAgICBzZWxmLnNjaGVkdWxlcigpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoeydpbnRlcnZhbCc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5ub3cgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG5cclxuICBpZiAodGhpcy5uZXh0U3RlcFRpbWUgPT09IDApIHtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lID0gdGhpcy5ub3c7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCB0aGlzLm5vdyArIHRoaXMubG9va2FoZWFkKSB7XHJcbiAgICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXSkge1xyXG4gICAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICAgIHRoaXMucnVuUXVldWUucHVzaCh7XHJcbiAgICAgICAgICAnaW5zdHJ1bWVudCc6IHBhcnQuaW5zdHJ1bWVudCxcclxuICAgICAgICAgICdwYXR0ZXJuJzogdGhpcy5jb3B5QXJyYXkocGFydC5wYXR0ZXJuKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJ1blF1ZXVlLmZvckVhY2goZnVuY3Rpb24ocGFydCwgaW5kZXgpIHtcclxuICAgICAgdmFyIHNlcUV2ZW50cyA9IHBhcnQucGF0dGVybi5zaGlmdCgpOyAgLy9yZXR1cm4gZmlyc3QgZWxlbWVudCBhbmQgcmVtb3ZlIGl0IGZyb20gcGFydFxyXG4gICAgICBpZiAoc2VxRXZlbnRzKSB7XHJcbiAgICAgICAgLy92YXIgaW5zdHJ1bWVudCA9IHBhcnQuaW5zdHJ1bWVudDtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgaWYgKHNlcUV2ZW50Lm5vdGUpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBzaG91bGQgYmUgZXh0ZW5kZWQgdG8gcGxheSByZWFsIG5vdGVzXHJcbiAgICAgICAgICAgIHBhcnQuaW5zdHJ1bWVudC5wbGF5KHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoc2VxRXZlbnQuY29udHJvbGxlcikge1xyXG4gICAgICAgICAgICAvLyBwcm9jZXNzIGNvbnRyb2xsZXIgZXZlbnQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9yZW1vdmUgcGFydCBmcm9tIHJ1blF1ZXVlIGlmIGVtcHR5XHJcbiAgICAgICAgICBpZiAocGFydC5wYXR0ZXJuLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJ1blF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSArPSB0aGlzLnRpbWVQZXJTdGVwO1xyXG5cclxuICAgIC8vIHNldCBwb2ludGVyIHRvIHRoZSBuZXh0IHN0ZXAgaW4gdGhlIHF1ZXVlIHRoYXQgc2hvdWxkIGJlIHBsYXllZC5cclxuICAgIC8vIElmIHdlJ3JlIHBsYXlpbmcgaW4gbG9vcCBtb2RlLCBqdW1wIGJhY2sgdG8gbG9vcHN0YXJ0IHdoZW5cclxuICAgIC8vIGVuZCBvZiBsb29wIGlzIHJlYWNoZWQuXHJcbiAgICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICAgIGlmICh0aGlzLm5leHRTdGVwID49IHRoaXMubG9vcEVuZCkge1xyXG4gICAgICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgICAgICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSB0cnVlO1xyXG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIGZpcnN0IHdlJ2xsIGhhdmUgdG8gZmluZCBvdXQsIHdoYXQgc3RlcCB3YXMgcmVjZW50bHkgcGxheWVkLlxyXG4gIC8vIHRoaXMgaXMgc29tZWhvdyBjbHVtc3kgYmVjYXVzZSB0aGUgc2VxdWVuY2VyIGRvZXNuJ3Qga2VlcCB0cmFjayBvZiB0aGF0LlxyXG4gIHZhciBsb29rQWhlYWREZWx0YSA9IHRoaXMubmV4dFN0ZXBUaW1lIC0gY29yZS5jdXJyZW50VGltZTtcclxuICB2YXIgc3RlcHNBaGVhZCA9IE1hdGguZmxvb3IobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKSArIDE7XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG5cclxuICAvL3Nob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHRoZSBhcHBsaWNhdGlvblxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWUodGhpcy5sYXN0UGxheWVkU3RlcCk7XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKCF0aGlzLnF1ZXVlW3Bvc2l0aW9uXSkge1xyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICB9XHJcbiAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ucHVzaChwYXJ0KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY3JlYXRlTm90ZUV2ZW50ID0gZnVuY3Rpb24obm90ZSwgbGVuZ3RoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICdub3RlJzogbm90ZSxcclxuICAgICdsZW5ndGgnOiBsZW5ndGhcclxuICB9O1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIFBsYXlzIGEgc291bmQgZnJvbSBhIFNvdW5kV2F2ZSBvYmplY3QuXHJcbiAqIFRoZSBzb3VuZCBjYW4gYmUgc3RhcnRlZC9zdG9wcGVkL3BhdXNlZC5cclxuICogSXQgY2FuIGFsc28gYmUgbG9vcGVkIHdpdGggYW4gYWRqdXN0YWJsZSBsb29wIHJhbmdlLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdhdWRpb2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5zdGFydCgpO1xyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNvdW5kV2F2ZSBTb3VuZFdhdmUgb2JqZWN0IGluY2x1ZGluZyB0aGUgYnVmZmVyIHdpdGggYXVkaW8gZGF0YSB0byBiZSBwbGF5ZWRcclxuICovXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKHNvdW5kV2F2ZSkge1xyXG5cclxuICB0aGlzLndhdmUgPSBudWxsO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7ICAgICAvL3RoZSBvZmZzZXQgd2l0aGluIHRoZSB3YXZlZm9ybVxyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDsgICAgICAgLy93aGVuIHRoZSBzb3VuZCBzdGFydHMgdG8gcGxheVxyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gMTtcclxuICB0aGlzLmRldHVuZSA9IDA7XHJcblxyXG4gIGlmIChzb3VuZFdhdmUpIHtcclxuICAgIHRoaXMud2F2ZSA9IHNvdW5kV2F2ZTtcclxuICAgIHRoaXMuYnVmZmVyID0gc291bmRXYXZlLmJ1ZmZlcjtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuICAgIHRoaXMuc2V0dXBBdWRpb0NoYWluKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgaW5pdGlhbGlzaW5nIFNvdW5kIG9iamVjdDogcGFyYW1ldGVyIG1pc3NpbmcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBnYWluIGFuZCBzdGVyZW8tcGFubmVyIG5vZGUsIGNvbm5lY3RzIHRoZW1cclxuICogKGdhaW4gLT4gcGFubmVyKSBhbmQgc2V0cyBnYWluIHRvIDEgKG1heCB2YWx1ZSkuXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IGNvcmUuY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IGNvcmUuY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QoY29yZS5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgQnVmZmVyU291cmNlTm9kZVxyXG4gKiB0aGF0IGNhbiBiZSBwbGF5ZWQgb25jZSBhbmQgdGhlbiBkZXN0cm95cyBpdHNlbGYuXHJcbiAqIEByZXR1cm4ge0J1ZmZlclNvdXJjZU5vZGV9IFRoZSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSBjb3JlLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICBidWZmZXJTb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcclxuICBidWZmZXJTb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnb25lbmRlZCBmaXJlZCcpO1xyXG4gICAgc2VsZi5kZXN0cm95QnVmZmVyU291cmNlKGJ1ZmZlclNvdXJjZSk7XHJcbiAgfTtcclxuICByZXR1cm4gYnVmZmVyU291cmNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlc3Ryb3llcyBhIGdpdmVuIEF1ZGlvQnVmZmVyU291cmNlTm9kZSBhbmQgZGVsZXRlcyBpdFxyXG4gKiBmcm9tIHRoZSBzb3VyY2VOb2RlIHF1ZXVlLiBUaGlzIGlzIHVzZWQgaW4gdGhlIG9uZW5kZWRcclxuICogY2FsbGJhY2sgb2YgYWxsIEJ1ZmZlclNvdXJjZU5vZGVzLlxyXG4gKiBUaGlzIGlzIHByb2JhYmx5IGZ1dGlsZSBzaW5jZSB3ZSBhbHJlYWR5IGRlbGV0ZSBhbGwgbm9kZVxyXG4gKiByZWZlcmVuY2VzIGluIHRoZSBzdG9wIG1ldGhvZC5cclxuICogQHRvZG8gICBDaGVjayBpZiB0aGlzIGNhbiBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyU291cmNlTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkZWxheSAgICAgIFRpbWUgaW4gc2Vjb25kcyB0aGUgc291bmQgcGF1c2VzIGJlZm9yZSB0aGUgc3RyZWFtIHN0YXJ0c1xyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihkZWxheSwgcGxheUxvb3BlZCwgZHVyYXRpb24pIHtcclxuICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgaWYgKGRlbGF5KSB7XHJcbiAgICBzdGFydFRpbWUgPSBkZWxheTtcclxuICB9IGVsc2Uge1xyXG4gICAgc3RhcnRUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICB9XHJcbiAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcbiAgaWYgKHBsYXlMb29wZWQpIHtcclxuICAgIGJzLmxvb3AgPSBwbGF5TG9vcGVkO1xyXG4gICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICBicy5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG4gIH1cclxuXHJcbiAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgYnMuZGV0dW5lLnZhbHVlID0gdGhpcy5kZXR1bmU7XHJcblxyXG4gIC8vIGlmIChwbGF5TG9vcGVkKSB7XHJcbiAgLy8gICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAvLyAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgLy8gfVxyXG5cclxuICAvLyBpZiAodGhpcy5zdGFydE9mZnNldCA9PT0gMCB8fCB0aGlzLnN0YXJ0T2Zmc2V0ID49IHRoaXMuYnVmZmVyLmR1cmF0aW9uKSB7XHJcbiAgLy8gICBjb25zb2xlLmxvZygncmVzZXR0aW5nIHN0YXJ0dGltZScpO1xyXG4gIC8vICAgdGhpcy5zdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIC8vIH1cclxuICB0aGlzLnF1ZXVlLnB1c2goYnMpO1xyXG4gIC8vYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuXHJcbiAgaWYgKGR1cmF0aW9uKSB7XHJcbiAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQsIGR1cmF0aW9uKTtcclxuICB9IGVsc2Uge1xyXG4gICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICB9XHJcblxyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW0sIGV2ZW4gdGhlIG9uZXMgdGhhdCBhcmUganVzdCBzY2hlZHVsZWQuXHJcbiAqIEl0IGFsc28gY2xlYW5zIHRoZSBxdWV1ZSBzbyB0aGF0IHRoZSBzb3VuZCBvYmplY3QgaXMgcmVhZHkgZm9yIGFub3RoZXIgcm91bmQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgIG5vZGUuc3RvcCgpO1xyXG4gICAgICBub2RlLmRpc2Nvbm5lY3QoKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5xdWV1ZSA9IFtdOyAgLy9yZWxlYXNlIGFsbCByZWZlcmVuY2VzXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vZmFpbCBzaWxlbnRseVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyB0aGUgYXVkaW8gc3RyZWFtIGFuZCBzdG9yZSB0aGUgY3VycmVudCBwb3NpdGlvbnNcclxuICogYXMgYW4gb2Zmc2V0IGZvciB3aGVuIHRoZSBzb3VuZCBnZXQgcmVzdGFydGVkLlxyXG4gKiBSZW1lbWJlciB0aGF0IHRoaXMgZG9lc24ndCB3b3JrIHdpdGggbG9vcHMgdGhhdCBhcmUgc2hvcnRlclxyXG4gKiB0aGFuIHRoZSBidWZmZXIgaXRzZWxmLiBJZiB5b3Ugd2FudCBhIGdsb2JhbCwgYWNjdXJhdGUgcGF1c2UgZnVuY3Rpb25cclxuICogdXNlIHN1c3BlbmQvcmVzdW1lIGZyb20gdGhlIGNvcmUgbW9kdWxlLlxyXG4gKiBAdG9kbyAgICBOZWVkcyB0byBiZSByZXdyaXR0ZW4gc2luY2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgc3RhcnQgdGltZXMuXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IChjb3JlLmN1cnJlbnRUaW1lIC0gdGhpcy5zdGFydFRpbWUpICUgdGhpcy5zb3VuZExlbmd0aDtcclxuICB0aGlzLnN0b3AoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdGFydHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBzdGFydCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAvL3RoaXMubG9vcFN0YXJ0ID0gdmFsdWUgKiB0aGlzLnNvdW5kTGVuZ3RoO1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgZW5kcG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIGVuZCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcEVuZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wRW5kID0gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoZSBzdGFydCBhbmQgZW5kcG9pbnQgdG8gc3RhcnQgZW5kIGVuZHBvaW50IG9mIHRoZSBBdWRpb0J1ZmZlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlc2V0TG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgc291bmQgaW4gcGVyY2VudGFnZVxyXG4gKiAoMSA9IDEwMCUsIDIgPSAyMDAlKVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICByYXRlIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHJhdGUpIHtcclxuICB0aGlzLnBsYXliYWNrUmF0ZSA9IHJhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGVcclxuICogQHJldHVybiB7ZmxvYXR9ICBUaGUgcGxheWJhY2sgcmF0ZSBpbiBwZXJjZW50YWdlICgxLjI1ID0gMTI1JSlcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wbGF5YmFja1JhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSB0b25lIHdpdGhpbiB0d28gb2N0YXZlICgrLy0xMiB0b25lcylcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHNlbWkgdG9uZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFRvbmUgPSBmdW5jdGlvbihzZW1pVG9uZSkge1xyXG4gIGlmIChzZW1pVG9uZSA+PSAtMTIgJiYgc2VtaVRvbmUgPD0gMTIpIHtcclxuICAgIHRoaXMuZGV0dW5lID0gc2VtaVRvbmUgKiAxMDA7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignU2VtaSB0b25lIGlzICcgKyBzZW1pVG9uZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMi4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsYXN0IHBsYXllZCBzZW1pdG9uZS4gVGhpcyBkb2Vzbid0IGhhcyB0byBiZSBhblxyXG4gKiBpbnRlZ2VyIGJldHdlZW4gLS8rMTIgYXMgdGhlIHNvdW5kIGNhbiBiZSBkZXR1bmVkIHdpdGhcclxuICogbW9yZSBwcmVjaXNpb24uXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgU2VtaXRvbmUgYmV0d2VlbiAtLysxMlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmUgLyAxMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0dW5lIHRoZSBzb3VuZCBvc2NpbGxhdGlvbiBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICBkZXR1bmUgIGRldHVuZSBpbiBjZW50c1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldERldHVuZSA9IGZ1bmN0aW9uKGRldHVuZSkge1xyXG4gIGlmIChkZXR1bmUgPj0gLTEyMDAgJiYgZGV0dW5lIDw9IDEyMDApIHtcclxuICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldHVuZSBwYXJhbWV0ZXIgaXMgJyArIGRldHVuZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMjAwLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgdGhlIGN1cnJlbnQgZGV0dW5lIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHJldHVybiB7SW50ZWdlcn0gIERldHVuZSBpbiBjZW50c1xyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldERldHVuZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cigyLCA4KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIENyZWF0ZXMgYSB3cmFwcGVyIGluIHdoaWNoIGFuIGF1ZGlvIGJ1ZmZlciBsaXZlcy5cclxuICogQSBTb3VuZFdhdmUgb2JqZWN0IGp1c3QgaG9sZHMgYXVkaW8gZGF0YSBhbmQgZG9lcyBub3RoaW5nIGVsc2UuXHJcbiAqIElmIHlvdSB3YW50IHRvIHBsYXkgdGhlIHNvdW5kLCB5b3UgaGF2ZSB0byBhZGRpdGlvbmFsbHkgY3JlYXRlIGFcclxuICogPGEgaHJlZj1cIlNvdW5kLmh0bWxcIj5Tb3VuZDwvYT4gb2JqZWN0LlxyXG4gKiBJdCBjYW4gaGFuZGxlIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICogKCoud2F2LCAqLm1wMykgYXMgZGF0YSBzb3VyY2VzLlxyXG4gKiA8L3A+PHA+XHJcbiAqIE11bHRpcGxlIHNvdXJjZXMgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byBvbmUgYXVkaW8gYnVmZmVyLlxyXG4gKiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBjcmVhdGluZyBtdWx0aXBsZSBTb3VuZFdhdmUgb2JqZWN0cy5cclxuICogSXQncyBsaWtlIGEgd2F2ZXRhYmxlOiBBbGwgc3RhcnQvZW5kIHBvc2l0aW9ucyB3aWxsIGJlIHNhdmVkIHNvXHJcbiAqIHlvdSBjYW4gdHJpZ2dlciB0aGUgb3JpZ2luYWwgc2FtcGxlcyB3aXRob3V0IHVzaW5nIG11bHRpcGxlIGJ1ZmZlcnMuXHJcbiAqIFBvc3NpYmxlIHVzYWdlcyBhcmUgbXVsdGlzYW1wbGVkIHNvdW5kcywgbG9vcHMgb3Igd2F2ZXNlcXVlbmNlcyAoa2luZCBvZikuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+UGxheSBhIHNvdW5kIGZyb20gYW4gYXVkaW8gZmlsZTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdmaWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgSW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q29uY2F0ZW5hdGUgbXVsdGlwbGUgc291cmNlIGZpbGVzIGludG8gb25lIGJ1ZmZlcjxicj5cclxuICogaW4gdGhlIGdpdmVuIG9yZGVyIGFuZCBwbGF5IHRoZW06PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZSgnZmlsZTEud2F2LGZpbGUyLndhdixmaWxlMy53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IEludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlxyXG4gKiBVc2luZyBBcnJheUJ1ZmZlcnMgaW5zdGVhZCBvZiBmaWxlbmFtZXMgd2lsbCBjb21lIGluIGhhbmR5IGlmIHlvdSB3YW50PGJyPlxyXG4gKiB0byBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIFhIUiBvciB1c2UgYSBwcmVsb2FkZXIgKGhlcmU6IHByZWxvYWQuanMpOlxyXG4gKiA8L2NhcHRpb24+XHJcbiAqIHZhciBxdWV1ZSA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKTtcclxuICogcXVldWUub24oJ2NvbXBsZXRlJywgaGFuZGxlQ29tcGxldGUpO1xyXG4gKiBxdWV1ZS5sb2FkTWFuaWZlc3QoW1xyXG4gKiAgICAge2lkOiAnc3JjMScsIHNyYzonZmlsZTEud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9LFxyXG4gKiAgICAge2lkOiAnc3JjMicsIHNyYzonZmlsZTIud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9XHJcbiAqIF0pO1xyXG4gKlxyXG4gKiBmdW5jdGlvbiBoYW5kbGVDb21wbGV0ZSgpIHtcclxuICogICAgIHZhciBiaW5EYXRhMSA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMScpO1xyXG4gKiAgICAgdmFyIGJpbkRhdGEyID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMyJyk7XHJcbiAqICAgICB2YXIgd2F2ZTEgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGExKTtcclxuICogICAgIHZhciB3YXZlMiA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTIpO1xyXG4gKiAgICAgdmFyIGNvbmNhdFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKFtiaW5EYXRhMSwgYmluRGF0YTJdKTtcclxuICogfTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAgeyhPYmplY3R8T2JqZWN0W118c3RyaW5nKX0gYXVkaW9TcmMgICBPbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqL1xyXG52YXIgU291bmRXYXZlID0gZnVuY3Rpb24oYXVkaW9TcmMpIHtcclxuXHJcbiAgdGhpcy5idWZmZXIgPSBudWxsOyAgICAgICAgICAgICAvL0F1ZGlvQnVmZmVyXHJcbiAgdGhpcy5tZXRhRGF0YSA9IFtdOyAgICAgICAgICAgICAgICAvL3N0YXJ0LS9lbmRwb2ludHMgYW5kIGxlbmd0aCBvZiBzaW5nbGUgd2F2ZXNcclxuXHJcbiAgaWYgKGF1ZGlvU3JjKSB7XHJcbiAgICBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL29uZSBhdWRpbyBidWZmZXIgdG8gZGVjb2RlXHJcbiAgICAgIHRoaXMuZGVjb2RlQXVkaW9EYXRhKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiBhdWRpb1NyY1swXSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgYXVkaW8gYnVmZmVycyB0byBkZWNvZGUgYW5kIGNvbmNhdGVuYXRlXHJcbiAgICAgIHRoaXMuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPT09IC0xKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdmFyIGJpbkJ1ZmZlcjtcclxuICAgICAgdGhpcy5sb2FkRmlsZShhdWRpb1NyYywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICBiaW5CdWZmZXIgPSByZXNwb25zZTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYmluQnVmZmVyKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPiAtMSkge1xyXG4gICAgICAvL211bHRpcGxlIGZpbGVzIHRvIGxvYWQvZGVjb2RlIGFuZCBjYW5jYXRpbmF0ZVxyXG4gICAgICB2YXIgYmluQnVmZmVycyA9IHRoaXMubG9hZEZpbGVzKGF1ZGlvU3JjKTtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihiaW5CdWZmZXJzLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgU291bmRXYXZlIG9iamVjdDogVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9zdGFydCB0aGUgb2JqZWN0IHdpdGggZW1wdHkgYnVmZmVyLiBVc2VmdWxsIGZvciB0ZXN0aW5nIGFuZCBhZHZhbmNlZCB1c2FnZS5cclxuICB9XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGJpbmFyeSBhdWRpbyBkYXRhIGFuZCB0dXJucyBpdCBpbnRvIGFuIGF1ZGlvIGJ1ZmZlciBvYmplY3QuXHJcbiAqIFRoaXMgaXMgYSB3cmFwcGVyIGZvciB0aGUgd2ViLWF1ZGlvLWFwaSBkZWNvZGVBdWRpb0RhdGEgZnVuY3Rpb24uXHJcbiAqIEl0IHVzZXMgdGhlIG5ldyBwcm9taXNlIHN5bnRheCBzbyBpdCBwcm9iYWJseSB3b24ndCB3b3JrIGluIGFsbCBicm93c2VycyBieSBub3cuXHJcbiAqIEBwYXJhbSAge0FycmF5QnVmZmVyfSAgcmF3QXVkaW9TcmMgQXVkaW8gZGF0YSBpbiByYXcgYmluYXJ5IGZvcm1hdFxyXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gICAgIFtmdW5jXSAgICAgIENhbiBiZSB1c2VkIHRvIHJ1biBjb2RlIGluc2lkZSB0aGUgaW5uZXIgZGVjb2RlIGZ1bmN0aW9uLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICAgICAgIFByb21pc2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBhdWRpbyBidWZmZXIgYWZ0ZXIgZGVjb2RpbmcuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKHJhd0F1ZGlvU3JjLCBmdW5jKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAvL25ldyBwcm9taXNlIGJhc2VkIHN5bnRheCBjdXJyZW50bHkgbm90IGF2YWlsYWJsZSBpbiBDaHJvbWUgPDQ5LCBJRSwgU2FmYXJpXHJcbiAgLy9UT0RPOiBtb25rZXlwYXRjaCB3aXRoIGNhbGxcclxuICB0aGlzLmJ1ZmZlciA9IGNvcmUuZGVjb2RlQXVkaW9EYXRhKHJhd0F1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgIGlmIChmdW5jKSB7XHJcbiAgICAgIGZ1bmMoKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb25jYXRlbmF0ZXMgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIHRvIGFuIEF1ZGlvQnVmZmVyLlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gYmluYXJ5QnVmZmVycyAgQXJyYXkgaG9sZGluZyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnNcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGF1ZGlvQnVmZmVyICAgQW4gZXhpc3RpbmcgQXVkaW9CdWZmZXIgb2JqZWN0XHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgICAgICAgIFRoZSBjb25jYXRlbmF0ZWQgQXVkaW9CdWZmZXJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYmluYXJ5QnVmZmVycywgYXVkaW9CdWZmZXIpIHtcclxuICBiaW5hcnlCdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYmluQnVmZmVyKSB7XHJcbiAgICB2YXIgdG1wQXVkaW9CdWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShiaW5CdWZmZXIpO1xyXG4gICAgdGhpcy5tZXRhRGF0YS5wdXNoKHRoaXMuYWRkV2F2ZU1ldGFEYXRhKGF1ZGlvQnVmZmVyLCB0bXBBdWRpb0J1ZmZlcikpO1xyXG4gICAgYXVkaW9CdWZmZXIgPSB0aGlzLmFwcGVuZEF1ZGlvQnVmZmVyKGF1ZGlvQnVmZmVyLCB0bXBBdWRpb0J1ZmZlcik7XHJcbiAgfSwgdGhpcyk7XHJcblxyXG4gIHJldHVybiBhdWRpb0J1ZmZlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBcHBlbmRzIHR3byBhdWRpbyBidWZmZXJzLiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOjxicj5cclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDE0MzY1Mi93ZWItYXVkaW8tYXBpLWFwcGVuZC1jb25jYXRlbmF0ZS1kaWZmZXJlbnQtYXVkaW9idWZmZXJzLWFuZC1wbGF5LXRoZW0tYXMtb25lLXNvblxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMSBUaGUgZmlyc3QgYXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIyIFRoZSBzZWNvbmQgYXVkaW8gYnVmZmVyXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIGJ1ZmZlcjEgKyBidWZmZXIyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFwcGVuZEF1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyMSwgYnVmZmVyMikge1xyXG4gIHZhciBudW1iZXJPZkNoYW5uZWxzID0gTWF0aC5taW4oYnVmZmVyMS5udW1iZXJPZkNoYW5uZWxzLCBidWZmZXIyLm51bWJlck9mQ2hhbm5lbHMpO1xyXG4gIHZhciB0bXAgPSBjb3JlLmNyZWF0ZUJ1ZmZlcihudW1iZXJPZkNoYW5uZWxzLFxyXG4gICAgKGJ1ZmZlcjEubGVuZ3RoICsgYnVmZmVyMi5sZW5ndGgpLFxyXG4gICAgYnVmZmVyMS5zYW1wbGVSYXRlKTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mQ2hhbm5lbHM7IGkrKykge1xyXG4gICAgdmFyIGNoYW5uZWwgPSB0bXAuZ2V0Q2hhbm5lbERhdGEoaSk7XHJcbiAgICBjaGFubmVsLnNldCggYnVmZmVyMS5nZXRDaGFubmVsRGF0YShpKSwgMCk7XHJcbiAgICBjaGFubmVsLnNldCggYnVmZmVyMi5nZXRDaGFubmVsRGF0YShpKSwgYnVmZmVyMS5sZW5ndGgpO1xyXG4gIH1cclxuICByZXR1cm4gdG1wO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcCBwb2ludHMgYW5kIGxlbmd0aCBpbiBzYW1wbGUtZnJhbWVzXHJcbiAqIG9mIGFuIGFwcGVuZGVkIHdhdmVmb3JtIGFuZCBhZGRzIGl0IHRvIHRoZSBtZXRhRGF0YSBhcnJheS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGV4aXN0aW5nQnVmZmVyIFRoZSAnb2xkJyBidWZmZXIgdGhhdCBnZXRzIGFwcGVuZGVkXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBuZXdCdWZmZXIgICAgICBUaGUgYnVmZmVyIHRoYXQgZ2V0cyBhcHBlbmRlZFxyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgRGljdGlvbmFyeSB3aXRoIHN0YXJ0L3N0b3AvbGVuZ3RoIGRhdGFcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYWRkV2F2ZU1ldGFEYXRhID0gZnVuY3Rpb24oZXhpc3RpbmdCdWZmZXIsIG5ld0J1ZmZlcikge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZXhpc3RpbmdCdWZmZXIubGVuZ3RoICsgMSxcclxuICAgIGVuZDogZXhpc3RpbmdCdWZmZXIubGVuZ3RoICsgbmV3QnVmZmVyLmxlbmd0aCxcclxuICAgIGxlbmd0aDogbmV3QnVmZmVyLmxlbmd0aFxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgYSBiaW5hcnkgZmlsZSBhbmQgY2FsbHMgYSBmdW5jdGlvbiB3aXRoIHRoZVxyXG4gKiByZXR1cm5lZCBBcnJheUJ1ZmZlciBhcyBpdHMgYXJndW1lbnQgd2hlbiBkb25lLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgZmlsZW5hbWUgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBvbmxvYWRDYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXHJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICBbYXN5bmM9dHJ1ZV0gICBBc3luY2hyb25vdXMgbG9hZGluZ1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgYXJyYXlCdWZmZXI7XHJcbiAqIHRoaXMubG9hZEZpbGUoJ2ZpbGUxLndhdicsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAqICAgYXJyYXlCdWZmZXIgPSByZXNwb25zZTtcclxuICogfSk7XHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlID0gZnVuY3Rpb24oZmlsZW5hbWUsIG9ubG9hZENhbGxiYWNrLCBhc3luYykge1xyXG4gIHZhciBhc3luY2hyb25vdXNseSA9IHRydWU7XHJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gIGlmIChhc3luYykge1xyXG4gICAgYXN5bmNocm9ub3VzbHkgPSBhc3luYztcclxuICB9XHJcblxyXG4gIHJlcXVlc3Qub3BlbignR0VUJywgZmlsZW5hbWUsIGFzeW5jaHJvbm91c2x5KTtcclxuICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XHJcblxyXG4gIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBvbmxvYWRDYWxsYmFjayhyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICB9O1xyXG5cclxuICByZXF1ZXN0LnNlbmQoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBtdWx0aXBsZSBiaW5hcnkgZmlsZXMgYW5kIHJldHVybnMgYW4gYXJyYXlcclxuICogd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBmaWxlcyBpbiB0aGUgZ2l2ZW4gb3JkZXIuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzIExpc3Qgd2l0aCBmaWxlbmFtZXNcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgQXJyYXkgb2YgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYmluQnVmZmVycyA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IGZpbGVuYW1lcy5zcGxpdCgnLCcpO1xyXG4gIG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xyXG4gICAgc2VsZi5sb2FkRmlsZShuYW1lLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICBiaW5CdWZmZXJzW25hbWVdID0gcmVzcG9uc2U7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRoaXMuc29ydEJpbkJ1ZmZlcnMobmFtZXMsIGJpbkJ1ZmZlcnMpO1xyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS5zb3J0QmluQnVmZmVycyA9IGZ1bmN0aW9uKGZpbGVuYW1lcywgYmluQnVmZmVycykge1xyXG4gIHJldHVybiBmaWxlbmFtZXMubWFwKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICByZXR1cm4gYmluQnVmZmVyc1tlbF07XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kV2F2ZTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgdGhlIGZvdW5kYXRpb24gb2YgdGhlIEludGVybWl4IGxpYnJhcnkuXHJcbiAqIEl0IHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQgc28gaXQgY2FuIGJlIGVhc2lseSBjb25zdW1lZFxyXG4gKiBmcm9tIGFsbCBjbGFzc2VzIG9mIHRoZSBsaWJyYXJ5LlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtBdWRpb0NvbnRleHR9IFRoZSBBdWRpb0NvbnRleHQgb2JqZWN0XHJcbiAqXHJcbiAqIEB0b2RvIFNob3VsZCB3ZSBkbyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3Igb2xkZXIgYXBpLXZlcnNpb25zP1xyXG4gKiBAdG9kbyBDaGVjayBmb3IgbW9iaWxlL2lPUyBjb21wYXRpYmlsaXR5LlxyXG4gKiBAdG9kbyBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGVcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+U3VzcGVuZCBhbmQgcmVzdW1lIHRoZSBhdWRpbyBjb250ZXh0IHRvXHJcbiAqIGNyZWF0ZSBhIHBhdXNlIGJ1dHRvbi4gVGhpcyBzaG91bGQgYmUgdXNlZCB3aXRoIGNyZWF0ZUF1ZGlvV29ya2VyXHJcbiAqIGFzIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIHdoZW4gc3VzcGVuZCBpcyBjYWxsZWQgb24gYW4gb2ZmbGluZSBhdWRpbyBjb250ZXh0LlxyXG4gKiBZb3UgY2FuIGFsc28gcGF1c2Ugc2luZ2xlIHNvdW5kcyB3aXRoIDxpPlNvdW5kLnBhdXNlKCk8L2k+LlxyXG4gKiBQbGVhc2UgcmVhZCA8YSBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZGUvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dC9zdXNwZW5kXCI+dGhlIGRldmVsb3BlciBkb2NzIGF0IE1ETjwvYT5cclxuICogdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgdGhpcy48L2NhcHRpb24+XHJcbiAqIHN1c3Jlc0J0bi5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAqICAgaWYoSW50ZXJtaXguc3RhdGUgPT09ICdydW5uaW5nJykge1xyXG4gKiAgICAgSW50ZXJtaXguc3VzcGVuZCgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdSZXN1bWUgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9IGVsc2UgaWYgKEludGVybWl4LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xyXG4gKiAgICAgSW50ZXJtaXgucmVzdW1lKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1N1c3BlbmQgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9XHJcbiAqIH1cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh3aW5kb3cuQXVkaW9Db250ZXh0KSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ291bGRuXFwndCBpbml0aWFsaXplIHRoZSBhdWRpbyBjb250ZXh0LicpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGF1ZGlvQ3R4O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5JdCBpcyBqdXN0IGZvciBsaWJyYXJ5IGludGVybmFsXHJcbiAqIHVzYWdlLiBTZWUgU2VxdWVuY2VyLmpzIGZvciBkZXRhaWxzLjwvY2FwdGlvbj5cclxuICogd29ya2VyLnBvc3RNZXNzYWdlKHsgJ2ludGVydmFsJzogMjAwIH0pO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gKiB3b3JrZXIudGVybWluYXRlKCk7ICAvL3dlYndvcmtlciBpbnRlcm5hbCBmdW5jdGlvbiwganVzdCBmb3IgY29tcGxldGVuZXNzXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdGltZXIgPSBudWxsO1xyXG52YXIgaW50ZXJ2YWwgPSAxMDA7XHJcblxyXG52YXIgd29ya2VyID0gZnVuY3Rpb24oc2VsZikge1xyXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhLmludGVydmFsKSB7XHJcbiAgICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4gICAgICBpZiAodGltZXIpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gd29ya2VyO1xyXG4iXX0=
