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
 * @example
 * var sound = new intermix.Sound(soundWaveObject);
 * var seq = new intermix.Sequencer();
 * var part = new intermix.Part();
 * var note = intermix.events.createAudioNote('a3', 1, 0, sound);
 * part.addEvent(note, 0);
 * part.addEvent(note, 4);
 * seq.addPart(part, 0);
 * @constructor
 * @param  {float}  length       Length of the part in 64th notes (default: 64)
 */
var Part = function(length) {

  this.resolution = 16; // (resolution * multiply) should alwasy be 64
  this.multiply = 4;    // resolution multiplier
  this.length = 64;     // length of the pattern in 64th notes
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
  for (var i = 0; i < (length); i++) {
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
 * Can be handy to draw events on the screen.
 * @example <caption>from {@tutorial Stepsequencer}</caption>
 * bdSteps = bdPart.getNotePositions();
 * bdSteps.forEach(function(pos) {
 *   document.getElementById('bd' + pos).style.backgroundColor = 'red';
 * });
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
 * @param  {float}  extLength Length in 64th notes
 * @return {Void}
 */
Part.prototype.extendOnTop = function(extLength) {
  var extension = this.initPattern(extLength);
  this.pattern = extension.concat(this.pattern);
};

/**
 * Extends a part at the end
 * @param  {float}  extLength Length in 64th notes
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
 * @example
 * var part = new intermix.Part();
 * var seq = new intermix.Sequencer();
 * part.addEvent(someNote, 0);
 * seq.addPart(part, 0);
 * seq.start();
 * @constructor
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
 * @private
 * @return {Void}
 */
Sequencer.prototype.scheduler = function() {
  var limit = core.currentTime + this.lookahead;
  // if invoked for the first time or previously stopped
  if (this.nextStepTime === 0) {
    this.nextStepTime = core.currentTime;
  }

  while (this.nextStepTime < limit) {
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
  if (typeof this.queue[this.nextStep] !== 'undefined') {
    if (this.queue[this.nextStep].length === 1) {
      var part = this.queue[this.nextStep][0];
      part.pointer = 0;
      this.runqueue.push(part);
    } else {
      this.queue[this.nextStep].forEach(function(part) {
        part.pointer = 0;
        this.runqueue.push(part);
      }, this);
    }
  }
};

/**
 * Deletes parts from runqueue. It is important, that the indices
 * of the parts are sorted from max to min. Otherwise the forEach
 * loop won't work.
 * @private
 * @param  {Array} indices  Indices of the parts in the runqueue
 * @return {Void}
 */
Sequencer.prototype.deletePartsFromRunqueue = function(indices) {
  if (indices.length > 0) {
    indices.forEach(function(id) {
      delete this.runqueue[id].pointer;
      this.runqueue.splice(id, 1);
    }, this);
  }
};

/**
 * Fires all events for the upcomming step.
 * @private
 * @return {Void}
 */
Sequencer.prototype.fireEvents = function() {
  var markForDelete = [];
  this.runqueue.forEach(function(part, index) {
    if (part.pointer === part.length - 1) {
      markForDelete.unshift(index);
    } else {
      var seqEvents = part.pattern[part.pointer];
      if (seqEvents && seqEvents.length > 1) {
        seqEvents.forEach(function(seqEvent) {
          this.processSeqEvent(seqEvent, this.nextStepTime);
        }, this);
      } else if (seqEvents && seqEvents.length === 1) {
        this.processSeqEvent(seqEvents[0], this.nextStepTime);
      }
    }
    part.pointer++;
  }, this);
  this.deletePartsFromRunqueue(markForDelete);
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
 * If a pointer position is given, jump to it.
 * @private
 * @param   {Int}   position  New position in the master queue
 * @return  {Void}
 */
Sequencer.prototype.setQueuePointer = function(position) {
  if (typeof position !== 'undefined') {
    this.nextStep = position;
    this.runqueue = [];
  } else if (this.loop && this.nextStep >= this.loopEnd) {
    this.nextStep = this.loopStart;
    this.runqueue = [];
  } else {
    this.nextStep++;
  }
};

/**
 * Resets the queue pointer (set to position 0).
 * @return {Void}
 */
Sequencer.prototype.resetQueuePointer = function() {
  this.setQueuePointer(0);
};

/**
 * Starts the sequencer
 * @return {Void}
 */
Sequencer.prototype.start = function() {
  if (!this.isRunning) {
    this.scheduleWorker.postMessage('start');
    this.isRunning = true;
    window.requestAnimationFrame(this.draw.bind(this));
  }
};

/**
 * Stops the sequencer (halts at the current position)
 * @return {Void}
 */
Sequencer.prototype.stop = function() {
  this.scheduleWorker.postMessage('stop');
  this.nextStepTime = 0;
  this.isRunning = false;
};

/**
 * Stops the sequencer and suspends the AudioContext to
 * globally halt all audio streams. It just halts if
 * if sequencer and AudioContext both are in running state.
 * @return {Boolean} true if halted, false if not
 */
Sequencer.prototype.pause = function() {
  if (core.state === 'running' && this.isRunning) {
    this.stop();
    core.suspend();
    return true;
  } else {
    return false;
  }
};

/**
 * Resumes the AudioContext and starts the sequencer at its
 * current position. It just starts if sequencer and AudioContext
 * both are stopped.
 * @return {Boolean} true if resumed, false if not
 */
Sequencer.prototype.resume = function() {
  if (core.state === 'suspended' && !this.isRunning) {
    this.start();
    core.resume();
    return true;
  } else {
    return false;
  }
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
  // first we'll have to find out, what step was played recently.
  // this is somehow clumsy because the sequencer doesn't keep track of that.
  var lookAheadDelta = this.nextStepTime - core.currentTime;
  if (lookAheadDelta >= 0) {
    var stepsAhead = Math.round(lookAheadDelta / this.timePerStep);

    if (this.nextStep < stepsAhead) {
      // we just jumped to the start of a loop
      this.lastPlayedStep = this.loopEnd + this.nextStep - stepsAhead;
    } else {
      this.lastPlayedStep = this.nextStep - stepsAhead;
    }

    this.updateFrame(this.lastPlayedStep);
  }

  if (this.isRunning) {
    window.requestAnimationFrame(this.draw.bind(this));
  }
};

/**
 * Runs between screen refresh. Has to be overridden by the
 * app to render to the screen.
 * @param  {Int}  lastPlayedStep  The 64th step that was played recently
 * @return {Void}
 */
Sequencer.prototype.updateFrame = function(lastPlayedStep) {
  console.log(lastPlayedStep);
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
    throw new Error('Given parameter doesn\'t seem to be a part object');
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
 * @private
 * @param  {float}  bpm        beats per minute
 * @param  {Int}    resolution shortest possible note value
 * @return {float}             time in seconds
 */
Sequencer.prototype.setTimePerStep = function(bpm, resolution) {
  return (60 * 4) / (bpm * resolution);
};

Sequencer.prototype.getLastPlayedStep = function() {

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
 * Play a sound that can be looped. Pause/Start works sample-accurate
 * at any rate. Hit the start button multiple times to have multiple
 * sounds played. All parameters are adjustable in realtime.
 * </p>
 *
 * @example
 * var soundWave = new intermix.SoundWave('audiofile.wav');
 * var sound = new intermix.Sound(soundWave);
 * sound.start();
 * @tutorial Sound
 * @constructor
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
    this.soundLength = this.loopEnd = this.wave.buffer.duration;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

/**
 * Creates a gain and stereo-panner node, connects them
 * (gain -> panner) and sets gain to 1 (max value).
 * @private
 * @return {Void}
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
 * @private
 * @return {BufferSourceNode} The BufferSourceNode
 */
Sound.prototype.createBufferSource = function() {
  var self = this;
  var bufferSource = core.createBufferSource();
  // console.log(this.wave.buffer);
  bufferSource.buffer = this.wave.buffer;
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
 * callback of all BufferSourceNodes to avoid dead references.
 * @private
 * @param  {bsNode} bsNode the bufferSource to be destroyed.
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
 * This currently just works in Chrome 49+ only.
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

/**
 * This is not in use and can probably be removed
 * @return {Int} Random number
 */
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
 * @example <caption>Concatenate multiple source files into one buffer<br>
 * in the given order and play them (This is broken in v0.1. Don't use it!):</caption>
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
  var self = this;
  this.ac = core;       //currently just used for tests
  this.buffer = core.createBuffer(1, 1, core.sampleRate);   //AudioBuffer
  this.metaData = [];   //start-/endpoints and length of single waves

  if (typeof audioSrc !== 'undefined') {
    if (typeof audioSrc === 'string') {
      //one file to load/decode
      this.buffer = this.loadFile(audioSrc).then(function(response) {
        return self.decodeAudioData(response);
      })
      .then(function(decoded) {
        self.buffer = decoded;
        return self.buffer;
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof Array && typeof audioSrc[0] === 'string') {
      //multiple files to load/decode and cancatinate
      this.buffer = this.loadMultipleFiles(audioSrc).then(function(decoded) {
        self.buffer = decoded;
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof ArrayBuffer) {
      //one ArrayBuffer to decode
      this.buffer = this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple ArrayBuffers to decode and concatenate
      this.decodeAudioSources(audioSrc).then(function(audioBuffers) {
        return self.joinAudioBuffers(audioBuffers);
      })
      .then(function(audioBuffer) {
        self.buffer = audioBuffer;
      })
      .catch(function(err) {
        throw err;
      });
    } else {
      throw new Error('Cannot create SoundWave object: Unsupported data format');
    }
  } else {
    //start the object with empty buffer. Usefull for testing and advanced usage.
  }

};

/**
 * Takes an array of filenames and returns a promise that resolves
 * to an AudioBuffer including the PCM data of all files on success.
 * Returns an error on failure.
 * @param  {Array}    filenames Array with filenames to be loaded
 * @return {Promise}            Resolves to AudioBuffer or throws error.
 */
SoundWave.prototype.loadMultipleFiles = function(urls) {
  var self = this;
  var filenames = this.stripFilenames(urls);

  return this.loadFiles(urls).then(function(binBuffers) {
    return self.decodeAudioSources(binBuffers);
  })
  .then(function(audioBuffers) {
    var promises = [];
    promises.push(self.joinAudioBuffers(audioBuffers),
      self.storeMetaData(audioBuffers, filenames));
    return Promise.all(promises);
  })
  .then(function(bufferAndMeta) {
    self.metaData = bufferAndMeta[1];
    return bufferAndMeta[0];
  })
  .catch(function(err) {
    throw err;
  });
};

/**
 * Takes one or more ArrayBuffers and returns an equal number of AudioBuffers.
 * @param  {Array}    buffers Array with ArrayBuffers
 * @return {Promise}          Resolves to an array of AudioBuffers or error
 */
SoundWave.prototype.decodeAudioSources = function(buffers) {
  var promises = [];
  buffers.forEach(function(buffer) {
    promises.push(this.decodeAudioData(buffer));
  }, this);

  return Promise.all(promises);
};

/**
 * Takes an ArrayBuffer with binary audio data and
 * turns it into an audio buffer object.
 * Just a wrapper for the web-audio-api decodeAudioData function.
 * It uses the new promise syntax so it probably won't work in all browsers by now.
 * @private
 * @param  {ArrayBuffer}  rawAudioSrc Audio data in raw binary format
 * @return {Promise}                  Resolves to AudioBuffer or error
 */
SoundWave.prototype.decodeAudioData = function(rawAudioSrc) {
  return core.decodeAudioData(rawAudioSrc);
};

/**
 * Joins an arbitrary number of ArrayBuffers.
 * @private
 * @param  {Array}       buffers Array of AudioBuffers
 * @return {AudioBuffer}         Waveform that includes all given buffers.
 */
SoundWave.prototype.joinAudioBuffers = function(buffers) {
  var self = this;
  var joinedBuffer;

  return new Promise(function(resolve, reject) {
    if (Array.isArray(buffers)) {
      joinedBuffer = buffers[0];
      buffers = buffers.splice(0, 1);
    } else {
      reject(new TypeError('Argument is not of type Array'));
    }

    buffers.forEach(function(buffer) {
      if (buffer instanceof window.AudioBuffer &&
        joinedBuffer instanceof window.AudioBuffer) {
        joinedBuffer = this.appendAudioBuffer(joinedBuffer, buffer);
      } else {
        reject(new TypeError('One or more buffers are not of type AudioBuffer.'));
      }
    }, self);
    resolve(joinedBuffer);
  });
};

/**
 * Appends two audio buffers. Both buffers should have the same amount
 * of channels. If not, channels will be dropped. For example, if you
 * append a stereo and a mono buffer, the output will be mono and only
 * one of the channels of the stereo sample will be used (no merging of channels).
 * Suggested by Chris Wilson:<br>
 * http://stackoverflow.com/questions/14143652/web-audio-api-append-concatenate-different-audiobuffers-and-play-them-as-one-son
 * @private
 * @param  {AudioBuffer} buffer1 The first audio buffer
 * @param  {AudioBuffer} buffer2 The second audio buffer
 * @return {AudioBuffer}         buffer1 + buffer2
 */
SoundWave.prototype.appendAudioBuffer = function(buffer1, buffer2) {
  if (buffer1 instanceof window.AudioBuffer &&
  buffer2 instanceof window.AudioBuffer) {
    var numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
    var newBuffer = core.createBuffer(numberOfChannels,
      (buffer1.length + buffer2.length),
      buffer1.sampleRate);
    for (var i = 0; i < numberOfChannels; i++) {
      var channel = newBuffer.getChannelData(i);
      channel.set( buffer1.getChannelData(i), 0);
      channel.set( buffer2.getChannelData(i), buffer1.length);
    }
    return newBuffer;
  } else {
    throw new TypeError('One or both buffers are not of type AudioBuffer.');
  }
};

/**
 * Stores metaData objects in the metaData array.
 * @param  {Array} audioBuffers Array of AudioBuffers
 * @param  {Array} names        Array of names
 * @return {Promise}            Resolves to a metaData array or error.
 */
SoundWave.prototype.storeMetaData = function(audioBuffers, names) {
  var fnames = [];
  var metaData = [];
  var start = 0;
  var self = this;

  return new Promise(function(resolve, reject) {
    if (typeof names === 'undefined') {
      audioBuffers.forEach(function(buffer, index) {
        fnames.push('fragment' + index);
      });
    } else if (names.length === audioBuffers.length) {
      fnames = names;
    } else {
      reject(new Error('audioBuffers and names should be of same length'));
    }
    audioBuffers.forEach(function(buffer, index) {
      metaData.push(this.getMetaData(buffer, names[index], start));
      start += buffer.length;
    }, self);
    resolve(metaData);
  });
};

/**
 * Strips filenames from an array of urls and returns it in an array.
 * @private
 * @param  {Array} urls Array of urls
 * @return {Array}      Array of filenames
 */
SoundWave.prototype.stripFilenames = function(urls) {
  return urls.map(function(url) {
    return url.split('/').pop();
  });
};

/**
 * Creates a dictionary with start/stop points and length in sample-frames
 * of a buffer fragment..
 * @param  {AudioBuffer} buffer      Buffer with the appendable pcm fragment
 * @param  {String}      name        Name of the fragment
 * @param  {Int}         start       Startpoint of the fragment
 * @return {Object}                  Dictionary with meta data or error msg
 */
SoundWave.prototype.getMetaData = function(buffer, name, start) {
  if (buffer instanceof window.AudioBuffer && typeof name === 'string') {
    if (typeof start === 'undefined') {
      start = 0;
    }
    var bufLength = buffer.length;
    return {
      'name': name,
      'start': start,
      'end': start + bufLength - 1,
      'length': bufLength
    };
  } else {
    throw new TypeError('Arguments should be of type AudioBuffer and String');
  }
};

/**
 * Loads a (audio) file and returns its data as ArrayBuffer
 * when the promise fulfills.
 * @private
 * @param  {string}   url            The file to be loaded
 * @return {Promise}                 A promise representing the xhr response
 */
SoundWave.prototype.loadFile = function(url) {
  return window.fetch(url)
    .then(function(response) {
      if (response.ok) {
        return response.arrayBuffer();
      } else {
        throw new Error('Server error. Couldn\'t load file: ' + url);
      }
    });
};

/**
 * Loads multiple (audio) files and returns an array
 * with the data from the files in the given order.
 * @private
 * @param  {Array}  filenames List with filenames
 * @return {Array}            Array of ArrayBuffers
 */
SoundWave.prototype.loadFiles = function(filenames) {
  var promises = [];
  filenames.forEach(function(name) {
    promises.push(this.loadFile(name));
  }, this);

  return Promise.all(promises);
};


/**
 * Get an AudioBuffer with a fragment of the AudioBuffer
 * of this object.
 * @param  {Int}    start   Startpoint of the fragment in samples
 * @param  {Int}    end     Endpoint of the fragment in samples
 * @return {AudioBuffer}    AudioBuffer including the fragment
 */
SoundWave.prototype.getBufferFragment = function(start, end) {
  if (this.buffer.length === 1) {
    throw new Error('Audio buffer empty. Nothing to copy.');
  } else if (typeof start === 'undefined') {
    return this.buffer;
  } else if (start < 0) {
    start = 0;
  }

  if (typeof end === 'undefined' || end > this.buffer.length) {
    end = this.buffer.length;
  }

  if (start >= end) {
    throw new Error('Arguments out of bounds.');
  }

  var chnCount = this.buffer.numberOfChannels;
  var frameCount = end - start;
  var newBuffer = core.createBuffer(chnCount, frameCount, core.sampleRate);

  for (var chn = 0; chn < chnCount; chn++) {
    var newChannel = newBuffer.getChannelData(chn);
    var oldChannel = this.buffer.getChannelData(chn);

    for (var i = 0; i < frameCount; i++) {
      newChannel[i] = oldChannel[start + i];
    }
  }

  return newBuffer;
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
  // futile??
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

var isMobile = {
  'Android': function() {
    return window.navigator.userAgent.match(/Android/i);
  },
  'iOS': function() {
    return window.navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  'BlackBerry': function() {
    return window.navigator.userAgent.match(/BlackBerry/i);
  },
  'Opera': function() {
    return window.navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function() {
    return window.navigator.userAgent.match(/IEMobile/i) ||
    window.navigator.userAgent.match(/WPDesktop/i);
  },
  any: function() {
    return (isMobile.Android() ||
    isMobile.iOS() ||
    isMobile.BlackBerry() ||
    isMobile.Opera() ||
    isMobile.Windows());
  }
};

(function() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if (typeof window.AudioContext !== 'undefined') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy9pbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKSB8fCB7fTtcclxuaW50ZXJtaXguZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcclxuaW50ZXJtaXguU291bmRXYXZlID0gcmVxdWlyZSgnLi9Tb3VuZFdhdmUuanMnKTtcclxuaW50ZXJtaXguU291bmQgPSByZXF1aXJlKCcuL1NvdW5kLmpzJyk7XHJcbmludGVybWl4LlNlcXVlbmNlciA9IHJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJyk7XHJcbmludGVybWl4LlBhcnQgPSByZXF1aXJlKCcuL1BhcnQuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW50ZXJtaXg7XHJcbiIsInZhciBidW5kbGVGbiA9IGFyZ3VtZW50c1szXTtcbnZhciBzb3VyY2VzID0gYXJndW1lbnRzWzRdO1xudmFyIGNhY2hlID0gYXJndW1lbnRzWzVdO1xuXG52YXIgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIgd2tleTtcbiAgICB2YXIgY2FjaGVLZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIHZhciBleHAgPSBjYWNoZVtrZXldLmV4cG9ydHM7XG4gICAgICAgIC8vIFVzaW5nIGJhYmVsIGFzIGEgdHJhbnNwaWxlciB0byB1c2UgZXNtb2R1bGUsIHRoZSBleHBvcnQgd2lsbCBhbHdheXNcbiAgICAgICAgLy8gYmUgYW4gb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgZXhwb3J0IGFzIGEgcHJvcGVydHkgb2YgaXQuIFRvIGVuc3VyZVxuICAgICAgICAvLyB0aGUgZXhpc3RpbmcgYXBpIGFuZCBiYWJlbCBlc21vZHVsZSBleHBvcnRzIGFyZSBib3RoIHN1cHBvcnRlZCB3ZVxuICAgICAgICAvLyBjaGVjayBmb3IgYm90aFxuICAgICAgICBpZiAoZXhwID09PSBmbiB8fCBleHAuZGVmYXVsdCA9PT0gZm4pIHtcbiAgICAgICAgICAgIHdrZXkgPSBrZXk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghd2tleSkge1xuICAgICAgICB3a2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgICAgIHZhciB3Y2FjaGUgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICAgICAgd2NhY2hlW2tleV0gPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlc1t3a2V5XSA9IFtcbiAgICAgICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZScsJ21vZHVsZScsJ2V4cG9ydHMnXSwgJygnICsgZm4gKyAnKShzZWxmKScpLFxuICAgICAgICAgICAgd2NhY2hlXG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBza2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG5cbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sIChcbiAgICAgICAgICAgIC8vIHRyeSB0byBjYWxsIGRlZmF1bHQgaWYgZGVmaW5lZCB0byBhbHNvIHN1cHBvcnQgYmFiZWwgZXNtb2R1bGVcbiAgICAgICAgICAgIC8vIGV4cG9ydHNcbiAgICAgICAgICAgICd2YXIgZiA9IHJlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpOycgK1xuICAgICAgICAgICAgJyhmLmRlZmF1bHQgPyBmLmRlZmF1bHQgOiBmKShzZWxmKTsnXG4gICAgICAgICkpLFxuICAgICAgICBzY2FjaGVcbiAgICBdO1xuXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICA7XG5cbiAgICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgICAgbmV3IEJsb2IoW3NyY10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSlcbiAgICApKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogUmVwcmVzZW50cyBhIHBhcnQgb2YgYSBzZXF1ZW5jZS4gSXQgY2FuIGJlXHJcbiAqIHVzZWQgaW4gbWFueSB3YXlzOlxyXG4gKiA8dWw+XHJcbiAqIDxsaT5BIHBhcnQgb2YgYSB0cmFjayBsaWtlIGluIHBpYW5vLXJvbGwgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDxsaT5BIHBhdHRlcm4gbGlrZSBpbiBzdGVwIHNlcXVlbmNlcnMsIGRydW0gY29tcHV0ZXJzIGFuZCB0cmFja2VyczwvbGk+XHJcbiAqIDxsaT5BIGxvb3AgbGlrZSBpbiBsaXZlIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8L3VsPlxyXG4gKiBUZWNobmljYWxseSBpdCBjYW4gc3RvcmUgYW55IHR5cGUgb2YgZXZlbnQgeW91ciBzeXN0ZW0gaXMgY2FwYWJsZSBvZi5cclxuICogVGhpcyBtZWFucyBpdCBpcyBub3QgbGltaXRlZCB0byBhdWRpbywgbWlkaSwgb3NjIG9yIGRteCBidXQgY2FuIGhvbGRcclxuICogYW55IHR5cGUgb2YgamF2YXNjcmlwdCBvYmplY3QuIEEgcG9zc2libGUgdXNlY2FzZSB3b3VsZCBiZSB0byB0cmlnZ2VyXHJcbiAqIHNjcmVlbiBldmVudHMgd2l0aCB0aGUgZHJhdyBmdW5jdGlvbiBvZiB0aGUgc2VxdWVuY2VyIG9iamVjdC5cclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZU9iamVjdCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHZhciBwYXJ0ID0gbmV3IGludGVybWl4LlBhcnQoKTtcclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdhMycsIDEsIDAsIHNvdW5kKTtcclxuICogcGFydC5hZGRFdmVudChub3RlLCAwKTtcclxuICogcGFydC5hZGRFdmVudChub3RlLCA0KTtcclxuICogc2VxLmFkZFBhcnQocGFydCwgMCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgICAgICBMZW5ndGggb2YgdGhlIHBhcnQgaW4gNjR0aCBub3RlcyAoZGVmYXVsdDogNjQpXHJcbiAqL1xyXG52YXIgUGFydCA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG5cclxuICB0aGlzLnJlc29sdXRpb24gPSAxNjsgLy8gKHJlc29sdXRpb24gKiBtdWx0aXBseSkgc2hvdWxkIGFsd2FzeSBiZSA2NFxyXG4gIHRoaXMubXVsdGlwbHkgPSA0OyAgICAvLyByZXNvbHV0aW9uIG11bHRpcGxpZXJcclxuICB0aGlzLmxlbmd0aCA9IDY0OyAgICAgLy8gbGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIGluIDY0dGggbm90ZXNcclxuICB0aGlzLm5hbWUgPSAnUGFydCc7ICAgLy8gbmFtZSBvZiB0aGlzIHBhcnRcclxuICB0aGlzLnBhdHRlcm4gPSBbXTsgICAgLy8gdGhlIGFjdHVhbCBwYXR0ZXJuIHdpdGggbm90ZXMgZXRjLlxyXG5cclxuICBpZiAobGVuZ3RoKSB7XHJcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICB9XHJcblxyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMuaW5pdFBhdHRlcm4odGhpcy5sZW5ndGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgYW4gZW1wdHkgcGF0dGVybiBmb3IgdGhlIHBhcnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICBMZW5ndGggb2YgdGhlIHBhdHRlcm4gbWVzdXJlZCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGF0dGVybiA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gIHZhciBwYXR0ZXJuID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAobGVuZ3RoKTsgaSsrKSB7XHJcbiAgICBwYXR0ZXJuW2ldID0gW107XHJcbiAgfVxyXG4gIHJldHVybiBwYXR0ZXJuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYW4gZXZlbnQgdG8gdGhlIHBhdHRlcm4gYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuYWRkRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICBpZiAocG9zaXRpb24gPD0gdGhpcy5yZXNvbHV0aW9uKSB7XHJcbiAgICB2YXIgcG9zID0gKHBvc2l0aW9uKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgICB0aGlzLnBhdHRlcm5bcG9zXS5wdXNoKHNlcUV2ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQb3NpdGlvbiBvdXQgb2YgcGF0dGVybiBib3VuZHMuJyk7XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYW4gZXZlbnQgYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICB2YXIgcG9zID0gKHBvc2l0aW9uKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgdmFyIGluZGV4ID0gdGhpcy5wYXR0ZXJuW3Bvc10uaW5kZXhPZihzZXFFdmVudCk7XHJcbiAgdGhpcy5wYXR0ZXJuW3Bvc10uc3BsaWNlKGluZGV4LCAxKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge0ludH0gICAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wYXR0ZXJuLmxlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYWxsIHBvc2l0aW9ucyB0aGF0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGV2ZW50LlxyXG4gKiBDYW4gYmUgaGFuZHkgdG8gZHJhdyBldmVudHMgb24gdGhlIHNjcmVlbi5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+ZnJvbSB7QHR1dG9yaWFsIFN0ZXBzZXF1ZW5jZXJ9PC9jYXB0aW9uPlxyXG4gKiBiZFN0ZXBzID0gYmRQYXJ0LmdldE5vdGVQb3NpdGlvbnMoKTtcclxuICogYmRTdGVwcy5mb3JFYWNoKGZ1bmN0aW9uKHBvcykge1xyXG4gKiAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZCcgKyBwb3MpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZWQnO1xyXG4gKiB9KTtcclxuICogQHJldHVybiB7QXJyYXl9ICBMaXN0IHdpdGggYWxsIG5vbi1lbXB0eSBwYXR0ZXJuIGVudHJpZXNcclxuICovXHJcblBhcnQucHJvdG90eXBlLmdldE5vdGVQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcG9zaXRpb25zID0gW107XHJcbiAgdGhpcy5wYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24oZWwsIGluZGV4KSB7XHJcbiAgICBpZiAoZWwubGVuZ3RoID4gMCkge1xyXG4gICAgICBwb3NpdGlvbnMucHVzaChpbmRleCAvIHRoaXMubXVsdGlwbHkpO1xyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG4gIHJldHVybiBwb3NpdGlvbnM7XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBhIHBhcnQgYXQgdGhlIHRvcC9zdGFydC5cclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uVG9wID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSBleHRlbnNpb24uY29uY2F0KHRoaXMucGF0dGVybik7XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBhIHBhcnQgYXQgdGhlIGVuZFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGV4dExlbmd0aCBMZW5ndGggaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25FbmQgPSBmdW5jdGlvbihleHRMZW5ndGgpIHtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihleHRMZW5ndGgpO1xyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMucGF0dGVybi5jb25jYXQoZXh0ZW5zaW9uKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFydDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHdvcmsgPSByZXF1aXJlKCd3ZWJ3b3JraWZ5Jyk7ICAgLy9wcmVwYXJlcyB0aGUgd29ya2VyIGZvciBicm93c2VyaWZ5XHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciB3b3JrZXIgPSByZXF1aXJlKCcuL3NjaGVkdWxlV29ya2VyLmpzJyk7XHJcblxyXG4vKipcclxuICogVGhlIG1haW4gY2xhc3Mgb2YgdGhlIHNlcXVlbmNlci4gSXQgZG9lcyB0aGUgcXVldWluZyBvZlxyXG4gKiBwYXJ0cyBhbmQgZXZlbnRzIGFuZCBydW5zIHRoZSBzY2hlZHVsZXJzIHRoYXQgZmlyZSBldmVudHNcclxuICogYW5kIGRyYXdzIHRvIHRoZSBzY3JlZW4uXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBwYXJ0ID0gbmV3IGludGVybWl4LlBhcnQoKTtcclxuICogdmFyIHNlcSA9IG5ldyBpbnRlcm1peC5TZXF1ZW5jZXIoKTtcclxuICogcGFydC5hZGRFdmVudChzb21lTm90ZSwgMCk7XHJcbiAqIHNlcS5hZGRQYXJ0KHBhcnQsIDApO1xyXG4gKiBzZXEuc3RhcnQoKTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgU2VxdWVuY2VyID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMuYnBtID0gMTIwOyAgICAgICAgICAgICAvL2JlYXRzIHBlciBtaW51dGVcclxuICB0aGlzLnJlc29sdXRpb24gPSA2NDsgICAgICAgLy9zaG9ydGVzdCBwb3NzaWJsZSBub3RlLiBZb3Ugbm9ybWFsbHkgZG9uJ3Qgd2FudCB0byB0b3VjaCB0aGlzLlxyXG4gIHRoaXMuaW50ZXJ2YWwgPSAxMDA7ICAgICAgICAvL3RoZSBpbnRlcnZhbCBpbiBtaWxpc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGdldHMgaW52b2tlZC5cclxuICB0aGlzLmxvb2thaGVhZCA9IDAuMzsgICAgICAgLy90aW1lIGluIHNlY29uZHMgdGhlIHNjaGVkdWxlciBsb29rcyBhaGVhZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9zaG91bGQgYmUgbG9uZ2VyIHRoYW4gaW50ZXJ2YWwuXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAgIC8vTGlzdCB3aXRoIGFsbCBwYXJ0cyBvZiB0aGUgc2NvcmVcclxuICB0aGlzLnJ1bnF1ZXVlID0gW107ICAgICAgICAgLy9saXN0IHdpdGggcGFydHMgdGhhdCBhcmUgcGxheWluZyBvciB3aWxsIGJlIHBsYXllZCBzaG9ydGx5XHJcblxyXG4gIHRoaXMudGltZVBlclN0ZXA7ICAgICAgICAgICAvL3BlcmlvZCBvZiB0aW1lIGJldHdlZW4gdHdvIHN0ZXBzXHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwOyAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIG5leHQgc3RlcCB3aWxsIGJlIHRyaWdnZXJlZFxyXG4gIHRoaXMubmV4dFN0ZXAgPSAwOyAgICAgICAgICAvL3Bvc2l0aW9uIGluIHRoZSBxdWV1ZSB0aGF0IHdpbGwgZ2V0IHRyaWdnZXJlZCBuZXh0XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IDA7ICAgIC8vc3RlcCBpbiBxdWV1ZSB0aGF0IHdhcyBwbGF5ZWQgKG5vdCB0cmlnZ2VyZWQpIHJlY2VudGx5ICh1c2VkIGZvciBkcmF3aW5nKS5cclxuICB0aGlzLmxvb3AgPSBmYWxzZTsgICAgICAgICAgLy9wbGF5IGEgc2VjdGlvbiBvZiB0aGUgcXVldWUgaW4gYSBsb29wXHJcbiAgdGhpcy5sb29wU3RhcnQ7ICAgICAgICAgICAgIC8vZmlyc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMubG9vcEVuZDsgICAgICAgICAgICAgICAvL2xhc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7ICAgICAvL3RydWUgaWYgc2VxdWVuY2VyIGlzIHJ1bm5pbmcsIG90aGVyd2lzZSBmYWxzZVxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWU7ICAgICAgICAvL2hhcyB0byBiZSBvdmVycmlkZGVuIHdpdGggYSBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgaW4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJhdyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0UGxheWVkU3RlcCBpbnQgYXMgcGFyYW1ldGVyLlxyXG5cclxuICAvLyBzZXQgdGltZSBwZXIgc2V0VGltZVBlclN0ZXBcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcCh0aGlzLmJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSB0aGUgc2NoZWR1bGVyLXRpbWVyXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlciA9IHdvcmsod29ya2VyKTtcclxuXHJcbiAgLyplc2xpbnQtZW5hYmxlICovXHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3RpY2snKSB7XHJcbiAgICAgIHNlbGYuc2NoZWR1bGVyKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSh7J2ludGVydmFsJzogdGhpcy5pbnRlcnZhbH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGV2ZW50cyBmcm9tIHRoZSBtYXN0ZXIgcXVldWUgYW5kIGZpcmVzIHRoZW0uXHJcbiAqIEl0IGdldHMgY2FsbGVkIGF0IGEgY29uc3RhbnQgcmF0ZSwgbG9va3MgYWhlYWQgaW5cclxuICogdGhlIHF1ZXVlIGFuZCBmaXJlcyBhbGwgZXZlbnRzIGluIHRoZSBuZWFyIGZ1dHVyZVxyXG4gKiB3aXRoIGEgZGVsYXkgY29tcHV0ZWQgZnJvbSB0aGUgY3VycmVudCBicG0gdmFsdWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBsaW1pdCA9IGNvcmUuY3VycmVudFRpbWUgKyB0aGlzLmxvb2thaGVhZDtcclxuICAvLyBpZiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZSBvciBwcmV2aW91c2x5IHN0b3BwZWRcclxuICBpZiAodGhpcy5uZXh0U3RlcFRpbWUgPT09IDApIHtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIHdoaWxlICh0aGlzLm5leHRTdGVwVGltZSA8IGxpbWl0KSB7XHJcbiAgICB0aGlzLmFkZFBhcnRzVG9SdW5xdWV1ZSgpO1xyXG4gICAgdGhpcy5maXJlRXZlbnRzKCk7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSArPSB0aGlzLnRpbWVQZXJTdGVwO1xyXG5cclxuICAgIHRoaXMuc2V0UXVldWVQb2ludGVyKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvb2tzIGluIHRoZSBtYXN0ZXIgcXVldWUgZm9yIHBhcnRzIGFuZCBhZGRzXHJcbiAqIGNvcGllcyBvZiB0aGVtIHRvIHRoZSBydW5xdWV1ZS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydHNUb1J1bnF1ZXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHR5cGVvZiB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgaWYgKHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0ubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHZhciBwYXJ0ID0gdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXVswXTtcclxuICAgICAgcGFydC5wb2ludGVyID0gMDtcclxuICAgICAgdGhpcy5ydW5xdWV1ZS5wdXNoKHBhcnQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcclxuICAgICAgICBwYXJ0LnBvaW50ZXIgPSAwO1xyXG4gICAgICAgIHRoaXMucnVucXVldWUucHVzaChwYXJ0KTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlbGV0ZXMgcGFydHMgZnJvbSBydW5xdWV1ZS4gSXQgaXMgaW1wb3J0YW50LCB0aGF0IHRoZSBpbmRpY2VzXHJcbiAqIG9mIHRoZSBwYXJ0cyBhcmUgc29ydGVkIGZyb20gbWF4IHRvIG1pbi4gT3RoZXJ3aXNlIHRoZSBmb3JFYWNoXHJcbiAqIGxvb3Agd29uJ3Qgd29yay5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IGluZGljZXMgIEluZGljZXMgb2YgdGhlIHBhcnRzIGluIHRoZSBydW5xdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kZWxldGVQYXJ0c0Zyb21SdW5xdWV1ZSA9IGZ1bmN0aW9uKGluZGljZXMpIHtcclxuICBpZiAoaW5kaWNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBpbmRpY2VzLmZvckVhY2goZnVuY3Rpb24oaWQpIHtcclxuICAgICAgZGVsZXRlIHRoaXMucnVucXVldWVbaWRdLnBvaW50ZXI7XHJcbiAgICAgIHRoaXMucnVucXVldWUuc3BsaWNlKGlkLCAxKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaXJlcyBhbGwgZXZlbnRzIGZvciB0aGUgdXBjb21taW5nIHN0ZXAuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmZpcmVFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbWFya0ZvckRlbGV0ZSA9IFtdO1xyXG4gIHRoaXMucnVucXVldWUuZm9yRWFjaChmdW5jdGlvbihwYXJ0LCBpbmRleCkge1xyXG4gICAgaWYgKHBhcnQucG9pbnRlciA9PT0gcGFydC5sZW5ndGggLSAxKSB7XHJcbiAgICAgIG1hcmtGb3JEZWxldGUudW5zaGlmdChpbmRleCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgc2VxRXZlbnRzID0gcGFydC5wYXR0ZXJuW3BhcnQucG9pbnRlcl07XHJcbiAgICAgIGlmIChzZXFFdmVudHMgJiYgc2VxRXZlbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQsIHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgfSBlbHNlIGlmIChzZXFFdmVudHMgJiYgc2VxRXZlbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50c1swXSwgdGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBwYXJ0LnBvaW50ZXIrKztcclxuICB9LCB0aGlzKTtcclxuICB0aGlzLmRlbGV0ZVBhcnRzRnJvbVJ1bnF1ZXVlKG1hcmtGb3JEZWxldGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludm9rZXMgdGhlIGFwcHJvcHJpYXRlIHN1YnN5c3RlbSB0byBwcm9jZXNzIHRoZSBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgdG8gcHJvY2Vzc1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGRlbGF5ICAgICB0aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgZXZlbnQgc2hvdWxkIHN0YXJ0XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBkZWxheSkge1xyXG4gIGlmIChkZWxheSkge1xyXG4gICAgc2VxRXZlbnQucHJvcHNbJ2RlbGF5J10gPSBkZWxheTtcclxuICB9XHJcbiAgc2VxRXZlbnQucHJvcHMuaW5zdHJ1bWVudC5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHBvaW50ZXIgdG8gdGhlIG5leHQgc3RlcCB0aGF0IHNob3VsZCBiZSBwbGF5ZWRcclxuICogaW4gdGhlIG1hc3RlciBxdWV1ZS4gSWYgd2UncmUgcGxheWluZyBpbiBsb29wIG1vZGUsXHJcbiAqIGp1bXAgYmFjayB0byBsb29wc3RhcnQgd2hlbiBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gKiBJZiBhIHBvaW50ZXIgcG9zaXRpb24gaXMgZ2l2ZW4sIGp1bXAgdG8gaXQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAgIHtJbnR9ICAgcG9zaXRpb24gIE5ldyBwb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRRdWV1ZVBvaW50ZXIgPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gIGlmICh0eXBlb2YgcG9zaXRpb24gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwID0gcG9zaXRpb247XHJcbiAgICB0aGlzLnJ1bnF1ZXVlID0gW107XHJcbiAgfSBlbHNlIGlmICh0aGlzLmxvb3AgJiYgdGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgIHRoaXMucnVucXVldWUgPSBbXTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHF1ZXVlIHBvaW50ZXIgKHNldCB0byBwb3NpdGlvbiAwKS5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVzZXRRdWV1ZVBvaW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNldFF1ZXVlUG9pbnRlcigwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgdGhlIHNlcXVlbmNlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICghdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAgICB0aGlzLmlzUnVubmluZyA9IHRydWU7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgdGhlIHNlcXVlbmNlciAoaGFsdHMgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24pXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgdGhlIHNlcXVlbmNlciBhbmQgc3VzcGVuZHMgdGhlIEF1ZGlvQ29udGV4dCB0b1xyXG4gKiBnbG9iYWxseSBoYWx0IGFsbCBhdWRpbyBzdHJlYW1zLiBJdCBqdXN0IGhhbHRzIGlmXHJcbiAqIGlmIHNlcXVlbmNlciBhbmQgQXVkaW9Db250ZXh0IGJvdGggYXJlIGluIHJ1bm5pbmcgc3RhdGUuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgaGFsdGVkLCBmYWxzZSBpZiBub3RcclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoY29yZS5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIHRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB0aGlzLnN0b3AoKTtcclxuICAgIGNvcmUuc3VzcGVuZCgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzdW1lcyB0aGUgQXVkaW9Db250ZXh0IGFuZCBzdGFydHMgdGhlIHNlcXVlbmNlciBhdCBpdHNcclxuICogY3VycmVudCBwb3NpdGlvbi4gSXQganVzdCBzdGFydHMgaWYgc2VxdWVuY2VyIGFuZCBBdWRpb0NvbnRleHRcclxuICogYm90aCBhcmUgc3RvcHBlZC5cclxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiByZXN1bWVkLCBmYWxzZSBpZiBub3RcclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKGNvcmUuc3RhdGUgPT09ICdzdXNwZW5kZWQnICYmICF0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zdGFydCgpO1xyXG4gICAgY29yZS5yZXN1bWUoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNjaGVkdWxlciB0aGF0IHJ1bnMgYSBkcmF3aW5nIGZ1bmN0aW9uIGV2ZXJ5IHRpbWVcclxuICogdGhlIHNjcmVlbiByZWZyZXNoZXMuIFRoZSBmdW5jdGlvbiBTZXF1ZW5jZXIuYW5pbWF0aW9uRnJhbWUoKVxyXG4gKiBoYXMgdG8gYmUgb3ZlcnJpZGRlbiBieSB0aGUgYXBwbGljYXRpb24gd2l0aCBzdHVmZiB0byBiZSBkcmF3biBvbiB0aGUgc2NyZWVuLlxyXG4gKiBJdCBjYWxscyBpdHNlbGYgcmVjdXJzaXZlbHkgb24gZXZlcnkgZnJhbWUgYXMgbG9uZyBhcyB0aGUgc2VxdWVuY2VyIGlzIHJ1bm5pbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcclxuICAvLyBmaXJzdCB3ZSdsbCBoYXZlIHRvIGZpbmQgb3V0LCB3aGF0IHN0ZXAgd2FzIHBsYXllZCByZWNlbnRseS5cclxuICAvLyB0aGlzIGlzIHNvbWVob3cgY2x1bXN5IGJlY2F1c2UgdGhlIHNlcXVlbmNlciBkb2Vzbid0IGtlZXAgdHJhY2sgb2YgdGhhdC5cclxuICB2YXIgbG9va0FoZWFkRGVsdGEgPSB0aGlzLm5leHRTdGVwVGltZSAtIGNvcmUuY3VycmVudFRpbWU7XHJcbiAgaWYgKGxvb2tBaGVhZERlbHRhID49IDApIHtcclxuICAgIHZhciBzdGVwc0FoZWFkID0gTWF0aC5yb3VuZChsb29rQWhlYWREZWx0YSAvIHRoaXMudGltZVBlclN0ZXApO1xyXG5cclxuICAgIGlmICh0aGlzLm5leHRTdGVwIDwgc3RlcHNBaGVhZCkge1xyXG4gICAgICAvLyB3ZSBqdXN0IGp1bXBlZCB0byB0aGUgc3RhcnQgb2YgYSBsb29wXHJcbiAgICAgIHRoaXMubGFzdFBsYXllZFN0ZXAgPSB0aGlzLmxvb3BFbmQgKyB0aGlzLm5leHRTdGVwIC0gc3RlcHNBaGVhZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubGFzdFBsYXllZFN0ZXAgPSB0aGlzLm5leHRTdGVwIC0gc3RlcHNBaGVhZDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnVwZGF0ZUZyYW1lKHRoaXMubGFzdFBsYXllZFN0ZXApO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUnVucyBiZXR3ZWVuIHNjcmVlbiByZWZyZXNoLiBIYXMgdG8gYmUgb3ZlcnJpZGRlbiBieSB0aGVcclxuICogYXBwIHRvIHJlbmRlciB0byB0aGUgc2NyZWVuLlxyXG4gKiBAcGFyYW0gIHtJbnR9ICBsYXN0UGxheWVkU3RlcCAgVGhlIDY0dGggc3RlcCB0aGF0IHdhcyBwbGF5ZWQgcmVjZW50bHlcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUudXBkYXRlRnJhbWUgPSBmdW5jdGlvbihsYXN0UGxheWVkU3RlcCkge1xyXG4gIGNvbnNvbGUubG9nKGxhc3RQbGF5ZWRTdGVwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgcGFydCB0byB0aGUgbWFzdGVyIHF1ZXVlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcnQgICAgICBBbiBpbnN0YW5jZSBvZiBQYXJ0XHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBhcnQubGVuZ3RoICYmIHBhcnQucGF0dGVybikge1xyXG4gICAgaWYgKCF0aGlzLnF1ZXVlW3Bvc2l0aW9uXSkge1xyXG4gICAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXSA9IFtdO1xyXG4gICAgfVxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ucHVzaChwYXJ0KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBwYXJhbWV0ZXIgZG9lc25cXCd0IHNlZW0gdG8gYmUgYSBwYXJ0IG9iamVjdCcpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgcGFydCBvYmplY3QgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gcGFydCAgICAgUGFydCBpbnN0YW5jZSB0byBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gUG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZW1vdmVQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAodGhpcy5xdWV1ZVtwb3NpdGlvbl0gaW5zdGFuY2VvZiBBcnJheSAmJlxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ubGVuZ3RoID4gMCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5xdWV1ZVtwb3NpdGlvbl0uaW5kZXhPZihwYXJ0KTtcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnNwbGljZShpbmRleCwgMSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUGFydCBub3QgZm91bmQgYXQgcG9zaXRpb24gJyArIHBvc2l0aW9uICsgJy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgIGJwbSBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldEJwbSA9IGZ1bmN0aW9uKGJwbSkge1xyXG4gIHRoaXMuYnBtID0gYnBtO1xyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKGJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlcyB0aGUgdGltZSBpbiBzZWNvbmRzIGFzIGZsb2F0IHZhbHVlXHJcbiAqIGJldHdlZW4gb25lIHNob3J0ZXN0IHBvc3NzaWJsZSBub3RlXHJcbiAqICg2NHRoIGJ5IGRlZmF1bHQpIGFuZCB0aGUgbmV4dC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBicG0gICAgICAgIGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgICByZXNvbHV0aW9uIHNob3J0ZXN0IHBvc3NpYmxlIG5vdGUgdmFsdWVcclxuICogQHJldHVybiB7ZmxvYXR9ICAgICAgICAgICAgIHRpbWUgaW4gc2Vjb25kc1xyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZ2V0TGFzdFBsYXllZFN0ZXAgPSBmdW5jdGlvbigpIHtcclxuXHJcbn07XHJcblxyXG4vKipcclxuICogTWFrZXMgYSBjb3B5IG9mIGEgZmxhdCBhcnJheS5cclxuICogVXNlcyBhIHByZS1hbGxvY2F0ZWQgd2hpbGUtbG9vcFxyXG4gKiB3aGljaCBzZWVtcyB0byBiZSB0aGUgZmFzdGVkIHdheVxyXG4gKiAoYnkgZmFyKSBvZiBkb2luZyB0aGlzOlxyXG4gKiBodHRwOi8vanNwZXJmLmNvbS9uZXctYXJyYXktdnMtc3BsaWNlLXZzLXNsaWNlLzExM1xyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gc291cmNlQXJyYXkgQXJyYXkgdGhhdCBzaG91bGQgYmUgY29waWVkLlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQ29weSBvZiB0aGUgc291cmNlIGFycmF5LlxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5jb3B5QXJyYXkgPSBmdW5jdGlvbihzb3VyY2VBcnJheSkge1xyXG4gIHZhciBkZXN0QXJyYXkgPSBuZXcgQXJyYXkoc291cmNlQXJyYXkubGVuZ3RoKTtcclxuICB2YXIgaSA9IHNvdXJjZUFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAoaS0tKSB7XHJcbiAgICBkZXN0QXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcclxuICB9XHJcbiAgcmV0dXJuIGRlc3RBcnJheTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VxdWVuY2VyO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxuLyoqXHJcbiAqIDxwPlxyXG4gKiBQbGF5IGEgc291bmQgdGhhdCBjYW4gYmUgbG9vcGVkLiBQYXVzZS9TdGFydCB3b3JrcyBzYW1wbGUtYWNjdXJhdGVcclxuICogYXQgYW55IHJhdGUuIEhpdCB0aGUgc3RhcnQgYnV0dG9uIG11bHRpcGxlIHRpbWVzIHRvIGhhdmUgbXVsdGlwbGVcclxuICogc291bmRzIHBsYXllZC4gQWxsIHBhcmFtZXRlcnMgYXJlIGFkanVzdGFibGUgaW4gcmVhbHRpbWUuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2F1ZGlvZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnN0YXJ0KCk7XHJcbiAqIEB0dXRvcmlhbCBTb3VuZFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7T2JqZWN0fSBzb3VuZFdhdmUgU291bmRXYXZlIG9iamVjdCBpbmNsdWRpbmcgdGhlIGJ1ZmZlciB3aXRoIGF1ZGlvIGRhdGEgdG8gYmUgcGxheWVkXHJcbiAqL1xyXG52YXIgU291bmQgPSBmdW5jdGlvbihzb3VuZFdhdmUpIHtcclxuXHJcbiAgdGhpcy53YXZlID0gbnVsbDtcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgIC8vYWxsIGN1cnJlbnRseSBhY3RpdmUgc3RyZWFtc1xyXG4gIHRoaXMubG9vcCA9IGZhbHNlO1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBudWxsO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IG51bGw7XHJcblxyXG4gIHRoaXMuc291bmRMZW5ndGggPSAwO1xyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0cyA9IFtdOyAgIC8vaG9sZHMgc3RhcnQgb2Zmc2V0cyBpZiBwYXVzZWRcclxuICB0aGlzLnN0YXJ0VGltZSA9IDA7ICAgICAgIC8vd2hlbiB0aGUgc291bmQgc3RhcnRzIHRvIHBsYXlcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gbnVsbDtcclxuICB0aGlzLnBsYXliYWNrUmF0ZSA9IDE7XHJcbiAgdGhpcy5kZXR1bmUgPSAwO1xyXG5cclxuICBpZiAoc291bmRXYXZlKSB7XHJcbiAgICB0aGlzLndhdmUgPSBzb3VuZFdhdmU7XHJcbiAgICB0aGlzLnNvdW5kTGVuZ3RoID0gdGhpcy5sb29wRW5kID0gdGhpcy53YXZlLmJ1ZmZlci5kdXJhdGlvbjtcclxuICAgIHRoaXMuc2V0dXBBdWRpb0NoYWluKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgaW5pdGlhbGlzaW5nIFNvdW5kIG9iamVjdDogcGFyYW1ldGVyIG1pc3NpbmcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBnYWluIGFuZCBzdGVyZW8tcGFubmVyIG5vZGUsIGNvbm5lY3RzIHRoZW1cclxuICogKGdhaW4gLT4gcGFubmVyKSBhbmQgc2V0cyBnYWluIHRvIDEgKG1heCB2YWx1ZSkuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IGNvcmUuY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IGNvcmUuY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QoY29yZS5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgQnVmZmVyU291cmNlTm9kZVxyXG4gKiB0aGF0IGNhbiBiZSBwbGF5ZWQgb25jZSBhbmQgdGhlbiBkZXN0cm95cyBpdHNlbGYuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge0J1ZmZlclNvdXJjZU5vZGV9IFRoZSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSBjb3JlLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIC8vIGNvbnNvbGUubG9nKHRoaXMud2F2ZS5idWZmZXIpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLndhdmUuYnVmZmVyO1xyXG4gIGJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdvbmVuZGVkIGZpcmVkJyk7XHJcbiAgICBzZWxmLmRlc3Ryb3lCdWZmZXJTb3VyY2UoYnVmZmVyU291cmNlKTtcclxuICB9O1xyXG4gIHJldHVybiBidWZmZXJTb3VyY2U7XHJcbn07XHJcblxyXG4vKipcclxuICogRGVzdHJveWVzIGEgZ2l2ZW4gQXVkaW9CdWZmZXJTb3VyY2VOb2RlIGFuZCBkZWxldGVzIGl0XHJcbiAqIGZyb20gdGhlIHNvdXJjZU5vZGUgcXVldWUuIFRoaXMgaXMgdXNlZCBpbiB0aGUgb25lbmRlZFxyXG4gKiBjYWxsYmFjayBvZiBhbGwgQnVmZmVyU291cmNlTm9kZXMgdG8gYXZvaWQgZGVhZCByZWZlcmVuY2VzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtic05vZGV9IGJzTm9kZSB0aGUgYnVmZmVyU291cmNlIHRvIGJlIGRlc3Ryb3llZC5cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5kZXN0cm95QnVmZmVyU291cmNlID0gZnVuY3Rpb24oYnNOb2RlKSB7XHJcbiAgYnNOb2RlLmRpc2Nvbm5lY3QoKTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcclxuICAgIGlmIChub2RlID09PSBic05vZGUpIHtcclxuICAgICAgdGhpcy5xdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyBhIHNvdW5kIChBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIGFuZCBzdG9yZXMgYSByZWZlcmVuY2VzXHJcbiAqIGluIGEgcXVldWUuIFRoaXMgZW5hYmxlcyB5b3UgdG8gcGxheSBtdWx0aXBsZSBzb3VuZHMgYXQgb25jZVxyXG4gKiBhbmQgZXZlbiBzdG9wIHRoZW0gYWxsIGF0IGEgZ2l2ZW4gdGltZS5cclxuICogQHBhcmFtICB7Qm9vbGVhbn0gcGxheUxvb3BlZCBXaGV0aGVyIHRoZSBzb3VuZCBzaG91bGQgYmUgbG9vcGVkIG9yIG5vdFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkZWxheSAgICAgIFRpbWUgaW4gc2Vjb25kcyB0aGUgc291bmQgcGF1c2VzIGJlZm9yZSB0aGUgc3RyZWFtIHN0YXJ0c1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkdXJhdGlvbiAgIFRpbWUgcHJlcmlvZCBhZnRlciB0aGUgc3RyZWFtIHNob3VsZCBlbmRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKHBsYXlMb29wZWQsIGRlbGF5LCBkdXJhdGlvbikge1xyXG4gIGlmICh0aGlzLmlzUGF1c2VkICYmIHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgdGhpcy5yZXN1bWUoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHN0YXJ0VGltZSA9IDA7XHJcblxyXG4gICAgaWYgKGRlbGF5KSB7XHJcbiAgICAgIHN0YXJ0VGltZSA9IGRlbGF5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3RhcnRUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICAgIH1cclxuICAgIHZhciBicyA9IHRoaXMuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcblxyXG4gICAgaWYgKHBsYXlMb29wZWQpIHtcclxuICAgICAgYnMubG9vcCA9IHBsYXlMb29wZWQ7XHJcbiAgICAgIGJzLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgICBicy5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG4gICAgfVxyXG4gICAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gYnMudG1wUGxheWJhY2tSYXRlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgICBicy5kZXR1bmUudmFsdWUgPSB0aGlzLmRldHVuZTtcclxuICAgIGJzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTsgICAvLyBleHRlbmQgbm9kZSB3aXRoIGEgc3RhcnR0aW1lIHByb3BlcnR5XHJcblxyXG4gICAgdGhpcy5xdWV1ZS5wdXNoKGJzKTtcclxuICAgIGlmIChkdXJhdGlvbikge1xyXG4gICAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQsIGR1cmF0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW0sIGV2ZW4gdGhlIG9uZXMgdGhhdCBhcmUganVzdCBzY2hlZHVsZWQuXHJcbiAqIEl0IGFsc28gY2xlYW5zIHRoZSBxdWV1ZSBzbyB0aGF0IHRoZSBzb3VuZCBvYmplY3QgaXMgcmVhZHkgZm9yIGFub3RoZXIgcm91bmQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnN0b3AoKTtcclxuICAgIG5vZGUuZGlzY29ubmVjdCgpO1xyXG4gIH0pO1xyXG4gIHRoaXMucXVldWUgPSBbXTsgIC8vcmVsZWFzZSBhbGwgcmVmZXJlbmNlc1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW1zIG9mIHRoaXMgc291bmQgdGVtcG9yYXJpbHkuXHJcbiAqIFRoaXMgY3VycmVudGx5IGp1c3Qgd29ya3MgaW4gQ2hyb21lIDQ5KyBvbmx5LlxyXG4gKiBJZiB5b3Ugd2FudCBhIGdsb2JhbCwgYWNjdXJhdGUgcGF1c2UgZnVuY3Rpb25cclxuICogdXNlIHN1c3BlbmQvcmVzdW1lIGZyb20gdGhlIGNvcmUgbW9kdWxlLlxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICghdGhpcy5pc1BhdXNlZCkge1xyXG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgbm9kZS50bXBQbGF5YmFja1JhdGUgPSBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZTtcclxuICAgICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSAwLjA7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXN1bWVzIGFsbCBzdHJlYW1zIGlmIHRoZXkgd2VyZSBwYXVzZWQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gbm9kZS50bXBQbGF5YmFja1JhdGU7XHJcbiAgICBkZWxldGUgbm9kZS50bXBQbGF5YmFja1JhdGU7XHJcbiAgfSk7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFByb2Nlc3NlcyBhbiBldmVudCBmaXJlZCBieSB0aGUgc2VxdWVuY2VyLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50IEEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucHJvY2Vzc1NlcUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAvL3RoaXMuc2V0VG9uZShzZXFFdmVudC5wcm9wcy50b25lKTtcclxuICBpZiAoc2VxRXZlbnQucHJvcHMuZHVyYXRpb24pIHtcclxuICAgIHRoaXMuc3RhcnQoZmFsc2UsXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmRlbGF5LFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kdXJhdGlvbik7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMuc3RhcnQoZmFsc2UsXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmRlbGF5KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgc3RhcnRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3Agc3RhcnQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BTdGFydCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wU3RhcnQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBlbmRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3AgZW5kIGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wRW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wRW5kID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVsZWFzZXMgdGhlIGxvb3Agb2YgYWxsIHJ1bm5pbmcgbm9kZXMsXHJcbiAqIE5vZGVzIHdpbGwgcnVuIHVudGlsIGVuZCBhbmQgc3RvcC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZWxlYXNlTG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3AgPSBmYWxzZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHN0YXJ0IGFuZCBlbmRwb2ludCB0byBzdGFydCBlbmQgZW5kcG9pbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzZXRMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IHRoaXMuc291bmRMZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBzb3VuZCBpbiBwZXJjZW50YWdlXHJcbiAqICgxID0gMTAwJSwgMiA9IDIwMCUpXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgdmFsdWUgICBSYXRlIGluIHBlcmNlbnRhZ2VcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGVcclxuICogQHJldHVybiB7ZmxvYXR9ICBUaGUgcGxheWJhY2sgcmF0ZSBpbiBwZXJjZW50YWdlICgxLjI1ID0gMTI1JSlcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wbGF5YmFja1JhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSB0b25lIHdpdGhpbiB0d28gb2N0YXZlICgrLy0xMiB0b25lcylcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHNlbWkgdG9uZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFRvbmUgPSBmdW5jdGlvbihzZW1pVG9uZSkge1xyXG4gIGlmIChzZW1pVG9uZSA+PSAtMTIgJiYgc2VtaVRvbmUgPD0gMTIpIHtcclxuICAgIHRoaXMuZGV0dW5lID0gc2VtaVRvbmUgKiAxMDA7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignU2VtaSB0b25lIGlzICcgKyBzZW1pVG9uZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMi4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsYXN0IHBsYXllZCBzZW1pdG9uZS4gVGhpcyBkb2Vzbid0IGhhcyB0byBiZSBhblxyXG4gKiBpbnRlZ2VyIGJldHdlZW4gLS8rMTIgYXMgdGhlIHNvdW5kIGNhbiBiZSBkZXR1bmVkIHdpdGhcclxuICogbW9yZSBwcmVjaXNpb24uXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgU2VtaXRvbmUgYmV0d2VlbiAtLysxMlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmUgLyAxMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0dW5lIHRoZSBzb3VuZCBvc2NpbGxhdGlvbiBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICB2YWx1ZSAgZGV0dW5lIGluIGNlbnRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RGV0dW5lID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAodmFsdWUgPj0gLTEyMDAgJiYgdmFsdWUgPD0gMTIwMCkge1xyXG4gICAgdGhpcy5kZXR1bmUgPSB2YWx1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdEZXR1bmUgcGFyYW1ldGVyIGlzICcgKyB2YWx1ZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMjAwLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgdGhlIGN1cnJlbnQgZGV0dW5lIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHJldHVybiB7SW50ZWdlcn0gIERldHVuZSBpbiBjZW50c1xyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldERldHVuZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBpbiB1c2UgYW5kIGNhbiBwcm9iYWJseSBiZSByZW1vdmVkXHJcbiAqIEByZXR1cm4ge0ludH0gUmFuZG9tIG51bWJlclxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgaW4gd2hpY2ggYW4gYXVkaW8gYnVmZmVyIGxpdmVzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcgZWxzZS5cclxuICogSWYgeW91IHdhbnQgdG8gcGxheSB0aGUgc291bmQsIHlvdSBoYXZlIHRvIGFkZGl0aW9uYWxseSBjcmVhdGUgYVxyXG4gKiA8YSBocmVmPVwiU291bmQuaHRtbFwiPlNvdW5kPC9hPiBvYmplY3QuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIDwvcD48cD5cclxuICogTXVsdGlwbGUgc291cmNlcyB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIG9uZSBhdWRpbyBidWZmZXIuXHJcbiAqIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIGNyZWF0aW5nIG11bHRpcGxlIFNvdW5kV2F2ZSBvYmplY3RzLlxyXG4gKiBJdCdzIGxpa2UgYSB3YXZldGFibGU6IEFsbCBzdGFydC9lbmQgcG9zaXRpb25zIHdpbGwgYmUgc2F2ZWQgc29cclxuICogeW91IGNhbiB0cmlnZ2VyIHRoZSBvcmlnaW5hbCBzYW1wbGVzIHdpdGhvdXQgdXNpbmcgbXVsdGlwbGUgYnVmZmVycy5cclxuICogUG9zc2libGUgdXNhZ2VzIGFyZSBtdWx0aXNhbXBsZWQgc291bmRzLCBsb29wcyBvciB3YXZlc2VxdWVuY2VzIChraW5kIG9mKS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db25jYXRlbmF0ZSBtdWx0aXBsZSBzb3VyY2UgZmlsZXMgaW50byBvbmUgYnVmZmVyPGJyPlxyXG4gKiBpbiB0aGUgZ2l2ZW4gb3JkZXIgYW5kIHBsYXkgdGhlbSAoVGhpcyBpcyBicm9rZW4gaW4gdjAuMS4gRG9uJ3QgdXNlIGl0ISk6PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnZmlsZTEud2F2LGZpbGUyLndhdixmaWxlMy53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlxyXG4gKiBVc2luZyBBcnJheUJ1ZmZlcnMgaW5zdGVhZCBvZiBmaWxlbmFtZXMgd2lsbCBjb21lIGluIGhhbmR5IGlmIHlvdSB3YW50PGJyPlxyXG4gKiB0byBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIFhIUiBvciB1c2UgYSBwcmVsb2FkZXIgKGhlcmU6IHByZWxvYWQuanMpOlxyXG4gKiA8L2NhcHRpb24+XHJcbiAqIHZhciBxdWV1ZSA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKTtcclxuICogcXVldWUub24oJ2NvbXBsZXRlJywgaGFuZGxlQ29tcGxldGUpO1xyXG4gKiBxdWV1ZS5sb2FkTWFuaWZlc3QoW1xyXG4gKiAgICAge2lkOiAnc3JjMScsIHNyYzonZmlsZTEud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9LFxyXG4gKiAgICAge2lkOiAnc3JjMicsIHNyYzonZmlsZTIud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9XHJcbiAqIF0pO1xyXG4gKlxyXG4gKiBmdW5jdGlvbiBoYW5kbGVDb21wbGV0ZSgpIHtcclxuICogICAgIHZhciBiaW5EYXRhMSA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMScpO1xyXG4gKiAgICAgdmFyIGJpbkRhdGEyID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMyJyk7XHJcbiAqICAgICB2YXIgd2F2ZTEgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGExKTtcclxuICogICAgIHZhciB3YXZlMiA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTIpO1xyXG4gKiAgICAgdmFyIGNvbmNhdFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKFtiaW5EYXRhMSwgYmluRGF0YTJdKTtcclxuICogfTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAgeyhPYmplY3R8T2JqZWN0W118c3RyaW5nKX0gYXVkaW9TcmMgICBPbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqL1xyXG52YXIgU291bmRXYXZlID0gZnVuY3Rpb24oYXVkaW9TcmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJ1ZmZlciA9IGNvcmUuY3JlYXRlQnVmZmVyKDEsIDEsIGNvcmUuc2FtcGxlUmF0ZSk7ICAgLy9BdWRpb0J1ZmZlclxyXG4gIHRoaXMubWV0YURhdGEgPSBbXTsgICAvL3N0YXJ0LS9lbmRwb2ludHMgYW5kIGxlbmd0aCBvZiBzaW5nbGUgd2F2ZXNcclxuXHJcbiAgaWYgKHR5cGVvZiBhdWRpb1NyYyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuZGVjb2RlQXVkaW9EYXRhKHJlc3BvbnNlKTtcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgICAgICByZXR1cm4gc2VsZi5idWZmZXI7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIHR5cGVvZiBhdWRpb1NyY1swXSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgLy9tdWx0aXBsZSBmaWxlcyB0byBsb2FkL2RlY29kZSBhbmQgY2FuY2F0aW5hdGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmxvYWRNdWx0aXBsZUZpbGVzKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIEFycmF5QnVmZmVyIHRvIGRlY29kZVxyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuZGVjb2RlQXVkaW9EYXRhKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiBhdWRpb1NyY1swXSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgQXJyYXlCdWZmZXJzIHRvIGRlY29kZSBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgdGhpcy5kZWNvZGVBdWRpb1NvdXJjZXMoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oYXVkaW9CdWZmZXJzKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuam9pbkF1ZGlvQnVmZmVycyhhdWRpb0J1ZmZlcnMpO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbihmdW5jdGlvbihhdWRpb0J1ZmZlcikge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gYXVkaW9CdWZmZXI7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIFNvdW5kV2F2ZSBvYmplY3Q6IFVuc3VwcG9ydGVkIGRhdGEgZm9ybWF0Jyk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vc3RhcnQgdGhlIG9iamVjdCB3aXRoIGVtcHR5IGJ1ZmZlci4gVXNlZnVsbCBmb3IgdGVzdGluZyBhbmQgYWR2YW5jZWQgdXNhZ2UuXHJcbiAgfVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhbiBhcnJheSBvZiBmaWxlbmFtZXMgYW5kIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXNcclxuICogdG8gYW4gQXVkaW9CdWZmZXIgaW5jbHVkaW5nIHRoZSBQQ00gZGF0YSBvZiBhbGwgZmlsZXMgb24gc3VjY2Vzcy5cclxuICogUmV0dXJucyBhbiBlcnJvciBvbiBmYWlsdXJlLlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgZmlsZW5hbWVzIEFycmF5IHdpdGggZmlsZW5hbWVzIHRvIGJlIGxvYWRlZFxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgIFJlc29sdmVzIHRvIEF1ZGlvQnVmZmVyIG9yIHRocm93cyBlcnJvci5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZE11bHRpcGxlRmlsZXMgPSBmdW5jdGlvbih1cmxzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBmaWxlbmFtZXMgPSB0aGlzLnN0cmlwRmlsZW5hbWVzKHVybHMpO1xyXG5cclxuICByZXR1cm4gdGhpcy5sb2FkRmlsZXModXJscykudGhlbihmdW5jdGlvbihiaW5CdWZmZXJzKSB7XHJcbiAgICByZXR1cm4gc2VsZi5kZWNvZGVBdWRpb1NvdXJjZXMoYmluQnVmZmVycyk7XHJcbiAgfSlcclxuICAudGhlbihmdW5jdGlvbihhdWRpb0J1ZmZlcnMpIHtcclxuICAgIHZhciBwcm9taXNlcyA9IFtdO1xyXG4gICAgcHJvbWlzZXMucHVzaChzZWxmLmpvaW5BdWRpb0J1ZmZlcnMoYXVkaW9CdWZmZXJzKSxcclxuICAgICAgc2VsZi5zdG9yZU1ldGFEYXRhKGF1ZGlvQnVmZmVycywgZmlsZW5hbWVzKSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gIH0pXHJcbiAgLnRoZW4oZnVuY3Rpb24oYnVmZmVyQW5kTWV0YSkge1xyXG4gICAgc2VsZi5tZXRhRGF0YSA9IGJ1ZmZlckFuZE1ldGFbMV07XHJcbiAgICByZXR1cm4gYnVmZmVyQW5kTWV0YVswXTtcclxuICB9KVxyXG4gIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgIHRocm93IGVycjtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgYW5kIHJldHVybnMgYW4gZXF1YWwgbnVtYmVyIG9mIEF1ZGlvQnVmZmVycy5cclxuICogQHBhcmFtICB7QXJyYXl9ICAgIGJ1ZmZlcnMgQXJyYXkgd2l0aCBBcnJheUJ1ZmZlcnNcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgUmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2YgQXVkaW9CdWZmZXJzIG9yIGVycm9yXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvU291cmNlcyA9IGZ1bmN0aW9uKGJ1ZmZlcnMpIHtcclxuICB2YXIgcHJvbWlzZXMgPSBbXTtcclxuICBidWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyKSB7XHJcbiAgICBwcm9taXNlcy5wdXNoKHRoaXMuZGVjb2RlQXVkaW9EYXRhKGJ1ZmZlcikpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIEFycmF5QnVmZmVyIHdpdGggYmluYXJ5IGF1ZGlvIGRhdGEgYW5kXHJcbiAqIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogSnVzdCBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUmVzb2x2ZXMgdG8gQXVkaW9CdWZmZXIgb3IgZXJyb3JcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMpIHtcclxuICByZXR1cm4gY29yZS5kZWNvZGVBdWRpb0RhdGEocmF3QXVkaW9TcmMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEpvaW5zIGFuIGFyYml0cmFyeSBudW1iZXIgb2YgQXJyYXlCdWZmZXJzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgYnVmZmVycyBBcnJheSBvZiBBdWRpb0J1ZmZlcnNcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgV2F2ZWZvcm0gdGhhdCBpbmNsdWRlcyBhbGwgZ2l2ZW4gYnVmZmVycy5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuam9pbkF1ZGlvQnVmZmVycyA9IGZ1bmN0aW9uKGJ1ZmZlcnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGpvaW5lZEJ1ZmZlcjtcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYnVmZmVycykpIHtcclxuICAgICAgam9pbmVkQnVmZmVyID0gYnVmZmVyc1swXTtcclxuICAgICAgYnVmZmVycyA9IGJ1ZmZlcnMuc3BsaWNlKDAsIDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IGlzIG5vdCBvZiB0eXBlIEFycmF5JykpO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1ZmZlcnMuZm9yRWFjaChmdW5jdGlvbihidWZmZXIpIHtcclxuICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlciAmJlxyXG4gICAgICAgIGpvaW5lZEJ1ZmZlciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgICAgIGpvaW5lZEJ1ZmZlciA9IHRoaXMuYXBwZW5kQXVkaW9CdWZmZXIoam9pbmVkQnVmZmVyLCBidWZmZXIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdPbmUgb3IgbW9yZSBidWZmZXJzIGFyZSBub3Qgb2YgdHlwZSBBdWRpb0J1ZmZlci4nKSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHNlbGYpO1xyXG4gICAgcmVzb2x2ZShqb2luZWRCdWZmZXIpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIEJvdGggYnVmZmVycyBzaG91bGQgaGF2ZSB0aGUgc2FtZSBhbW91bnRcclxuICogb2YgY2hhbm5lbHMuIElmIG5vdCwgY2hhbm5lbHMgd2lsbCBiZSBkcm9wcGVkLiBGb3IgZXhhbXBsZSwgaWYgeW91XHJcbiAqIGFwcGVuZCBhIHN0ZXJlbyBhbmQgYSBtb25vIGJ1ZmZlciwgdGhlIG91dHB1dCB3aWxsIGJlIG1vbm8gYW5kIG9ubHlcclxuICogb25lIG9mIHRoZSBjaGFubmVscyBvZiB0aGUgc3RlcmVvIHNhbXBsZSB3aWxsIGJlIHVzZWQgKG5vIG1lcmdpbmcgb2YgY2hhbm5lbHMpLlxyXG4gKiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOjxicj5cclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDE0MzY1Mi93ZWItYXVkaW8tYXBpLWFwcGVuZC1jb25jYXRlbmF0ZS1kaWZmZXJlbnQtYXVkaW9idWZmZXJzLWFuZC1wbGF5LXRoZW0tYXMtb25lLXNvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMSBUaGUgZmlyc3QgYXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIyIFRoZSBzZWNvbmQgYXVkaW8gYnVmZmVyXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIGJ1ZmZlcjEgKyBidWZmZXIyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFwcGVuZEF1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyMSwgYnVmZmVyMikge1xyXG4gIGlmIChidWZmZXIxIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmXHJcbiAgYnVmZmVyMiBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgICAgKGJ1ZmZlcjEubGVuZ3RoICsgYnVmZmVyMi5sZW5ndGgpLFxyXG4gICAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgICAgdmFyIGNoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSk7XHJcbiAgICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdCdWZmZXI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ09uZSBvciBib3RoIGJ1ZmZlcnMgYXJlIG5vdCBvZiB0eXBlIEF1ZGlvQnVmZmVyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yZXMgbWV0YURhdGEgb2JqZWN0cyBpbiB0aGUgbWV0YURhdGEgYXJyYXkuXHJcbiAqIEBwYXJhbSAge0FycmF5fSBhdWRpb0J1ZmZlcnMgQXJyYXkgb2YgQXVkaW9CdWZmZXJzXHJcbiAqIEBwYXJhbSAge0FycmF5fSBuYW1lcyAgICAgICAgQXJyYXkgb2YgbmFtZXNcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICBSZXNvbHZlcyB0byBhIG1ldGFEYXRhIGFycmF5IG9yIGVycm9yLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5zdG9yZU1ldGFEYXRhID0gZnVuY3Rpb24oYXVkaW9CdWZmZXJzLCBuYW1lcykge1xyXG4gIHZhciBmbmFtZXMgPSBbXTtcclxuICB2YXIgbWV0YURhdGEgPSBbXTtcclxuICB2YXIgc3RhcnQgPSAwO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgaWYgKHR5cGVvZiBuYW1lcyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgYXVkaW9CdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyLCBpbmRleCkge1xyXG4gICAgICAgIGZuYW1lcy5wdXNoKCdmcmFnbWVudCcgKyBpbmRleCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChuYW1lcy5sZW5ndGggPT09IGF1ZGlvQnVmZmVycy5sZW5ndGgpIHtcclxuICAgICAgZm5hbWVzID0gbmFtZXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZWplY3QobmV3IEVycm9yKCdhdWRpb0J1ZmZlcnMgYW5kIG5hbWVzIHNob3VsZCBiZSBvZiBzYW1lIGxlbmd0aCcpKTtcclxuICAgIH1cclxuICAgIGF1ZGlvQnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlciwgaW5kZXgpIHtcclxuICAgICAgbWV0YURhdGEucHVzaCh0aGlzLmdldE1ldGFEYXRhKGJ1ZmZlciwgbmFtZXNbaW5kZXhdLCBzdGFydCkpO1xyXG4gICAgICBzdGFydCArPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgfSwgc2VsZik7XHJcbiAgICByZXNvbHZlKG1ldGFEYXRhKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdHJpcHMgZmlsZW5hbWVzIGZyb20gYW4gYXJyYXkgb2YgdXJscyBhbmQgcmV0dXJucyBpdCBpbiBhbiBhcnJheS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IHVybHMgQXJyYXkgb2YgdXJsc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICBBcnJheSBvZiBmaWxlbmFtZXNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc3RyaXBGaWxlbmFtZXMgPSBmdW5jdGlvbih1cmxzKSB7XHJcbiAgcmV0dXJuIHVybHMubWFwKGZ1bmN0aW9uKHVybCkge1xyXG4gICAgcmV0dXJuIHVybC5zcGxpdCgnLycpLnBvcCgpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcCBwb2ludHMgYW5kIGxlbmd0aCBpbiBzYW1wbGUtZnJhbWVzXHJcbiAqIG9mIGEgYnVmZmVyIGZyYWdtZW50Li5cclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlciAgICAgIEJ1ZmZlciB3aXRoIHRoZSBhcHBlbmRhYmxlIHBjbSBmcmFnbWVudFxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgbmFtZSAgICAgICAgTmFtZSBvZiB0aGUgZnJhZ21lbnRcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgIHN0YXJ0ICAgICAgIFN0YXJ0cG9pbnQgb2YgdGhlIGZyYWdtZW50XHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICBEaWN0aW9uYXJ5IHdpdGggbWV0YSBkYXRhIG9yIGVycm9yIG1zZ1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5nZXRNZXRhRGF0YSA9IGZ1bmN0aW9uKGJ1ZmZlciwgbmFtZSwgc3RhcnQpIHtcclxuICBpZiAoYnVmZmVyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgc3RhcnQgPSAwO1xyXG4gICAgfVxyXG4gICAgdmFyIGJ1Zkxlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAnbmFtZSc6IG5hbWUsXHJcbiAgICAgICdzdGFydCc6IHN0YXJ0LFxyXG4gICAgICAnZW5kJzogc3RhcnQgKyBidWZMZW5ndGggLSAxLFxyXG4gICAgICAnbGVuZ3RoJzogYnVmTGVuZ3RoXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgc2hvdWxkIGJlIG9mIHR5cGUgQXVkaW9CdWZmZXIgYW5kIFN0cmluZycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIChhdWRpbykgZmlsZSBhbmQgcmV0dXJucyBpdHMgZGF0YSBhcyBBcnJheUJ1ZmZlclxyXG4gKiB3aGVuIHRoZSBwcm9taXNlIGZ1bGZpbGxzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdXJsICAgICAgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICBBIHByb21pc2UgcmVwcmVzZW50aW5nIHRoZSB4aHIgcmVzcG9uc2VcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbih1cmwpIHtcclxuICByZXR1cm4gd2luZG93LmZldGNoKHVybClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmVyIGVycm9yLiBDb3VsZG5cXCd0IGxvYWQgZmlsZTogJyArIHVybCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIChhdWRpbykgZmlsZXMgYW5kIHJldHVybnMgYW4gYXJyYXlcclxuICogd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBmaWxlcyBpbiB0aGUgZ2l2ZW4gb3JkZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzIExpc3Qgd2l0aCBmaWxlbmFtZXNcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgQXJyYXkgb2YgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHZhciBwcm9taXNlcyA9IFtdO1xyXG4gIGZpbGVuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkRmlsZShuYW1lKSk7XHJcbiAgfSwgdGhpcyk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldCBhbiBBdWRpb0J1ZmZlciB3aXRoIGEgZnJhZ21lbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIG9mIHRoaXMgb2JqZWN0LlxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHN0YXJ0ICAgU3RhcnRwb2ludCBvZiB0aGUgZnJhZ21lbnQgaW4gc2FtcGxlc1xyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIGVuZCAgICAgRW5kcG9pbnQgb2YgdGhlIGZyYWdtZW50IGluIHNhbXBsZXNcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgIEF1ZGlvQnVmZmVyIGluY2x1ZGluZyB0aGUgZnJhZ21lbnRcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZ2V0QnVmZmVyRnJhZ21lbnQgPSBmdW5jdGlvbihzdGFydCwgZW5kKSB7XHJcbiAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBdWRpbyBidWZmZXIgZW1wdHkuIE5vdGhpbmcgdG8gY29weS4nKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcclxuICB9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xyXG4gICAgc3RhcnQgPSAwO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBlbmQgPT09ICd1bmRlZmluZWQnIHx8IGVuZCA+IHRoaXMuYnVmZmVyLmxlbmd0aCkge1xyXG4gICAgZW5kID0gdGhpcy5idWZmZXIubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBcmd1bWVudHMgb3V0IG9mIGJvdW5kcy4nKTtcclxuICB9XHJcblxyXG4gIHZhciBjaG5Db3VudCA9IHRoaXMuYnVmZmVyLm51bWJlck9mQ2hhbm5lbHM7XHJcbiAgdmFyIGZyYW1lQ291bnQgPSBlbmQgLSBzdGFydDtcclxuICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIoY2huQ291bnQsIGZyYW1lQ291bnQsIGNvcmUuc2FtcGxlUmF0ZSk7XHJcblxyXG4gIGZvciAodmFyIGNobiA9IDA7IGNobiA8IGNobkNvdW50OyBjaG4rKykge1xyXG4gICAgdmFyIG5ld0NoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2huKTtcclxuICAgIHZhciBvbGRDaGFubmVsID0gdGhpcy5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2huKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICBuZXdDaGFubmVsW2ldID0gb2xkQ2hhbm5lbFtzdGFydCArIGldO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ld0J1ZmZlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0IEFycmF5QnVmZmVycyB0aGUgc2FtZSBvcmRlciwgbGlrZSB0aGUgZmlsZW5hbWVcclxuICogcGFyYW1ldGVycy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgIEFycmF5IHdpdGggZmlsZW5hbWVzXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgYmluQnVmZmVycyBBcnJheSB3aXRoIEFycmF5QnVmZmVyXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBBcnJheSB3aXRoIHNvcnRlZCBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc29ydEJpbkJ1ZmZlcnMgPSBmdW5jdGlvbihmaWxlbmFtZXMsIGJpbkJ1ZmZlcnMpIHtcclxuICAvLyBmdXRpbGU/P1xyXG4gIHJldHVybiBmaWxlbmFtZXMubWFwKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICByZXR1cm4gYmluQnVmZmVyc1tlbF07XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kV2F2ZTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgdGhlIGZvdW5kYXRpb24gb2YgdGhlIEludGVybWl4IGxpYnJhcnkuXHJcbiAqIEl0IHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQgc28gaXQgY2FuIGJlIGVhc2lseSBjb25zdW1lZFxyXG4gKiBmcm9tIGFsbCBjbGFzc2VzIG9mIHRoZSBsaWJyYXJ5LlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtBdWRpb0NvbnRleHR9IFRoZSBBdWRpb0NvbnRleHQgb2JqZWN0XHJcbiAqXHJcbiAqIEB0b2RvIFNob3VsZCB3ZSBkbyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3Igb2xkZXIgYXBpLXZlcnNpb25zP1xyXG4gKiBAdG9kbyBDaGVjayBmb3IgbW9iaWxlL2lPUyBjb21wYXRpYmlsaXR5LlxyXG4gKiBAdG9kbyBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGVcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+U3VzcGVuZCBhbmQgcmVzdW1lIHRoZSBhdWRpbyBjb250ZXh0IHRvXHJcbiAqIGNyZWF0ZSBhIHBhdXNlIGJ1dHRvbi4gVGhpcyBzaG91bGQgYmUgdXNlZCB3aXRoIGNyZWF0ZUF1ZGlvV29ya2VyXHJcbiAqIGFzIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIHdoZW4gc3VzcGVuZCBpcyBjYWxsZWQgb24gYW4gb2ZmbGluZSBhdWRpbyBjb250ZXh0LlxyXG4gKiBZb3UgY2FuIGFsc28gcGF1c2Ugc2luZ2xlIHNvdW5kcyB3aXRoIDxpPlNvdW5kLnBhdXNlKCk8L2k+LlxyXG4gKiBQbGVhc2UgcmVhZCA8YSBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZGUvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dC9zdXNwZW5kXCI+dGhlIGRldmVsb3BlciBkb2NzIGF0IE1ETjwvYT5cclxuICogdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgdGhpcy48L2NhcHRpb24+XHJcbiAqIHN1c3Jlc0J0bi5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAqICAgaWYoSW50ZXJtaXguc3RhdGUgPT09ICdydW5uaW5nJykge1xyXG4gKiAgICAgSW50ZXJtaXguc3VzcGVuZCgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdSZXN1bWUgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9IGVsc2UgaWYgKEludGVybWl4LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xyXG4gKiAgICAgSW50ZXJtaXgucmVzdW1lKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1N1c3BlbmQgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9XHJcbiAqIH1cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG52YXIgaXNNb2JpbGUgPSB7XHJcbiAgJ0FuZHJvaWQnOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcclxuICB9LFxyXG4gICdpT1MnOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBob25lfGlQYWR8aVBvZC9pKTtcclxuICB9LFxyXG4gICdCbGFja0JlcnJ5JzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSk7XHJcbiAgfSxcclxuICAnT3BlcmEnOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvT3BlcmEgTWluaS9pKTtcclxuICB9LFxyXG4gIFdpbmRvd3M6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9JRU1vYmlsZS9pKSB8fFxyXG4gICAgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1dQRGVza3RvcC9pKTtcclxuICB9LFxyXG4gIGFueTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKGlzTW9iaWxlLkFuZHJvaWQoKSB8fFxyXG4gICAgaXNNb2JpbGUuaU9TKCkgfHxcclxuICAgIGlzTW9iaWxlLkJsYWNrQmVycnkoKSB8fFxyXG4gICAgaXNNb2JpbGUuT3BlcmEoKSB8fFxyXG4gICAgaXNNb2JpbGUuV2luZG93cygpKTtcclxuICB9XHJcbn07XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh0eXBlb2Ygd2luZG93LkF1ZGlvQ29udGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGF1ZGlvQ3R4ID0gbmV3IHdpbmRvdy5BdWRpb0NvbnRleHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZG5cXCd0IGluaXRpYWxpemUgdGhlIGF1ZGlvIGNvbnRleHQuJyk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXVkaW9DdHg7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBhYm91dCBqYXZhc2NyaXB0IGV2ZW50cyEgSXQncyBqdXN0XHJcbiAqIGEgZGVmaW5pdGlvbiBvZiB0aGUgZXZlbnRzIHRoYXQgdGhlIHNlcXVlbmNlciBjYW4gaGFuZGxlIHBsdXNcclxuICogc29tZSBmdW5jdGlvbnMgdG8gY3JlYXRlIHZhbGlkIGV2ZW50cy5cclxuICogVGhlIGNsYXNzIGRlZmluZXMgd2hpY2ggc3Vic3lzdGVtIGlzIGludm9rZWQgdG8gcHJvY2VzcyB0aGUgZXZlbnQuXHJcbiAqIEV2ZXJ5IGNsYXNzIGNhbiBoYXZlIHNldmVyYWwgdHlwZXMgYW5kIGEgdHlwZSBjb25zaXN0cyBvZiBvbmUgb3JcclxuICogbW9yZSBwcm9wZXJ0aWVzLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYSBub3RlIGV2ZW50IGZvciBhbiBhdWRpbyBvYmplY3Q8L2NhcHRpb24+XHJcbiAqIHZhciBub3RlID0gaW50ZXJtaXguZXZlbnRzLmNyZWF0ZUF1ZGlvTm90ZSgnYzMnLCA2NSwgMTI4LCBhU291bmRPYmplY3QpO1xyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgcHJvcGVydGllcyBpbiBvbmUgaGFuZHkgYXJyYXkuXHJcbiAqIEB0eXBlIHtBcnJheX1cclxuICovXHJcbnZhciBldlByb3AgPSBbXHJcbiAgJ2luc3RydW1lbnQnLCAvLyB0aGUgZXZlbnQgcmVjZWl2ZXJcclxuICAndG9uZScsICAgICAgIC8vIEludCBiZXR3ZWVuIDAgYW5kIDEyNyBiZWdpbm5pbmcgYXQgYzBcclxuICAnZHVyYXRpb24nLCAgIC8vIEludCByZXByZXNlbnRpbmcgYSBudW1iZXIgb2YgNjR0aCBub3Rlc1xyXG4gICd2ZWxvY2l0eScsICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAgJ3BpdGNoJyxcclxuICAndm9sdW1lJyxcclxuICAncGFuJ1xyXG5dO1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCB0eXBlcyBhbmQgdGhlIHByb3BlcnRpZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIFR5cGUgYXJlIHZhbGlkIHdpdGggb25lLCBzZXZlcmFsIG9yIGFsbCBvZiBpdHMgcHJvcGVydGllcy5cclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbnZhciBldlR5cGUgPSB7XHJcbiAgJ25vdGUnOiBbIGV2UHJvcFswXSwgZXZQcm9wWzFdLCBldlByb3BbMl0sIGV2UHJvcFszXSBdLFxyXG4gICdjb250cm9sJzogWyBldlByb3BbNF0sIGV2UHJvcFs1XSwgZXZQcm9wWzZdIF1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgY2xhc3NlcyBhbmQgdGhlIHR5cGVzIGFzc290aWF0ZWQgd2l0aCB0aGVtLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2Q2xhc3MgPSB7XHJcbiAgJ2F1ZGlvJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ3N5bnRoJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ2Z4JzogW10sXHJcbiAgJ21pZGknOiBbXSxcclxuICAnb3NjJzogW11cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIGNsYXNzIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlQ2xhc3MgRXZlbnQgY2xhc3NcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgY2xhc3MgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZUNsYXNzID0gZnVuY3Rpb24oZUNsYXNzKSB7XHJcbiAgaWYgKGV2Q2xhc3MuaGFzT3duUHJvcGVydHkoZUNsYXNzKSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSB0eXBlIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlVHlwZSBFdmVudCB0eXBlXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICB0cnVlIGlmIHR5cGUgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVR5cGUgPSBmdW5jdGlvbihlVHlwZSkge1xyXG4gIGlmIChldlR5cGUuaGFzT3duUHJvcGVydHkoZVR5cGUpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYW4gaW5zdHJ1bWVudCBpcyBhbiBvYmplY3QuXHJcbiAqIFRoaXMgaXMgYSBwb29ybHkgd2VhayB0ZXN0IGJ1dCB0aGF0J3NcclxuICogYWxsIHdlIGNhbiBkbyBoZXJlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGluc3RyIEFuIGluc3RydW1lbnQgb2JqZWN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgdHJ1ZSBpZiBpdCdzIGFuIG9iamVjdCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudCA9IGZ1bmN0aW9uKGluc3RyKSB7XHJcbiAgaWYgKHR5cGVvZiBpbnN0ciA9PT0gJ29iamVjdCcpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBpZiBhIHRvbmUgb3IgdmVsb2NpdHkgdmFsdWUgaXNcclxuICogYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDEyNy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7SW50fSAgdmFsdWUgICBUaGUgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyBhIHRvbmVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICBUcnVlIGlmIGl0cyBhIHZhbGlkIHRvbmUsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcFRvbmVWZWxvID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDEyNykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgZHVyYXRpb24gaXMgYSBwb3NpdGl2ZSBpbnRlZ2VyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIE51bWJlciByZXByZXNlbnRpbmcgbXVsdGlwbGUgNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgZHVyYXRpb24sIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcER1cmF0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgYW4gb2JqZWN0IG9mIGV2ZW50IHByb3BlcnRpZXMuXHJcbiAqIEl0IGNoZWNrcyB0aGUgcHJvcGVydGllcyBhcmUgdmFsaWQgZm9yIHRoZSBnaXZlbiB0eXBlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGVQcm9wcyAgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICAgRXZlbnQgdHlwZSB0byB2YWxpZGF0ZSBhZ2FpbnN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICB0cnVlIGlmIGFsbCBwcm9wcyBhcmUgdmFsaWQsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcHMgPSBmdW5jdGlvbihlUHJvcHMsIGVUeXBlKSB7XHJcbiAgdmFyIHR5cGUgPSBldlR5cGVbZVR5cGVdO1xyXG4gIGZvciAodmFyIGtleSBpbiBlUHJvcHMpICB7XHJcbiAgICBpZiAoZXZQcm9wLmluZGV4T2Yoa2V5KSA9PT0gLTEgJiZcclxuICAgIHR5cGUuaW5kZXhPZihrZXkpID09PSAtMSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGEgc3RyaW5nIG9mIHRoZSBmb3JtIGMzIG9yIGQjNCBhbmRcclxuICogcmV0dXJucyB0aGUgY29ycmVzcG9uZGluZyBudW1iZXIuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gdG9uZSBTdHJpbmcgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKiBAcmV0dXJuIHtJbnR9ICAgICAgICAgTnVtYmVyIHJlcHJlc2VudGluZyBhIG5vdGVcclxuICovXHJcbnZhciBjb252ZXJ0VG9uZSA9IGZ1bmN0aW9uKHRvbmUpIHtcclxuICB2YXIgbm90ZXMgPSBbJ2MnLCAnYyMnLCAnZCcsICdkIycsICdlJywgJ2YnLCAnZiMnLCAnZycsICdnIycsICdhJywgJ2EjJywgJ2InXTtcclxuICB2YXIgc3RyID0gdG9uZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICBpZiAoc3RyLm1hdGNoKC9eW2EtaF0jP1swLTldJC8pKSB7XHJcbiAgICB2YXIgbm90ZSA9IHN0ci5zdWJzdHJpbmcoMCwgc3RyLmxlbmd0aCAtIDEpO1xyXG4gICAgdmFyIG9jdCA9IHN0ci5zbGljZSgtMSk7XHJcblxyXG4gICAgaWYgKG5vdGUgPT09ICdoJykge1xyXG4gICAgICBub3RlID0gJ2InO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5vdGVzLmluZGV4T2Yobm90ZSkgKyBvY3QgKiAxMjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnZhbGlkIHN0cmluZy4gSGFzIHRvIGJlIGxpa2UgW2EtaF08Iz5bMC05XScpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgc2VxdWVuY2VyIGV2ZW50LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICBFdmVudCB0eXBlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzIE9iamVjdCB3aXRoIGV2ZW50IHByb3BlcnRpZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgU2VxdWVuY2VyIGV2ZW50XHJcbiAqL1xyXG52YXIgY3JlYXRlRXZlbnQgPSBmdW5jdGlvbihlQ2xhc3MsIGVUeXBlLCBlUHJvcHMpIHtcclxuICBpZiAodmFsaWRhdGVDbGFzcyhlQ2xhc3MpICYmXHJcbiAgICB2YWxpZGF0ZVR5cGUoZVR5cGUpICYmXHJcbiAgICB2YWxpZGF0ZVByb3BzKGVQcm9wcywgZVR5cGUpKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAnY2xhc3MnOiBlQ2xhc3MsXHJcbiAgICAgICd0eXBlJzogZVR5cGUsXHJcbiAgICAgICdwcm9wcyc6IGVQcm9wc1xyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY3JlYXRlIHNlcXVlbmNlciBldmVudC4gV3JvbmcgcGFyYW1ldGVycycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuIGF1ZGlvIG5vdGUgZXZlbnRcclxuICogQHBhcmFtICB7SW50fFN0cmluZ30gdG9uZSAgICAgVG9uZSBiZXR3ZWVuIDAgYW5kIDEyNyBvciBzdHJpbmcgKGMzLCBkIzQpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgICAgIHZlbG9jaXR5IFZlbG9jaXR5IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAqIEBwYXJhbSAge0ludH0gICAgICAgIGR1cmF0aW9uIER1cmF0aW9uIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgQWxsIHByb3BlcnRpZXMgaW4gb25lIG9iamVjdFxyXG4gKi9cclxudmFyIGNyZWF0ZUF1ZGlvTm90ZSA9IGZ1bmN0aW9uKHRvbmUsIHZlbG9jaXR5LCBkdXJhdGlvbiwgaW5zdHIpIHtcclxuICB2YXIgcHJvcHMgPSB7fTtcclxuICBpZiAodHlwZW9mIHRvbmUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICB0b25lID0gY29udmVydFRvbmUodG9uZSk7XHJcbiAgfVxyXG4gIGlmICh0b25lICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHRvbmUpKSB7XHJcbiAgICBwcm9wcy50b25lID0gdG9uZTtcclxuICB9XHJcbiAgaWYgKHZlbG9jaXR5ICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHZlbG9jaXR5KSkge1xyXG4gICAgcHJvcHMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcclxuICB9XHJcbiAgaWYgKGR1cmF0aW9uICYmIHZhbGlkYXRlUHJvcER1cmF0aW9uKGR1cmF0aW9uKSkge1xyXG4gICAgcHJvcHMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICB9XHJcbiAgaWYgKGluc3RyICYmIHZhbGlkYXRlUHJvcEluc3RydW1lbnQoaW5zdHIpKSB7XHJcbiAgICBwcm9wcy5pbnN0cnVtZW50ID0gaW5zdHI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQSBzZXF1ZW5jZXIgZXZlbnQgbXVzdCBoYXZlIGFuIGluc3RydW1lbnQgYXMgcHJvcGVydHknKTtcclxuICB9XHJcbiAgcmV0dXJuIGNyZWF0ZUV2ZW50KCdhdWRpbycsICdub3RlJywgcHJvcHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgY2xhc3M6IGV2Q2xhc3MsXHJcbiAgdHlwZTogZXZUeXBlLFxyXG4gIHByb3BlcnR5OiBldlByb3AsXHJcbiAgY3JlYXRlQXVkaW9Ob3RlOiBjcmVhdGVBdWRpb05vdGVcclxufTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgYSB3ZWJ3b3JrZXIgdGhhdCBwcm92aWRlcyBhIHRpbWVyXHJcbiAqIHRoYXQgZmlyZXMgdGhlIHNjaGVkdWxlciBmb3IgdGhlIHNlcXVlbmNlci5cclxuICogVGhpcyBpcyBiZWNhdXNlIHRpbWluZyBoZXJlIGlzICBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+SXQgaXMganVzdCBmb3IgbGlicmFyeSBpbnRlcm5hbFxyXG4gKiB1c2FnZS4gU2VlIFNlcXVlbmNlci5qcyBmb3IgZGV0YWlscy48L2NhcHRpb24+XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSh7ICdpbnRlcnZhbCc6IDIwMCB9KTtcclxuICogd29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICogd29ya2VyLnRlcm1pbmF0ZSgpOyAgLy93ZWJ3b3JrZXIgaW50ZXJuYWwgZnVuY3Rpb24sIGp1c3QgZm9yIGNvbXBsZXRlbmVzc1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRpbWVyID0gbnVsbDtcclxudmFyIGludGVydmFsID0gMTAwO1xyXG5cclxudmFyIHdvcmtlciA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAnc3RhcnQnKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhID09PSAnc3RvcCcpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4gICAgICBpbnRlcnZhbCA9IGUuZGF0YS5pbnRlcnZhbDtcclxuICAgICAgaWYgKHRpbWVyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtlcjtcclxuIl19
