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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcblxyXG4vL0ludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciBJbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpIHx8IHt9O1xyXG5JbnRlcm1peC5Tb3VuZFdhdmUgPSByZXF1aXJlKCcuL1NvdW5kV2F2ZS5qcycpO1xyXG5JbnRlcm1peC5Tb3VuZCA9IHJlcXVpcmUoJy4vU291bmQuanMnKTtcclxuSW50ZXJtaXguU2VxdWVuY2VyID0gcmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKTtcclxuSW50ZXJtaXguUGFydCA9IHJlcXVpcmUoJy4vUGFydC5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcm1peDtcclxuIiwidmFyIGJ1bmRsZUZuID0gYXJndW1lbnRzWzNdO1xudmFyIHNvdXJjZXMgPSBhcmd1bWVudHNbNF07XG52YXIgY2FjaGUgPSBhcmd1bWVudHNbNV07XG5cbnZhciBzdHJpbmdpZnkgPSBKU09OLnN0cmluZ2lmeTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIHZhciB3a2V5O1xuICAgIHZhciBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgdmFyIGV4cCA9IGNhY2hlW2tleV0uZXhwb3J0cztcbiAgICAgICAgLy8gVXNpbmcgYmFiZWwgYXMgYSB0cmFuc3BpbGVyIHRvIHVzZSBlc21vZHVsZSwgdGhlIGV4cG9ydCB3aWxsIGFsd2F5c1xuICAgICAgICAvLyBiZSBhbiBvYmplY3Qgd2l0aCB0aGUgZGVmYXVsdCBleHBvcnQgYXMgYSBwcm9wZXJ0eSBvZiBpdC4gVG8gZW5zdXJlXG4gICAgICAgIC8vIHRoZSBleGlzdGluZyBhcGkgYW5kIGJhYmVsIGVzbW9kdWxlIGV4cG9ydHMgYXJlIGJvdGggc3VwcG9ydGVkIHdlXG4gICAgICAgIC8vIGNoZWNrIGZvciBib3RoXG4gICAgICAgIGlmIChleHAgPT09IGZuIHx8IGV4cC5kZWZhdWx0ID09PSBmbikge1xuICAgICAgICAgICAgd2tleSA9IGtleTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF3a2V5KSB7XG4gICAgICAgIHdrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgdmFyIHdjYWNoZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgICAgICB3Y2FjaGVba2V5XSA9IGtleTtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2VzW3drZXldID0gW1xuICAgICAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJywnbW9kdWxlJywnZXhwb3J0cyddLCAnKCcgKyBmbiArICcpKHNlbGYpJyksXG4gICAgICAgICAgICB3Y2FjaGVcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHNrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcblxuICAgIHZhciBzY2FjaGUgPSB7fTsgc2NhY2hlW3drZXldID0gd2tleTtcbiAgICBzb3VyY2VzW3NrZXldID0gW1xuICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnXSwgKFxuICAgICAgICAgICAgLy8gdHJ5IHRvIGNhbGwgZGVmYXVsdCBpZiBkZWZpbmVkIHRvIGFsc28gc3VwcG9ydCBiYWJlbCBlc21vZHVsZVxuICAgICAgICAgICAgLy8gZXhwb3J0c1xuICAgICAgICAgICAgJ3ZhciBmID0gcmVxdWlyZSgnICsgc3RyaW5naWZ5KHdrZXkpICsgJyk7JyArXG4gICAgICAgICAgICAnKGYuZGVmYXVsdCA/IGYuZGVmYXVsdCA6IGYpKHNlbGYpOydcbiAgICAgICAgKSksXG4gICAgICAgIHNjYWNoZVxuICAgIF07XG5cbiAgICB2YXIgc3JjID0gJygnICsgYnVuZGxlRm4gKyAnKSh7J1xuICAgICAgICArIE9iamVjdC5rZXlzKHNvdXJjZXMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5naWZ5KGtleSkgKyAnOlsnXG4gICAgICAgICAgICAgICAgKyBzb3VyY2VzW2tleV1bMF1cbiAgICAgICAgICAgICAgICArICcsJyArIHN0cmluZ2lmeShzb3VyY2VzW2tleV1bMV0pICsgJ10nXG4gICAgICAgICAgICA7XG4gICAgICAgIH0pLmpvaW4oJywnKVxuICAgICAgICArICd9LHt9LFsnICsgc3RyaW5naWZ5KHNrZXkpICsgJ10pJ1xuICAgIDtcblxuICAgIHZhciBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwgfHwgd2luZG93Lm1velVSTCB8fCB3aW5kb3cubXNVUkw7XG5cbiAgICByZXR1cm4gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKFxuICAgICAgICBuZXcgQmxvYihbc3JjXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KVxuICAgICkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgcGFydCBvZiBhIHNlcXVlbmNlLiBJdCBjYW4gYmVcclxuICogdXNlZCBpbiBtYW55IHdheXM6XHJcbiAqIDx1bD5cclxuICogPGxpPkEgcGFydCBvZiBhIHRyYWNrIGxpa2UgaW4gcGlhbm8tcm9sbCBzZXF1ZW5jZXJzPC9saT5cclxuICogPGxpPkEgcGF0dGVybiBsaWtlIGluIHN0ZXAgc2VxdWVuY2VycywgZHJ1bSBjb21wdXRlcnMgYW5kIHRyYWNrZXJzPC9saT5cclxuICogPGxpPkEgbG9vcCBsaWtlIGluIGxpdmUgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDwvdWw+XHJcbiAqIFRlY2huaWNhbGx5IGl0IGNhbiBzdG9yZSBhbnkgdHlwZSBvZiBldmVudCB5b3VyIHN5c3RlbSBpcyBjYXBhYmxlIG9mLlxyXG4gKiBUaGlzIG1lYW5zIGl0IGlzIG5vdCBsaW1pdGVkIHRvIGF1ZGlvLCBtaWRpLCBvc2Mgb3IgZG14IGJ1dCBjYW4gaG9sZFxyXG4gKiBhbnkgdHlwZSBvZiBqYXZhc2NyaXB0IG9iamVjdC4gQSBwb3NzaWJsZSB1c2VjYXNlIHdvdWxkIGJlIHRvIHRyaWdnZXJcclxuICogc2NyZWVuIGV2ZW50cyB3aXRoIHRoZSBkcmF3IGZ1bmN0aW9uIG9mIHRoZSBzZXF1ZW5jZXIgb2JqZWN0LlxyXG4gKiBAdG9kbyBBZGQgYXQgbGVhc3Qgb25lIHVzYWdlIGV4YW1wbGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggICAgICAgTGVuZ3RoIG9mIHRoZSBwYXJ0IGluIGJhcnMgKDQgYmVhdHMpXHJcbiAqL1xyXG52YXIgUGFydCA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG5cclxuICB0aGlzLnJlc29sdXRpb24gPSAxNjsgLy8gKHJlc29sdXRpb24gKiBtdWx0aXBseSkgc2hvdWxkIGFsd2FzeSBiZSA2NFxyXG4gIHRoaXMubXVsdGlwbHkgPSA0OyAgICAvLyByZXNvbHV0aW9uIG11bHRpcGxpZXJcclxuICB0aGlzLmxlbmd0aCA9IDE7ICAgICAgLy8gMSA9IG9uZSBiYXIgKDQgYmVhdHMgPSAxIGJhcilcclxuICB0aGlzLm5hbWUgPSAnUGFydCc7ICAgLy8gbmFtZSBvZiB0aGlzIHBhcnRcclxuICB0aGlzLnBhdHRlcm4gPSBbXTsgICAgLy8gdGhlIGFjdHVhbCBwYXR0ZXJuIHdpdGggbm90ZXMgZXRjLlxyXG5cclxuICBpZiAobGVuZ3RoKSB7XHJcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICB9XHJcblxyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMuaW5pdFBhdHRlcm4odGhpcy5sZW5ndGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgYW4gZW1wdHkgcGF0dGVybiBmb3IgdGhlIHBhcnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICBMZW5ndGggb2YgdGhlIHBhdHRlcm4gbWVzdXJlZCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGF0dGVybiA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gIHZhciBwYXR0ZXJuID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAobGVuZ3RoICogNjQpOyBpKyspIHtcclxuICAgIHBhdHRlcm5baV0gPSBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHBhdHRlcm47XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbiBldmVudCB0byB0aGUgcGF0dGVybiBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5hZGRFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIGlmIChwb3NpdGlvbiA8PSB0aGlzLnJlc29sdXRpb24pIHtcclxuICAgIHZhciBwb3MgPSAocG9zaXRpb24gLSAxKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgICB0aGlzLnBhdHRlcm5bcG9zXS5wdXNoKHNlcUV2ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQb3NpdGlvbiBvdXQgb2YgcGF0dGVybiBib3VuZHMuJyk7XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYW4gZXZlbnQgYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICB2YXIgcG9zID0gKHBvc2l0aW9uIC0gMSkgKiB0aGlzLm11bHRpcGx5O1xyXG4gIHZhciBpbmRleCA9IHRoaXMucGF0dGVybltwb3NdLmluZGV4T2Yoc2VxRXZlbnQpO1xyXG4gIHRoaXMucGF0dGVybltwb3NdLnNwbGljZShpbmRleCwgMSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtJbnR9ICAgIExlbmd0aCBvZiB0aGUgcGF0dGVyblxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGF0dGVybi5sZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NpdGlvbnMgdGhhdCBjb250YWluIGF0IGxlYXN0IG9uZSBldmVudC5cclxuICogVGhpcyBpcyBjdXJyZW50bHkgdW51c2VkIGFuZCB3aWxsIHByb2JhYmx5IGRlbGV0ZWRcclxuICogaW4gZnV0dXJlIHZlcnNpb25zLlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gIExpc3Qgd2l0aCBhbGwgbm9uLWVtcHR5IHBhdHRlcm4gZW50cmllc1xyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0Tm90ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwb3NpdGlvbnMgPSBbXTtcclxuICB0aGlzLnBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbihlbCwgaW5kZXgpIHtcclxuICAgIGlmIChlbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHBvc2l0aW9ucy5wdXNoKGluZGV4IC8gdGhpcy5tdWx0aXBseSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbiAgcmV0dXJuIHBvc2l0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIGEgcGFydCBhdCB0aGUgdG9wL3N0YXJ0LlxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGV4dExlbmd0aCBMZW5ndGggaW4gYmFycyAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25Ub3AgPSBmdW5jdGlvbihleHRMZW5ndGgpIHtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihleHRMZW5ndGgpO1xyXG4gIHRoaXMucGF0dGVybiA9IGV4dGVuc2lvbi5jb25jYXQodGhpcy5wYXR0ZXJuKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIGEgcGFydCBhdCB0aGUgZW5kXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPbkVuZCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5wYXR0ZXJuLmNvbmNhdChleHRlbnNpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYXJ0O1xyXG4iLCIvKipcclxuICogU2VxdWVuY2VyXHJcbiAqXHJcbiAqIFNjaGVkdWxpbmcgaW5zcGlyZWQgYnkgXCJBIFRhbGUgb2YgVHdvIENsb2Nrc1wiIGJ5IENocmlzIFdpbHNvbjpcclxuICogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvYXVkaW8vc2NoZWR1bGluZy9cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpO1xyXG5cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKGF1ZGlvQ3R4KSB7XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgdGhpcy5iZWF0c1Blck1pbnV0ZSA9IDEyMDsgIC8vYmVhdHMgcGVyIG1pbnV0ZVxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDY0OyAgICAgICAvL3Nob3J0ZXN0IHBvc3NpYmxlIG5vdGUuIFlvdSBub3JtYWxseSBkb24ndCB3YW50IHRvIHRvdWNoIHRoaXMuXHJcbiAgdGhpcy5pbnRlcnZhbCA9IDEwMDsgICAgICAgIC8vdGhlIGludGVydmFsIGluIG1pbGlzZWNvbmRzIHRoZSBzY2hlZHVsZXIgZ2V0cyBpbnZva2VkLlxyXG4gIHRoaXMubG9va2FoZWFkID0gMC4zOyAgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGxvb2tzIGFoZWFkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Nob3VsZCBiZSBsb25nZXIgdGhhbiBpbnRlcnZhbC5cclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgICAgLy9MaXN0IHdpdGggYWxsIHBhcnRzIG9mIHRoZSBzY29yZVxyXG4gIHRoaXMucnVuUXVldWUgPSBbXTsgICAgICAgICAvL2xpc3Qgd2l0aCBwYXJ0cyB0aGF0IGFyZSBwbGF5aW5nIG9yIHdpbGwgYmUgcGxheWVkIHNob3J0bHlcclxuXHJcbiAgdGhpcy5ub3c7ICAgICAgICAgICAgICAgICAgICAvL3RpbWVzdGFtcCBmcm9tIGF1ZGlvY29udGV4dCB3aGVuIHRoZSBzY2hlZHVsZXIgaXMgaW52b2tlZC5cclxuICB0aGlzLnRpbWVQZXJTdGVwOyAgICAgICAgICAgLy9wZXJpb2Qgb2YgdGltZSBiZXR3ZWVuIHR3byBzdGVwc1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDsgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBuZXh0IHN0ZXAgd2lsbCBiZSB0cmlnZ2VyZWRcclxuICB0aGlzLm5leHRTdGVwID0gMDsgICAgICAgICAgLy9wb3NpdGlvbiBpbiB0aGUgcXVldWUgdGhhdCB3aWxsIGdldCB0cmlnZ2VyZWQgbmV4dFxyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSAwOyAgICAvL3N0ZXAgaW4gcXVldWUgdGhhdCB3YXMgcGxheWVkIChub3QgdHJpZ2dlcmVkKSByZWNlbnRseSAodXNlZCBmb3IgZHJhd2luZykuXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7ICAgICAgICAgIC8vcGxheSBhIHNlY3Rpb24gb2YgdGhlIHF1ZXVlIGluIGEgbG9vcFxyXG4gIHRoaXMubG9vcFN0YXJ0OyAgICAgICAgICAgICAvL2ZpcnN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmxvb3BFbmQ7ICAgICAgICAgICAgICAgLy9sYXN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlOyAgICAgLy90cnVlIGlmIHNlcXVlbmNlciBpcyBydW5uaW5nLCBvdGhlcndpc2UgZmFsc2VcclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lOyAgICAgICAgLy9oYXMgdG8gYmUgb3ZlcnJpZGRlbiB3aXRoIGEgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGluIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RyYXcgZnVuY3Rpb24gd2l0aCB0aGUgbGFzdFBsYXllZFN0ZXAgaW50IGFzIHBhcmFtZXRlci5cclxuXHJcbiAgLy8gc2V0IHRpbWUgcGVyIHNldFRpbWVQZXJTdGVwXHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAodGhpcy5iZWF0c1Blck1pbnV0ZSwgdGhpcy5yZXNvbHV0aW9uKTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSB0aGUgc2NoZWR1bGVyLXRpbWVyXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlciA9IHdvcmsocmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpKTtcclxuXHJcbiAgLyplc2xpbnQtZW5hYmxlICovXHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3RpY2snKSB7XHJcbiAgICAgIHNlbGYuc2NoZWR1bGVyKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSh7J21lc3NhZ2UnOiB0aGlzLmludGVydmFsfSk7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubm93ID0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IHRoaXMubm93O1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHRoaXMubmV4dFN0ZXBUaW1lIDwgdGhpcy5ub3cgKyB0aGlzLmxvb2thaGVhZCkge1xyXG4gICAgaWYgKHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcclxuICAgICAgICB0aGlzLnJ1blF1ZXVlLnB1c2goe1xyXG4gICAgICAgICAgJ2luc3RydW1lbnQnOiBwYXJ0Lmluc3RydW1lbnQsXHJcbiAgICAgICAgICAncGF0dGVybic6IHRoaXMuY29weUFycmF5KHBhcnQucGF0dGVybilcclxuICAgICAgICB9KTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ydW5RdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGluZGV4KSB7XHJcbiAgICAgIHZhciBzZXFFdmVudHMgPSBwYXJ0LnBhdHRlcm4uc2hpZnQoKTsgIC8vcmV0dXJuIGZpcnN0IGVsZW1lbnQgYW5kIHJlbW92ZSBpdCBmcm9tIHBhcnRcclxuICAgICAgaWYgKHNlcUV2ZW50cykge1xyXG4gICAgICAgIC8vdmFyIGluc3RydW1lbnQgPSBwYXJ0Lmluc3RydW1lbnQ7XHJcbiAgICAgICAgc2VxRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAgICAgICAgIGlmIChzZXFFdmVudC5ub3RlKSB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogc2hvdWxkIGJlIGV4dGVuZGVkIHRvIHBsYXkgcmVhbCBub3Rlc1xyXG4gICAgICAgICAgICBwYXJ0Lmluc3RydW1lbnQucGxheSh0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHNlcUV2ZW50LmNvbnRyb2xsZXIpIHtcclxuICAgICAgICAgICAgLy8gcHJvY2VzcyBjb250cm9sbGVyIGV2ZW50O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vcmVtb3ZlIHBhcnQgZnJvbSBydW5RdWV1ZSBpZiBlbXB0eVxyXG4gICAgICAgICAgaWYgKHBhcnQucGF0dGVybi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5ydW5RdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICAvLyBzZXQgcG9pbnRlciB0byB0aGUgbmV4dCBzdGVwIGluIHRoZSBxdWV1ZSB0aGF0IHNob3VsZCBiZSBwbGF5ZWQuXHJcbiAgICAvLyBJZiB3ZSdyZSBwbGF5aW5nIGluIGxvb3AgbW9kZSwganVtcCBiYWNrIHRvIGxvb3BzdGFydCB3aGVuXHJcbiAgICAvLyBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gICAgaWYgKHRoaXMubG9vcCkge1xyXG4gICAgICBpZiAodGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgICAgICB0aGlzLm5leHRTdGVwID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgICAgdGhpcy5ydW5RdWV1ZSA9IFtdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubmV4dFN0ZXArKztcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gdHJ1ZTtcclxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdyk7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAgdGhpcy5ydW5RdWV1ZSA9IFtdO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcclxuICAvLyBmaXJzdCB3ZSdsbCBoYXZlIHRvIGZpbmQgb3V0LCB3aGF0IHN0ZXAgd2FzIHJlY2VudGx5IHBsYXllZC5cclxuICAvLyB0aGlzIGlzIHNvbWVob3cgY2x1bXN5IGJlY2F1c2UgdGhlIHNlcXVlbmNlciBkb2Vzbid0IGtlZXAgdHJhY2sgb2YgdGhhdC5cclxuICB2YXIgbG9va0FoZWFkRGVsdGEgPSB0aGlzLm5leHRTdGVwVGltZSAtIHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWU7XHJcbiAgdmFyIHN0ZXBzQWhlYWQgPSBNYXRoLmZsb29yKGxvb2tBaGVhZERlbHRhIC8gdGhpcy50aW1lUGVyU3RlcCkgKyAxO1xyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSB0aGlzLm5leHRTdGVwIC0gc3RlcHNBaGVhZDtcclxuXHJcbiAgLy9zaG91bGQgYmUgb3ZlcnJpZGRlbiBieSB0aGUgYXBwbGljYXRpb25cclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lKHRoaXMubGFzdFBsYXllZFN0ZXApO1xyXG5cclxuICBpZiAodGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3KTtcclxuICB9XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dID0gW107XHJcbiAgfVxyXG4gIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNyZWF0ZU5vdGVFdmVudCA9IGZ1bmN0aW9uKG5vdGUsIGxlbmd0aCkge1xyXG4gIHJldHVybiB7XHJcbiAgICAnbm90ZSc6IG5vdGUsXHJcbiAgICAnbGVuZ3RoJzogbGVuZ3RoXHJcbiAgfTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0VGltZVBlclN0ZXAgPSBmdW5jdGlvbihicG0sIHJlc29sdXRpb24pIHtcclxuICByZXR1cm4gKDYwICogNCkgLyAoYnBtICogcmVzb2x1dGlvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogY29weUFycmF5OiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBcdFx0XHRcdFx0XHRVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIFx0XHRcdFx0XHRcdHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIFx0XHRcdFx0XHRcdChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIFx0XHRcdFx0XHRcdGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIFBsYXlzIGEgc291bmQgZnJvbSBhIFNvdW5kV2F2ZSBvYmplY3QuXHJcbiAqIFRoZSBzb3VuZCBjYW4gYmUgc3RhcnRlZC9zdG9wcGVkL3BhdXNlZC5cclxuICogSXQgY2FuIGFsc28gYmUgbG9vcGVkIHdpdGggYW4gYWRqdXN0YWJsZSBsb29wIHJhbmdlLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdhdWRpb2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5zdGFydCgpO1xyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNvdW5kV2F2ZSBTb3VuZFdhdmUgb2JqZWN0IGluY2x1ZGluZyB0aGUgYnVmZmVyIHdpdGggYXVkaW8gZGF0YSB0byBiZSBwbGF5ZWRcclxuICovXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKHNvdW5kV2F2ZSkge1xyXG5cclxuICB0aGlzLndhdmUgPSBudWxsO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7ICAgICAvL3RoZSBvZmZzZXQgd2l0aGluIHRoZSB3YXZlZm9ybVxyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDsgICAgICAgLy93aGVuIHRoZSBzb3VuZCBzdGFydHMgdG8gcGxheVxyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gMTtcclxuICB0aGlzLmRldHVuZSA9IDA7XHJcblxyXG4gIGlmIChzb3VuZFdhdmUpIHtcclxuICAgIHRoaXMud2F2ZSA9IHNvdW5kV2F2ZTtcclxuICAgIHRoaXMuYnVmZmVyID0gc291bmRXYXZlLmJ1ZmZlcjtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuICAgIHRoaXMuc2V0dXBBdWRpb0NoYWluKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgaW5pdGlhbGlzaW5nIFNvdW5kIG9iamVjdDogcGFyYW1ldGVyIG1pc3NpbmcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBnYWluIGFuZCBzdGVyZW8tcGFubmVyIG5vZGUsIGNvbm5lY3RzIHRoZW1cclxuICogKGdhaW4gLT4gcGFubmVyKSBhbmQgc2V0cyBnYWluIHRvIDEgKG1heCB2YWx1ZSkuXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IGNvcmUuY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IGNvcmUuY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QoY29yZS5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgQnVmZmVyU291cmNlTm9kZVxyXG4gKiB0aGF0IGNhbiBiZSBwbGF5ZWQgb25jZSBhbmQgdGhlbiBkZXN0cm95cyBpdHNlbGYuXHJcbiAqIEByZXR1cm4ge0J1ZmZlclNvdXJjZU5vZGV9IFRoZSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSBjb3JlLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICBidWZmZXJTb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcclxuICBidWZmZXJTb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnb25lbmRlZCBmaXJlZCcpO1xyXG4gICAgc2VsZi5kZXN0cm95QnVmZmVyU291cmNlKGJ1ZmZlclNvdXJjZSk7XHJcbiAgfTtcclxuICByZXR1cm4gYnVmZmVyU291cmNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlc3Ryb3llcyBhIGdpdmVuIEF1ZGlvQnVmZmVyU291cmNlTm9kZSBhbmQgZGVsZXRlcyBpdFxyXG4gKiBmcm9tIHRoZSBzb3VyY2VOb2RlIHF1ZXVlLiBUaGlzIGlzIHVzZWQgaW4gdGhlIG9uZW5kZWRcclxuICogY2FsbGJhY2sgb2YgYWxsIEJ1ZmZlclNvdXJjZU5vZGVzLlxyXG4gKiBUaGlzIGlzIHByb2JhYmx5IGZ1dGlsZSBzaW5jZSB3ZSBhbHJlYWR5IGRlbGV0ZSBhbGwgbm9kZVxyXG4gKiByZWZlcmVuY2VzIGluIHRoZSBzdG9wIG1ldGhvZC5cclxuICogQHRvZG8gICBDaGVjayBpZiB0aGlzIGNhbiBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyU291cmNlTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkZWxheSAgICAgIFRpbWUgaW4gc2Vjb25kcyB0aGUgc291bmQgcGF1c2VzIGJlZm9yZSB0aGUgc3RyZWFtIHN0YXJ0c1xyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihkZWxheSwgcGxheUxvb3BlZCwgZHVyYXRpb24pIHtcclxuICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgaWYgKGRlbGF5KSB7XHJcbiAgICBzdGFydFRpbWUgPSBkZWxheTtcclxuICB9IGVsc2Uge1xyXG4gICAgc3RhcnRUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICB9XHJcbiAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcbiAgaWYgKHBsYXlMb29wZWQpIHtcclxuICAgIGJzLmxvb3AgPSBwbGF5TG9vcGVkO1xyXG4gICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICBicy5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG4gIH1cclxuXHJcbiAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgYnMuZGV0dW5lLnZhbHVlID0gdGhpcy5kZXR1bmU7XHJcblxyXG4gIC8vIGlmIChwbGF5TG9vcGVkKSB7XHJcbiAgLy8gICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAvLyAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgLy8gfVxyXG5cclxuICAvLyBpZiAodGhpcy5zdGFydE9mZnNldCA9PT0gMCB8fCB0aGlzLnN0YXJ0T2Zmc2V0ID49IHRoaXMuYnVmZmVyLmR1cmF0aW9uKSB7XHJcbiAgLy8gICBjb25zb2xlLmxvZygncmVzZXR0aW5nIHN0YXJ0dGltZScpO1xyXG4gIC8vICAgdGhpcy5zdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIC8vIH1cclxuICB0aGlzLnF1ZXVlLnB1c2goYnMpO1xyXG4gIC8vYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuXHJcbiAgaWYgKGR1cmF0aW9uKSB7XHJcbiAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQsIGR1cmF0aW9uKTtcclxuICB9IGVsc2Uge1xyXG4gICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICB9XHJcblxyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW0sIGV2ZW4gdGhlIG9uZXMgdGhhdCBhcmUganVzdCBzY2hlZHVsZWQuXHJcbiAqIEl0IGFsc28gY2xlYW5zIHRoZSBxdWV1ZSBzbyB0aGF0IHRoZSBzb3VuZCBvYmplY3QgaXMgcmVhZHkgZm9yIGFub3RoZXIgcm91bmQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgIG5vZGUuc3RvcCgpO1xyXG4gICAgICBub2RlLmRpc2Nvbm5lY3QoKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5xdWV1ZSA9IFtdOyAgLy9yZWxlYXNlIGFsbCByZWZlcmVuY2VzXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vZmFpbCBzaWxlbnRseVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyB0aGUgYXVkaW8gc3RyZWFtIGFuZCBzdG9yZSB0aGUgY3VycmVudCBwb3NpdGlvbnNcclxuICogYXMgYW4gb2Zmc2V0IGZvciB3aGVuIHRoZSBzb3VuZCBnZXQgcmVzdGFydGVkLlxyXG4gKiBSZW1lbWJlciB0aGF0IHRoaXMgZG9lc24ndCB3b3JrIHdpdGggbG9vcHMgdGhhdCBhcmUgc2hvcnRlclxyXG4gKiB0aGFuIHRoZSBidWZmZXIgaXRzZWxmLiBJZiB5b3Ugd2FudCBhIGdsb2JhbCwgYWNjdXJhdGUgcGF1c2UgZnVuY3Rpb25cclxuICogdXNlIHN1c3BlbmQvcmVzdW1lIGZyb20gdGhlIGNvcmUgbW9kdWxlLlxyXG4gKiBAdG9kbyAgICBOZWVkcyB0byBiZSByZXdyaXR0ZW4gc2luY2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgc3RhcnQgdGltZXMuXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IChjb3JlLmN1cnJlbnRUaW1lIC0gdGhpcy5zdGFydFRpbWUpICUgdGhpcy5zb3VuZExlbmd0aDtcclxuICB0aGlzLnN0b3AoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdGFydHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBzdGFydCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAvL3RoaXMubG9vcFN0YXJ0ID0gdmFsdWUgKiB0aGlzLnNvdW5kTGVuZ3RoO1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgZW5kcG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIGVuZCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcEVuZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wRW5kID0gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoZSBzdGFydCBhbmQgZW5kcG9pbnQgdG8gc3RhcnQgZW5kIGVuZHBvaW50IG9mIHRoZSBBdWRpb0J1ZmZlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlc2V0TG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgc291bmQgaW4gcGVyY2VudGFnZVxyXG4gKiAoMSA9IDEwMCUsIDIgPSAyMDAlKVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICByYXRlIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHJhdGUpIHtcclxuICB0aGlzLnBsYXliYWNrUmF0ZSA9IHJhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGVcclxuICogQHJldHVybiB7ZmxvYXR9ICBUaGUgcGxheWJhY2sgcmF0ZSBpbiBwZXJjZW50YWdlICgxLjI1ID0gMTI1JSlcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wbGF5YmFja1JhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSB0b25lIHdpdGhpbiB0d28gb2N0YXZlICgrLy0xMiB0b25lcylcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHNlbWkgdG9uZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFRvbmUgPSBmdW5jdGlvbihzZW1pVG9uZSkge1xyXG4gIGlmIChzZW1pVG9uZSA+PSAtMTIgJiYgc2VtaVRvbmUgPD0gMTIpIHtcclxuICAgIHRoaXMuZGV0dW5lID0gc2VtaVRvbmUgKiAxMDA7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignU2VtaSB0b25lIGlzICcgKyBzZW1pVG9uZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMi4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsYXN0IHBsYXllZCBzZW1pdG9uZS4gVGhpcyBkb2Vzbid0IGhhcyB0byBiZSBhblxyXG4gKiBpbnRlZ2VyIGJldHdlZW4gLS8rMTIgYXMgdGhlIHNvdW5kIGNhbiBiZSBkZXR1bmVkIHdpdGhcclxuICogbW9yZSBwcmVjaXNpb24uXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgU2VtaXRvbmUgYmV0d2VlbiAtLysxMlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmUgLyAxMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0dW5lIHRoZSBzb3VuZCBvc2NpbGxhdGlvbiBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICBkZXR1bmUgIGRldHVuZSBpbiBjZW50c1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldERldHVuZSA9IGZ1bmN0aW9uKGRldHVuZSkge1xyXG4gIGlmIChkZXR1bmUgPj0gLTEyMDAgJiYgZGV0dW5lIDw9IDEyMDApIHtcclxuICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldHVuZSBwYXJhbWV0ZXIgaXMgJyArIGRldHVuZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMjAwLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgdGhlIGN1cnJlbnQgZGV0dW5lIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHJldHVybiB7SW50ZWdlcn0gIERldHVuZSBpbiBjZW50c1xyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldERldHVuZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cigyLCA4KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIENyZWF0ZXMgYSB3cmFwcGVyIGluIHdoaWNoIGFuIGF1ZGlvIGJ1ZmZlciBsaXZlcy5cclxuICogQSBTb3VuZFdhdmUgb2JqZWN0IGp1c3QgaG9sZHMgYXVkaW8gZGF0YSBhbmQgZG9lcyBub3RoaW5nIGVsc2UuXHJcbiAqIElmIHlvdSB3YW50IHRvIHBsYXkgdGhlIHNvdW5kLCB5b3UgaGF2ZSB0byBhZGRpdGlvbmFsbHkgY3JlYXRlIGFcclxuICogPGEgaHJlZj1cIlNvdW5kLmh0bWxcIj5Tb3VuZDwvYT4gb2JqZWN0LlxyXG4gKiBJdCBjYW4gaGFuZGxlIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICogKCoud2F2LCAqLm1wMykgYXMgZGF0YSBzb3VyY2VzLlxyXG4gKiA8L3A+PHA+XHJcbiAqIE11bHRpcGxlIHNvdXJjZXMgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byBvbmUgYXVkaW8gYnVmZmVyLlxyXG4gKiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBjcmVhdGluZyBtdWx0aXBsZSBTb3VuZFdhdmUgb2JqZWN0cy5cclxuICogSXQncyBsaWtlIGEgd2F2ZXRhYmxlOiBBbGwgc3RhcnQvZW5kIHBvc2l0aW9ucyB3aWxsIGJlIHNhdmVkIHNvXHJcbiAqIHlvdSBjYW4gdHJpZ2dlciB0aGUgb3JpZ2luYWwgc2FtcGxlcyB3aXRob3V0IHVzaW5nIG11bHRpcGxlIGJ1ZmZlcnMuXHJcbiAqIFBvc3NpYmxlIHVzYWdlcyBhcmUgbXVsdGlzYW1wbGVkIHNvdW5kcywgbG9vcHMgb3Igd2F2ZXNlcXVlbmNlcyAoa2luZCBvZikuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+UGxheSBhIHNvdW5kIGZyb20gYW4gYXVkaW8gZmlsZTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdmaWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgSW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q29uY2F0ZW5hdGUgbXVsdGlwbGUgc291cmNlIGZpbGVzIGludG8gb25lIGJ1ZmZlcjxicj5cclxuICogaW4gdGhlIGdpdmVuIG9yZGVyIGFuZCBwbGF5IHRoZW06PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZSgnZmlsZTEud2F2LGZpbGUyLndhdixmaWxlMy53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IEludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlxyXG4gKiBVc2luZyBBcnJheUJ1ZmZlcnMgaW5zdGVhZCBvZiBmaWxlbmFtZXMgd2lsbCBjb21lIGluIGhhbmR5IGlmIHlvdSB3YW50PGJyPlxyXG4gKiB0byBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIFhIUiBvciB1c2UgYSBwcmVsb2FkZXIgKGhlcmU6IHByZWxvYWQuanMpOlxyXG4gKiA8L2NhcHRpb24+XHJcbiAqIHZhciBxdWV1ZSA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKTtcclxuICogcXVldWUub24oJ2NvbXBsZXRlJywgaGFuZGxlQ29tcGxldGUpO1xyXG4gKiBxdWV1ZS5sb2FkTWFuaWZlc3QoW1xyXG4gKiAgICAge2lkOiAnc3JjMScsIHNyYzonZmlsZTEud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9LFxyXG4gKiAgICAge2lkOiAnc3JjMicsIHNyYzonZmlsZTIud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9XHJcbiAqIF0pO1xyXG4gKlxyXG4gKiBmdW5jdGlvbiBoYW5kbGVDb21wbGV0ZSgpIHtcclxuICogICAgIHZhciBiaW5EYXRhMSA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMScpO1xyXG4gKiAgICAgdmFyIGJpbkRhdGEyID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMyJyk7XHJcbiAqICAgICB2YXIgd2F2ZTEgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGExKTtcclxuICogICAgIHZhciB3YXZlMiA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTIpO1xyXG4gKiAgICAgdmFyIGNvbmNhdFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKFtiaW5EYXRhMSwgYmluRGF0YTJdKTtcclxuICogfTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAgeyhPYmplY3R8T2JqZWN0W118c3RyaW5nKX0gYXVkaW9TcmMgICBPbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqL1xyXG52YXIgU291bmRXYXZlID0gZnVuY3Rpb24oYXVkaW9TcmMpIHtcclxuXHJcbiAgdGhpcy5idWZmZXIgPSBudWxsOyAgICAgICAgICAgICAvL0F1ZGlvQnVmZmVyXHJcbiAgdGhpcy5tZXRhRGF0YSA9IFtdOyAgICAgICAgICAgICAgICAvL3N0YXJ0LS9lbmRwb2ludHMgYW5kIGxlbmd0aCBvZiBzaW5nbGUgd2F2ZXNcclxuXHJcbiAgaWYgKGF1ZGlvU3JjKSB7XHJcbiAgICBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL29uZSBhdWRpbyBidWZmZXIgdG8gZGVjb2RlXHJcbiAgICAgIHRoaXMuZGVjb2RlQXVkaW9EYXRhKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiBhdWRpb1NyY1swXSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgYXVkaW8gYnVmZmVycyB0byBkZWNvZGUgYW5kIGNvbmNhdGVuYXRlXHJcbiAgICAgIHRoaXMuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPT09IC0xKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdmFyIGJpbkJ1ZmZlcjtcclxuICAgICAgdGhpcy5sb2FkRmlsZShhdWRpb1NyYywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICBiaW5CdWZmZXIgPSByZXNwb25zZTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYmluQnVmZmVyKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPiAtMSkge1xyXG4gICAgICAvL211bHRpcGxlIGZpbGVzIHRvIGxvYWQvZGVjb2RlIGFuZCBjYW5jYXRpbmF0ZVxyXG4gICAgICB2YXIgYmluQnVmZmVycyA9IHRoaXMubG9hZEZpbGVzKGF1ZGlvU3JjKTtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihiaW5CdWZmZXJzLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgU291bmRXYXZlIG9iamVjdDogVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9zdGFydCB0aGUgb2JqZWN0IHdpdGggZW1wdHkgYnVmZmVyLiBVc2VmdWxsIGZvciB0ZXN0aW5nIGFuZCBhZHZhbmNlZCB1c2FnZS5cclxuICB9XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGJpbmFyeSBhdWRpbyBkYXRhIGFuZCB0dXJucyBpdCBpbnRvIGFuIGF1ZGlvIGJ1ZmZlciBvYmplY3QuXHJcbiAqIFRoaXMgaXMgYSB3cmFwcGVyIGZvciB0aGUgd2ViLWF1ZGlvLWFwaSBkZWNvZGVBdWRpb0RhdGEgZnVuY3Rpb24uXHJcbiAqIEl0IHVzZXMgdGhlIG5ldyBwcm9taXNlIHN5bnRheCBzbyBpdCBwcm9iYWJseSB3b24ndCB3b3JrIGluIGFsbCBicm93c2VycyBieSBub3cuXHJcbiAqIEBwYXJhbSAge0FycmF5QnVmZmVyfSAgcmF3QXVkaW9TcmMgQXVkaW8gZGF0YSBpbiByYXcgYmluYXJ5IGZvcm1hdFxyXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gICAgIFtmdW5jXSAgICAgIENhbiBiZSB1c2VkIHRvIHJ1biBjb2RlIGluc2lkZSB0aGUgaW5uZXIgZGVjb2RlIGZ1bmN0aW9uLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICAgICAgIFByb21pc2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBhdWRpbyBidWZmZXIgYWZ0ZXIgZGVjb2RpbmcuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKHJhd0F1ZGlvU3JjLCBmdW5jKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAvL25ldyBwcm9taXNlIGJhc2VkIHN5bnRheCBjdXJyZW50bHkgbm90IGF2YWlsYWJsZSBpbiBDaHJvbWUgPDQ5LCBJRSwgU2FmYXJpXHJcbiAgLy9UT0RPOiBtb25rZXlwYXRjaCB3aXRoIGNhbGxcclxuICB0aGlzLmJ1ZmZlciA9IGNvcmUuZGVjb2RlQXVkaW9EYXRhKHJhd0F1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgIGlmIChmdW5jKSB7XHJcbiAgICAgIGZ1bmMoKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb25jYXRlbmF0ZXMgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIHRvIGFuIEF1ZGlvQnVmZmVyLlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gYmluYXJ5QnVmZmVycyAgQXJyYXkgaG9sZGluZyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnNcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGF1ZGlvQnVmZmVyICAgQW4gZXhpc3RpbmcgQXVkaW9CdWZmZXIgb2JqZWN0XHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgICAgICAgIFRoZSBjb25jYXRlbmF0ZWQgQXVkaW9CdWZmZXJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYmluYXJ5QnVmZmVycywgYXVkaW9CdWZmZXIpIHtcclxuICBiaW5hcnlCdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYmluQnVmZmVyKSB7XHJcbiAgICB2YXIgdG1wQXVkaW9CdWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShiaW5CdWZmZXIpO1xyXG4gICAgdGhpcy5tZXRhRGF0YS5wdXNoKHRoaXMuYWRkV2F2ZU1ldGFEYXRhKGF1ZGlvQnVmZmVyLCB0bXBBdWRpb0J1ZmZlcikpO1xyXG4gICAgYXVkaW9CdWZmZXIgPSB0aGlzLmFwcGVuZEF1ZGlvQnVmZmVyKGF1ZGlvQnVmZmVyLCB0bXBBdWRpb0J1ZmZlcik7XHJcbiAgfSwgdGhpcyk7XHJcblxyXG4gIHJldHVybiBhdWRpb0J1ZmZlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBcHBlbmRzIHR3byBhdWRpbyBidWZmZXJzLiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOjxicj5cclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDE0MzY1Mi93ZWItYXVkaW8tYXBpLWFwcGVuZC1jb25jYXRlbmF0ZS1kaWZmZXJlbnQtYXVkaW9idWZmZXJzLWFuZC1wbGF5LXRoZW0tYXMtb25lLXNvblxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMSBUaGUgZmlyc3QgYXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIyIFRoZSBzZWNvbmQgYXVkaW8gYnVmZmVyXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIGJ1ZmZlcjEgKyBidWZmZXIyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFwcGVuZEF1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyMSwgYnVmZmVyMikge1xyXG4gIHZhciBudW1iZXJPZkNoYW5uZWxzID0gTWF0aC5taW4oYnVmZmVyMS5udW1iZXJPZkNoYW5uZWxzLCBidWZmZXIyLm51bWJlck9mQ2hhbm5lbHMpO1xyXG4gIHZhciB0bXAgPSBjb3JlLmNyZWF0ZUJ1ZmZlcihudW1iZXJPZkNoYW5uZWxzLFxyXG4gICAgKGJ1ZmZlcjEubGVuZ3RoICsgYnVmZmVyMi5sZW5ndGgpLFxyXG4gICAgYnVmZmVyMS5zYW1wbGVSYXRlKTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mQ2hhbm5lbHM7IGkrKykge1xyXG4gICAgdmFyIGNoYW5uZWwgPSB0bXAuZ2V0Q2hhbm5lbERhdGEoaSk7XHJcbiAgICBjaGFubmVsLnNldCggYnVmZmVyMS5nZXRDaGFubmVsRGF0YShpKSwgMCk7XHJcbiAgICBjaGFubmVsLnNldCggYnVmZmVyMi5nZXRDaGFubmVsRGF0YShpKSwgYnVmZmVyMS5sZW5ndGgpO1xyXG4gIH1cclxuICByZXR1cm4gdG1wO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcCBwb2ludHMgYW5kIGxlbmd0aCBpbiBzYW1wbGUtZnJhbWVzXHJcbiAqIG9mIGFuIGFwcGVuZGVkIHdhdmVmb3JtIGFuZCBhZGRzIGl0IHRvIHRoZSBtZXRhRGF0YSBhcnJheS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGV4aXN0aW5nQnVmZmVyIFRoZSAnb2xkJyBidWZmZXIgdGhhdCBnZXRzIGFwcGVuZGVkXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBuZXdCdWZmZXIgICAgICBUaGUgYnVmZmVyIHRoYXQgZ2V0cyBhcHBlbmRlZFxyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgRGljdGlvbmFyeSB3aXRoIHN0YXJ0L3N0b3AvbGVuZ3RoIGRhdGFcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYWRkV2F2ZU1ldGFEYXRhID0gZnVuY3Rpb24oZXhpc3RpbmdCdWZmZXIsIG5ld0J1ZmZlcikge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZXhpc3RpbmdCdWZmZXIubGVuZ3RoICsgMSxcclxuICAgIGVuZDogZXhpc3RpbmdCdWZmZXIubGVuZ3RoICsgbmV3QnVmZmVyLmxlbmd0aCxcclxuICAgIGxlbmd0aDogbmV3QnVmZmVyLmxlbmd0aFxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgYSBiaW5hcnkgZmlsZSBhbmQgY2FsbHMgYSBmdW5jdGlvbiB3aXRoIHRoZVxyXG4gKiByZXR1cm5lZCBBcnJheUJ1ZmZlciBhcyBpdHMgYXJndW1lbnQgd2hlbiBkb25lLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgZmlsZW5hbWUgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBvbmxvYWRDYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXHJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICBbYXN5bmM9dHJ1ZV0gICBBc3luY2hyb25vdXMgbG9hZGluZ1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgYXJyYXlCdWZmZXI7XHJcbiAqIHRoaXMubG9hZEZpbGUoJ2ZpbGUxLndhdicsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAqICAgYXJyYXlCdWZmZXIgPSByZXNwb25zZTtcclxuICogfSk7XHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlID0gZnVuY3Rpb24oZmlsZW5hbWUsIG9ubG9hZENhbGxiYWNrLCBhc3luYykge1xyXG4gIHZhciBhc3luY2hyb25vdXNseSA9IHRydWU7XHJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gIGlmIChhc3luYykge1xyXG4gICAgYXN5bmNocm9ub3VzbHkgPSBhc3luYztcclxuICB9XHJcblxyXG4gIHJlcXVlc3Qub3BlbignR0VUJywgZmlsZW5hbWUsIGFzeW5jaHJvbm91c2x5KTtcclxuICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XHJcblxyXG4gIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBvbmxvYWRDYWxsYmFjayhyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICB9O1xyXG5cclxuICByZXF1ZXN0LnNlbmQoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBtdWx0aXBsZSBiaW5hcnkgZmlsZXMgYW5kIHJldHVybnMgYW4gYXJyYXlcclxuICogd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBmaWxlcyBpbiB0aGUgZ2l2ZW4gb3JkZXIuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzIExpc3Qgd2l0aCBmaWxlbmFtZXNcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgQXJyYXkgb2YgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYmluQnVmZmVycyA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IGZpbGVuYW1lcy5zcGxpdCgnLCcpO1xyXG4gIG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xyXG4gICAgc2VsZi5sb2FkRmlsZShuYW1lLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICBiaW5CdWZmZXJzW25hbWVdID0gcmVzcG9uc2U7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRoaXMuc29ydEJpbkJ1ZmZlcnMobmFtZXMsIGJpbkJ1ZmZlcnMpO1xyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS5zb3J0QmluQnVmZmVycyA9IGZ1bmN0aW9uKGZpbGVuYW1lcywgYmluQnVmZmVycykge1xyXG4gIHJldHVybiBmaWxlbmFtZXMubWFwKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICByZXR1cm4gYmluQnVmZmVyc1tlbF07XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kV2F2ZTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgdGhlIGZvdW5kYXRpb24gb2YgdGhlIEludGVybWl4IGxpYnJhcnkuXHJcbiAqIEl0IHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQgc28gaXQgY2FuIGJlIGVhc2lseSBjb25zdW1lZFxyXG4gKiBmcm9tIGFsbCBjbGFzc2VzIG9mIHRoZSBsaWJyYXJ5LlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtBdWRpb0NvbnRleHR9IFRoZSBBdWRpb0NvbnRleHQgb2JqZWN0XHJcbiAqXHJcbiAqIEB0b2RvIFNob3VsZCB3ZSBkbyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3Igb2xkZXIgYXBpLXZlcnNpb25zP1xyXG4gKiBAdG9kbyBDaGVjayBmb3IgbW9iaWxlL2lPUyBjb21wYXRpYmlsaXR5LlxyXG4gKiBAdG9kbyBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGVcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+U3VzcGVuZCBhbmQgcmVzdW1lIHRoZSBhdWRpbyBjb250ZXh0IHRvXHJcbiAqIGNyZWF0ZSBhIHBhdXNlIGJ1dHRvbi4gVGhpcyBzaG91bGQgYmUgdXNlZCB3aXRoIGNyZWF0ZUF1ZGlvV29ya2VyXHJcbiAqIGFzIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIHdoZW4gc3VzcGVuZCBpcyBjYWxsZWQgb24gYW4gb2ZmbGluZSBhdWRpbyBjb250ZXh0LlxyXG4gKiBZb3UgY2FuIGFsc28gcGF1c2Ugc2luZ2xlIHNvdW5kcyB3aXRoIDxpPlNvdW5kLnBhdXNlKCk8L2k+LlxyXG4gKiBQbGVhc2UgcmVhZCA8YSBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZGUvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dC9zdXNwZW5kXCI+dGhlIGRldmVsb3BlciBkb2NzIGF0IE1ETjwvYT5cclxuICogdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgdGhpcy48L2NhcHRpb24+XHJcbiAqIHN1c3Jlc0J0bi5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAqICAgaWYoSW50ZXJtaXguc3RhdGUgPT09ICdydW5uaW5nJykge1xyXG4gKiAgICAgSW50ZXJtaXguc3VzcGVuZCgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdSZXN1bWUgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9IGVsc2UgaWYgKEludGVybWl4LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xyXG4gKiAgICAgSW50ZXJtaXgucmVzdW1lKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1N1c3BlbmQgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9XHJcbiAqIH1cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh3aW5kb3cuQXVkaW9Db250ZXh0KSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ291bGRuXFwndCBpbml0aWFsaXplIHRoZSBhdWRpbyBjb250ZXh0LicpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGF1ZGlvQ3R4O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgbXVjaCBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICpcclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB0aW1lciA9IG51bGw7XHJcbnZhciBpbnRlcnZhbCA9IDEwMDtcclxuXHJcbnZhciB3b3JrZXIgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuICAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbiAgICAgIGlmICh0aW1lcikge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3b3JrZXI7XHJcblxyXG4vKmVzbGludC1kaXNhYmxlICovXHJcbi8vIHNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4vLyAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuLy8gICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7cG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbi8vICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4vLyAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbi8vICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuLy8gICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4vLyAgICAgaWYgKHRpbWVyKSB7XHJcbi8vICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4vLyAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3Bvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4vLyAgICAgfVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICBzZWxmLmNsb3NlKCk7XHJcbi8vIH07XHJcbiJdfQ==
