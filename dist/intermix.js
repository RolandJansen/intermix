(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//intermix = require('./core.js');
var intermix = _dereq_('./core.js') || {};
intermix.events = _dereq_('./events.js');
intermix.SoundWave = _dereq_('./SoundWave.js');
intermix.Sound = _dereq_('./Sound.js');
intermix.Sequencer = _dereq_('./Sequencer.js');
intermix.Part = _dereq_('./Part.js');

module.exports = intermix;

},{"./Part.js":3,"./Sequencer.js":4,"./Sound.js":5,"./SoundWave.js":6,"./core.js":7,"./events.js":8}],2:[function(_dereq_,module,exports){
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
    var pos = (position) * this.multiply;
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
  var pos = (position) * this.multiply;
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

var work = _dereq_('webworkify');   //prepares the worker for browserify
var core = _dereq_('./core.js');
var worker = _dereq_('./scheduleWorker.js');
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
  this.bpm = 120;             //beats per minute
  this.resolution = 64;       //shortest possible note. You normally don't want to touch this.
  this.interval = 100;        //the interval in miliseconds the scheduler gets invoked.
  this.lookahead = 0.3;       //time in seconds the scheduler looks ahead.
                              //should be longer than interval.
  this.queue = [];            //List with all parts of the score
  this.runqueue = [];         //list with parts that are playing or will be played shortly

  this.now = 0;               //timestamp from audiocontext when the scheduler is invoked.
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
  this.timePerStep = this.setTimePerStep(this.bpm, this.resolution);

  // Initialize the scheduler-timer
  this.scheduleWorker = work(worker);

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
    if (pattern.length === 0) {
      //remove empty parts from runQueue
      this.runqueue.splice(index, 1);
    } else {
      var seqEvents = pattern.shift();  //return first element and remove it
      if (seqEvents) {
        seqEvents.forEach(function(seqEvent) {
          this.processSeqEvent(seqEvent, this.nextStepTime);
        }, this);
      }
    }
  }, this);
};

/**
 * Invokes the appropriate subsystem to process the event
 * @private
 * @param  {Object} seqEvent  The event to process
 * @param  {float}  delay     time in seconds when the event should start
 * @return {Void}
 */
Sequencer.prototype.processSeqEvent = function(seqEvent, delay) {
  if (delay) {
    seqEvent.props['delay'] = delay;
  }
  seqEvent.props.instrument.processSeqEvent(seqEvent);
};

/**
 * Sets the pointer to the next step that should be played
 * in the master queue. If we're playing in loop mode,
 * jump back to loopstart when end of loop is reached.
 * @private
 * @param   {Int}   position  New position in the master queue
 * @return  {Void}
 */
Sequencer.prototype.setQueuePointer = function(position) {
  if (this.loop) {
    if (this.nextStep >= this.loopEnd) {
      this.nextStep = this.loopStart;
      this.runQueue = [];
    } else {
      this.nextStep++;
    }
  } else if (position) {
    this.nextStep = position;
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
  //window.requestAnimationFrame(this.draw);
};

/**
 * Stops the sequencer (halts at the current position)
 * @return {Void}
 */
Sequencer.prototype.stop = function() {
  this.scheduleWorker.postMessage('stop');
  //this.runQueue = [];
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

/**
 * Set beats per minute
 * @param  {Int}   bpm beats per minute
 * @return {Void}
 */
Sequencer.prototype.setBpm = function(bpm) {
  this.bpm = bpm;
  this.timePerStep = this.setTimePerStep(bpm, this.resolution);
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

},{"./core.js":7,"./scheduleWorker.js":9,"webworkify":2}],5:[function(_dereq_,module,exports){
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
  this.isPaused = false;
  this.startOffset = 0;
  this.startOffsets = [];   //holds start offsets if paused
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
 * @param  {Boolean} playLooped Whether the sound should be looped or not
 * @param  {float}   delay      Time in seconds the sound pauses before the stream starts
 * @param  {float}   duration   Time preriod after the stream should end
 * @return {Void}
 */
Sound.prototype.start = function(playLooped, delay, duration) {
  if (this.isPaused && this.queue.length > 0) {
    this.resume();
  } else {
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

    bs.playbackRate.value = bs.tmpPlaybackRate = this.playbackRate;
    bs.detune.value = this.detune;
    bs.startTime = startTime;   // extend node with a starttime property

    this.queue.push(bs);
    if (duration) {
      bs.start(startTime, this.startOffset, duration);
    } else {
      bs.start(startTime, this.startOffset);
    }

    this.startOffset = 0;
  }
};

/**
 * Stops all audio stream, even the ones that are just scheduled.
 * It also cleans the queue so that the sound object is ready for another round.
 * @return {Void}
 */
Sound.prototype.stop = function() {
  this.queue.forEach(function(node) {
    node.stop();
    node.disconnect();
  });
  this.queue = [];  //release all references
};

/**
 * Stops all audio streams of this sound temporarily.
 * If you want a global, accurate pause function
 * use suspend/resume from the core module.
 * @return  {Void}
 */
Sound.prototype.pause = function() {
  if (!this.isPaused) {
    this.queue.forEach(function(node) {
      node.tmpPlaybackRate = node.playbackRate.value;
      node.playbackRate.value = 0.0;
    });
    this.isPaused = true;
  }
};

/**
 * Resumes all streams if they were paused.
 * @return {Void}
 */
Sound.prototype.resume = function() {
  this.queue.forEach(function(node) {
    node.playbackRate.value = node.tmpPlaybackRate;
    delete node.tmpPlaybackRate;
  });
  this.isPaused = false;
};

/**
 * Processes an event fired by the sequencer.
 * @param  {Object} seqEvent A sequencer event
 * @return {Void}
 */
Sound.prototype.processSeqEvent = function(seqEvent) {
  //this.setTone(seqEvent.props.tone);
  if (seqEvent.props.duration) {
    this.start(false,
      seqEvent.props.delay,
      seqEvent.props.duration);
  } else {
    this.start(false,
      seqEvent.props.delay);
  }
};

/**
 * Sets the startpoint of the loop
 * @param  {float} value  loop start in seconds
 * @return {Void}
 */
Sound.prototype.setLoopStart = function(value) {
  this.loopStart = value;
  this.queue.forEach(function(node) {
    node.loopStart = value;
  });
};

/**
 * Sets the endpoint of the loop
 * @param  {float} value  loop end in seconds
 * @return {Void}
 */
Sound.prototype.setLoopEnd = function(value) {
  this.loopEnd = value;
  this.queue.forEach(function(node) {
    node.loopEnd = value;
  });
};

/**
 * Releases the loop of all running nodes,
 * Nodes will run until end and stop.
 * @return {Void}
 */
Sound.prototype.releaseLoop = function() {
  this.queue.forEach(function(node) {
    node.loop = false;
  });
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
 * @param  {float}  value   Rate in percentage
 * @return {Void}
 */
Sound.prototype.setPlaybackRate = function(value) {
  this.playbackRate = value;
  this.queue.forEach(function(node) {
    node.playbackRate.value = value;
  });
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
 * @param  {Integer}  value  detune in cents
 * @return {Void}
 */
Sound.prototype.setDetune = function(value) {
  if (value >= -1200 && value <= 1200) {
    this.detune = value;
  } else {
    throw new Error('Detune parameter is ' + value + '. Must be between +/-1200.');
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
 * var soundWave = new intermix.SoundWave('file.wav');
 * var sound = new intermix.Sound(soundWave);
 * sound.play;
 * @example <caption><b>This is broken in v0.1! Don't use it!</b> Concatenate multiple source files into one buffer<br>
 * in the given order and play them:</caption>
 * var soundWave = new intermix.SoundWave('file1.wav,file2.wav,file3.wav');
 * var sound = new intermix.Sound(soundWave);
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
 *     var wave1 = new intermix.SoundWave(binData1);
 *     var wave2 = new intermix.SoundWave(binData2);
 *     var concatWave = new intermix.SoundWave([binData1, binData2]);
 * };
 * @constructor
 * @param  {(Object|Object[]|string)} audioSrc   One or more ArrayBuffers or filenames
 */
var SoundWave = function(audioSrc) {

  this.buffer = null;   //AudioBuffer
  this.metaData = [];   //start-/endpoints and length of single waves
  var self = this;

  if (audioSrc) {
    if (audioSrc instanceof ArrayBuffer) {
      //one audio buffer to decode
      this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple audio buffers to decode and concatenate
      this.concatBinariesToAudioBuffer(audioSrc);
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') === -1) {
      //one file to load/decode
      this.loadFile(audioSrc, function(response) {
        self.buffer = self.decodeAudioData(response);
      });
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
 * @todo    Test in synchronous mode or remove it completely
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
  var self = this;
  var asynchronously = true;
  var request = new window.XMLHttpRequest();

  request.addEventListener('progress', self.updateProgress);
  request.addEventListener('load', self.transferComplete);
  request.addEventListener('error', self.transferFailed);
  request.addEventListener('abort', self.transferCanceled);

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

SoundWave.prototype.updateProgress = function() {};

SoundWave.prototype.transferComplete = function(evt) {

};

SoundWave.prototype.transferFailed = function() {};

SoundWave.prototype.transferCanceled = function() {};

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

/**
 * Sort ArrayBuffers the same order, like the filename
 * parameters.
 * @private
 * @param  {Array}  filenames  Array with filenames
 * @param  {Array}  binBuffers Array with ArrayBuffer
 * @return {Array}             Array with sorted ArrayBuffers
 */
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
 * @example <caption>Create a note event for an audio object</caption>
 * var note = intermix.events.createAudioNote('c3', 65, 128, aSoundObject);
 */

/**
 * All valid event properties in one handy array.
 * @type {Array}
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

/**
 * All valid event types and the properties assotiated with them.
 * Type are valid with one, several or all of its properties.
 * @type {Object}
 */
var evType = {
  'note': [ evProp[0], evProp[1], evProp[2], evProp[3] ],
  'control': [ evProp[4], evProp[5], evProp[6] ]
};

/**
 * All valid event classes and the types assotiated with them.
 * @type {Object}
 */
var evClass = {
  'audio': [evType.note, evType.control],
  'synth': [evType.note, evType.control],
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
 * Takes a string of the form c3 or d#4 and
 * returns the corresponding number.
 * @param  {String} tone String representing a note
 * @return {Int}         Number representing a note
 */
var convertTone = function(tone) {
  var notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  var str = tone.toLowerCase();

  if (str.match(/^[a-h]#?[0-9]$/)) {
    var note = str.substring(0, str.length - 1);
    var oct = str.slice(-1);

    if (note === 'h') {
      note = 'b';
    }
    return notes.indexOf(note) + oct * 12;
  } else {
    throw new Error('Unvalid string. Has to be like [a-h]<#>[0-9]');
  }
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
 * @param  {Int|String} tone     Tone between 0 and 127 or string (c3, d#4)
 * @param  {Int}        velocity Velocity between 0 and 127
 * @param  {Int}        duration Duration in 64th notes
 * @return {Object}              All properties in one object
 */
var createAudioNote = function(tone, velocity, duration, instr) {
  var props = {};
  if (typeof tone === 'string') {
    tone = convertTone(tone);
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
  if (instr && validatePropInstrument(instr)) {
    props.instrument = instr;
  } else {
    throw new Error('A sequencer event must have an instrument as property');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy9pbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKSB8fCB7fTtcclxuaW50ZXJtaXguZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcclxuaW50ZXJtaXguU291bmRXYXZlID0gcmVxdWlyZSgnLi9Tb3VuZFdhdmUuanMnKTtcclxuaW50ZXJtaXguU291bmQgPSByZXF1aXJlKCcuL1NvdW5kLmpzJyk7XHJcbmludGVybWl4LlNlcXVlbmNlciA9IHJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJyk7XHJcbmludGVybWl4LlBhcnQgPSByZXF1aXJlKCcuL1BhcnQuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW50ZXJtaXg7XHJcbiIsInZhciBidW5kbGVGbiA9IGFyZ3VtZW50c1szXTtcbnZhciBzb3VyY2VzID0gYXJndW1lbnRzWzRdO1xudmFyIGNhY2hlID0gYXJndW1lbnRzWzVdO1xuXG52YXIgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIgd2tleTtcbiAgICB2YXIgY2FjaGVLZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIHZhciBleHAgPSBjYWNoZVtrZXldLmV4cG9ydHM7XG4gICAgICAgIC8vIFVzaW5nIGJhYmVsIGFzIGEgdHJhbnNwaWxlciB0byB1c2UgZXNtb2R1bGUsIHRoZSBleHBvcnQgd2lsbCBhbHdheXNcbiAgICAgICAgLy8gYmUgYW4gb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgZXhwb3J0IGFzIGEgcHJvcGVydHkgb2YgaXQuIFRvIGVuc3VyZVxuICAgICAgICAvLyB0aGUgZXhpc3RpbmcgYXBpIGFuZCBiYWJlbCBlc21vZHVsZSBleHBvcnRzIGFyZSBib3RoIHN1cHBvcnRlZCB3ZVxuICAgICAgICAvLyBjaGVjayBmb3IgYm90aFxuICAgICAgICBpZiAoZXhwID09PSBmbiB8fCBleHAuZGVmYXVsdCA9PT0gZm4pIHtcbiAgICAgICAgICAgIHdrZXkgPSBrZXk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghd2tleSkge1xuICAgICAgICB3a2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgICAgIHZhciB3Y2FjaGUgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICAgICAgd2NhY2hlW2tleV0gPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlc1t3a2V5XSA9IFtcbiAgICAgICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZScsJ21vZHVsZScsJ2V4cG9ydHMnXSwgJygnICsgZm4gKyAnKShzZWxmKScpLFxuICAgICAgICAgICAgd2NhY2hlXG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBza2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG5cbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sIChcbiAgICAgICAgICAgIC8vIHRyeSB0byBjYWxsIGRlZmF1bHQgaWYgZGVmaW5lZCB0byBhbHNvIHN1cHBvcnQgYmFiZWwgZXNtb2R1bGVcbiAgICAgICAgICAgIC8vIGV4cG9ydHNcbiAgICAgICAgICAgICd2YXIgZiA9IHJlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpOycgK1xuICAgICAgICAgICAgJyhmLmRlZmF1bHQgPyBmLmRlZmF1bHQgOiBmKShzZWxmKTsnXG4gICAgICAgICkpLFxuICAgICAgICBzY2FjaGVcbiAgICBdO1xuXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICA7XG5cbiAgICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgICAgbmV3IEJsb2IoW3NyY10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSlcbiAgICApKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogUmVwcmVzZW50cyBhIHBhcnQgb2YgYSBzZXF1ZW5jZS4gSXQgY2FuIGJlXHJcbiAqIHVzZWQgaW4gbWFueSB3YXlzOlxyXG4gKiA8dWw+XHJcbiAqIDxsaT5BIHBhcnQgb2YgYSB0cmFjayBsaWtlIGluIHBpYW5vLXJvbGwgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDxsaT5BIHBhdHRlcm4gbGlrZSBpbiBzdGVwIHNlcXVlbmNlcnMsIGRydW0gY29tcHV0ZXJzIGFuZCB0cmFja2VyczwvbGk+XHJcbiAqIDxsaT5BIGxvb3AgbGlrZSBpbiBsaXZlIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8L3VsPlxyXG4gKiBUZWNobmljYWxseSBpdCBjYW4gc3RvcmUgYW55IHR5cGUgb2YgZXZlbnQgeW91ciBzeXN0ZW0gaXMgY2FwYWJsZSBvZi5cclxuICogVGhpcyBtZWFucyBpdCBpcyBub3QgbGltaXRlZCB0byBhdWRpbywgbWlkaSwgb3NjIG9yIGRteCBidXQgY2FuIGhvbGRcclxuICogYW55IHR5cGUgb2YgamF2YXNjcmlwdCBvYmplY3QuIEEgcG9zc2libGUgdXNlY2FzZSB3b3VsZCBiZSB0byB0cmlnZ2VyXHJcbiAqIHNjcmVlbiBldmVudHMgd2l0aCB0aGUgZHJhdyBmdW5jdGlvbiBvZiB0aGUgc2VxdWVuY2VyIG9iamVjdC5cclxuICogQHRvZG8gQWRkIGF0IGxlYXN0IG9uZSB1c2FnZSBleGFtcGxlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICAgICAgIExlbmd0aCBvZiB0aGUgcGFydCBpbiBiYXJzICg0IGJlYXRzKVxyXG4gKi9cclxudmFyIFBhcnQgPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gMTY7IC8vIChyZXNvbHV0aW9uICogbXVsdGlwbHkpIHNob3VsZCBhbHdhc3kgYmUgNjRcclxuICB0aGlzLm11bHRpcGx5ID0gNDsgICAgLy8gcmVzb2x1dGlvbiBtdWx0aXBsaWVyXHJcbiAgdGhpcy5sZW5ndGggPSAxOyAgICAgIC8vIDEgPSBvbmUgYmFyICg0IGJlYXRzID0gMSBiYXIpXHJcbiAgdGhpcy5uYW1lID0gJ1BhcnQnOyAgIC8vIG5hbWUgb2YgdGhpcyBwYXJ0XHJcbiAgdGhpcy5wYXR0ZXJuID0gW107ICAgIC8vIHRoZSBhY3R1YWwgcGF0dGVybiB3aXRoIG5vdGVzIGV0Yy5cclxuXHJcbiAgaWYgKGxlbmd0aCkge1xyXG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XHJcbiAgfVxyXG5cclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLmluaXRQYXR0ZXJuKHRoaXMubGVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIGFuIGVtcHR5IHBhdHRlcm4gZm9yIHRoZSBwYXJ0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIG1lc3VyZWQgaW4gYmFycyAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhdHRlcm4gPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuICB2YXIgcGF0dGVybiA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgKGxlbmd0aCAqIDY0KTsgaSsrKSB7XHJcbiAgICBwYXR0ZXJuW2ldID0gW107XHJcbiAgfVxyXG4gIHJldHVybiBwYXR0ZXJuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYW4gZXZlbnQgdG8gdGhlIHBhdHRlcm4gYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuYWRkRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICBpZiAocG9zaXRpb24gPD0gdGhpcy5yZXNvbHV0aW9uKSB7XHJcbiAgICB2YXIgcG9zID0gKHBvc2l0aW9uKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgICB0aGlzLnBhdHRlcm5bcG9zXS5wdXNoKHNlcUV2ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQb3NpdGlvbiBvdXQgb2YgcGF0dGVybiBib3VuZHMuJyk7XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYW4gZXZlbnQgYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICB2YXIgcG9zID0gKHBvc2l0aW9uKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgdmFyIGluZGV4ID0gdGhpcy5wYXR0ZXJuW3Bvc10uaW5kZXhPZihzZXFFdmVudCk7XHJcbiAgdGhpcy5wYXR0ZXJuW3Bvc10uc3BsaWNlKGluZGV4LCAxKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge0ludH0gICAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wYXR0ZXJuLmxlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYWxsIHBvc2l0aW9ucyB0aGF0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGV2ZW50LlxyXG4gKiBUaGlzIGlzIGN1cnJlbnRseSB1bnVzZWQgYW5kIHdpbGwgcHJvYmFibHkgZGVsZXRlZFxyXG4gKiBpbiBmdXR1cmUgdmVyc2lvbnMuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpOyAgIC8vcHJlcGFyZXMgdGhlIHdvcmtlciBmb3IgYnJvd3NlcmlmeVxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgd29ya2VyID0gcmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpO1xyXG4vKipcclxuICogVGhlIG1haW4gY2xhc3Mgb2YgdGhlIHNlcXVlbmNlci4gSXQgZG9lcyB0aGUgcXVldWluZyBvZlxyXG4gKiBwYXJ0cyBhbmQgZXZlbnRzIGFuZCBydW5zIHRoZSBzY2hlZHVsZXJzIHRoYXQgZmlyZSBldmVudHNcclxuICogYW5kIGRyYXdzIHRvIHRoZSBzY3JlZW4uXHJcbiAqXHJcbiAqIFNjaGVkdWxpbmcgaW5zcGlyZWQgYnkgXCJBIFRhbGUgb2YgVHdvIENsb2Nrc1wiIGJ5IENocmlzIFdpbHNvbjpcclxuICogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvYXVkaW8vc2NoZWR1bGluZy9cclxuICovXHJcbnZhciBTZXF1ZW5jZXIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5icG0gPSAxMjA7ICAgICAgICAgICAgIC8vYmVhdHMgcGVyIG1pbnV0ZVxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDY0OyAgICAgICAvL3Nob3J0ZXN0IHBvc3NpYmxlIG5vdGUuIFlvdSBub3JtYWxseSBkb24ndCB3YW50IHRvIHRvdWNoIHRoaXMuXHJcbiAgdGhpcy5pbnRlcnZhbCA9IDEwMDsgICAgICAgIC8vdGhlIGludGVydmFsIGluIG1pbGlzZWNvbmRzIHRoZSBzY2hlZHVsZXIgZ2V0cyBpbnZva2VkLlxyXG4gIHRoaXMubG9va2FoZWFkID0gMC4zOyAgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGxvb2tzIGFoZWFkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Nob3VsZCBiZSBsb25nZXIgdGhhbiBpbnRlcnZhbC5cclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgICAgLy9MaXN0IHdpdGggYWxsIHBhcnRzIG9mIHRoZSBzY29yZVxyXG4gIHRoaXMucnVucXVldWUgPSBbXTsgICAgICAgICAvL2xpc3Qgd2l0aCBwYXJ0cyB0aGF0IGFyZSBwbGF5aW5nIG9yIHdpbGwgYmUgcGxheWVkIHNob3J0bHlcclxuXHJcbiAgdGhpcy5ub3cgPSAwOyAgICAgICAgICAgICAgIC8vdGltZXN0YW1wIGZyb20gYXVkaW9jb250ZXh0IHdoZW4gdGhlIHNjaGVkdWxlciBpcyBpbnZva2VkLlxyXG4gIHRoaXMudGltZVBlclN0ZXA7ICAgICAgICAgICAvL3BlcmlvZCBvZiB0aW1lIGJldHdlZW4gdHdvIHN0ZXBzXHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwOyAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIG5leHQgc3RlcCB3aWxsIGJlIHRyaWdnZXJlZFxyXG4gIHRoaXMubmV4dFN0ZXAgPSAwOyAgICAgICAgICAvL3Bvc2l0aW9uIGluIHRoZSBxdWV1ZSB0aGF0IHdpbGwgZ2V0IHRyaWdnZXJlZCBuZXh0XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IDA7ICAgIC8vc3RlcCBpbiBxdWV1ZSB0aGF0IHdhcyBwbGF5ZWQgKG5vdCB0cmlnZ2VyZWQpIHJlY2VudGx5ICh1c2VkIGZvciBkcmF3aW5nKS5cclxuICB0aGlzLmxvb3AgPSBmYWxzZTsgICAgICAgICAgLy9wbGF5IGEgc2VjdGlvbiBvZiB0aGUgcXVldWUgaW4gYSBsb29wXHJcbiAgdGhpcy5sb29wU3RhcnQ7ICAgICAgICAgICAgIC8vZmlyc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMubG9vcEVuZDsgICAgICAgICAgICAgICAvL2xhc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7ICAgICAvL3RydWUgaWYgc2VxdWVuY2VyIGlzIHJ1bm5pbmcsIG90aGVyd2lzZSBmYWxzZVxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWU7ICAgICAgICAvL2hhcyB0byBiZSBvdmVycmlkZGVuIHdpdGggYSBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgaW4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJhdyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0UGxheWVkU3RlcCBpbnQgYXMgcGFyYW1ldGVyLlxyXG5cclxuICAvLyBzZXQgdGltZSBwZXIgc2V0VGltZVBlclN0ZXBcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcCh0aGlzLmJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSB0aGUgc2NoZWR1bGVyLXRpbWVyXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlciA9IHdvcmsod29ya2VyKTtcclxuXHJcbiAgLyplc2xpbnQtZW5hYmxlICovXHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3RpY2snKSB7XHJcbiAgICAgIHNlbGYuc2NoZWR1bGVyKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSh7J2ludGVydmFsJzogdGhpcy5pbnRlcnZhbH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGV2ZW50cyBmcm9tIHRoZSBtYXN0ZXIgcXVldWUgYW5kIGZpcmVzIHRoZW0uXHJcbiAqIEl0IGdldHMgY2FsbGVkIGF0IGEgY29uc3RhbnQgcmF0ZSwgbG9va3MgYWhlYWQgaW5cclxuICogdGhlIHF1ZXVlIGFuZCBmaXJlcyBhbGwgZXZlbnRzIGluIHRoZSBuZWFyIGZ1dHVyZVxyXG4gKiB3aXRoIGEgZGVsYXkgY29tcHV0ZWQgZnJvbSB0aGUgY3VycmVudCBicG0gdmFsdWUuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubm93ID0gY29yZS5jdXJyZW50VGltZTtcclxuXHJcbiAgLy8gaWYgaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUgb3IgcHJldmlvdXNseSBzdG9wcGVkXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IHRoaXMubm93O1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHRoaXMubmV4dFN0ZXBUaW1lIDwgdGhpcy5ub3cgKyB0aGlzLmxvb2thaGVhZCkge1xyXG4gICAgdGhpcy5hZGRQYXJ0c1RvUnVucXVldWUoKTtcclxuICAgIHRoaXMuZmlyZUV2ZW50cygpO1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICB0aGlzLnNldFF1ZXVlUG9pbnRlcigpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyBpbiB0aGUgbWFzdGVyIHF1ZXVlIGZvciBwYXJ0cyBhbmQgYWRkc1xyXG4gKiBjb3BpZXMgb2YgdGhlbSB0byB0aGUgcnVucXVldWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnRzVG9SdW5xdWV1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdKSB7XHJcbiAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2godGhpcy5jb3B5QXJyYXkocGFydC5wYXR0ZXJuKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRmlyZXMgYWxsIGV2ZW50cyBmb3IgdGhlIHVwY29tbWluZyBzdGVwLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5maXJlRXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5ydW5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhdHRlcm4sIGluZGV4KSB7XHJcbiAgICBpZiAocGF0dGVybi5sZW5ndGggPT09IDApIHtcclxuICAgICAgLy9yZW1vdmUgZW1wdHkgcGFydHMgZnJvbSBydW5RdWV1ZVxyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgc2VxRXZlbnRzID0gcGF0dGVybi5zaGlmdCgpOyAgLy9yZXR1cm4gZmlyc3QgZWxlbWVudCBhbmQgcmVtb3ZlIGl0XHJcbiAgICAgIGlmIChzZXFFdmVudHMpIHtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQsIHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludm9rZXMgdGhlIGFwcHJvcHJpYXRlIHN1YnN5c3RlbSB0byBwcm9jZXNzIHRoZSBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgdG8gcHJvY2Vzc1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGRlbGF5ICAgICB0aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgZXZlbnQgc2hvdWxkIHN0YXJ0XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBkZWxheSkge1xyXG4gIGlmIChkZWxheSkge1xyXG4gICAgc2VxRXZlbnQucHJvcHNbJ2RlbGF5J10gPSBkZWxheTtcclxuICB9XHJcbiAgc2VxRXZlbnQucHJvcHMuaW5zdHJ1bWVudC5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHBvaW50ZXIgdG8gdGhlIG5leHQgc3RlcCB0aGF0IHNob3VsZCBiZSBwbGF5ZWRcclxuICogaW4gdGhlIG1hc3RlciBxdWV1ZS4gSWYgd2UncmUgcGxheWluZyBpbiBsb29wIG1vZGUsXHJcbiAqIGp1bXAgYmFjayB0byBsb29wc3RhcnQgd2hlbiBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gICB7SW50fSAgIHBvc2l0aW9uICBOZXcgcG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICBpZiAodGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgICAgdGhpcy5uZXh0U3RlcCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChwb3NpdGlvbikge1xyXG4gICAgdGhpcy5uZXh0U3RlcCA9IHBvc2l0aW9uO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyB0aGUgc2VxdWVuY2VyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICB0aGlzLmlzUnVubmluZyA9IHRydWU7XHJcbiAgLy93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgdGhlIHNlcXVlbmNlciAoaGFsdHMgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24pXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAgLy90aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogU2NoZWR1bGVyIHRoYXQgcnVucyBhIGRyYXdpbmcgZnVuY3Rpb24gZXZlcnkgdGltZVxyXG4gKiB0aGUgc2NyZWVuIHJlZnJlc2hlcy4gVGhlIGZ1bmN0aW9uIFNlcXVlbmNlci5hbmltYXRpb25GcmFtZSgpXHJcbiAqIGhhcyB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZSBhcHBsaWNhdGlvbiB3aXRoIHN0dWZmIHRvIGJlIGRyYXduIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEl0IGNhbGxzIGl0c2VsZiByZWN1cnNpdmVseSBvbiBldmVyeSBmcmFtZSBhcyBsb25nIGFzIHRoZSBzZXF1ZW5jZXIgaXMgcnVubmluZy5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIGZpcnN0IHdlJ2xsIGhhdmUgdG8gZmluZCBvdXQsIHdoYXQgc3RlcCB3YXMgcmVjZW50bHkgcGxheWVkLlxyXG4gIC8vIHRoaXMgaXMgc29tZWhvdyBjbHVtc3kgYmVjYXVzZSB0aGUgc2VxdWVuY2VyIGRvZXNuJ3Qga2VlcCB0cmFjayBvZiB0aGF0LlxyXG4gIHZhciBsb29rQWhlYWREZWx0YSA9IHRoaXMubmV4dFN0ZXBUaW1lIC0gY29yZS5jdXJyZW50VGltZTtcclxuICB2YXIgc3RlcHNBaGVhZCA9IE1hdGguZmxvb3IobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKSArIDE7XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG5cclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lKHRoaXMubGFzdFBsYXllZFN0ZXApO1xyXG5cclxuICBpZiAodGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhIHBhcnQgdG8gdGhlIG1hc3RlciBxdWV1ZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICAgQW4gaW5zdGFuY2Ugb2YgUGFydFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmIChwYXJ0Lmxlbmd0aCAmJiBwYXJ0LnBhdHRlcm4pIHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gcGFyYW1ldGVyIGRvZXNuXFwnIHNlZW0gdG8gYmUgYSBwYXJ0IG9iamVjdCcpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgcGFydCBvYmplY3QgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gcGFydCAgICAgUGFydCBpbnN0YW5jZSB0byBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gUG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZW1vdmVQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAodGhpcy5xdWV1ZVtwb3NpdGlvbl0gaW5zdGFuY2VvZiBBcnJheSAmJlxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ubGVuZ3RoID4gMCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5xdWV1ZVtwb3NpdGlvbl0uaW5kZXhPZihwYXJ0KTtcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnNwbGljZShpbmRleCwgMSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUGFydCBub3QgZm91bmQgYXQgcG9zaXRpb24gJyArIHBvc2l0aW9uICsgJy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgIGJwbSBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldEJwbSA9IGZ1bmN0aW9uKGJwbSkge1xyXG4gIHRoaXMuYnBtID0gYnBtO1xyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKGJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlcyB0aGUgdGltZSBpbiBzZWNvbmRzIGFzIGZsb2F0IHZhbHVlXHJcbiAqIGJldHdlZW4gb25lIHNob3J0ZXN0IHBvc3NzaWJsZSBub3RlXHJcbiAqICg2NHRoIGJ5IGRlZmF1bHQpIGFuZCB0aGUgbmV4dC5cclxuICogQHBhcmFtICB7ZmxvYXR9ICBicG0gICAgICAgIGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgICByZXNvbHV0aW9uIHNob3J0ZXN0IHBvc3NpYmxlIG5vdGUgdmFsdWVcclxuICogQHJldHVybiB7ZmxvYXR9ICAgICAgICAgICAgIHRpbWUgaW4gc2Vjb25kc1xyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIFBsYXlzIGEgc291bmQgZnJvbSBhIFNvdW5kV2F2ZSBvYmplY3QuXHJcbiAqIFRoZSBzb3VuZCBjYW4gYmUgc3RhcnRlZC9zdG9wcGVkL3BhdXNlZC5cclxuICogSXQgY2FuIGFsc28gYmUgbG9vcGVkIHdpdGggYW4gYWRqdXN0YWJsZSBsb29wIHJhbmdlLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdhdWRpb2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5zdGFydCgpO1xyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNvdW5kV2F2ZSBTb3VuZFdhdmUgb2JqZWN0IGluY2x1ZGluZyB0aGUgYnVmZmVyIHdpdGggYXVkaW8gZGF0YSB0byBiZSBwbGF5ZWRcclxuICovXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKHNvdW5kV2F2ZSkge1xyXG5cclxuICB0aGlzLndhdmUgPSBudWxsO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXRzID0gW107ICAgLy9ob2xkcyBzdGFydCBvZmZzZXRzIGlmIHBhdXNlZFxyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDsgICAgICAgLy93aGVuIHRoZSBzb3VuZCBzdGFydHMgdG8gcGxheVxyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gMTtcclxuICB0aGlzLmRldHVuZSA9IDA7XHJcblxyXG4gIGlmIChzb3VuZFdhdmUpIHtcclxuICAgIHRoaXMud2F2ZSA9IHNvdW5kV2F2ZTtcclxuICAgIHRoaXMuYnVmZmVyID0gc291bmRXYXZlLmJ1ZmZlcjtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuICAgIHRoaXMuc2V0dXBBdWRpb0NoYWluKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgaW5pdGlhbGlzaW5nIFNvdW5kIG9iamVjdDogcGFyYW1ldGVyIG1pc3NpbmcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBnYWluIGFuZCBzdGVyZW8tcGFubmVyIG5vZGUsIGNvbm5lY3RzIHRoZW1cclxuICogKGdhaW4gLT4gcGFubmVyKSBhbmQgc2V0cyBnYWluIHRvIDEgKG1heCB2YWx1ZSkuXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IGNvcmUuY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IGNvcmUuY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QoY29yZS5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgQnVmZmVyU291cmNlTm9kZVxyXG4gKiB0aGF0IGNhbiBiZSBwbGF5ZWQgb25jZSBhbmQgdGhlbiBkZXN0cm95cyBpdHNlbGYuXHJcbiAqIEByZXR1cm4ge0J1ZmZlclNvdXJjZU5vZGV9IFRoZSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSBjb3JlLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICBidWZmZXJTb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcclxuICBidWZmZXJTb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnb25lbmRlZCBmaXJlZCcpO1xyXG4gICAgc2VsZi5kZXN0cm95QnVmZmVyU291cmNlKGJ1ZmZlclNvdXJjZSk7XHJcbiAgfTtcclxuICByZXR1cm4gYnVmZmVyU291cmNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlc3Ryb3llcyBhIGdpdmVuIEF1ZGlvQnVmZmVyU291cmNlTm9kZSBhbmQgZGVsZXRlcyBpdFxyXG4gKiBmcm9tIHRoZSBzb3VyY2VOb2RlIHF1ZXVlLiBUaGlzIGlzIHVzZWQgaW4gdGhlIG9uZW5kZWRcclxuICogY2FsbGJhY2sgb2YgYWxsIEJ1ZmZlclNvdXJjZU5vZGVzLlxyXG4gKiBUaGlzIGlzIHByb2JhYmx5IGZ1dGlsZSBzaW5jZSB3ZSBhbHJlYWR5IGRlbGV0ZSBhbGwgbm9kZVxyXG4gKiByZWZlcmVuY2VzIGluIHRoZSBzdG9wIG1ldGhvZC5cclxuICogQHRvZG8gICBDaGVjayBpZiB0aGlzIGNhbiBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyU291cmNlTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGR1cmF0aW9uICAgVGltZSBwcmVyaW9kIGFmdGVyIHRoZSBzdHJlYW0gc2hvdWxkIGVuZFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ocGxheUxvb3BlZCwgZGVsYXksIGR1cmF0aW9uKSB7XHJcbiAgaWYgKHRoaXMuaXNQYXVzZWQgJiYgdGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICB0aGlzLnJlc3VtZSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgICBpZiAoZGVsYXkpIHtcclxuICAgICAgc3RhcnRUaW1lID0gZGVsYXk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gICAgfVxyXG4gICAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcbiAgICBpZiAocGxheUxvb3BlZCkge1xyXG4gICAgICBicy5sb29wID0gcGxheUxvb3BlZDtcclxuICAgICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgICB9XHJcblxyXG4gICAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gYnMudG1wUGxheWJhY2tSYXRlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgICBicy5kZXR1bmUudmFsdWUgPSB0aGlzLmRldHVuZTtcclxuICAgIGJzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTsgICAvLyBleHRlbmQgbm9kZSB3aXRoIGEgc3RhcnR0aW1lIHByb3BlcnR5XHJcblxyXG4gICAgdGhpcy5xdWV1ZS5wdXNoKGJzKTtcclxuICAgIGlmIChkdXJhdGlvbikge1xyXG4gICAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQsIGR1cmF0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW0sIGV2ZW4gdGhlIG9uZXMgdGhhdCBhcmUganVzdCBzY2hlZHVsZWQuXHJcbiAqIEl0IGFsc28gY2xlYW5zIHRoZSBxdWV1ZSBzbyB0aGF0IHRoZSBzb3VuZCBvYmplY3QgaXMgcmVhZHkgZm9yIGFub3RoZXIgcm91bmQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnN0b3AoKTtcclxuICAgIG5vZGUuZGlzY29ubmVjdCgpO1xyXG4gIH0pO1xyXG4gIHRoaXMucXVldWUgPSBbXTsgIC8vcmVsZWFzZSBhbGwgcmVmZXJlbmNlc1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW1zIG9mIHRoaXMgc291bmQgdGVtcG9yYXJpbHkuXHJcbiAqIElmIHlvdSB3YW50IGEgZ2xvYmFsLCBhY2N1cmF0ZSBwYXVzZSBmdW5jdGlvblxyXG4gKiB1c2Ugc3VzcGVuZC9yZXN1bWUgZnJvbSB0aGUgY29yZSBtb2R1bGUuXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLmlzUGF1c2VkKSB7XHJcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBub2RlLnRtcFBsYXliYWNrUmF0ZSA9IG5vZGUucGxheWJhY2tSYXRlLnZhbHVlO1xyXG4gICAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IDAuMDtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgYWxsIHN0cmVhbXMgaWYgdGhleSB3ZXJlIHBhdXNlZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICAgIGRlbGV0ZSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICB9KTtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvY2Vzc2VzIGFuIGV2ZW50IGZpcmVkIGJ5IHRoZSBzZXF1ZW5jZXIuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgQSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wcm9jZXNzU2VxRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gIC8vdGhpcy5zZXRUb25lKHNlcUV2ZW50LnByb3BzLnRvbmUpO1xyXG4gIGlmIChzZXFFdmVudC5wcm9wcy5kdXJhdGlvbikge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXksXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmR1cmF0aW9uKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXkpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdGFydHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBzdGFydCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGVuZHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBlbmQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BFbmQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcEVuZCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWxlYXNlcyB0aGUgbG9vcCBvZiBhbGwgcnVubmluZyBub2RlcyxcclxuICogTm9kZXMgd2lsbCBydW4gdW50aWwgZW5kIGFuZCBzdG9wLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlbGVhc2VMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcCA9IGZhbHNlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgc3RhcnQgYW5kIGVuZHBvaW50IHRvIHN0YXJ0IGVuZCBlbmRwb2ludCBvZiB0aGUgQXVkaW9CdWZmZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXNldExvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gdGhpcy5zb3VuZExlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHNvdW5kIGluIHBlcmNlbnRhZ2VcclxuICogKDEgPSAxMDAlLCAyID0gMjAwJSlcclxuICogQHBhcmFtICB7ZmxvYXR9ICB2YWx1ZSAgIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRvbmUgd2l0aGluIHR3byBvY3RhdmUgKCsvLTEyIHRvbmVzKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgc2VtaSB0b25lXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgaWYgKHNlbWlUb25lID49IC0xMiAmJiBzZW1pVG9uZSA8PSAxMikge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBzZW1pVG9uZSAqIDEwMDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZW1pIHRvbmUgaXMgJyArIHNlbWlUb25lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxhc3QgcGxheWVkIHNlbWl0b25lLiBUaGlzIGRvZXNuJ3QgaGFzIHRvIGJlIGFuXHJcbiAqIGludGVnZXIgYmV0d2VlbiAtLysxMiBhcyB0aGUgc291bmQgY2FuIGJlIGRldHVuZWQgd2l0aFxyXG4gKiBtb3JlIHByZWNpc2lvbi5cclxuICogQHJldHVybiB7ZmxvYXR9ICBTZW1pdG9uZSBiZXR3ZWVuIC0vKzEyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZSAvIDEwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXR1bmUgdGhlIHNvdW5kIG9zY2lsbGF0aW9uIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHZhbHVlICBkZXR1bmUgaW4gY2VudHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXREZXR1bmUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA+PSAtMTIwMCAmJiB2YWx1ZSA8PSAxMjAwKSB7XHJcbiAgICB0aGlzLmRldHVuZSA9IHZhbHVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldHVuZSBwYXJhbWV0ZXIgaXMgJyArIHZhbHVlICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyMDAuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgY3VycmVudCBkZXR1bmUgaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcmV0dXJuIHtJbnRlZ2VyfSAgRGV0dW5lIGluIGNlbnRzXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RGV0dW5lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgaW4gd2hpY2ggYW4gYXVkaW8gYnVmZmVyIGxpdmVzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcgZWxzZS5cclxuICogSWYgeW91IHdhbnQgdG8gcGxheSB0aGUgc291bmQsIHlvdSBoYXZlIHRvIGFkZGl0aW9uYWxseSBjcmVhdGUgYVxyXG4gKiA8YSBocmVmPVwiU291bmQuaHRtbFwiPlNvdW5kPC9hPiBvYmplY3QuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIDwvcD48cD5cclxuICogTXVsdGlwbGUgc291cmNlcyB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIG9uZSBhdWRpbyBidWZmZXIuXHJcbiAqIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIGNyZWF0aW5nIG11bHRpcGxlIFNvdW5kV2F2ZSBvYmplY3RzLlxyXG4gKiBJdCdzIGxpa2UgYSB3YXZldGFibGU6IEFsbCBzdGFydC9lbmQgcG9zaXRpb25zIHdpbGwgYmUgc2F2ZWQgc29cclxuICogeW91IGNhbiB0cmlnZ2VyIHRoZSBvcmlnaW5hbCBzYW1wbGVzIHdpdGhvdXQgdXNpbmcgbXVsdGlwbGUgYnVmZmVycy5cclxuICogUG9zc2libGUgdXNhZ2VzIGFyZSBtdWx0aXNhbXBsZWQgc291bmRzLCBsb29wcyBvciB3YXZlc2VxdWVuY2VzIChraW5kIG9mKS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj48Yj5UaGlzIGlzIGJyb2tlbiBpbiB2MC4xISBEb24ndCB1c2UgaXQhPC9iPiBDb25jYXRlbmF0ZSBtdWx0aXBsZSBzb3VyY2UgZmlsZXMgaW50byBvbmUgYnVmZmVyPGJyPlxyXG4gKiBpbiB0aGUgZ2l2ZW4gb3JkZXIgYW5kIHBsYXkgdGhlbTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdmaWxlMS53YXYsZmlsZTIud2F2LGZpbGUzLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG5cclxuICB0aGlzLmJ1ZmZlciA9IG51bGw7ICAgLy9BdWRpb0J1ZmZlclxyXG4gIHRoaXMubWV0YURhdGEgPSBbXTsgICAvL3N0YXJ0LS9lbmRwb2ludHMgYW5kIGxlbmd0aCBvZiBzaW5nbGUgd2F2ZXNcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmIChhdWRpb1NyYykge1xyXG4gICAgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9vbmUgYXVkaW8gYnVmZmVyIHRvIGRlY29kZVxyXG4gICAgICB0aGlzLmRlY29kZUF1ZGlvRGF0YShhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgYXVkaW9TcmNbMF0gaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL211bHRpcGxlIGF1ZGlvIGJ1ZmZlcnMgdG8gZGVjb2RlIGFuZCBjb25jYXRlbmF0ZVxyXG4gICAgICB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhdWRpb1NyYyA9PT0gJ3N0cmluZycgJiYgYXVkaW9TcmMuaW5kZXhPZignLCcpID09PSAtMSkge1xyXG4gICAgICAvL29uZSBmaWxlIHRvIGxvYWQvZGVjb2RlXHJcbiAgICAgIHRoaXMubG9hZEZpbGUoYXVkaW9TcmMsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgc2VsZi5idWZmZXIgPSBzZWxmLmRlY29kZUF1ZGlvRGF0YShyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA+IC0xKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgZmlsZXMgdG8gbG9hZC9kZWNvZGUgYW5kIGNhbmNhdGluYXRlXHJcbiAgICAgIHZhciBiaW5CdWZmZXJzID0gdGhpcy5sb2FkRmlsZXMoYXVkaW9TcmMpO1xyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyKGJpbkJ1ZmZlcnMsIHRoaXMuYnVmZmVyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBTb3VuZFdhdmUgb2JqZWN0OiBVbnN1cHBvcnRlZCBkYXRhIGZvcm1hdCcpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICAvL3N0YXJ0IHRoZSBvYmplY3Qgd2l0aCBlbXB0eSBidWZmZXIuIFVzZWZ1bGwgZm9yIHRlc3RpbmcgYW5kIGFkdmFuY2VkIHVzYWdlLlxyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYmluYXJ5IGF1ZGlvIGRhdGEgYW5kIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgW2Z1bmNdICAgICAgQ2FuIGJlIHVzZWQgdG8gcnVuIGNvZGUgaW5zaWRlIHRoZSBpbm5lciBkZWNvZGUgZnVuY3Rpb24uXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUHJvbWlzZSBvYmplY3QgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIGF1ZGlvIGJ1ZmZlciBhZnRlciBkZWNvZGluZy5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMsIGZ1bmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgLy9uZXcgcHJvbWlzZSBiYXNlZCBzeW50YXggY3VycmVudGx5IG5vdCBhdmFpbGFibGUgaW4gQ2hyb21lIDw0OSwgSUUsIFNhZmFyaVxyXG4gIC8vVE9ETzogbW9ua2V5cGF0Y2ggd2l0aCBjYWxsXHJcbiAgdGhpcy5idWZmZXIgPSBjb3JlLmRlY29kZUF1ZGlvRGF0YShyYXdBdWRpb1NyYykudGhlbihmdW5jdGlvbihkZWNvZGVkKSB7XHJcbiAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICBpZiAoZnVuYykge1xyXG4gICAgICBmdW5jKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29uY2F0ZW5hdGVzIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyB0byBhbiBBdWRpb0J1ZmZlci5cclxuICogQHBhcmFtICB7QXJyYXl9IGJpbmFyeUJ1ZmZlcnMgIEFycmF5IGhvbGRpbmcgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBhdWRpb0J1ZmZlciAgIEFuIGV4aXN0aW5nIEF1ZGlvQnVmZmVyIG9iamVjdFxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICAgICAgICBUaGUgY29uY2F0ZW5hdGVkIEF1ZGlvQnVmZmVyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJpbmFyeUJ1ZmZlcnMsIGF1ZGlvQnVmZmVyKSB7XHJcbiAgYmluYXJ5QnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJpbkJ1ZmZlcikge1xyXG4gICAgdmFyIHRtcEF1ZGlvQnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYmluQnVmZmVyKTtcclxuICAgIHRoaXMubWV0YURhdGEucHVzaCh0aGlzLmFkZFdhdmVNZXRhRGF0YShhdWRpb0J1ZmZlciwgdG1wQXVkaW9CdWZmZXIpKTtcclxuICAgIGF1ZGlvQnVmZmVyID0gdGhpcy5hcHBlbmRBdWRpb0J1ZmZlcihhdWRpb0J1ZmZlciwgdG1wQXVkaW9CdWZmZXIpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gYXVkaW9CdWZmZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogQXBwZW5kcyB0d28gYXVkaW8gYnVmZmVycy4gU3VnZ2VzdGVkIGJ5IENocmlzIFdpbHNvbjo8YnI+XHJcbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTQxNDM2NTIvd2ViLWF1ZGlvLWFwaS1hcHBlbmQtY29uY2F0ZW5hdGUtZGlmZmVyZW50LWF1ZGlvYnVmZmVycy1hbmQtcGxheS10aGVtLWFzLW9uZS1zb25cclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjEgVGhlIGZpcnN0IGF1ZGlvIGJ1ZmZlclxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMiBUaGUgc2Vjb25kIGF1ZGlvIGJ1ZmZlclxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICBidWZmZXIxICsgYnVmZmVyMlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5hcHBlbmRBdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJ1ZmZlcjEsIGJ1ZmZlcjIpIHtcclxuICB2YXIgbnVtYmVyT2ZDaGFubmVscyA9IE1hdGgubWluKGJ1ZmZlcjEubnVtYmVyT2ZDaGFubmVscywgYnVmZmVyMi5udW1iZXJPZkNoYW5uZWxzKTtcclxuICB2YXIgdG1wID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgIChidWZmZXIxLmxlbmd0aCArIGJ1ZmZlcjIubGVuZ3RoKSxcclxuICAgIGJ1ZmZlcjEuc2FtcGxlUmF0ZSk7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgIHZhciBjaGFubmVsID0gdG1wLmdldENoYW5uZWxEYXRhKGkpO1xyXG4gICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjEuZ2V0Q2hhbm5lbERhdGEoaSksIDApO1xyXG4gICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICB9XHJcbiAgcmV0dXJuIHRtcDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZGljdGlvbmFyeSB3aXRoIHN0YXJ0L3N0b3AgcG9pbnRzIGFuZCBsZW5ndGggaW4gc2FtcGxlLWZyYW1lc1xyXG4gKiBvZiBhbiBhcHBlbmRlZCB3YXZlZm9ybSBhbmQgYWRkcyBpdCB0byB0aGUgbWV0YURhdGEgYXJyYXkuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBleGlzdGluZ0J1ZmZlciBUaGUgJ29sZCcgYnVmZmVyIHRoYXQgZ2V0cyBhcHBlbmRlZFxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gbmV3QnVmZmVyICAgICAgVGhlIGJ1ZmZlciB0aGF0IGdldHMgYXBwZW5kZWRcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIERpY3Rpb25hcnkgd2l0aCBzdGFydC9zdG9wL2xlbmd0aCBkYXRhXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFkZFdhdmVNZXRhRGF0YSA9IGZ1bmN0aW9uKGV4aXN0aW5nQnVmZmVyLCBuZXdCdWZmZXIpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGV4aXN0aW5nQnVmZmVyLmxlbmd0aCArIDEsXHJcbiAgICBlbmQ6IGV4aXN0aW5nQnVmZmVyLmxlbmd0aCArIG5ld0J1ZmZlci5sZW5ndGgsXHJcbiAgICBsZW5ndGg6IG5ld0J1ZmZlci5sZW5ndGhcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIGEgYmluYXJ5IGZpbGUgYW5kIGNhbGxzIGEgZnVuY3Rpb24gd2l0aCB0aGVcclxuICogcmV0dXJuZWQgQXJyYXlCdWZmZXIgYXMgaXRzIGFyZ3VtZW50IHdoZW4gZG9uZS5cclxuICogQHRvZG8gICAgVGVzdCBpbiBzeW5jaHJvbm91cyBtb2RlIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5XHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICBmaWxlbmFtZSAgICAgICBUaGUgZmlsZSB0byBiZSBsb2FkZWRcclxuICogQHBhcmFtICB7ZnVuY3Rpb259IG9ubG9hZENhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWRcclxuICogQHBhcmFtICB7Ym9vbGVhbn0gIFthc3luYz10cnVlXSAgIEFzeW5jaHJvbm91cyBsb2FkaW5nXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBhcnJheUJ1ZmZlcjtcclxuICogdGhpcy5sb2FkRmlsZSgnZmlsZTEud2F2JywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICogICBhcnJheUJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gKiB9KTtcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbihmaWxlbmFtZSwgb25sb2FkQ2FsbGJhY2ssIGFzeW5jKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBhc3luY2hyb25vdXNseSA9IHRydWU7XHJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBzZWxmLnVwZGF0ZVByb2dyZXNzKTtcclxuICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzZWxmLnRyYW5zZmVyQ29tcGxldGUpO1xyXG4gIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBzZWxmLnRyYW5zZmVyRmFpbGVkKTtcclxuICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgc2VsZi50cmFuc2ZlckNhbmNlbGVkKTtcclxuXHJcbiAgaWYgKGFzeW5jKSB7XHJcbiAgICBhc3luY2hyb25vdXNseSA9IGFzeW5jO1xyXG4gIH1cclxuXHJcbiAgcmVxdWVzdC5vcGVuKCdHRVQnLCBmaWxlbmFtZSwgYXN5bmNocm9ub3VzbHkpO1xyXG4gIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuXHJcbiAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIG9ubG9hZENhbGxiYWNrKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gIH07XHJcblxyXG4gIHJlcXVlc3Quc2VuZCgpO1xyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS51cGRhdGVQcm9ncmVzcyA9IGZ1bmN0aW9uKCkge307XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnRyYW5zZmVyQ29tcGxldGUgPSBmdW5jdGlvbihldnQpIHtcclxuXHJcbn07XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnRyYW5zZmVyRmFpbGVkID0gZnVuY3Rpb24oKSB7fTtcclxuXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUudHJhbnNmZXJDYW5jZWxlZCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4vKipcclxuICogTG9hZHMgbXVsdGlwbGUgYmluYXJ5IGZpbGVzIGFuZCByZXR1cm5zIGFuIGFycmF5XHJcbiAqIHdpdGggdGhlIGRhdGEgZnJvbSB0aGUgZmlsZXMgaW4gdGhlIGdpdmVuIG9yZGVyLlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGZpbGVuYW1lcyBMaXN0IHdpdGggZmlsZW5hbWVzXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgIEFycmF5IG9mIEFycmF5QnVmZmVyc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkRmlsZXMgPSBmdW5jdGlvbihmaWxlbmFtZXMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJpbkJ1ZmZlcnMgPSBbXTtcclxuICB2YXIgbmFtZXMgPSBmaWxlbmFtZXMuc3BsaXQoJywnKTtcclxuICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHNlbGYubG9hZEZpbGUobmFtZSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgYmluQnVmZmVyc1tuYW1lXSA9IHJlc3BvbnNlO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0aGlzLnNvcnRCaW5CdWZmZXJzKG5hbWVzLCBiaW5CdWZmZXJzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0IEFycmF5QnVmZmVycyB0aGUgc2FtZSBvcmRlciwgbGlrZSB0aGUgZmlsZW5hbWVcclxuICogcGFyYW1ldGVycy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgIEFycmF5IHdpdGggZmlsZW5hbWVzXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgYmluQnVmZmVycyBBcnJheSB3aXRoIEFycmF5QnVmZmVyXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBBcnJheSB3aXRoIHNvcnRlZCBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc29ydEJpbkJ1ZmZlcnMgPSBmdW5jdGlvbihmaWxlbmFtZXMsIGJpbkJ1ZmZlcnMpIHtcclxuICByZXR1cm4gZmlsZW5hbWVzLm1hcChmdW5jdGlvbihlbCkge1xyXG4gICAgcmV0dXJuIGJpbkJ1ZmZlcnNbZWxdO1xyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIHRoZSBmb3VuZGF0aW9uIG9mIHRoZSBJbnRlcm1peCBsaWJyYXJ5LlxyXG4gKiBJdCBzaW1wbHkgY3JlYXRlcyB0aGUgYXVkaW8gY29udGV4dCBvYmplY3RzXHJcbiAqIGFuZCBleHBvcnRzIGl0IHNvIGl0IGNhbiBiZSBlYXNpbHkgY29uc3VtZWRcclxuICogZnJvbSBhbGwgY2xhc3NlcyBvZiB0aGUgbGlicmFyeS5cclxuICpcclxuICogQHJldHVybiB7QXVkaW9Db250ZXh0fSBUaGUgQXVkaW9Db250ZXh0IG9iamVjdFxyXG4gKlxyXG4gKiBAdG9kbyBTaG91bGQgd2UgZG8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIG9sZGVyIGFwaS12ZXJzaW9ucz9cclxuICogQHRvZG8gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogQHRvZG8gQ2hlY2sgaWYgd2UncmUgcnVubmluZyBvbiBub2RlXHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlN1c3BlbmQgYW5kIHJlc3VtZSB0aGUgYXVkaW8gY29udGV4dCB0b1xyXG4gKiBjcmVhdGUgYSBwYXVzZSBidXR0b24uIFRoaXMgc2hvdWxkIGJlIHVzZWQgd2l0aCBjcmVhdGVBdWRpb1dvcmtlclxyXG4gKiBhcyBhbiBlcnJvciB3aWxsIGJlIHRocm93biB3aGVuIHN1c3BlbmQgaXMgY2FsbGVkIG9uIGFuIG9mZmxpbmUgYXVkaW8gY29udGV4dC5cclxuICogWW91IGNhbiBhbHNvIHBhdXNlIHNpbmdsZSBzb3VuZHMgd2l0aCA8aT5Tb3VuZC5wYXVzZSgpPC9pPi5cclxuICogUGxlYXNlIHJlYWQgPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RlL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvc3VzcGVuZFwiPnRoZSBkZXZlbG9wZXIgZG9jcyBhdCBNRE48L2E+XHJcbiAqIHRvIGdldCBhIGJldHRlciBpZGVhIG9mIHRoaXMuPC9jYXB0aW9uPlxyXG4gKiBzdXNyZXNCdG4ub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG4gKiAgIGlmKEludGVybWl4LnN0YXRlID09PSAncnVubmluZycpIHtcclxuICogICAgIEludGVybWl4LnN1c3BlbmQoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnUmVzdW1lIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfSBlbHNlIGlmIChJbnRlcm1peC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcclxuICogICAgIEludGVybWl4LnJlc3VtZSgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdTdXNwZW5kIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfVxyXG4gKiB9XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYXVkaW9DdHggPSBudWxsO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG5cclxuICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xyXG5cclxuICBpZiAod2luZG93LkF1ZGlvQ29udGV4dCkge1xyXG4gICAgYXVkaW9DdHggPSBuZXcgd2luZG93LkF1ZGlvQ29udGV4dCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkblxcJ3QgaW5pdGlhbGl6ZSB0aGUgYXVkaW8gY29udGV4dC4nKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhdWRpb0N0eDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGFib3V0IGphdmFzY3JpcHQgZXZlbnRzISBJdCdzIGp1c3RcclxuICogYSBkZWZpbml0aW9uIG9mIHRoZSBldmVudHMgdGhhdCB0aGUgc2VxdWVuY2VyIGNhbiBoYW5kbGUgcGx1c1xyXG4gKiBzb21lIGZ1bmN0aW9ucyB0byBjcmVhdGUgdmFsaWQgZXZlbnRzLlxyXG4gKiBUaGUgY2xhc3MgZGVmaW5lcyB3aGljaCBzdWJzeXN0ZW0gaXMgaW52b2tlZCB0byBwcm9jZXNzIHRoZSBldmVudC5cclxuICogRXZlcnkgY2xhc3MgY2FuIGhhdmUgc2V2ZXJhbCB0eXBlcyBhbmQgYSB0eXBlIGNvbnNpc3RzIG9mIG9uZSBvclxyXG4gKiBtb3JlIHByb3BlcnRpZXMuXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhIG5vdGUgZXZlbnQgZm9yIGFuIGF1ZGlvIG9iamVjdDwvY2FwdGlvbj5cclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdjMycsIDY1LCAxMjgsIGFTb3VuZE9iamVjdCk7XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBwcm9wZXJ0aWVzIGluIG9uZSBoYW5keSBhcnJheS5cclxuICogQHR5cGUge0FycmF5fVxyXG4gKi9cclxudmFyIGV2UHJvcCA9IFtcclxuICAnaW5zdHJ1bWVudCcsIC8vIHRoZSBldmVudCByZWNlaXZlclxyXG4gICd0b25lJywgICAgICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3IGJlZ2lubmluZyBhdCBjMFxyXG4gICdkdXJhdGlvbicsICAgLy8gSW50IHJlcHJlc2VudGluZyBhIG51bWJlciBvZiA2NHRoIG5vdGVzXHJcbiAgJ3ZlbG9jaXR5JywgICAvLyBJbnQgYmV0d2VlbiAwIGFuZCAxMjdcclxuICAncGl0Y2gnLFxyXG4gICd2b2x1bWUnLFxyXG4gICdwYW4nXHJcbl07XHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IHR5cGVzIGFuZCB0aGUgcHJvcGVydGllcyBhc3NvdGlhdGVkIHdpdGggdGhlbS5cclxuICogVHlwZSBhcmUgdmFsaWQgd2l0aCBvbmUsIHNldmVyYWwgb3IgYWxsIG9mIGl0cyBwcm9wZXJ0aWVzLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2VHlwZSA9IHtcclxuICAnbm90ZSc6IFsgZXZQcm9wWzBdLCBldlByb3BbMV0sIGV2UHJvcFsyXSwgZXZQcm9wWzNdIF0sXHJcbiAgJ2NvbnRyb2wnOiBbIGV2UHJvcFs0XSwgZXZQcm9wWzVdLCBldlByb3BbNl0gXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBjbGFzc2VzIGFuZCB0aGUgdHlwZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG52YXIgZXZDbGFzcyA9IHtcclxuICAnYXVkaW8nOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnc3ludGgnOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnZngnOiBbXSxcclxuICAnbWlkaSc6IFtdLFxyXG4gICdvc2MnOiBbXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyB0aGUgY2xhc3Mgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgdHJ1ZSBpZiBjbGFzcyBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlQ2xhc3MgPSBmdW5jdGlvbihlQ2xhc3MpIHtcclxuICBpZiAoZXZDbGFzcy5oYXNPd25Qcm9wZXJ0eShlQ2xhc3MpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIHR5cGUgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVUeXBlIEV2ZW50IHR5cGVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgdHlwZSBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlVHlwZSA9IGZ1bmN0aW9uKGVUeXBlKSB7XHJcbiAgaWYgKGV2VHlwZS5oYXNPd25Qcm9wZXJ0eShlVHlwZSkpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhbiBpbnN0cnVtZW50IGlzIGFuIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHBvb3JseSB3ZWFrIHRlc3QgYnV0IHRoYXQnc1xyXG4gKiBhbGwgd2UgY2FuIGRvIGhlcmUuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gaW5zdHIgQW4gaW5zdHJ1bWVudCBvYmplY3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICB0cnVlIGlmIGl0J3MgYW4gb2JqZWN0LCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BJbnN0cnVtZW50ID0gZnVuY3Rpb24oaW5zdHIpIHtcclxuICBpZiAodHlwZW9mIGluc3RyID09PSAnb2JqZWN0Jykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgdG9uZSBvciB2ZWxvY2l0eSB2YWx1ZSBpc1xyXG4gKiBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgMTI3LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIFRoZSBudW1iZXIgdGhhdCByZXByZXNlbnRzIGEgdG9uZVxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgdG9uZSwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wVG9uZVZlbG8gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDAgJiYgdmFsdWUgPD0gMTI3KSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgaWYgYSBkdXJhdGlvbiBpcyBhIHBvc2l0aXZlIGludGVnZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0ludH0gIHZhbHVlICAgTnVtYmVyIHJlcHJlc2VudGluZyBtdWx0aXBsZSA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgVHJ1ZSBpZiBpdHMgYSB2YWxpZCBkdXJhdGlvbiwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wRHVyYXRpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBhbiBvYmplY3Qgb2YgZXZlbnQgcHJvcGVydGllcy5cclxuICogSXQgY2hlY2tzIHRoZSBwcm9wZXJ0aWVzIGFyZSB2YWxpZCBmb3IgdGhlIGdpdmVuIHR5cGUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzICBPYmplY3Qgd2l0aCBldmVudCBwcm9wZXJ0aWVzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgICBFdmVudCB0eXBlIHRvIHZhbGlkYXRlIGFnYWluc3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgIHRydWUgaWYgYWxsIHByb3BzIGFyZSB2YWxpZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wcyA9IGZ1bmN0aW9uKGVQcm9wcywgZVR5cGUpIHtcclxuICB2YXIgdHlwZSA9IGV2VHlwZVtlVHlwZV07XHJcbiAgZm9yICh2YXIga2V5IGluIGVQcm9wcykgIHtcclxuICAgIGlmIChldlByb3AuaW5kZXhPZihrZXkpID09PSAtMSAmJlxyXG4gICAgdHlwZS5pbmRleE9mKGtleSkgPT09IC0xKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYSBzdHJpbmcgb2YgdGhlIGZvcm0gYzMgb3IgZCM0IGFuZFxyXG4gKiByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIG51bWJlci5cclxuICogQHBhcmFtICB7U3RyaW5nfSB0b25lIFN0cmluZyByZXByZXNlbnRpbmcgYSBub3RlXHJcbiAqIEByZXR1cm4ge0ludH0gICAgICAgICBOdW1iZXIgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKi9cclxudmFyIGNvbnZlcnRUb25lID0gZnVuY3Rpb24odG9uZSkge1xyXG4gIHZhciBub3RlcyA9IFsnYycsICdjIycsICdkJywgJ2QjJywgJ2UnLCAnZicsICdmIycsICdnJywgJ2cjJywgJ2EnLCAnYSMnLCAnYiddO1xyXG4gIHZhciBzdHIgPSB0b25lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIGlmIChzdHIubWF0Y2goL15bYS1oXSM/WzAtOV0kLykpIHtcclxuICAgIHZhciBub3RlID0gc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSk7XHJcbiAgICB2YXIgb2N0ID0gc3RyLnNsaWNlKC0xKTtcclxuXHJcbiAgICBpZiAobm90ZSA9PT0gJ2gnKSB7XHJcbiAgICAgIG5vdGUgPSAnYic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm90ZXMuaW5kZXhPZihub3RlKSArIG9jdCAqIDEyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VudmFsaWQgc3RyaW5nLiBIYXMgdG8gYmUgbGlrZSBbYS1oXTwjPlswLTldJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzZXF1ZW5jZXIgZXZlbnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgIEV2ZW50IHR5cGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICBTZXF1ZW5jZXIgZXZlbnRcclxuICovXHJcbnZhciBjcmVhdGVFdmVudCA9IGZ1bmN0aW9uKGVDbGFzcywgZVR5cGUsIGVQcm9wcykge1xyXG4gIGlmICh2YWxpZGF0ZUNsYXNzKGVDbGFzcykgJiZcclxuICAgIHZhbGlkYXRlVHlwZShlVHlwZSkgJiZcclxuICAgIHZhbGlkYXRlUHJvcHMoZVByb3BzLCBlVHlwZSkpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICdjbGFzcyc6IGVDbGFzcyxcclxuICAgICAgJ3R5cGUnOiBlVHlwZSxcclxuICAgICAgJ3Byb3BzJzogZVByb3BzXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjcmVhdGUgc2VxdWVuY2VyIGV2ZW50LiBXcm9uZyBwYXJhbWV0ZXJzJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gYXVkaW8gbm90ZSBldmVudFxyXG4gKiBAcGFyYW0gIHtJbnR8U3RyaW5nfSB0b25lICAgICBUb25lIGJldHdlZW4gMCBhbmQgMTI3IG9yIHN0cmluZyAoYzMsIGQjNClcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgdmVsb2NpdHkgVmVsb2NpdHkgYmV0d2VlbiAwIGFuZCAxMjdcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgZHVyYXRpb24gRHVyYXRpb24gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICBBbGwgcHJvcGVydGllcyBpbiBvbmUgb2JqZWN0XHJcbiAqL1xyXG52YXIgY3JlYXRlQXVkaW9Ob3RlID0gZnVuY3Rpb24odG9uZSwgdmVsb2NpdHksIGR1cmF0aW9uLCBpbnN0cikge1xyXG4gIHZhciBwcm9wcyA9IHt9O1xyXG4gIGlmICh0eXBlb2YgdG9uZSA9PT0gJ3N0cmluZycpIHtcclxuICAgIHRvbmUgPSBjb252ZXJ0VG9uZSh0b25lKTtcclxuICB9XHJcbiAgaWYgKHRvbmUgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odG9uZSkpIHtcclxuICAgIHByb3BzLnRvbmUgPSB0b25lO1xyXG4gIH1cclxuICBpZiAodmVsb2NpdHkgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odmVsb2NpdHkpKSB7XHJcbiAgICBwcm9wcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xyXG4gIH1cclxuICBpZiAoZHVyYXRpb24gJiYgdmFsaWRhdGVQcm9wRHVyYXRpb24oZHVyYXRpb24pKSB7XHJcbiAgICBwcm9wcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gIH1cclxuICBpZiAoaW5zdHIgJiYgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudChpbnN0cikpIHtcclxuICAgIHByb3BzLmluc3RydW1lbnQgPSBpbnN0cjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBIHNlcXVlbmNlciBldmVudCBtdXN0IGhhdmUgYW4gaW5zdHJ1bWVudCBhcyBwcm9wZXJ0eScpO1xyXG4gIH1cclxuICByZXR1cm4gY3JlYXRlRXZlbnQoJ2F1ZGlvJywgJ25vdGUnLCBwcm9wcyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBjbGFzczogZXZDbGFzcyxcclxuICB0eXBlOiBldlR5cGUsXHJcbiAgcHJvcGVydHk6IGV2UHJvcCxcclxuICBjcmVhdGVBdWRpb05vdGU6IGNyZWF0ZUF1ZGlvTm90ZVxyXG59O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5JdCBpcyBqdXN0IGZvciBsaWJyYXJ5IGludGVybmFsXHJcbiAqIHVzYWdlLiBTZWUgU2VxdWVuY2VyLmpzIGZvciBkZXRhaWxzLjwvY2FwdGlvbj5cclxuICogd29ya2VyLnBvc3RNZXNzYWdlKHsgJ2ludGVydmFsJzogMjAwIH0pO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gKiB3b3JrZXIudGVybWluYXRlKCk7ICAvL3dlYndvcmtlciBpbnRlcm5hbCBmdW5jdGlvbiwganVzdCBmb3IgY29tcGxldGVuZXNzXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdGltZXIgPSBudWxsO1xyXG52YXIgaW50ZXJ2YWwgPSAxMDA7XHJcblxyXG52YXIgd29ya2VyID0gZnVuY3Rpb24oc2VsZikge1xyXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhLmludGVydmFsKSB7XHJcbiAgICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4gICAgICBpZiAodGltZXIpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gd29ya2VyO1xyXG4iXX0=
