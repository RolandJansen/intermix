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

var work = _dereq_('webworkify');
var core = _dereq_('./core.js');
var events = _dereq_('./events.js');

/**
 * The main class of the sequencer. It does the queuing of
 * parts and events and runs the schedulers that fire events
 * and draws to the screen.
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
  this.runqueue = [];         //list with parts that are playing or will be played shortly

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

/**
 * Reads events from the master queue and fires them.
 * It gets called at a constant rate, looks ahead in
 * the queue and fires all events in the near future
 * with a delay computed from the current bpm value.
 * @return {Void}
 */
Sequencer.prototype.scheduler = function() {
  this.now = core.currentTime;

  // if invoked for the first time or previously stopped
  if (this.nextStepTime === 0) {
    this.nextStepTime = this.now;
  }

  while (this.nextStepTime < this.now + this.lookahead) {
    this.addPartsToRunqueue();
    this.fireEvents();

    this.nextStepTime += this.timePerStep;

    this.setQueuePointer();
  }
};

/**
 * Looks in the master queue for parts and adds
 * copies of them to the runqueue.
 * @private
 * @return {Void}
 */
Sequencer.prototype.addPartsToRunqueue = function() {
  if (this.queue[this.nextStep]) {
    this.queue[this.nextStep].forEach(function(part) {
      this.runqueue.push(this.copyArray(part.pattern));
    }, this);
  }
};

/**
 * Fires all events for the upcomming step.
 * @private
 * @return {Void}
 */
Sequencer.prototype.fireEvents = function() {
  this.runqueue.forEach(function(pattern, index) {
    var seqEvents = pattern.shift();  //return first element and remove it
    if (seqEvents) {
      seqEvents.forEach(function(seqEvent) {
        this.processSeqEvent(seqEvent);
        //remove part from runQueue if empty
        if (pattern.length === 0) {
          this.runqueue.splice(index, 1);
        }
      }, this);
    }
  }, this);
};

/**
 * Invokes the appropriate subsystem to process the event
 * @private
 * @param  {Object} seqEvent  The event to process
 * @return {boolean}          true if success, false if not
 */
Sequencer.prototype.processSeqEvent = function(seqEvent) {
  switch (seqEvent.class) {
    case 'audio':
      // invoke audio subsystem
      return true;
      break;
    case 'synth':
      // invoke the synth subsystem
      return true;
      break;
    default:
      return false;
  }
};

/**
 * Sets the pointer to the next step that should be played
 * in the master queue. If we're playing in loop mode,
 * jump back to loopstart when end of loop is reached.
 * @private
 * @return {Void}
 */
Sequencer.prototype.setQueuePointer = function() {
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
};

/**
 * Starts the sequencer
 * @return {Void}
 */
Sequencer.prototype.start = function() {
  this.scheduleWorker.postMessage('start');
  this.isRunning = true;
  window.requestAnimationFrame(this.draw);
};

/**
 * Stops the sequencer (halts at the current position)
 * @return {Void}
 */
Sequencer.prototype.stop = function() {
  this.scheduleWorker.postMessage('stop');
  this.runQueue = [];
  this.nextStepTime = 0;
  this.isRunning = false;
};

/**
 * Scheduler that runs a drawing function every time
 * the screen refreshes. The function Sequencer.animationFrame()
 * has to be overridden by the application with stuff to be drawn on the screen.
 * It calls itself recursively on every frame as long as the sequencer is running.
 * @private
 * @return {Void}
 */
Sequencer.prototype.draw = function() {
  // first we'll have to find out, what step was recently played.
  // this is somehow clumsy because the sequencer doesn't keep track of that.
  var lookAheadDelta = this.nextStepTime - core.currentTime;
  var stepsAhead = Math.floor(lookAheadDelta / this.timePerStep) + 1;
  this.lastPlayedStep = this.nextStep - stepsAhead;

  this.animationFrame(this.lastPlayedStep);

  if (this.isRunning) {
    window.requestAnimationFrame(this.draw);
  }
};

/**
 * Adds a part to the master queue.
 * @param  {Object} part      An instance of Part
 * @param  {Int}    position  Position in the master queue
 * @return {Void}
 */
Sequencer.prototype.addPart = function(part, position) {
  if (part.length && part.pattern) {
    if (!this.queue[position]) {
      this.queue[position] = [];
    }
    this.queue[position].push(part);
  } else {
    throw new Error('Given parameter doesn\' seem to be a part object');
  }
};

/**
 * Removes a part object from the master queue
 * @param  {Object} part     Part instance to be removed
 * @param  {Int}    position Position in the master queue
 * @return {Void}
 */
Sequencer.prototype.removePart = function(part, position) {
  if (this.queue[position] instanceof Array &&
    this.queue[position].length > 0) {
    var index = this.queue[position].indexOf(part);
    this.queue[position].splice(index, 1);
  } else {
    throw new Error('Part not found at position ' + position + '.');
  }
};

Sequencer.prototype.createNoteEvent = function(note, length) {
  return {
    'note': note,
    'length': length
  };
};

/**
 * Computes the time in seconds as float value
 * between one shortest posssible note
 * (64th by default) and the next.
 * @param  {float}  bpm        beats per minute
 * @param  {Int}    resolution shortest possible note value
 * @return {float}             time in seconds
 */
Sequencer.prototype.setTimePerStep = function(bpm, resolution) {
  return (60 * 4) / (bpm * resolution);
};

/**
 * Makes a copy of a flat array.
 * Uses a pre-allocated while-loop
 * which seems to be the fasted way
 * (by far) of doing this:
 * http://jsperf.com/new-array-vs-splice-vs-slice/113
 * @private
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

},{"./core.js":7,"./events.js":8,"./scheduleWorker.js":9,"webworkify":2}],5:[function(_dereq_,module,exports){
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
'use strict';

/**
 * This is not about javascript events! It's just
 * a definition of the events that the sequencer can handle plus
 * some functions to create valid events.
 * The class defines which subsystem is invoked to process the event.
 * Every class can have several types and a type consists of one or
 * more properties.
 */

var evProp = [
  'instrument', // the event receiver
  'tone',       // Int between 0 and 127 beginning at c0
  'duration',   // Int representing a number of 64th notes
  'velocity',   // Int between 0 and 127
  'pitch',
  'volume',
  'pan'
];

var evType = {
  'note': [ evProp[0], evProp[1], evProp[2], evProp[3] ],
  'control': [ evProp[4], evProp[5], evProp[6] ]
};

var evClass = {
  'audio': [evType.note, evType.control],
  'synth': [],
  'fx': [],
  'midi': [],
  'osc': []
};

/**
 * Validates the class of a sequencer event
 * @private
 * @param  {String}   eClass Event class
 * @return {boolean}  true if class exists, false if not
 */
var validateClass = function(eClass) {
  if (evClass.hasOwnProperty(eClass)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates the type of a sequencer event
 * @private
 * @param  {String}   eType Event type
 * @return {boolean}  true if type exists, false if not
 */
var validateType = function(eType) {
  if (evType.hasOwnProperty(eType)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Checks if an instrument is an object.
 * This is a poorly weak test but that's
 * all we can do here.
 * @param  {Object} instr An instrument object
 * @return {boolean}      true if it's an object, false if not
 */
var validatePropInstrument = function(instr) {
  if (typeof instr === 'object') {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates if a tone or velocity value is
 * an integer between 0 and 127.
 * @private
 * @param  {Int}  value   The number that represents a tone
 * @return {boolean}      True if its a valid tone, false if not
 */
var validatePropToneVelo = function(value) {
  if (!isNaN(value) && Number.isInteger(value) && value >= 0 && value <= 127) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates if a duration is a positive integer.
 * @private
 * @param  {Int}  value   Number representing multiple 64th notes
 * @return {boolean}      True if its a valid duration, false if not
 */
var validatePropDuration = function(value) {
  if (!isNaN(value) && Number.isInteger(value) && value >= 0) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates an object of event properties.
 * It checks the properties are valid for the given type.
 * @private
 * @param  {Object} eProps  Object with event properties
 * @param  {String} eType   Event type to validate against
 * @return {boolean}        true if all props are valid, false if not
 */
var validateProps = function(eProps, eType) {
  var type = evType[eType];
  for (var key in eProps)  {
    if (evProp.indexOf(key) === -1 &&
    type.indexOf(key) === -1) {
      return false;
    }
  }
  return true;
};

/**
 * Creates a sequencer event.
 * @private
 * @param  {String} eClass Event class
 * @param  {String} eType  Event type
 * @param  {Object} eProps Object with event properties
 * @return {Object}        Sequencer event
 */
var createEvent = function(eClass, eType, eProps) {
  if (validateClass(eClass) &&
    validateType(eType) &&
    validateProps(eProps, eType)) {
    return {
      'class': eClass,
      'type': eType,
      'props': eProps
    };
  } else {
    throw new Error('Unable to create sequencer event. Wrong parameters');
  }
};

/**
 * Creates an audio note event
 * @param  {Int} tone     Tone between 0 and 127
 * @param  {Int} velocity Velocity between 0 and 127
 * @param  {Int} duration Duration in 64th notes
 * @return {Object}       All properties in one object
 */
var createAudioNote = function(tone, velocity, duration, instr) {
  var props = {};
  if (instr && validatePropInstrument(instr)) {
    props.instrument = instr;
  } else {
    throw new Error('A sequencer event must have an instrument as property');
  }
  if (tone && validatePropToneVelo(tone)) {
    props.tone = tone;
  }
  if (velocity && validatePropToneVelo(velocity)) {
    props.velocity = velocity;
  }
  if (duration && validatePropDuration(duration)) {
    props.duration = duration;
  }
  return createEvent('audio', 'note', props);
};

module.exports = {
  class: evClass,
  type: evType,
  property: evProp,
  createAudioNote: createAudioNote
};

},{}],9:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vSW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIEludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbkludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbkludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5JbnRlcm1peC5TZXF1ZW5jZXIgPSByZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpO1xyXG5JbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEludGVybWl4O1xyXG4iLCJ2YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcblxudmFyIHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgdmFyIHdrZXk7XG4gICAgdmFyIGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICB2YXIgZXhwID0gY2FjaGVba2V5XS5leHBvcnRzO1xuICAgICAgICAvLyBVc2luZyBiYWJlbCBhcyBhIHRyYW5zcGlsZXIgdG8gdXNlIGVzbW9kdWxlLCB0aGUgZXhwb3J0IHdpbGwgYWx3YXlzXG4gICAgICAgIC8vIGJlIGFuIG9iamVjdCB3aXRoIHRoZSBkZWZhdWx0IGV4cG9ydCBhcyBhIHByb3BlcnR5IG9mIGl0LiBUbyBlbnN1cmVcbiAgICAgICAgLy8gdGhlIGV4aXN0aW5nIGFwaSBhbmQgYmFiZWwgZXNtb2R1bGUgZXhwb3J0cyBhcmUgYm90aCBzdXBwb3J0ZWQgd2VcbiAgICAgICAgLy8gY2hlY2sgZm9yIGJvdGhcbiAgICAgICAgaWYgKGV4cCA9PT0gZm4gfHwgZXhwLmRlZmF1bHQgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXdrZXkpIHtcbiAgICAgICAgd2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgd2NhY2hlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgICAgIHdjYWNoZVtrZXldID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZXNbd2tleV0gPSBbXG4gICAgICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnLCdtb2R1bGUnLCdleHBvcnRzJ10sICcoJyArIGZuICsgJykoc2VsZiknKSxcbiAgICAgICAgICAgIHdjYWNoZVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgc2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuXG4gICAgdmFyIHNjYWNoZSA9IHt9OyBzY2FjaGVbd2tleV0gPSB3a2V5O1xuICAgIHNvdXJjZXNbc2tleV0gPSBbXG4gICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZSddLCAoXG4gICAgICAgICAgICAvLyB0cnkgdG8gY2FsbCBkZWZhdWx0IGlmIGRlZmluZWQgdG8gYWxzbyBzdXBwb3J0IGJhYmVsIGVzbW9kdWxlXG4gICAgICAgICAgICAvLyBleHBvcnRzXG4gICAgICAgICAgICAndmFyIGYgPSByZXF1aXJlKCcgKyBzdHJpbmdpZnkod2tleSkgKyAnKTsnICtcbiAgICAgICAgICAgICcoZi5kZWZhdWx0ID8gZi5kZWZhdWx0IDogZikoc2VsZik7J1xuICAgICAgICApKSxcbiAgICAgICAgc2NhY2hlXG4gICAgXTtcblxuICAgIHZhciBzcmMgPSAnKCcgKyBidW5kbGVGbiArICcpKHsnXG4gICAgICAgICsgT2JqZWN0LmtleXMoc291cmNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdpZnkoa2V5KSArICc6WydcbiAgICAgICAgICAgICAgICArIHNvdXJjZXNba2V5XVswXVxuICAgICAgICAgICAgICAgICsgJywnICsgc3RyaW5naWZ5KHNvdXJjZXNba2V5XVsxXSkgKyAnXSdcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSkuam9pbignLCcpXG4gICAgICAgICsgJ30se30sWycgKyBzdHJpbmdpZnkoc2tleSkgKyAnXSknXG4gICAgO1xuXG4gICAgdmFyIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCB8fCB3aW5kb3cubW96VVJMIHx8IHdpbmRvdy5tc1VSTDtcblxuICAgIHJldHVybiBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgIG5ldyBCbG9iKFtzcmNdLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pXG4gICAgKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBwYXJ0IG9mIGEgc2VxdWVuY2UuIEl0IGNhbiBiZVxyXG4gKiB1c2VkIGluIG1hbnkgd2F5czpcclxuICogPHVsPlxyXG4gKiA8bGk+QSBwYXJ0IG9mIGEgdHJhY2sgbGlrZSBpbiBwaWFuby1yb2xsIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8bGk+QSBwYXR0ZXJuIGxpa2UgaW4gc3RlcCBzZXF1ZW5jZXJzLCBkcnVtIGNvbXB1dGVycyBhbmQgdHJhY2tlcnM8L2xpPlxyXG4gKiA8bGk+QSBsb29wIGxpa2UgaW4gbGl2ZSBzZXF1ZW5jZXJzPC9saT5cclxuICogPC91bD5cclxuICogVGVjaG5pY2FsbHkgaXQgY2FuIHN0b3JlIGFueSB0eXBlIG9mIGV2ZW50IHlvdXIgc3lzdGVtIGlzIGNhcGFibGUgb2YuXHJcbiAqIFRoaXMgbWVhbnMgaXQgaXMgbm90IGxpbWl0ZWQgdG8gYXVkaW8sIG1pZGksIG9zYyBvciBkbXggYnV0IGNhbiBob2xkXHJcbiAqIGFueSB0eXBlIG9mIGphdmFzY3JpcHQgb2JqZWN0LiBBIHBvc3NpYmxlIHVzZWNhc2Ugd291bGQgYmUgdG8gdHJpZ2dlclxyXG4gKiBzY3JlZW4gZXZlbnRzIHdpdGggdGhlIGRyYXcgZnVuY3Rpb24gb2YgdGhlIHNlcXVlbmNlciBvYmplY3QuXHJcbiAqIEB0b2RvIEFkZCBhdCBsZWFzdCBvbmUgdXNhZ2UgZXhhbXBsZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgICAgICBMZW5ndGggb2YgdGhlIHBhcnQgaW4gYmFycyAoNCBiZWF0cylcclxuICovXHJcbnZhciBQYXJ0ID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcblxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDE2OyAvLyAocmVzb2x1dGlvbiAqIG11bHRpcGx5KSBzaG91bGQgYWx3YXN5IGJlIDY0XHJcbiAgdGhpcy5tdWx0aXBseSA9IDQ7ICAgIC8vIHJlc29sdXRpb24gbXVsdGlwbGllclxyXG4gIHRoaXMubGVuZ3RoID0gMTsgICAgICAvLyAxID0gb25lIGJhciAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gIHRoaXMubmFtZSA9ICdQYXJ0JzsgICAvLyBuYW1lIG9mIHRoaXMgcGFydFxyXG4gIHRoaXMucGF0dGVybiA9IFtdOyAgICAvLyB0aGUgYWN0dWFsIHBhdHRlcm4gd2l0aCBub3RlcyBldGMuXHJcblxyXG4gIGlmIChsZW5ndGgpIHtcclxuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5pbml0UGF0dGVybih0aGlzLmxlbmd0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhbiBlbXB0eSBwYXR0ZXJuIGZvciB0aGUgcGFydC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggIExlbmd0aCBvZiB0aGUgcGF0dGVybiBtZXN1cmVkIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmluaXRQYXR0ZXJuID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcbiAgdmFyIHBhdHRlcm4gPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IChsZW5ndGggKiA2NCk7IGkrKykge1xyXG4gICAgcGF0dGVybltpXSA9IFtdO1xyXG4gIH1cclxuICByZXR1cm4gcGF0dGVybjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IHRvIHRoZSBwYXR0ZXJuIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbiAtIDEpICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvc2l0aW9uIG91dCBvZiBwYXR0ZXJuIGJvdW5kcy4nKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbiBldmVudCBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIHZhciBwb3MgPSAocG9zaXRpb24gLSAxKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgdmFyIGluZGV4ID0gdGhpcy5wYXR0ZXJuW3Bvc10uaW5kZXhPZihzZXFFdmVudCk7XHJcbiAgdGhpcy5wYXR0ZXJuW3Bvc10uc3BsaWNlKGluZGV4LCAxKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge0ludH0gICAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wYXR0ZXJuLmxlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYWxsIHBvc2l0aW9ucyB0aGF0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGV2ZW50LlxyXG4gKiBUaGlzIGlzIGN1cnJlbnRseSB1bnVzZWQgYW5kIHdpbGwgcHJvYmFibHkgZGVsZXRlZFxyXG4gKiBpbiBmdXR1cmUgdmVyc2lvbnMuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpO1xyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgbWFpbiBjbGFzcyBvZiB0aGUgc2VxdWVuY2VyLiBJdCBkb2VzIHRoZSBxdWV1aW5nIG9mXHJcbiAqIHBhcnRzIGFuZCBldmVudHMgYW5kIHJ1bnMgdGhlIHNjaGVkdWxlcnMgdGhhdCBmaXJlIGV2ZW50c1xyXG4gKiBhbmQgZHJhd3MgdG8gdGhlIHNjcmVlbi5cclxuICpcclxuICogU2NoZWR1bGluZyBpbnNwaXJlZCBieSBcIkEgVGFsZSBvZiBUd28gQ2xvY2tzXCIgYnkgQ2hyaXMgV2lsc29uOlxyXG4gKiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9hdWRpby9zY2hlZHVsaW5nL1xyXG4gKi9cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJlYXRzUGVyTWludXRlID0gMTIwOyAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5xdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLm5vdzsgICAgICAgICAgICAgICAgICAgIC8vdGltZXN0YW1wIGZyb20gYXVkaW9jb250ZXh0IHdoZW4gdGhlIHNjaGVkdWxlciBpcyBpbnZva2VkLlxyXG4gIHRoaXMudGltZVBlclN0ZXA7ICAgICAgICAgICAvL3BlcmlvZCBvZiB0aW1lIGJldHdlZW4gdHdvIHN0ZXBzXHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwOyAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIG5leHQgc3RlcCB3aWxsIGJlIHRyaWdnZXJlZFxyXG4gIHRoaXMubmV4dFN0ZXAgPSAwOyAgICAgICAgICAvL3Bvc2l0aW9uIGluIHRoZSBxdWV1ZSB0aGF0IHdpbGwgZ2V0IHRyaWdnZXJlZCBuZXh0XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IDA7ICAgIC8vc3RlcCBpbiBxdWV1ZSB0aGF0IHdhcyBwbGF5ZWQgKG5vdCB0cmlnZ2VyZWQpIHJlY2VudGx5ICh1c2VkIGZvciBkcmF3aW5nKS5cclxuICB0aGlzLmxvb3AgPSBmYWxzZTsgICAgICAgICAgLy9wbGF5IGEgc2VjdGlvbiBvZiB0aGUgcXVldWUgaW4gYSBsb29wXHJcbiAgdGhpcy5sb29wU3RhcnQ7ICAgICAgICAgICAgIC8vZmlyc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMubG9vcEVuZDsgICAgICAgICAgICAgICAvL2xhc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7ICAgICAvL3RydWUgaWYgc2VxdWVuY2VyIGlzIHJ1bm5pbmcsIG90aGVyd2lzZSBmYWxzZVxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWU7ICAgICAgICAvL2hhcyB0byBiZSBvdmVycmlkZGVuIHdpdGggYSBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgaW4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJhdyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0UGxheWVkU3RlcCBpbnQgYXMgcGFyYW1ldGVyLlxyXG5cclxuICAvLyBzZXQgdGltZSBwZXIgc2V0VGltZVBlclN0ZXBcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcCh0aGlzLmJlYXRzUGVyTWludXRlLCB0aGlzLnJlc29sdXRpb24pO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBzY2hlZHVsZXItdGltZXJcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyID0gd29yayhyZXF1aXJlKCcuL3NjaGVkdWxlV29ya2VyLmpzJykpO1xyXG5cclxuICAvKmVzbGludC1lbmFibGUgKi9cclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAndGljaycpIHtcclxuICAgICAgc2VsZi5zY2hlZHVsZXIoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKHsnaW50ZXJ2YWwnOiB0aGlzLmludGVydmFsfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgZXZlbnRzIGZyb20gdGhlIG1hc3RlciBxdWV1ZSBhbmQgZmlyZXMgdGhlbS5cclxuICogSXQgZ2V0cyBjYWxsZWQgYXQgYSBjb25zdGFudCByYXRlLCBsb29rcyBhaGVhZCBpblxyXG4gKiB0aGUgcXVldWUgYW5kIGZpcmVzIGFsbCBldmVudHMgaW4gdGhlIG5lYXIgZnV0dXJlXHJcbiAqIHdpdGggYSBkZWxheSBjb21wdXRlZCBmcm9tIHRoZSBjdXJyZW50IGJwbSB2YWx1ZS5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5ub3cgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG5cclxuICAvLyBpZiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZSBvciBwcmV2aW91c2x5IHN0b3BwZWRcclxuICBpZiAodGhpcy5uZXh0U3RlcFRpbWUgPT09IDApIHtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lID0gdGhpcy5ub3c7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCB0aGlzLm5vdyArIHRoaXMubG9va2FoZWFkKSB7XHJcbiAgICB0aGlzLmFkZFBhcnRzVG9SdW5xdWV1ZSgpO1xyXG4gICAgdGhpcy5maXJlRXZlbnRzKCk7XHJcblxyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICB0aGlzLnNldFF1ZXVlUG9pbnRlcigpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyBpbiB0aGUgbWFzdGVyIHF1ZXVlIGZvciBwYXJ0cyBhbmQgYWRkc1xyXG4gKiBjb3BpZXMgb2YgdGhlbSB0byB0aGUgcnVucXVldWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnRzVG9SdW5xdWV1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdKSB7XHJcbiAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2godGhpcy5jb3B5QXJyYXkocGFydC5wYXR0ZXJuKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRmlyZXMgYWxsIGV2ZW50cyBmb3IgdGhlIHVwY29tbWluZyBzdGVwLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5maXJlRXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5ydW5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhdHRlcm4sIGluZGV4KSB7XHJcbiAgICB2YXIgc2VxRXZlbnRzID0gcGF0dGVybi5zaGlmdCgpOyAgLy9yZXR1cm4gZmlyc3QgZWxlbWVudCBhbmQgcmVtb3ZlIGl0XHJcbiAgICBpZiAoc2VxRXZlbnRzKSB7XHJcbiAgICAgIHNlcUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQpO1xyXG4gICAgICAgIC8vcmVtb3ZlIHBhcnQgZnJvbSBydW5RdWV1ZSBpZiBlbXB0eVxyXG4gICAgICAgIGlmIChwYXR0ZXJuLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgdGhpcy5ydW5xdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW52b2tlcyB0aGUgYXBwcm9wcmlhdGUgc3Vic3lzdGVtIHRvIHByb2Nlc3MgdGhlIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCB0byBwcm9jZXNzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgIHRydWUgaWYgc3VjY2VzcywgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgc3dpdGNoIChzZXFFdmVudC5jbGFzcykge1xyXG4gICAgY2FzZSAnYXVkaW8nOlxyXG4gICAgICAvLyBpbnZva2UgYXVkaW8gc3Vic3lzdGVtXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3N5bnRoJzpcclxuICAgICAgLy8gaW52b2tlIHRoZSBzeW50aCBzdWJzeXN0ZW1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBwb2ludGVyIHRvIHRoZSBuZXh0IHN0ZXAgdGhhdCBzaG91bGQgYmUgcGxheWVkXHJcbiAqIGluIHRoZSBtYXN0ZXIgcXVldWUuIElmIHdlJ3JlIHBsYXlpbmcgaW4gbG9vcCBtb2RlLFxyXG4gKiBqdW1wIGJhY2sgdG8gbG9vcHN0YXJ0IHdoZW4gZW5kIG9mIGxvb3AgaXMgcmVhY2hlZC5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHRoaXMubG9vcCkge1xyXG4gICAgaWYgKHRoaXMubmV4dFN0ZXAgPj0gdGhpcy5sb29wRW5kKSB7XHJcbiAgICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgICAgdGhpcy5ydW5RdWV1ZSA9IFtdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyB0aGUgc2VxdWVuY2VyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICB0aGlzLmlzUnVubmluZyA9IHRydWU7XHJcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgKGhhbHRzIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uKVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gIHRoaXMucnVuUXVldWUgPSBbXTtcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY2hlZHVsZXIgdGhhdCBydW5zIGEgZHJhd2luZyBmdW5jdGlvbiBldmVyeSB0aW1lXHJcbiAqIHRoZSBzY3JlZW4gcmVmcmVzaGVzLiBUaGUgZnVuY3Rpb24gU2VxdWVuY2VyLmFuaW1hdGlvbkZyYW1lKClcclxuICogaGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggc3R1ZmYgdG8gYmUgZHJhd24gb24gdGhlIHNjcmVlbi5cclxuICogSXQgY2FsbHMgaXRzZWxmIHJlY3Vyc2l2ZWx5IG9uIGV2ZXJ5IGZyYW1lIGFzIGxvbmcgYXMgdGhlIHNlcXVlbmNlciBpcyBydW5uaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gZmlyc3Qgd2UnbGwgaGF2ZSB0byBmaW5kIG91dCwgd2hhdCBzdGVwIHdhcyByZWNlbnRseSBwbGF5ZWQuXHJcbiAgLy8gdGhpcyBpcyBzb21laG93IGNsdW1zeSBiZWNhdXNlIHRoZSBzZXF1ZW5jZXIgZG9lc24ndCBrZWVwIHRyYWNrIG9mIHRoYXQuXHJcbiAgdmFyIGxvb2tBaGVhZERlbHRhID0gdGhpcy5uZXh0U3RlcFRpbWUgLSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIHZhciBzdGVwc0FoZWFkID0gTWF0aC5mbG9vcihsb29rQWhlYWREZWx0YSAvIHRoaXMudGltZVBlclN0ZXApICsgMTtcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcblxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWUodGhpcy5sYXN0UGxheWVkU3RlcCk7XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgcGFydCB0byB0aGUgbWFzdGVyIHF1ZXVlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcnQgICAgICBBbiBpbnN0YW5jZSBvZiBQYXJ0XHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBhcnQubGVuZ3RoICYmIHBhcnQucGF0dGVybikge1xyXG4gICAgaWYgKCF0aGlzLnF1ZXVlW3Bvc2l0aW9uXSkge1xyXG4gICAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXSA9IFtdO1xyXG4gICAgfVxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ucHVzaChwYXJ0KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBwYXJhbWV0ZXIgZG9lc25cXCcgc2VlbSB0byBiZSBhIHBhcnQgb2JqZWN0Jyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBwYXJ0IG9iamVjdCBmcm9tIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICBQYXJ0IGluc3RhbmNlIHRvIGJlIHJlbW92ZWRcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlbW92ZVBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmICh0aGlzLnF1ZXVlW3Bvc2l0aW9uXSBpbnN0YW5jZW9mIEFycmF5ICYmXHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5sZW5ndGggPiAwKSB7XHJcbiAgICB2YXIgaW5kZXggPSB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5pbmRleE9mKHBhcnQpO1xyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0uc3BsaWNlKGluZGV4LCAxKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYXJ0IG5vdCBmb3VuZCBhdCBwb3NpdGlvbiAnICsgcG9zaXRpb24gKyAnLicpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY3JlYXRlTm90ZUV2ZW50ID0gZnVuY3Rpb24obm90ZSwgbGVuZ3RoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICdub3RlJzogbm90ZSxcclxuICAgICdsZW5ndGgnOiBsZW5ndGhcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIHRoZSB0aW1lIGluIHNlY29uZHMgYXMgZmxvYXQgdmFsdWVcclxuICogYmV0d2VlbiBvbmUgc2hvcnRlc3QgcG9zc3NpYmxlIG5vdGVcclxuICogKDY0dGggYnkgZGVmYXVsdCkgYW5kIHRoZSBuZXh0LlxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGJwbSAgICAgICAgYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHJlc29sdXRpb24gc2hvcnRlc3QgcG9zc2libGUgbm90ZSB2YWx1ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gICAgICAgICAgICAgdGltZSBpbiBzZWNvbmRzXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldFRpbWVQZXJTdGVwID0gZnVuY3Rpb24oYnBtLCByZXNvbHV0aW9uKSB7XHJcbiAgcmV0dXJuICg2MCAqIDQpIC8gKGJwbSAqIHJlc29sdXRpb24pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1ha2VzIGEgY29weSBvZiBhIGZsYXQgYXJyYXkuXHJcbiAqIFVzZXMgYSBwcmUtYWxsb2NhdGVkIHdoaWxlLWxvb3BcclxuICogd2hpY2ggc2VlbXMgdG8gYmUgdGhlIGZhc3RlZCB3YXlcclxuICogKGJ5IGZhcikgb2YgZG9pbmcgdGhpczpcclxuICogaHR0cDovL2pzcGVyZi5jb20vbmV3LWFycmF5LXZzLXNwbGljZS12cy1zbGljZS8xMTNcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IHNvdXJjZUFycmF5IEFycmF5IHRoYXQgc2hvdWxkIGJlIGNvcGllZC5cclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIENvcHkgb2YgdGhlIHNvdXJjZSBhcnJheS5cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY29weUFycmF5ID0gZnVuY3Rpb24oc291cmNlQXJyYXkpIHtcclxuICB2YXIgZGVzdEFycmF5ID0gbmV3IEFycmF5KHNvdXJjZUFycmF5Lmxlbmd0aCk7XHJcbiAgdmFyIGkgPSBzb3VyY2VBcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGktLSkge1xyXG4gICAgZGVzdEFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XHJcbiAgfVxyXG4gIHJldHVybiBkZXN0QXJyYXk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcXVlbmNlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogUGxheXMgYSBzb3VuZCBmcm9tIGEgU291bmRXYXZlIG9iamVjdC5cclxuICogVGhlIHNvdW5kIGNhbiBiZSBzdGFydGVkL3N0b3BwZWQvcGF1c2VkLlxyXG4gKiBJdCBjYW4gYWxzbyBiZSBsb29wZWQgd2l0aCBhbiBhZGp1c3RhYmxlIGxvb3AgcmFuZ2UuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoJ2F1ZGlvZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IEludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnN0YXJ0KCk7XHJcbiAqIEBwYXJhbSAge09iamVjdH0gc291bmRXYXZlIFNvdW5kV2F2ZSBvYmplY3QgaW5jbHVkaW5nIHRoZSBidWZmZXIgd2l0aCBhdWRpbyBkYXRhIHRvIGJlIHBsYXllZFxyXG4gKi9cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oc291bmRXYXZlKSB7XHJcblxyXG4gIHRoaXMud2F2ZSA9IG51bGw7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAvL2FsbCBjdXJyZW50bHkgYWN0aXZlIHN0cmVhbXNcclxuICB0aGlzLmxvb3AgPSBmYWxzZTtcclxuICB0aGlzLmdhaW5Ob2RlID0gbnVsbDtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBudWxsO1xyXG5cclxuICB0aGlzLnNvdW5kTGVuZ3RoID0gMDtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDsgICAgIC8vdGhlIG9mZnNldCB3aXRoaW4gdGhlIHdhdmVmb3JtXHJcbiAgdGhpcy5zdGFydFRpbWUgPSAwOyAgICAgICAvL3doZW4gdGhlIHNvdW5kIHN0YXJ0cyB0byBwbGF5XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IG51bGw7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSAxO1xyXG4gIHRoaXMuZGV0dW5lID0gMDtcclxuXHJcbiAgaWYgKHNvdW5kV2F2ZSkge1xyXG4gICAgdGhpcy53YXZlID0gc291bmRXYXZlO1xyXG4gICAgdGhpcy5idWZmZXIgPSBzb3VuZFdhdmUuYnVmZmVyO1xyXG4gICAgdGhpcy5zb3VuZExlbmd0aCA9IHRoaXMubG9vcEVuZCA9IHRoaXMuYnVmZmVyLmR1cmF0aW9uO1xyXG4gICAgdGhpcy5zZXR1cEF1ZGlvQ2hhaW4oKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgbWlzc2luZy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGdhaW4gYW5kIHN0ZXJlby1wYW5uZXIgbm9kZSwgY29ubmVjdHMgdGhlbVxyXG4gKiAoZ2FpbiAtPiBwYW5uZXIpIGFuZCBzZXRzIGdhaW4gdG8gMSAobWF4IHZhbHVlKS5cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXR1cEF1ZGlvQ2hhaW4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmdhaW5Ob2RlID0gY29yZS5jcmVhdGVHYWluKCk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gY29yZS5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcclxuICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5wYW5uZXJOb2RlKTtcclxuICB0aGlzLnBhbm5lck5vZGUuY29ubmVjdChjb3JlLmRlc3RpbmF0aW9uKTtcclxuICB0aGlzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW5kIGNvbmZpZ3VyZXMgYSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqIHRoYXQgY2FuIGJlIHBsYXllZCBvbmNlIGFuZCB0aGVuIGRlc3Ryb3lzIGl0c2VsZi5cclxuICogQHJldHVybiB7QnVmZmVyU291cmNlTm9kZX0gVGhlIEJ1ZmZlclNvdXJjZU5vZGVcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJ1ZmZlclNvdXJjZSA9IGNvcmUuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xyXG4gIGJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdvbmVuZGVkIGZpcmVkJyk7XHJcbiAgICBzZWxmLmRlc3Ryb3lCdWZmZXJTb3VyY2UoYnVmZmVyU291cmNlKTtcclxuICB9O1xyXG4gIHJldHVybiBidWZmZXJTb3VyY2U7XHJcbn07XHJcblxyXG4vKipcclxuICogRGVzdHJveWVzIGEgZ2l2ZW4gQXVkaW9CdWZmZXJTb3VyY2VOb2RlIGFuZCBkZWxldGVzIGl0XHJcbiAqIGZyb20gdGhlIHNvdXJjZU5vZGUgcXVldWUuIFRoaXMgaXMgdXNlZCBpbiB0aGUgb25lbmRlZFxyXG4gKiBjYWxsYmFjayBvZiBhbGwgQnVmZmVyU291cmNlTm9kZXMuXHJcbiAqIFRoaXMgaXMgcHJvYmFibHkgZnV0aWxlIHNpbmNlIHdlIGFscmVhZHkgZGVsZXRlIGFsbCBub2RlXHJcbiAqIHJlZmVyZW5jZXMgaW4gdGhlIHN0b3AgbWV0aG9kLlxyXG4gKiBAdG9kbyAgIENoZWNrIGlmIHRoaXMgY2FuIGJlIHJlbW92ZWRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJTb3VyY2VOb2RlfSBic05vZGUgdGhlIGJ1ZmZlclNvdXJjZSB0byBiZSBkZXN0cm95ZWQuXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZGVzdHJveUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKGJzTm9kZSkge1xyXG4gIGJzTm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUsIGluZGV4KSB7XHJcbiAgICBpZiAobm9kZSA9PT0gYnNOb2RlKSB7XHJcbiAgICAgIHRoaXMucXVldWUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgYSBzb3VuZCAoQXVkaW9CdWZmZXJTb3VyY2VOb2RlKSBhbmQgc3RvcmVzIGEgcmVmZXJlbmNlc1xyXG4gKiBpbiBhIHF1ZXVlLiBUaGlzIGVuYWJsZXMgeW91IHRvIHBsYXkgbXVsdGlwbGUgc291bmRzIGF0IG9uY2VcclxuICogYW5kIGV2ZW4gc3RvcCB0aGVtIGFsbCBhdCBhIGdpdmVuIHRpbWUuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge0Jvb2xlYW59IHBsYXlMb29wZWQgV2hldGhlciB0aGUgc291bmQgc2hvdWxkIGJlIGxvb3BlZCBvciBub3RcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGRlbGF5LCBwbGF5TG9vcGVkLCBkdXJhdGlvbikge1xyXG4gIHZhciBzdGFydFRpbWUgPSAwO1xyXG5cclxuICBpZiAoZGVsYXkpIHtcclxuICAgIHN0YXJ0VGltZSA9IGRlbGF5O1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuICB2YXIgYnMgPSB0aGlzLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICBpZiAocGxheUxvb3BlZCkge1xyXG4gICAgYnMubG9vcCA9IHBsYXlMb29wZWQ7XHJcbiAgICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgfVxyXG5cclxuICBicy5wbGF5YmFja1JhdGUudmFsdWUgPSB0aGlzLnBsYXliYWNrUmF0ZTtcclxuICBicy5kZXR1bmUudmFsdWUgPSB0aGlzLmRldHVuZTtcclxuXHJcbiAgLy8gaWYgKHBsYXlMb29wZWQpIHtcclxuICAvLyAgIGJzLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gIC8vICAgYnMubG9vcEVuZCA9IHRoaXMubG9vcEVuZDtcclxuICAvLyB9XHJcblxyXG4gIC8vIGlmICh0aGlzLnN0YXJ0T2Zmc2V0ID09PSAwIHx8IHRoaXMuc3RhcnRPZmZzZXQgPj0gdGhpcy5idWZmZXIuZHVyYXRpb24pIHtcclxuICAvLyAgIGNvbnNvbGUubG9nKCdyZXNldHRpbmcgc3RhcnR0aW1lJyk7XHJcbiAgLy8gICB0aGlzLnN0YXJ0VGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgLy8gfVxyXG4gIHRoaXMucXVldWUucHVzaChicyk7XHJcbiAgLy9icy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG5cclxuICBpZiAoZHVyYXRpb24pIHtcclxuICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCwgZHVyYXRpb24pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbSwgZXZlbiB0aGUgb25lcyB0aGF0IGFyZSBqdXN0IHNjaGVkdWxlZC5cclxuICogSXQgYWxzbyBjbGVhbnMgdGhlIHF1ZXVlIHNvIHRoYXQgdGhlIHNvdW5kIG9iamVjdCBpcyByZWFkeSBmb3IgYW5vdGhlciByb3VuZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgbm9kZS5zdG9wKCk7XHJcbiAgICAgIG5vZGUuZGlzY29ubmVjdCgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnF1ZXVlID0gW107ICAvL3JlbGVhc2UgYWxsIHJlZmVyZW5jZXNcclxuICB9IGVsc2Uge1xyXG4gICAgLy9mYWlsIHNpbGVudGx5XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBhdWRpbyBzdHJlYW0gYW5kIHN0b3JlIHRoZSBjdXJyZW50IHBvc2l0aW9uc1xyXG4gKiBhcyBhbiBvZmZzZXQgZm9yIHdoZW4gdGhlIHNvdW5kIGdldCByZXN0YXJ0ZWQuXHJcbiAqIFJlbWVtYmVyIHRoYXQgdGhpcyBkb2Vzbid0IHdvcmsgd2l0aCBsb29wcyB0aGF0IGFyZSBzaG9ydGVyXHJcbiAqIHRoYW4gdGhlIGJ1ZmZlciBpdHNlbGYuIElmIHlvdSB3YW50IGEgZ2xvYmFsLCBhY2N1cmF0ZSBwYXVzZSBmdW5jdGlvblxyXG4gKiB1c2Ugc3VzcGVuZC9yZXN1bWUgZnJvbSB0aGUgY29yZSBtb2R1bGUuXHJcbiAqIEB0b2RvICAgIE5lZWRzIHRvIGJlIHJld3JpdHRlbiBzaW5jZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBzdGFydCB0aW1lcy5cclxuICogQHJldHVybiAge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gKGNvcmUuY3VycmVudFRpbWUgLSB0aGlzLnN0YXJ0VGltZSkgJSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG4gIHRoaXMuc3RvcCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHN0YXJ0cG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIHN0YXJ0IGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wU3RhcnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIC8vdGhpcy5sb29wU3RhcnQgPSB2YWx1ZSAqIHRoaXMuc291bmRMZW5ndGg7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBlbmRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3AgZW5kIGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wRW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BFbmQgPSB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHN0YXJ0IGFuZCBlbmRwb2ludCB0byBzdGFydCBlbmQgZW5kcG9pbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzZXRMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IHRoaXMuc291bmRMZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBzb3VuZCBpbiBwZXJjZW50YWdlXHJcbiAqICgxID0gMTAwJSwgMiA9IDIwMCUpXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIHJhdGUgUmF0ZSBpbiBwZXJjZW50YWdlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0UGxheWJhY2tSYXRlID0gZnVuY3Rpb24ocmF0ZSkge1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gcmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRvbmUgd2l0aGluIHR3byBvY3RhdmUgKCsvLTEyIHRvbmVzKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgc2VtaSB0b25lXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgaWYgKHNlbWlUb25lID49IC0xMiAmJiBzZW1pVG9uZSA8PSAxMikge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBzZW1pVG9uZSAqIDEwMDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZW1pIHRvbmUgaXMgJyArIHNlbWlUb25lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxhc3QgcGxheWVkIHNlbWl0b25lLiBUaGlzIGRvZXNuJ3QgaGFzIHRvIGJlIGFuXHJcbiAqIGludGVnZXIgYmV0d2VlbiAtLysxMiBhcyB0aGUgc291bmQgY2FuIGJlIGRldHVuZWQgd2l0aFxyXG4gKiBtb3JlIHByZWNpc2lvbi5cclxuICogQHJldHVybiB7ZmxvYXR9ICBTZW1pdG9uZSBiZXR3ZWVuIC0vKzEyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZSAvIDEwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXR1bmUgdGhlIHNvdW5kIG9zY2lsbGF0aW9uIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIGRldHVuZSAgZGV0dW5lIGluIGNlbnRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RGV0dW5lID0gZnVuY3Rpb24oZGV0dW5lKSB7XHJcbiAgaWYgKGRldHVuZSA+PSAtMTIwMCAmJiBkZXR1bmUgPD0gMTIwMCkge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBkZXR1bmU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRGV0dW5lIHBhcmFtZXRlciBpcyAnICsgZGV0dW5lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyMDAuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgY3VycmVudCBkZXR1bmUgaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcmV0dXJuIHtJbnRlZ2VyfSAgRGV0dW5lIGluIGNlbnRzXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RGV0dW5lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgaW4gd2hpY2ggYW4gYXVkaW8gYnVmZmVyIGxpdmVzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcgZWxzZS5cclxuICogSWYgeW91IHdhbnQgdG8gcGxheSB0aGUgc291bmQsIHlvdSBoYXZlIHRvIGFkZGl0aW9uYWxseSBjcmVhdGUgYVxyXG4gKiA8YSBocmVmPVwiU291bmQuaHRtbFwiPlNvdW5kPC9hPiBvYmplY3QuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIDwvcD48cD5cclxuICogTXVsdGlwbGUgc291cmNlcyB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIG9uZSBhdWRpbyBidWZmZXIuXHJcbiAqIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIGNyZWF0aW5nIG11bHRpcGxlIFNvdW5kV2F2ZSBvYmplY3RzLlxyXG4gKiBJdCdzIGxpa2UgYSB3YXZldGFibGU6IEFsbCBzdGFydC9lbmQgcG9zaXRpb25zIHdpbGwgYmUgc2F2ZWQgc29cclxuICogeW91IGNhbiB0cmlnZ2VyIHRoZSBvcmlnaW5hbCBzYW1wbGVzIHdpdGhvdXQgdXNpbmcgbXVsdGlwbGUgYnVmZmVycy5cclxuICogUG9zc2libGUgdXNhZ2VzIGFyZSBtdWx0aXNhbXBsZWQgc291bmRzLCBsb29wcyBvciB3YXZlc2VxdWVuY2VzIChraW5kIG9mKS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db25jYXRlbmF0ZSBtdWx0aXBsZSBzb3VyY2UgZmlsZXMgaW50byBvbmUgYnVmZmVyPGJyPlxyXG4gKiBpbiB0aGUgZ2l2ZW4gb3JkZXIgYW5kIHBsYXkgdGhlbTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdmaWxlMS53YXYsZmlsZTIud2F2LGZpbGUzLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgSW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG5cclxuICB0aGlzLmJ1ZmZlciA9IG51bGw7ICAgICAgICAgICAgIC8vQXVkaW9CdWZmZXJcclxuICB0aGlzLm1ldGFEYXRhID0gW107ICAgICAgICAgICAgICAgIC8vc3RhcnQtL2VuZHBvaW50cyBhbmQgbGVuZ3RoIG9mIHNpbmdsZSB3YXZlc1xyXG5cclxuICBpZiAoYXVkaW9TcmMpIHtcclxuICAgIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIGF1ZGlvIGJ1ZmZlciB0byBkZWNvZGVcclxuICAgICAgdGhpcy5kZWNvZGVBdWRpb0RhdGEoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9tdWx0aXBsZSBhdWRpbyBidWZmZXJzIHRvIGRlY29kZSBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgdGhpcy5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA9PT0gLTEpIHtcclxuICAgICAgLy9vbmUgZmlsZSB0byBsb2FkL2RlY29kZVxyXG4gICAgICB2YXIgYmluQnVmZmVyO1xyXG4gICAgICB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgIGJpbkJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShiaW5CdWZmZXIpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA+IC0xKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgZmlsZXMgdG8gbG9hZC9kZWNvZGUgYW5kIGNhbmNhdGluYXRlXHJcbiAgICAgIHZhciBiaW5CdWZmZXJzID0gdGhpcy5sb2FkRmlsZXMoYXVkaW9TcmMpO1xyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyKGJpbkJ1ZmZlcnMsIHRoaXMuYnVmZmVyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBTb3VuZFdhdmUgb2JqZWN0OiBVbnN1cHBvcnRlZCBkYXRhIGZvcm1hdCcpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICAvL3N0YXJ0IHRoZSBvYmplY3Qgd2l0aCBlbXB0eSBidWZmZXIuIFVzZWZ1bGwgZm9yIHRlc3RpbmcgYW5kIGFkdmFuY2VkIHVzYWdlLlxyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYmluYXJ5IGF1ZGlvIGRhdGEgYW5kIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgW2Z1bmNdICAgICAgQ2FuIGJlIHVzZWQgdG8gcnVuIGNvZGUgaW5zaWRlIHRoZSBpbm5lciBkZWNvZGUgZnVuY3Rpb24uXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUHJvbWlzZSBvYmplY3QgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIGF1ZGlvIGJ1ZmZlciBhZnRlciBkZWNvZGluZy5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMsIGZ1bmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vbmV3IHByb21pc2UgYmFzZWQgc3ludGF4IGN1cnJlbnRseSBub3QgYXZhaWxhYmxlIGluIENocm9tZSA8NDksIElFLCBTYWZhcmlcclxuICAvL1RPRE86IG1vbmtleXBhdGNoIHdpdGggY2FsbFxyXG4gIHRoaXMuYnVmZmVyID0gY29yZS5kZWNvZGVBdWRpb0RhdGEocmF3QXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgc2VsZi5idWZmZXIgPSBkZWNvZGVkO1xyXG4gICAgaWYgKGZ1bmMpIHtcclxuICAgICAgZnVuYygpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbmNhdGVuYXRlcyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgdG8gYW4gQXVkaW9CdWZmZXIuXHJcbiAqIEBwYXJhbSAge0FycmF5fSBiaW5hcnlCdWZmZXJzICBBcnJheSBob2xkaW5nIG9uZSBvciBtb3JlIEFycmF5QnVmZmVyc1xyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYXVkaW9CdWZmZXIgICBBbiBleGlzdGluZyBBdWRpb0J1ZmZlciBvYmplY3RcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgICAgICAgVGhlIGNvbmNhdGVuYXRlZCBBdWRpb0J1ZmZlclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihiaW5hcnlCdWZmZXJzLCBhdWRpb0J1ZmZlcikge1xyXG4gIGJpbmFyeUJ1ZmZlcnMuZm9yRWFjaChmdW5jdGlvbihiaW5CdWZmZXIpIHtcclxuICAgIHZhciB0bXBBdWRpb0J1ZmZlciA9IHRoaXMuZGVjb2RlQXVkaW9EYXRhKGJpbkJ1ZmZlcik7XHJcbiAgICB0aGlzLm1ldGFEYXRhLnB1c2godGhpcy5hZGRXYXZlTWV0YURhdGEoYXVkaW9CdWZmZXIsIHRtcEF1ZGlvQnVmZmVyKSk7XHJcbiAgICBhdWRpb0J1ZmZlciA9IHRoaXMuYXBwZW5kQXVkaW9CdWZmZXIoYXVkaW9CdWZmZXIsIHRtcEF1ZGlvQnVmZmVyKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIGF1ZGlvQnVmZmVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIFN1Z2dlc3RlZCBieSBDaHJpcyBXaWxzb246PGJyPlxyXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTQzNjUyL3dlYi1hdWRpby1hcGktYXBwZW5kLWNvbmNhdGVuYXRlLWRpZmZlcmVudC1hdWRpb2J1ZmZlcnMtYW5kLXBsYXktdGhlbS1hcy1vbmUtc29uXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIxIFRoZSBmaXJzdCBhdWRpbyBidWZmZXJcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjIgVGhlIHNlY29uZCBhdWRpbyBidWZmZXJcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgYnVmZmVyMSArIGJ1ZmZlcjJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYXBwZW5kQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihidWZmZXIxLCBidWZmZXIyKSB7XHJcbiAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgdmFyIHRtcCA9IGNvcmUuY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHMsXHJcbiAgICAoYnVmZmVyMS5sZW5ndGggKyBidWZmZXIyLmxlbmd0aCksXHJcbiAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZDaGFubmVsczsgaSsrKSB7XHJcbiAgICB2YXIgY2hhbm5lbCA9IHRtcC5nZXRDaGFubmVsRGF0YShpKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIyLmdldENoYW5uZWxEYXRhKGkpLCBidWZmZXIxLmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiB0bXA7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGRpY3Rpb25hcnkgd2l0aCBzdGFydC9zdG9wIHBvaW50cyBhbmQgbGVuZ3RoIGluIHNhbXBsZS1mcmFtZXNcclxuICogb2YgYW4gYXBwZW5kZWQgd2F2ZWZvcm0gYW5kIGFkZHMgaXQgdG8gdGhlIG1ldGFEYXRhIGFycmF5LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gZXhpc3RpbmdCdWZmZXIgVGhlICdvbGQnIGJ1ZmZlciB0aGF0IGdldHMgYXBwZW5kZWRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IG5ld0J1ZmZlciAgICAgIFRoZSBidWZmZXIgdGhhdCBnZXRzIGFwcGVuZGVkXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBEaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcC9sZW5ndGggZGF0YVxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5hZGRXYXZlTWV0YURhdGEgPSBmdW5jdGlvbihleGlzdGluZ0J1ZmZlciwgbmV3QnVmZmVyKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBleGlzdGluZ0J1ZmZlci5sZW5ndGggKyAxLFxyXG4gICAgZW5kOiBleGlzdGluZ0J1ZmZlci5sZW5ndGggKyBuZXdCdWZmZXIubGVuZ3RoLFxyXG4gICAgbGVuZ3RoOiBuZXdCdWZmZXIubGVuZ3RoXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIGJpbmFyeSBmaWxlIGFuZCBjYWxscyBhIGZ1bmN0aW9uIHdpdGggdGhlXHJcbiAqIHJldHVybmVkIEFycmF5QnVmZmVyIGFzIGl0cyBhcmd1bWVudCB3aGVuIGRvbmUuXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICBmaWxlbmFtZSAgICAgICBUaGUgZmlsZSB0byBiZSBsb2FkZWRcclxuICogQHBhcmFtICB7ZnVuY3Rpb259IG9ubG9hZENhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWRcclxuICogQHBhcmFtICB7Ym9vbGVhbn0gIFthc3luYz10cnVlXSAgIEFzeW5jaHJvbm91cyBsb2FkaW5nXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBhcnJheUJ1ZmZlcjtcclxuICogdGhpcy5sb2FkRmlsZSgnZmlsZTEud2F2JywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICogICBhcnJheUJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gKiB9KTtcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbihmaWxlbmFtZSwgb25sb2FkQ2FsbGJhY2ssIGFzeW5jKSB7XHJcbiAgdmFyIGFzeW5jaHJvbm91c2x5ID0gdHJ1ZTtcclxuICB2YXIgcmVxdWVzdCA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgaWYgKGFzeW5jKSB7XHJcbiAgICBhc3luY2hyb25vdXNseSA9IGFzeW5jO1xyXG4gIH1cclxuXHJcbiAgcmVxdWVzdC5vcGVuKCdHRVQnLCBmaWxlbmFtZSwgYXN5bmNocm9ub3VzbHkpO1xyXG4gIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuXHJcbiAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIG9ubG9hZENhbGxiYWNrKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gIH07XHJcblxyXG4gIHJlcXVlc3Quc2VuZCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIGJpbmFyeSBmaWxlcyBhbmQgcmV0dXJucyBhbiBhcnJheVxyXG4gKiB3aXRoIHRoZSBkYXRhIGZyb20gdGhlIGZpbGVzIGluIHRoZSBnaXZlbiBvcmRlci5cclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgTGlzdCB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICBBcnJheSBvZiBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGVzID0gZnVuY3Rpb24oZmlsZW5hbWVzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBiaW5CdWZmZXJzID0gW107XHJcbiAgdmFyIG5hbWVzID0gZmlsZW5hbWVzLnNwbGl0KCcsJyk7XHJcbiAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBzZWxmLmxvYWRGaWxlKG5hbWUsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGJpbkJ1ZmZlcnNbbmFtZV0gPSByZXNwb25zZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdGhpcy5zb3J0QmluQnVmZmVycyhuYW1lcywgYmluQnVmZmVycyk7XHJcbn07XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnNvcnRCaW5CdWZmZXJzID0gZnVuY3Rpb24oZmlsZW5hbWVzLCBiaW5CdWZmZXJzKSB7XHJcbiAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoZnVuY3Rpb24oZWwpIHtcclxuICAgIHJldHVybiBiaW5CdWZmZXJzW2VsXTtcclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmRXYXZlO1xyXG4iLCIvKipcclxuICogVGhpcyBpcyB0aGUgZm91bmRhdGlvbiBvZiB0aGUgSW50ZXJtaXggbGlicmFyeS5cclxuICogSXQgc2ltcGx5IGNyZWF0ZXMgdGhlIGF1ZGlvIGNvbnRleHQgb2JqZWN0c1xyXG4gKiBhbmQgZXhwb3J0cyBpdCBzbyBpdCBjYW4gYmUgZWFzaWx5IGNvbnN1bWVkXHJcbiAqIGZyb20gYWxsIGNsYXNzZXMgb2YgdGhlIGxpYnJhcnkuXHJcbiAqXHJcbiAqIEByZXR1cm4ge0F1ZGlvQ29udGV4dH0gVGhlIEF1ZGlvQ29udGV4dCBvYmplY3RcclxuICpcclxuICogQHRvZG8gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqIEB0b2RvIENoZWNrIGZvciBtb2JpbGUvaU9TIGNvbXBhdGliaWxpdHkuXHJcbiAqIEB0b2RvIENoZWNrIGlmIHdlJ3JlIHJ1bm5pbmcgb24gbm9kZVxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5TdXNwZW5kIGFuZCByZXN1bWUgdGhlIGF1ZGlvIGNvbnRleHQgdG9cclxuICogY3JlYXRlIGEgcGF1c2UgYnV0dG9uLiBUaGlzIHNob3VsZCBiZSB1c2VkIHdpdGggY3JlYXRlQXVkaW9Xb3JrZXJcclxuICogYXMgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gd2hlbiBzdXNwZW5kIGlzIGNhbGxlZCBvbiBhbiBvZmZsaW5lIGF1ZGlvIGNvbnRleHQuXHJcbiAqIFlvdSBjYW4gYWxzbyBwYXVzZSBzaW5nbGUgc291bmRzIHdpdGggPGk+U291bmQucGF1c2UoKTwvaT4uXHJcbiAqIFBsZWFzZSByZWFkIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3N1c3BlbmRcIj50aGUgZGV2ZWxvcGVyIGRvY3MgYXQgTUROPC9hPlxyXG4gKiB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiB0aGlzLjwvY2FwdGlvbj5cclxuICogc3VzcmVzQnRuLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuICogICBpZihJbnRlcm1peC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XHJcbiAqICAgICBJbnRlcm1peC5zdXNwZW5kKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1Jlc3VtZSBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH0gZWxzZSBpZiAoSW50ZXJtaXguc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XHJcbiAqICAgICBJbnRlcm1peC5yZXN1bWUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnU3VzcGVuZCBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH1cclxuICogfVxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGF1ZGlvQ3R4ID0gbnVsbDtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbiAgaWYgKHdpbmRvdy5BdWRpb0NvbnRleHQpIHtcclxuICAgIGF1ZGlvQ3R4ID0gbmV3IHdpbmRvdy5BdWRpb0NvbnRleHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZG5cXCd0IGluaXRpYWxpemUgdGhlIGF1ZGlvIGNvbnRleHQuJyk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXVkaW9DdHg7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBhYm91dCBqYXZhc2NyaXB0IGV2ZW50cyEgSXQncyBqdXN0XHJcbiAqIGEgZGVmaW5pdGlvbiBvZiB0aGUgZXZlbnRzIHRoYXQgdGhlIHNlcXVlbmNlciBjYW4gaGFuZGxlIHBsdXNcclxuICogc29tZSBmdW5jdGlvbnMgdG8gY3JlYXRlIHZhbGlkIGV2ZW50cy5cclxuICogVGhlIGNsYXNzIGRlZmluZXMgd2hpY2ggc3Vic3lzdGVtIGlzIGludm9rZWQgdG8gcHJvY2VzcyB0aGUgZXZlbnQuXHJcbiAqIEV2ZXJ5IGNsYXNzIGNhbiBoYXZlIHNldmVyYWwgdHlwZXMgYW5kIGEgdHlwZSBjb25zaXN0cyBvZiBvbmUgb3JcclxuICogbW9yZSBwcm9wZXJ0aWVzLlxyXG4gKi9cclxuXHJcbnZhciBldlByb3AgPSBbXHJcbiAgJ2luc3RydW1lbnQnLCAvLyB0aGUgZXZlbnQgcmVjZWl2ZXJcclxuICAndG9uZScsICAgICAgIC8vIEludCBiZXR3ZWVuIDAgYW5kIDEyNyBiZWdpbm5pbmcgYXQgYzBcclxuICAnZHVyYXRpb24nLCAgIC8vIEludCByZXByZXNlbnRpbmcgYSBudW1iZXIgb2YgNjR0aCBub3Rlc1xyXG4gICd2ZWxvY2l0eScsICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAgJ3BpdGNoJyxcclxuICAndm9sdW1lJyxcclxuICAncGFuJ1xyXG5dO1xyXG5cclxudmFyIGV2VHlwZSA9IHtcclxuICAnbm90ZSc6IFsgZXZQcm9wWzBdLCBldlByb3BbMV0sIGV2UHJvcFsyXSwgZXZQcm9wWzNdIF0sXHJcbiAgJ2NvbnRyb2wnOiBbIGV2UHJvcFs0XSwgZXZQcm9wWzVdLCBldlByb3BbNl0gXVxyXG59O1xyXG5cclxudmFyIGV2Q2xhc3MgPSB7XHJcbiAgJ2F1ZGlvJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ3N5bnRoJzogW10sXHJcbiAgJ2Z4JzogW10sXHJcbiAgJ21pZGknOiBbXSxcclxuICAnb3NjJzogW11cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIGNsYXNzIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlQ2xhc3MgRXZlbnQgY2xhc3NcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgY2xhc3MgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZUNsYXNzID0gZnVuY3Rpb24oZUNsYXNzKSB7XHJcbiAgaWYgKGV2Q2xhc3MuaGFzT3duUHJvcGVydHkoZUNsYXNzKSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSB0eXBlIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlVHlwZSBFdmVudCB0eXBlXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICB0cnVlIGlmIHR5cGUgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVR5cGUgPSBmdW5jdGlvbihlVHlwZSkge1xyXG4gIGlmIChldlR5cGUuaGFzT3duUHJvcGVydHkoZVR5cGUpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYW4gaW5zdHJ1bWVudCBpcyBhbiBvYmplY3QuXHJcbiAqIFRoaXMgaXMgYSBwb29ybHkgd2VhayB0ZXN0IGJ1dCB0aGF0J3NcclxuICogYWxsIHdlIGNhbiBkbyBoZXJlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGluc3RyIEFuIGluc3RydW1lbnQgb2JqZWN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgdHJ1ZSBpZiBpdCdzIGFuIG9iamVjdCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudCA9IGZ1bmN0aW9uKGluc3RyKSB7XHJcbiAgaWYgKHR5cGVvZiBpbnN0ciA9PT0gJ29iamVjdCcpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBpZiBhIHRvbmUgb3IgdmVsb2NpdHkgdmFsdWUgaXNcclxuICogYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDEyNy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7SW50fSAgdmFsdWUgICBUaGUgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyBhIHRvbmVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICBUcnVlIGlmIGl0cyBhIHZhbGlkIHRvbmUsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcFRvbmVWZWxvID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDEyNykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgZHVyYXRpb24gaXMgYSBwb3NpdGl2ZSBpbnRlZ2VyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIE51bWJlciByZXByZXNlbnRpbmcgbXVsdGlwbGUgNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgZHVyYXRpb24sIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcER1cmF0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgYW4gb2JqZWN0IG9mIGV2ZW50IHByb3BlcnRpZXMuXHJcbiAqIEl0IGNoZWNrcyB0aGUgcHJvcGVydGllcyBhcmUgdmFsaWQgZm9yIHRoZSBnaXZlbiB0eXBlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGVQcm9wcyAgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICAgRXZlbnQgdHlwZSB0byB2YWxpZGF0ZSBhZ2FpbnN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICB0cnVlIGlmIGFsbCBwcm9wcyBhcmUgdmFsaWQsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcHMgPSBmdW5jdGlvbihlUHJvcHMsIGVUeXBlKSB7XHJcbiAgdmFyIHR5cGUgPSBldlR5cGVbZVR5cGVdO1xyXG4gIGZvciAodmFyIGtleSBpbiBlUHJvcHMpICB7XHJcbiAgICBpZiAoZXZQcm9wLmluZGV4T2Yoa2V5KSA9PT0gLTEgJiZcclxuICAgIHR5cGUuaW5kZXhPZihrZXkpID09PSAtMSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzZXF1ZW5jZXIgZXZlbnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgIEV2ZW50IHR5cGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICBTZXF1ZW5jZXIgZXZlbnRcclxuICovXHJcbnZhciBjcmVhdGVFdmVudCA9IGZ1bmN0aW9uKGVDbGFzcywgZVR5cGUsIGVQcm9wcykge1xyXG4gIGlmICh2YWxpZGF0ZUNsYXNzKGVDbGFzcykgJiZcclxuICAgIHZhbGlkYXRlVHlwZShlVHlwZSkgJiZcclxuICAgIHZhbGlkYXRlUHJvcHMoZVByb3BzLCBlVHlwZSkpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICdjbGFzcyc6IGVDbGFzcyxcclxuICAgICAgJ3R5cGUnOiBlVHlwZSxcclxuICAgICAgJ3Byb3BzJzogZVByb3BzXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjcmVhdGUgc2VxdWVuY2VyIGV2ZW50LiBXcm9uZyBwYXJhbWV0ZXJzJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gYXVkaW8gbm90ZSBldmVudFxyXG4gKiBAcGFyYW0gIHtJbnR9IHRvbmUgICAgIFRvbmUgYmV0d2VlbiAwIGFuZCAxMjdcclxuICogQHBhcmFtICB7SW50fSB2ZWxvY2l0eSBWZWxvY2l0eSBiZXR3ZWVuIDAgYW5kIDEyN1xyXG4gKiBAcGFyYW0gIHtJbnR9IGR1cmF0aW9uIER1cmF0aW9uIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICBBbGwgcHJvcGVydGllcyBpbiBvbmUgb2JqZWN0XHJcbiAqL1xyXG52YXIgY3JlYXRlQXVkaW9Ob3RlID0gZnVuY3Rpb24odG9uZSwgdmVsb2NpdHksIGR1cmF0aW9uLCBpbnN0cikge1xyXG4gIHZhciBwcm9wcyA9IHt9O1xyXG4gIGlmIChpbnN0ciAmJiB2YWxpZGF0ZVByb3BJbnN0cnVtZW50KGluc3RyKSkge1xyXG4gICAgcHJvcHMuaW5zdHJ1bWVudCA9IGluc3RyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Egc2VxdWVuY2VyIGV2ZW50IG11c3QgaGF2ZSBhbiBpbnN0cnVtZW50IGFzIHByb3BlcnR5Jyk7XHJcbiAgfVxyXG4gIGlmICh0b25lICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHRvbmUpKSB7XHJcbiAgICBwcm9wcy50b25lID0gdG9uZTtcclxuICB9XHJcbiAgaWYgKHZlbG9jaXR5ICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHZlbG9jaXR5KSkge1xyXG4gICAgcHJvcHMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcclxuICB9XHJcbiAgaWYgKGR1cmF0aW9uICYmIHZhbGlkYXRlUHJvcER1cmF0aW9uKGR1cmF0aW9uKSkge1xyXG4gICAgcHJvcHMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICB9XHJcbiAgcmV0dXJuIGNyZWF0ZUV2ZW50KCdhdWRpbycsICdub3RlJywgcHJvcHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgY2xhc3M6IGV2Q2xhc3MsXHJcbiAgdHlwZTogZXZUeXBlLFxyXG4gIHByb3BlcnR5OiBldlByb3AsXHJcbiAgY3JlYXRlQXVkaW9Ob3RlOiBjcmVhdGVBdWRpb05vdGVcclxufTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgYSB3ZWJ3b3JrZXIgdGhhdCBwcm92aWRlcyBhIHRpbWVyXHJcbiAqIHRoYXQgZmlyZXMgdGhlIHNjaGVkdWxlciBmb3IgdGhlIHNlcXVlbmNlci5cclxuICogVGhpcyBpcyBiZWNhdXNlIHRpbWluZyBoZXJlIGlzICBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+SXQgaXMganVzdCBmb3IgbGlicmFyeSBpbnRlcm5hbFxyXG4gKiB1c2FnZS4gU2VlIFNlcXVlbmNlci5qcyBmb3IgZGV0YWlscy48L2NhcHRpb24+XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSh7ICdpbnRlcnZhbCc6IDIwMCB9KTtcclxuICogd29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICogd29ya2VyLnRlcm1pbmF0ZSgpOyAgLy93ZWJ3b3JrZXIgaW50ZXJuYWwgZnVuY3Rpb24sIGp1c3QgZm9yIGNvbXBsZXRlbmVzc1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRpbWVyID0gbnVsbDtcclxudmFyIGludGVydmFsID0gMTAwO1xyXG5cclxudmFyIHdvcmtlciA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAnc3RhcnQnKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhID09PSAnc3RvcCcpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4gICAgICBpbnRlcnZhbCA9IGUuZGF0YS5pbnRlcnZhbDtcclxuICAgICAgaWYgKHRpbWVyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtlcjtcclxuIl19
