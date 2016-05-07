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
  this.ac = core;       //currently just used for tests
  this.buffer = null;   //AudioBuffer
  this.metaData = [];   //start-/endpoints and length of single waves
  var self = this;

  if (typeof audioSrc !== 'undefined') {
    if (typeof audioSrc === 'string') {
      //one file to load/decode
      this.buffer = this.loadFile(audioSrc).then(function(response) {
        return self.decodeAudioData(response);
      });
    } else if (audioSrc instanceof Array && typeof audioSrc[0] === 'string') {
      //multiple files to load/decode and cancatinate
      this.buffer = this.loadMultipleFiles(audioSrc);
    } else if (audioSrc instanceof ArrayBuffer) {
      //one ArrayBuffer to decode
      this.buffer = this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple ArrayBuffers to decode and concatenate
      this.decodeAudioSources(audioSrc).then(function(audioBuffers) {
        return this.joinAudioBuffers(audioBuffers);
      })
      .then(function(audioBuffer) {
        this.buffer = audioBuffer;
      });
    } else {
      throw new Error('Cannot create SoundWave object: Unsupported data format');
    }
  } else {
    //start the object with empty buffer. Usefull for testing and advanced usage.
  }

};

SoundWave.prototype.loadMultipleFiles = function(filenames) {
  this.loadFiles(filenames).then(function(binBuffers) {
    return this.decodeAudioSources(binBuffers);
  })
  .then(function(audioBuffers) {
    return this.joinAudioBuffers(audioBuffers);
  })
  .then(function(audioBuffer) {
    return audioBuffer;
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

  return Promise.all(promises).then(function(audioBuffers) {
    return audioBuffers;
  })
  .catch(function(err) {
    return err;
  });
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
  return core.decodeAudioData(rawAudioSrc).then(function(decoded) {
    return decoded;
  })
  .catch(function(err) {
    return err;
  });
};

/**
 * Joins an arbitrary number of ArrayBuffers.
 * @private
 * @param  {Array}       buffers Array of AudioBuffers
 * @return {AudioBuffer}         Waveform that includes all given buffers.
 */
SoundWave.prototype.joinAudioBuffers = function(buffers) {
  var self = this;
  var joinedBuffer = core.createBuffer(1, 0, core.sampleRate);

  return new Promise(function(resolve, reject) {
    buffers.forEach(function(buffer) {
      if (buffer instanceof window.AudioBuffer) {
        joinedBuffer = this.appendAudioBuffer(joinedBuffer, buffer);
        this.metaData.push(this.createMetaData(joinedBuffer, buffer));
      } else {
        reject(new Error('One or more buffers are not of type AudioBuffer.'));
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
    // console.log('sedf');
    throw new Error('One or both buffers are not of type AudioBuffer.');
  }
};

/**
 * Creates a dictionary with start/stop points and length in sample-frames
 * of a buffer fragment..
 * @param  {AudioBuffer} buffer      Buffer with the appendable pcm fragment
 * @param  {AudioBuffer} predecessor Preceding buffer
 * @return {Object}                  Dictionary with meta data or error msg
 */
SoundWave.prototype.getMetaData = function(buffer, predecessor) {
  if (buffer instanceof window.AudioBuffer &&
  predecessor instanceof window.AudioBuffer) {
    var preLength = predecessor.length;
    var bufLength = buffer.length;
    return {
      'start': preLength,
      'end': preLength + bufLength - 1,
      'length': bufLength
    };
  } else {
    return { 'errorMsg': 'One or both arguments are not of type AudioBuffer' };
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
    })
    .then(function(buffer) {
      return buffer;
    })
    .catch(function(err) {
      return err;
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

  return Promise.all(promises).then(function(binBuffers) {
    return binBuffers;
  })
  .catch(function(err) {
    return err;
  });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy9pbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKSB8fCB7fTtcclxuaW50ZXJtaXguZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcclxuaW50ZXJtaXguU291bmRXYXZlID0gcmVxdWlyZSgnLi9Tb3VuZFdhdmUuanMnKTtcclxuaW50ZXJtaXguU291bmQgPSByZXF1aXJlKCcuL1NvdW5kLmpzJyk7XHJcbmludGVybWl4LlNlcXVlbmNlciA9IHJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJyk7XHJcbmludGVybWl4LlBhcnQgPSByZXF1aXJlKCcuL1BhcnQuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW50ZXJtaXg7XHJcbiIsInZhciBidW5kbGVGbiA9IGFyZ3VtZW50c1szXTtcbnZhciBzb3VyY2VzID0gYXJndW1lbnRzWzRdO1xudmFyIGNhY2hlID0gYXJndW1lbnRzWzVdO1xuXG52YXIgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIgd2tleTtcbiAgICB2YXIgY2FjaGVLZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIHZhciBleHAgPSBjYWNoZVtrZXldLmV4cG9ydHM7XG4gICAgICAgIC8vIFVzaW5nIGJhYmVsIGFzIGEgdHJhbnNwaWxlciB0byB1c2UgZXNtb2R1bGUsIHRoZSBleHBvcnQgd2lsbCBhbHdheXNcbiAgICAgICAgLy8gYmUgYW4gb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgZXhwb3J0IGFzIGEgcHJvcGVydHkgb2YgaXQuIFRvIGVuc3VyZVxuICAgICAgICAvLyB0aGUgZXhpc3RpbmcgYXBpIGFuZCBiYWJlbCBlc21vZHVsZSBleHBvcnRzIGFyZSBib3RoIHN1cHBvcnRlZCB3ZVxuICAgICAgICAvLyBjaGVjayBmb3IgYm90aFxuICAgICAgICBpZiAoZXhwID09PSBmbiB8fCBleHAuZGVmYXVsdCA9PT0gZm4pIHtcbiAgICAgICAgICAgIHdrZXkgPSBrZXk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghd2tleSkge1xuICAgICAgICB3a2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgICAgIHZhciB3Y2FjaGUgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICAgICAgd2NhY2hlW2tleV0gPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlc1t3a2V5XSA9IFtcbiAgICAgICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZScsJ21vZHVsZScsJ2V4cG9ydHMnXSwgJygnICsgZm4gKyAnKShzZWxmKScpLFxuICAgICAgICAgICAgd2NhY2hlXG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBza2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG5cbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sIChcbiAgICAgICAgICAgIC8vIHRyeSB0byBjYWxsIGRlZmF1bHQgaWYgZGVmaW5lZCB0byBhbHNvIHN1cHBvcnQgYmFiZWwgZXNtb2R1bGVcbiAgICAgICAgICAgIC8vIGV4cG9ydHNcbiAgICAgICAgICAgICd2YXIgZiA9IHJlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpOycgK1xuICAgICAgICAgICAgJyhmLmRlZmF1bHQgPyBmLmRlZmF1bHQgOiBmKShzZWxmKTsnXG4gICAgICAgICkpLFxuICAgICAgICBzY2FjaGVcbiAgICBdO1xuXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICA7XG5cbiAgICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgICAgbmV3IEJsb2IoW3NyY10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSlcbiAgICApKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogUmVwcmVzZW50cyBhIHBhcnQgb2YgYSBzZXF1ZW5jZS4gSXQgY2FuIGJlXHJcbiAqIHVzZWQgaW4gbWFueSB3YXlzOlxyXG4gKiA8dWw+XHJcbiAqIDxsaT5BIHBhcnQgb2YgYSB0cmFjayBsaWtlIGluIHBpYW5vLXJvbGwgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDxsaT5BIHBhdHRlcm4gbGlrZSBpbiBzdGVwIHNlcXVlbmNlcnMsIGRydW0gY29tcHV0ZXJzIGFuZCB0cmFja2VyczwvbGk+XHJcbiAqIDxsaT5BIGxvb3AgbGlrZSBpbiBsaXZlIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8L3VsPlxyXG4gKiBUZWNobmljYWxseSBpdCBjYW4gc3RvcmUgYW55IHR5cGUgb2YgZXZlbnQgeW91ciBzeXN0ZW0gaXMgY2FwYWJsZSBvZi5cclxuICogVGhpcyBtZWFucyBpdCBpcyBub3QgbGltaXRlZCB0byBhdWRpbywgbWlkaSwgb3NjIG9yIGRteCBidXQgY2FuIGhvbGRcclxuICogYW55IHR5cGUgb2YgamF2YXNjcmlwdCBvYmplY3QuIEEgcG9zc2libGUgdXNlY2FzZSB3b3VsZCBiZSB0byB0cmlnZ2VyXHJcbiAqIHNjcmVlbiBldmVudHMgd2l0aCB0aGUgZHJhdyBmdW5jdGlvbiBvZiB0aGUgc2VxdWVuY2VyIG9iamVjdC5cclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZU9iamVjdCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHZhciBwYXJ0ID0gbmV3IGludGVybWl4LlBhcnQoKTtcclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdhMycsIDEsIDAsIHNvdW5kKTtcclxuICogcGFydC5hZGRFdmVudChub3RlLCAwKTtcclxuICogcGFydC5hZGRFdmVudChub3RlLCA0KTtcclxuICogc2VxLmFkZFBhcnQocGFydCwgMCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgICAgICBMZW5ndGggb2YgdGhlIHBhcnQgaW4gNjR0aCBub3RlcyAoZGVmYXVsdDogNjQpXHJcbiAqL1xyXG52YXIgUGFydCA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG5cclxuICB0aGlzLnJlc29sdXRpb24gPSAxNjsgLy8gKHJlc29sdXRpb24gKiBtdWx0aXBseSkgc2hvdWxkIGFsd2FzeSBiZSA2NFxyXG4gIHRoaXMubXVsdGlwbHkgPSA0OyAgICAvLyByZXNvbHV0aW9uIG11bHRpcGxpZXJcclxuICB0aGlzLmxlbmd0aCA9IDY0OyAgICAgLy8gbGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIGluIDY0dGggbm90ZXNcclxuICB0aGlzLm5hbWUgPSAnUGFydCc7ICAgLy8gbmFtZSBvZiB0aGlzIHBhcnRcclxuICB0aGlzLnBhdHRlcm4gPSBbXTsgICAgLy8gdGhlIGFjdHVhbCBwYXR0ZXJuIHdpdGggbm90ZXMgZXRjLlxyXG5cclxuICBpZiAobGVuZ3RoKSB7XHJcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICB9XHJcblxyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMuaW5pdFBhdHRlcm4odGhpcy5sZW5ndGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgYW4gZW1wdHkgcGF0dGVybiBmb3IgdGhlIHBhcnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICBMZW5ndGggb2YgdGhlIHBhdHRlcm4gbWVzdXJlZCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGF0dGVybiA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gIHZhciBwYXR0ZXJuID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAobGVuZ3RoKTsgaSsrKSB7XHJcbiAgICBwYXR0ZXJuW2ldID0gW107XHJcbiAgfVxyXG4gIHJldHVybiBwYXR0ZXJuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYW4gZXZlbnQgdG8gdGhlIHBhdHRlcm4gYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuYWRkRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICBpZiAocG9zaXRpb24gPD0gdGhpcy5yZXNvbHV0aW9uKSB7XHJcbiAgICB2YXIgcG9zID0gKHBvc2l0aW9uKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgICB0aGlzLnBhdHRlcm5bcG9zXS5wdXNoKHNlcUV2ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQb3NpdGlvbiBvdXQgb2YgcGF0dGVybiBib3VuZHMuJyk7XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYW4gZXZlbnQgYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICB2YXIgcG9zID0gKHBvc2l0aW9uKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgdmFyIGluZGV4ID0gdGhpcy5wYXR0ZXJuW3Bvc10uaW5kZXhPZihzZXFFdmVudCk7XHJcbiAgdGhpcy5wYXR0ZXJuW3Bvc10uc3BsaWNlKGluZGV4LCAxKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge0ludH0gICAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wYXR0ZXJuLmxlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYWxsIHBvc2l0aW9ucyB0aGF0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGV2ZW50LlxyXG4gKiBDYW4gYmUgaGFuZHkgdG8gZHJhdyBldmVudHMgb24gdGhlIHNjcmVlbi5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+ZnJvbSB7QHR1dG9yaWFsIFN0ZXBzZXF1ZW5jZXJ9PC9jYXB0aW9uPlxyXG4gKiBiZFN0ZXBzID0gYmRQYXJ0LmdldE5vdGVQb3NpdGlvbnMoKTtcclxuICogYmRTdGVwcy5mb3JFYWNoKGZ1bmN0aW9uKHBvcykge1xyXG4gKiAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZCcgKyBwb3MpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZWQnO1xyXG4gKiB9KTtcclxuICogQHJldHVybiB7QXJyYXl9ICBMaXN0IHdpdGggYWxsIG5vbi1lbXB0eSBwYXR0ZXJuIGVudHJpZXNcclxuICovXHJcblBhcnQucHJvdG90eXBlLmdldE5vdGVQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcG9zaXRpb25zID0gW107XHJcbiAgdGhpcy5wYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24oZWwsIGluZGV4KSB7XHJcbiAgICBpZiAoZWwubGVuZ3RoID4gMCkge1xyXG4gICAgICBwb3NpdGlvbnMucHVzaChpbmRleCAvIHRoaXMubXVsdGlwbHkpO1xyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG4gIHJldHVybiBwb3NpdGlvbnM7XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBhIHBhcnQgYXQgdGhlIHRvcC9zdGFydC5cclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uVG9wID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSBleHRlbnNpb24uY29uY2F0KHRoaXMucGF0dGVybik7XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBhIHBhcnQgYXQgdGhlIGVuZFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGV4dExlbmd0aCBMZW5ndGggaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25FbmQgPSBmdW5jdGlvbihleHRMZW5ndGgpIHtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihleHRMZW5ndGgpO1xyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMucGF0dGVybi5jb25jYXQoZXh0ZW5zaW9uKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFydDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHdvcmsgPSByZXF1aXJlKCd3ZWJ3b3JraWZ5Jyk7ICAgLy9wcmVwYXJlcyB0aGUgd29ya2VyIGZvciBicm93c2VyaWZ5XHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciB3b3JrZXIgPSByZXF1aXJlKCcuL3NjaGVkdWxlV29ya2VyLmpzJyk7XHJcblxyXG4vKipcclxuICogVGhlIG1haW4gY2xhc3Mgb2YgdGhlIHNlcXVlbmNlci4gSXQgZG9lcyB0aGUgcXVldWluZyBvZlxyXG4gKiBwYXJ0cyBhbmQgZXZlbnRzIGFuZCBydW5zIHRoZSBzY2hlZHVsZXJzIHRoYXQgZmlyZSBldmVudHNcclxuICogYW5kIGRyYXdzIHRvIHRoZSBzY3JlZW4uXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBwYXJ0ID0gbmV3IGludGVybWl4LlBhcnQoKTtcclxuICogdmFyIHNlcSA9IG5ldyBpbnRlcm1peC5TZXF1ZW5jZXIoKTtcclxuICogcGFydC5hZGRFdmVudChzb21lTm90ZSwgMCk7XHJcbiAqIHNlcS5hZGRQYXJ0KHBhcnQsIDApO1xyXG4gKiBzZXEuc3RhcnQoKTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgU2VxdWVuY2VyID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMuYnBtID0gMTIwOyAgICAgICAgICAgICAvL2JlYXRzIHBlciBtaW51dGVcclxuICB0aGlzLnJlc29sdXRpb24gPSA2NDsgICAgICAgLy9zaG9ydGVzdCBwb3NzaWJsZSBub3RlLiBZb3Ugbm9ybWFsbHkgZG9uJ3Qgd2FudCB0byB0b3VjaCB0aGlzLlxyXG4gIHRoaXMuaW50ZXJ2YWwgPSAxMDA7ICAgICAgICAvL3RoZSBpbnRlcnZhbCBpbiBtaWxpc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGdldHMgaW52b2tlZC5cclxuICB0aGlzLmxvb2thaGVhZCA9IDAuMzsgICAgICAgLy90aW1lIGluIHNlY29uZHMgdGhlIHNjaGVkdWxlciBsb29rcyBhaGVhZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9zaG91bGQgYmUgbG9uZ2VyIHRoYW4gaW50ZXJ2YWwuXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAgIC8vTGlzdCB3aXRoIGFsbCBwYXJ0cyBvZiB0aGUgc2NvcmVcclxuICB0aGlzLnJ1bnF1ZXVlID0gW107ICAgICAgICAgLy9saXN0IHdpdGggcGFydHMgdGhhdCBhcmUgcGxheWluZyBvciB3aWxsIGJlIHBsYXllZCBzaG9ydGx5XHJcblxyXG4gIHRoaXMudGltZVBlclN0ZXA7ICAgICAgICAgICAvL3BlcmlvZCBvZiB0aW1lIGJldHdlZW4gdHdvIHN0ZXBzXHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwOyAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIG5leHQgc3RlcCB3aWxsIGJlIHRyaWdnZXJlZFxyXG4gIHRoaXMubmV4dFN0ZXAgPSAwOyAgICAgICAgICAvL3Bvc2l0aW9uIGluIHRoZSBxdWV1ZSB0aGF0IHdpbGwgZ2V0IHRyaWdnZXJlZCBuZXh0XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IDA7ICAgIC8vc3RlcCBpbiBxdWV1ZSB0aGF0IHdhcyBwbGF5ZWQgKG5vdCB0cmlnZ2VyZWQpIHJlY2VudGx5ICh1c2VkIGZvciBkcmF3aW5nKS5cclxuICB0aGlzLmxvb3AgPSBmYWxzZTsgICAgICAgICAgLy9wbGF5IGEgc2VjdGlvbiBvZiB0aGUgcXVldWUgaW4gYSBsb29wXHJcbiAgdGhpcy5sb29wU3RhcnQ7ICAgICAgICAgICAgIC8vZmlyc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMubG9vcEVuZDsgICAgICAgICAgICAgICAvL2xhc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7ICAgICAvL3RydWUgaWYgc2VxdWVuY2VyIGlzIHJ1bm5pbmcsIG90aGVyd2lzZSBmYWxzZVxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWU7ICAgICAgICAvL2hhcyB0byBiZSBvdmVycmlkZGVuIHdpdGggYSBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgaW4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJhdyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0UGxheWVkU3RlcCBpbnQgYXMgcGFyYW1ldGVyLlxyXG5cclxuICAvLyBzZXQgdGltZSBwZXIgc2V0VGltZVBlclN0ZXBcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcCh0aGlzLmJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSB0aGUgc2NoZWR1bGVyLXRpbWVyXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlciA9IHdvcmsod29ya2VyKTtcclxuXHJcbiAgLyplc2xpbnQtZW5hYmxlICovXHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3RpY2snKSB7XHJcbiAgICAgIHNlbGYuc2NoZWR1bGVyKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSh7J2ludGVydmFsJzogdGhpcy5pbnRlcnZhbH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGV2ZW50cyBmcm9tIHRoZSBtYXN0ZXIgcXVldWUgYW5kIGZpcmVzIHRoZW0uXHJcbiAqIEl0IGdldHMgY2FsbGVkIGF0IGEgY29uc3RhbnQgcmF0ZSwgbG9va3MgYWhlYWQgaW5cclxuICogdGhlIHF1ZXVlIGFuZCBmaXJlcyBhbGwgZXZlbnRzIGluIHRoZSBuZWFyIGZ1dHVyZVxyXG4gKiB3aXRoIGEgZGVsYXkgY29tcHV0ZWQgZnJvbSB0aGUgY3VycmVudCBicG0gdmFsdWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBsaW1pdCA9IGNvcmUuY3VycmVudFRpbWUgKyB0aGlzLmxvb2thaGVhZDtcclxuICAvLyBpZiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZSBvciBwcmV2aW91c2x5IHN0b3BwZWRcclxuICBpZiAodGhpcy5uZXh0U3RlcFRpbWUgPT09IDApIHtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIHdoaWxlICh0aGlzLm5leHRTdGVwVGltZSA8IGxpbWl0KSB7XHJcbiAgICB0aGlzLmFkZFBhcnRzVG9SdW5xdWV1ZSgpO1xyXG4gICAgdGhpcy5maXJlRXZlbnRzKCk7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSArPSB0aGlzLnRpbWVQZXJTdGVwO1xyXG5cclxuICAgIHRoaXMuc2V0UXVldWVQb2ludGVyKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvb2tzIGluIHRoZSBtYXN0ZXIgcXVldWUgZm9yIHBhcnRzIGFuZCBhZGRzXHJcbiAqIGNvcGllcyBvZiB0aGVtIHRvIHRoZSBydW5xdWV1ZS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydHNUb1J1bnF1ZXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHR5cGVvZiB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgaWYgKHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0ubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHZhciBwYXJ0ID0gdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXVswXTtcclxuICAgICAgcGFydC5wb2ludGVyID0gMDtcclxuICAgICAgdGhpcy5ydW5xdWV1ZS5wdXNoKHBhcnQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcclxuICAgICAgICBwYXJ0LnBvaW50ZXIgPSAwO1xyXG4gICAgICAgIHRoaXMucnVucXVldWUucHVzaChwYXJ0KTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlbGV0ZXMgcGFydHMgZnJvbSBydW5xdWV1ZS4gSXQgaXMgaW1wb3J0YW50LCB0aGF0IHRoZSBpbmRpY2VzXHJcbiAqIG9mIHRoZSBwYXJ0cyBhcmUgc29ydGVkIGZyb20gbWF4IHRvIG1pbi4gT3RoZXJ3aXNlIHRoZSBmb3JFYWNoXHJcbiAqIGxvb3Agd29uJ3Qgd29yay5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IGluZGljZXMgIEluZGljZXMgb2YgdGhlIHBhcnRzIGluIHRoZSBydW5xdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kZWxldGVQYXJ0c0Zyb21SdW5xdWV1ZSA9IGZ1bmN0aW9uKGluZGljZXMpIHtcclxuICBpZiAoaW5kaWNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBpbmRpY2VzLmZvckVhY2goZnVuY3Rpb24oaWQpIHtcclxuICAgICAgZGVsZXRlIHRoaXMucnVucXVldWVbaWRdLnBvaW50ZXI7XHJcbiAgICAgIHRoaXMucnVucXVldWUuc3BsaWNlKGlkLCAxKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaXJlcyBhbGwgZXZlbnRzIGZvciB0aGUgdXBjb21taW5nIHN0ZXAuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmZpcmVFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbWFya0ZvckRlbGV0ZSA9IFtdO1xyXG4gIHRoaXMucnVucXVldWUuZm9yRWFjaChmdW5jdGlvbihwYXJ0LCBpbmRleCkge1xyXG4gICAgaWYgKHBhcnQucG9pbnRlciA9PT0gcGFydC5sZW5ndGggLSAxKSB7XHJcbiAgICAgIG1hcmtGb3JEZWxldGUudW5zaGlmdChpbmRleCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgc2VxRXZlbnRzID0gcGFydC5wYXR0ZXJuW3BhcnQucG9pbnRlcl07XHJcbiAgICAgIGlmIChzZXFFdmVudHMgJiYgc2VxRXZlbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQsIHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgfSBlbHNlIGlmIChzZXFFdmVudHMgJiYgc2VxRXZlbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50c1swXSwgdGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBwYXJ0LnBvaW50ZXIrKztcclxuICB9LCB0aGlzKTtcclxuICB0aGlzLmRlbGV0ZVBhcnRzRnJvbVJ1bnF1ZXVlKG1hcmtGb3JEZWxldGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludm9rZXMgdGhlIGFwcHJvcHJpYXRlIHN1YnN5c3RlbSB0byBwcm9jZXNzIHRoZSBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgdG8gcHJvY2Vzc1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGRlbGF5ICAgICB0aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgZXZlbnQgc2hvdWxkIHN0YXJ0XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBkZWxheSkge1xyXG4gIGlmIChkZWxheSkge1xyXG4gICAgc2VxRXZlbnQucHJvcHNbJ2RlbGF5J10gPSBkZWxheTtcclxuICB9XHJcbiAgc2VxRXZlbnQucHJvcHMuaW5zdHJ1bWVudC5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHBvaW50ZXIgdG8gdGhlIG5leHQgc3RlcCB0aGF0IHNob3VsZCBiZSBwbGF5ZWRcclxuICogaW4gdGhlIG1hc3RlciBxdWV1ZS4gSWYgd2UncmUgcGxheWluZyBpbiBsb29wIG1vZGUsXHJcbiAqIGp1bXAgYmFjayB0byBsb29wc3RhcnQgd2hlbiBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gKiBJZiBhIHBvaW50ZXIgcG9zaXRpb24gaXMgZ2l2ZW4sIGp1bXAgdG8gaXQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAgIHtJbnR9ICAgcG9zaXRpb24gIE5ldyBwb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRRdWV1ZVBvaW50ZXIgPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gIGlmICh0eXBlb2YgcG9zaXRpb24gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwID0gcG9zaXRpb247XHJcbiAgICB0aGlzLnJ1bnF1ZXVlID0gW107XHJcbiAgfSBlbHNlIGlmICh0aGlzLmxvb3AgJiYgdGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgIHRoaXMucnVucXVldWUgPSBbXTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHF1ZXVlIHBvaW50ZXIgKHNldCB0byBwb3NpdGlvbiAwKS5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVzZXRRdWV1ZVBvaW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNldFF1ZXVlUG9pbnRlcigwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgdGhlIHNlcXVlbmNlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICghdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAgICB0aGlzLmlzUnVubmluZyA9IHRydWU7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgdGhlIHNlcXVlbmNlciAoaGFsdHMgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24pXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgdGhlIHNlcXVlbmNlciBhbmQgc3VzcGVuZHMgdGhlIEF1ZGlvQ29udGV4dCB0b1xyXG4gKiBnbG9iYWxseSBoYWx0IGFsbCBhdWRpbyBzdHJlYW1zLiBJdCBqdXN0IGhhbHRzIGlmXHJcbiAqIGlmIHNlcXVlbmNlciBhbmQgQXVkaW9Db250ZXh0IGJvdGggYXJlIGluIHJ1bm5pbmcgc3RhdGUuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgaGFsdGVkLCBmYWxzZSBpZiBub3RcclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoY29yZS5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIHRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB0aGlzLnN0b3AoKTtcclxuICAgIGNvcmUuc3VzcGVuZCgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzdW1lcyB0aGUgQXVkaW9Db250ZXh0IGFuZCBzdGFydHMgdGhlIHNlcXVlbmNlciBhdCBpdHNcclxuICogY3VycmVudCBwb3NpdGlvbi4gSXQganVzdCBzdGFydHMgaWYgc2VxdWVuY2VyIGFuZCBBdWRpb0NvbnRleHRcclxuICogYm90aCBhcmUgc3RvcHBlZC5cclxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiByZXN1bWVkLCBmYWxzZSBpZiBub3RcclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKGNvcmUuc3RhdGUgPT09ICdzdXNwZW5kZWQnICYmICF0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zdGFydCgpO1xyXG4gICAgY29yZS5yZXN1bWUoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNjaGVkdWxlciB0aGF0IHJ1bnMgYSBkcmF3aW5nIGZ1bmN0aW9uIGV2ZXJ5IHRpbWVcclxuICogdGhlIHNjcmVlbiByZWZyZXNoZXMuIFRoZSBmdW5jdGlvbiBTZXF1ZW5jZXIuYW5pbWF0aW9uRnJhbWUoKVxyXG4gKiBoYXMgdG8gYmUgb3ZlcnJpZGRlbiBieSB0aGUgYXBwbGljYXRpb24gd2l0aCBzdHVmZiB0byBiZSBkcmF3biBvbiB0aGUgc2NyZWVuLlxyXG4gKiBJdCBjYWxscyBpdHNlbGYgcmVjdXJzaXZlbHkgb24gZXZlcnkgZnJhbWUgYXMgbG9uZyBhcyB0aGUgc2VxdWVuY2VyIGlzIHJ1bm5pbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcclxuICAvLyBmaXJzdCB3ZSdsbCBoYXZlIHRvIGZpbmQgb3V0LCB3aGF0IHN0ZXAgd2FzIHBsYXllZCByZWNlbnRseS5cclxuICAvLyB0aGlzIGlzIHNvbWVob3cgY2x1bXN5IGJlY2F1c2UgdGhlIHNlcXVlbmNlciBkb2Vzbid0IGtlZXAgdHJhY2sgb2YgdGhhdC5cclxuICB2YXIgbG9va0FoZWFkRGVsdGEgPSB0aGlzLm5leHRTdGVwVGltZSAtIGNvcmUuY3VycmVudFRpbWU7XHJcbiAgaWYgKGxvb2tBaGVhZERlbHRhID49IDApIHtcclxuICAgIHZhciBzdGVwc0FoZWFkID0gTWF0aC5yb3VuZChsb29rQWhlYWREZWx0YSAvIHRoaXMudGltZVBlclN0ZXApO1xyXG5cclxuICAgIGlmICh0aGlzLm5leHRTdGVwIDwgc3RlcHNBaGVhZCkge1xyXG4gICAgICAvLyB3ZSBqdXN0IGp1bXBlZCB0byB0aGUgc3RhcnQgb2YgYSBsb29wXHJcbiAgICAgIHRoaXMubGFzdFBsYXllZFN0ZXAgPSB0aGlzLmxvb3BFbmQgKyB0aGlzLm5leHRTdGVwIC0gc3RlcHNBaGVhZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubGFzdFBsYXllZFN0ZXAgPSB0aGlzLm5leHRTdGVwIC0gc3RlcHNBaGVhZDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnVwZGF0ZUZyYW1lKHRoaXMubGFzdFBsYXllZFN0ZXApO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUnVucyBiZXR3ZWVuIHNjcmVlbiByZWZyZXNoLiBIYXMgdG8gYmUgb3ZlcnJpZGRlbiBieSB0aGVcclxuICogYXBwIHRvIHJlbmRlciB0byB0aGUgc2NyZWVuLlxyXG4gKiBAcGFyYW0gIHtJbnR9ICBsYXN0UGxheWVkU3RlcCAgVGhlIDY0dGggc3RlcCB0aGF0IHdhcyBwbGF5ZWQgcmVjZW50bHlcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUudXBkYXRlRnJhbWUgPSBmdW5jdGlvbihsYXN0UGxheWVkU3RlcCkge1xyXG4gIGNvbnNvbGUubG9nKGxhc3RQbGF5ZWRTdGVwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgcGFydCB0byB0aGUgbWFzdGVyIHF1ZXVlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcnQgICAgICBBbiBpbnN0YW5jZSBvZiBQYXJ0XHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBhcnQubGVuZ3RoICYmIHBhcnQucGF0dGVybikge1xyXG4gICAgaWYgKCF0aGlzLnF1ZXVlW3Bvc2l0aW9uXSkge1xyXG4gICAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXSA9IFtdO1xyXG4gICAgfVxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ucHVzaChwYXJ0KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBwYXJhbWV0ZXIgZG9lc25cXCd0IHNlZW0gdG8gYmUgYSBwYXJ0IG9iamVjdCcpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgcGFydCBvYmplY3QgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gcGFydCAgICAgUGFydCBpbnN0YW5jZSB0byBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gUG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZW1vdmVQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAodGhpcy5xdWV1ZVtwb3NpdGlvbl0gaW5zdGFuY2VvZiBBcnJheSAmJlxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ubGVuZ3RoID4gMCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5xdWV1ZVtwb3NpdGlvbl0uaW5kZXhPZihwYXJ0KTtcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnNwbGljZShpbmRleCwgMSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUGFydCBub3QgZm91bmQgYXQgcG9zaXRpb24gJyArIHBvc2l0aW9uICsgJy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgIGJwbSBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldEJwbSA9IGZ1bmN0aW9uKGJwbSkge1xyXG4gIHRoaXMuYnBtID0gYnBtO1xyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKGJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlcyB0aGUgdGltZSBpbiBzZWNvbmRzIGFzIGZsb2F0IHZhbHVlXHJcbiAqIGJldHdlZW4gb25lIHNob3J0ZXN0IHBvc3NzaWJsZSBub3RlXHJcbiAqICg2NHRoIGJ5IGRlZmF1bHQpIGFuZCB0aGUgbmV4dC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBicG0gICAgICAgIGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgICByZXNvbHV0aW9uIHNob3J0ZXN0IHBvc3NpYmxlIG5vdGUgdmFsdWVcclxuICogQHJldHVybiB7ZmxvYXR9ICAgICAgICAgICAgIHRpbWUgaW4gc2Vjb25kc1xyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZ2V0TGFzdFBsYXllZFN0ZXAgPSBmdW5jdGlvbigpIHtcclxuXHJcbn07XHJcblxyXG4vKipcclxuICogTWFrZXMgYSBjb3B5IG9mIGEgZmxhdCBhcnJheS5cclxuICogVXNlcyBhIHByZS1hbGxvY2F0ZWQgd2hpbGUtbG9vcFxyXG4gKiB3aGljaCBzZWVtcyB0byBiZSB0aGUgZmFzdGVkIHdheVxyXG4gKiAoYnkgZmFyKSBvZiBkb2luZyB0aGlzOlxyXG4gKiBodHRwOi8vanNwZXJmLmNvbS9uZXctYXJyYXktdnMtc3BsaWNlLXZzLXNsaWNlLzExM1xyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gc291cmNlQXJyYXkgQXJyYXkgdGhhdCBzaG91bGQgYmUgY29waWVkLlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQ29weSBvZiB0aGUgc291cmNlIGFycmF5LlxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5jb3B5QXJyYXkgPSBmdW5jdGlvbihzb3VyY2VBcnJheSkge1xyXG4gIHZhciBkZXN0QXJyYXkgPSBuZXcgQXJyYXkoc291cmNlQXJyYXkubGVuZ3RoKTtcclxuICB2YXIgaSA9IHNvdXJjZUFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAoaS0tKSB7XHJcbiAgICBkZXN0QXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcclxuICB9XHJcbiAgcmV0dXJuIGRlc3RBcnJheTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VxdWVuY2VyO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxuLyoqXHJcbiAqIDxwPlxyXG4gKiBQbGF5IGEgc291bmQgdGhhdCBjYW4gYmUgbG9vcGVkLiBQYXVzZS9TdGFydCB3b3JrcyBzYW1wbGUtYWNjdXJhdGVcclxuICogYXQgYW55IHJhdGUuIEhpdCB0aGUgc3RhcnQgYnV0dG9uIG11bHRpcGxlIHRpbWVzIHRvIGhhdmUgbXVsdGlwbGVcclxuICogc291bmRzIHBsYXllZC4gQWxsIHBhcmFtZXRlcnMgYXJlIGFkanVzdGFibGUgaW4gcmVhbHRpbWUuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2F1ZGlvZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnN0YXJ0KCk7XHJcbiAqIEB0dXRvcmlhbCBTb3VuZFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7T2JqZWN0fSBzb3VuZFdhdmUgU291bmRXYXZlIG9iamVjdCBpbmNsdWRpbmcgdGhlIGJ1ZmZlciB3aXRoIGF1ZGlvIGRhdGEgdG8gYmUgcGxheWVkXHJcbiAqL1xyXG52YXIgU291bmQgPSBmdW5jdGlvbihzb3VuZFdhdmUpIHtcclxuXHJcbiAgdGhpcy53YXZlID0gbnVsbDtcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgIC8vYWxsIGN1cnJlbnRseSBhY3RpdmUgc3RyZWFtc1xyXG4gIHRoaXMubG9vcCA9IGZhbHNlO1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBudWxsO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IG51bGw7XHJcblxyXG4gIHRoaXMuc291bmRMZW5ndGggPSAwO1xyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0cyA9IFtdOyAgIC8vaG9sZHMgc3RhcnQgb2Zmc2V0cyBpZiBwYXVzZWRcclxuICB0aGlzLnN0YXJ0VGltZSA9IDA7ICAgICAgIC8vd2hlbiB0aGUgc291bmQgc3RhcnRzIHRvIHBsYXlcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gbnVsbDtcclxuICB0aGlzLnBsYXliYWNrUmF0ZSA9IDE7XHJcbiAgdGhpcy5kZXR1bmUgPSAwO1xyXG5cclxuICBpZiAoc291bmRXYXZlKSB7XHJcbiAgICB0aGlzLndhdmUgPSBzb3VuZFdhdmU7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IHNvdW5kV2F2ZS5idWZmZXI7XHJcbiAgICB0aGlzLnNvdW5kTGVuZ3RoID0gdGhpcy5sb29wRW5kID0gdGhpcy5idWZmZXIuZHVyYXRpb247XHJcbiAgICB0aGlzLnNldHVwQXVkaW9DaGFpbigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIGluaXRpYWxpc2luZyBTb3VuZCBvYmplY3Q6IHBhcmFtZXRlciBtaXNzaW5nLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZ2FpbiBhbmQgc3RlcmVvLXBhbm5lciBub2RlLCBjb25uZWN0cyB0aGVtXHJcbiAqIChnYWluIC0+IHBhbm5lcikgYW5kIHNldHMgZ2FpbiB0byAxIChtYXggdmFsdWUpLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldHVwQXVkaW9DaGFpbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBjb3JlLmNyZWF0ZUdhaW4oKTtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBjb3JlLmNyZWF0ZVN0ZXJlb1Bhbm5lcigpO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLnBhbm5lck5vZGUpO1xyXG4gIHRoaXMucGFubmVyTm9kZS5jb25uZWN0KGNvcmUuZGVzdGluYXRpb24pO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDE7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbmQgY29uZmlndXJlcyBhIEJ1ZmZlclNvdXJjZU5vZGVcclxuICogdGhhdCBjYW4gYmUgcGxheWVkIG9uY2UgYW5kIHRoZW4gZGVzdHJveXMgaXRzZWxmLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtCdWZmZXJTb3VyY2VOb2RlfSBUaGUgQnVmZmVyU291cmNlTm9kZVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYnVmZmVyU291cmNlID0gY29yZS5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICBidWZmZXJTb3VyY2UuYnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgYnVmZmVyU291cmNlLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XHJcbiAgYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZShidWZmZXJTb3VyY2UpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGJ1ZmZlclNvdXJjZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXN0cm95ZXMgYSBnaXZlbiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgYW5kIGRlbGV0ZXMgaXRcclxuICogZnJvbSB0aGUgc291cmNlTm9kZSBxdWV1ZS4gVGhpcyBpcyB1c2VkIGluIHRoZSBvbmVuZGVkXHJcbiAqIGNhbGxiYWNrIG9mIGFsbCBCdWZmZXJTb3VyY2VOb2RlcyB0byBhdm9pZCBkZWFkIHJlZmVyZW5jZXMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2JzTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGR1cmF0aW9uICAgVGltZSBwcmVyaW9kIGFmdGVyIHRoZSBzdHJlYW0gc2hvdWxkIGVuZFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ocGxheUxvb3BlZCwgZGVsYXksIGR1cmF0aW9uKSB7XHJcbiAgaWYgKHRoaXMuaXNQYXVzZWQgJiYgdGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICB0aGlzLnJlc3VtZSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgICBpZiAoZGVsYXkpIHtcclxuICAgICAgc3RhcnRUaW1lID0gZGVsYXk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gICAgfVxyXG4gICAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcbiAgICBpZiAocGxheUxvb3BlZCkge1xyXG4gICAgICBicy5sb29wID0gcGxheUxvb3BlZDtcclxuICAgICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgICB9XHJcbiAgICBicy5wbGF5YmFja1JhdGUudmFsdWUgPSBicy50bXBQbGF5YmFja1JhdGUgPSB0aGlzLnBsYXliYWNrUmF0ZTtcclxuICAgIGJzLmRldHVuZS52YWx1ZSA9IHRoaXMuZGV0dW5lO1xyXG4gICAgYnMuc3RhcnRUaW1lID0gc3RhcnRUaW1lOyAgIC8vIGV4dGVuZCBub2RlIHdpdGggYSBzdGFydHRpbWUgcHJvcGVydHlcclxuXHJcbiAgICB0aGlzLnF1ZXVlLnB1c2goYnMpO1xyXG4gICAgaWYgKGR1cmF0aW9uKSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCwgZHVyYXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbSwgZXZlbiB0aGUgb25lcyB0aGF0IGFyZSBqdXN0IHNjaGVkdWxlZC5cclxuICogSXQgYWxzbyBjbGVhbnMgdGhlIHF1ZXVlIHNvIHRoYXQgdGhlIHNvdW5kIG9iamVjdCBpcyByZWFkeSBmb3IgYW5vdGhlciByb3VuZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUuc3RvcCgpO1xyXG4gICAgbm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgfSk7XHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgLy9yZWxlYXNlIGFsbCByZWZlcmVuY2VzXHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbXMgb2YgdGhpcyBzb3VuZCB0ZW1wb3JhcmlseS5cclxuICogVGhpcyBjdXJyZW50bHkganVzdCB3b3JrcyBpbiBDaHJvbWUgNDkrIG9ubHkuXHJcbiAqIElmIHlvdSB3YW50IGEgZ2xvYmFsLCBhY2N1cmF0ZSBwYXVzZSBmdW5jdGlvblxyXG4gKiB1c2Ugc3VzcGVuZC9yZXN1bWUgZnJvbSB0aGUgY29yZSBtb2R1bGUuXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLmlzUGF1c2VkKSB7XHJcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBub2RlLnRtcFBsYXliYWNrUmF0ZSA9IG5vZGUucGxheWJhY2tSYXRlLnZhbHVlO1xyXG4gICAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IDAuMDtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgYWxsIHN0cmVhbXMgaWYgdGhleSB3ZXJlIHBhdXNlZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICAgIGRlbGV0ZSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICB9KTtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvY2Vzc2VzIGFuIGV2ZW50IGZpcmVkIGJ5IHRoZSBzZXF1ZW5jZXIuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgQSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wcm9jZXNzU2VxRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gIC8vdGhpcy5zZXRUb25lKHNlcUV2ZW50LnByb3BzLnRvbmUpO1xyXG4gIGlmIChzZXFFdmVudC5wcm9wcy5kdXJhdGlvbikge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXksXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmR1cmF0aW9uKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXkpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdGFydHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBzdGFydCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGVuZHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBlbmQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BFbmQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcEVuZCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWxlYXNlcyB0aGUgbG9vcCBvZiBhbGwgcnVubmluZyBub2RlcyxcclxuICogTm9kZXMgd2lsbCBydW4gdW50aWwgZW5kIGFuZCBzdG9wLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlbGVhc2VMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcCA9IGZhbHNlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgc3RhcnQgYW5kIGVuZHBvaW50IHRvIHN0YXJ0IGVuZCBlbmRwb2ludCBvZiB0aGUgQXVkaW9CdWZmZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXNldExvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gdGhpcy5zb3VuZExlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHNvdW5kIGluIHBlcmNlbnRhZ2VcclxuICogKDEgPSAxMDAlLCAyID0gMjAwJSlcclxuICogQHBhcmFtICB7ZmxvYXR9ICB2YWx1ZSAgIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRvbmUgd2l0aGluIHR3byBvY3RhdmUgKCsvLTEyIHRvbmVzKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgc2VtaSB0b25lXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgaWYgKHNlbWlUb25lID49IC0xMiAmJiBzZW1pVG9uZSA8PSAxMikge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBzZW1pVG9uZSAqIDEwMDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZW1pIHRvbmUgaXMgJyArIHNlbWlUb25lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxhc3QgcGxheWVkIHNlbWl0b25lLiBUaGlzIGRvZXNuJ3QgaGFzIHRvIGJlIGFuXHJcbiAqIGludGVnZXIgYmV0d2VlbiAtLysxMiBhcyB0aGUgc291bmQgY2FuIGJlIGRldHVuZWQgd2l0aFxyXG4gKiBtb3JlIHByZWNpc2lvbi5cclxuICogQHJldHVybiB7ZmxvYXR9ICBTZW1pdG9uZSBiZXR3ZWVuIC0vKzEyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZSAvIDEwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXR1bmUgdGhlIHNvdW5kIG9zY2lsbGF0aW9uIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHZhbHVlICBkZXR1bmUgaW4gY2VudHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXREZXR1bmUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA+PSAtMTIwMCAmJiB2YWx1ZSA8PSAxMjAwKSB7XHJcbiAgICB0aGlzLmRldHVuZSA9IHZhbHVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldHVuZSBwYXJhbWV0ZXIgaXMgJyArIHZhbHVlICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyMDAuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgY3VycmVudCBkZXR1bmUgaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcmV0dXJuIHtJbnRlZ2VyfSAgRGV0dW5lIGluIGNlbnRzXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RGV0dW5lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGluIHVzZSBhbmQgY2FuIHByb2JhYmx5IGJlIHJlbW92ZWRcclxuICogQHJldHVybiB7SW50fSBSYW5kb20gbnVtYmVyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VUlEID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zdWJzdHIoMiwgOCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxuLyoqXHJcbiAqIDxwPlxyXG4gKiBDcmVhdGVzIGEgd3JhcHBlciBpbiB3aGljaCBhbiBhdWRpbyBidWZmZXIgbGl2ZXMuXHJcbiAqIEEgU291bmRXYXZlIG9iamVjdCBqdXN0IGhvbGRzIGF1ZGlvIGRhdGEgYW5kIGRvZXMgbm90aGluZyBlbHNlLlxyXG4gKiBJZiB5b3Ugd2FudCB0byBwbGF5IHRoZSBzb3VuZCwgeW91IGhhdmUgdG8gYWRkaXRpb25hbGx5IGNyZWF0ZSBhXHJcbiAqIDxhIGhyZWY9XCJTb3VuZC5odG1sXCI+U291bmQ8L2E+IG9iamVjdC5cclxuICogSXQgY2FuIGhhbmRsZSBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqICgqLndhdiwgKi5tcDMpIGFzIGRhdGEgc291cmNlcy5cclxuICogPC9wPjxwPlxyXG4gKiBNdWx0aXBsZSBzb3VyY2VzIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gb25lIGF1ZGlvIGJ1ZmZlci5cclxuICogVGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgY3JlYXRpbmcgbXVsdGlwbGUgU291bmRXYXZlIG9iamVjdHMuXHJcbiAqIEl0J3MgbGlrZSBhIHdhdmV0YWJsZTogQWxsIHN0YXJ0L2VuZCBwb3NpdGlvbnMgd2lsbCBiZSBzYXZlZCBzb1xyXG4gKiB5b3UgY2FuIHRyaWdnZXIgdGhlIG9yaWdpbmFsIHNhbXBsZXMgd2l0aG91dCB1c2luZyBtdWx0aXBsZSBidWZmZXJzLlxyXG4gKiBQb3NzaWJsZSB1c2FnZXMgYXJlIG11bHRpc2FtcGxlZCBzb3VuZHMsIGxvb3BzIG9yIHdhdmVzZXF1ZW5jZXMgKGtpbmQgb2YpLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlBsYXkgYSBzb3VuZCBmcm9tIGFuIGF1ZGlvIGZpbGU6PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNvbmNhdGVuYXRlIG11bHRpcGxlIHNvdXJjZSBmaWxlcyBpbnRvIG9uZSBidWZmZXI8YnI+XHJcbiAqIGluIHRoZSBnaXZlbiBvcmRlciBhbmQgcGxheSB0aGVtIChUaGlzIGlzIGJyb2tlbiBpbiB2MC4xLiBEb24ndCB1c2UgaXQhKTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdmaWxlMS53YXYsZmlsZTIud2F2LGZpbGUzLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5idWZmZXIgPSBudWxsOyAgIC8vQXVkaW9CdWZmZXJcclxuICB0aGlzLm1ldGFEYXRhID0gW107ICAgLy9zdGFydC0vZW5kcG9pbnRzIGFuZCBsZW5ndGggb2Ygc2luZ2xlIHdhdmVzXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBpZiAodHlwZW9mIGF1ZGlvU3JjICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgaWYgKHR5cGVvZiBhdWRpb1NyYyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgLy9vbmUgZmlsZSB0byBsb2FkL2RlY29kZVxyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMubG9hZEZpbGUoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICByZXR1cm4gc2VsZi5kZWNvZGVBdWRpb0RhdGEocmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiB0eXBlb2YgYXVkaW9TcmNbMF0gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgZmlsZXMgdG8gbG9hZC9kZWNvZGUgYW5kIGNhbmNhdGluYXRlXHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5sb2FkTXVsdGlwbGVGaWxlcyhhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9vbmUgQXJyYXlCdWZmZXIgdG8gZGVjb2RlXHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9tdWx0aXBsZSBBcnJheUJ1ZmZlcnMgdG8gZGVjb2RlIGFuZCBjb25jYXRlbmF0ZVxyXG4gICAgICB0aGlzLmRlY29kZUF1ZGlvU291cmNlcyhhdWRpb1NyYykudGhlbihmdW5jdGlvbihhdWRpb0J1ZmZlcnMpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5qb2luQXVkaW9CdWZmZXJzKGF1ZGlvQnVmZmVycyk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSBhdWRpb0J1ZmZlcjtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgU291bmRXYXZlIG9iamVjdDogVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9zdGFydCB0aGUgb2JqZWN0IHdpdGggZW1wdHkgYnVmZmVyLiBVc2VmdWxsIGZvciB0ZXN0aW5nIGFuZCBhZHZhbmNlZCB1c2FnZS5cclxuICB9XHJcblxyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkTXVsdGlwbGVGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHRoaXMubG9hZEZpbGVzKGZpbGVuYW1lcykudGhlbihmdW5jdGlvbihiaW5CdWZmZXJzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZWNvZGVBdWRpb1NvdXJjZXMoYmluQnVmZmVycyk7XHJcbiAgfSlcclxuICAudGhlbihmdW5jdGlvbihhdWRpb0J1ZmZlcnMpIHtcclxuICAgIHJldHVybiB0aGlzLmpvaW5BdWRpb0J1ZmZlcnMoYXVkaW9CdWZmZXJzKTtcclxuICB9KVxyXG4gIC50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVyKSB7XHJcbiAgICByZXR1cm4gYXVkaW9CdWZmZXI7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIGFuZCByZXR1cm5zIGFuIGVxdWFsIG51bWJlciBvZiBBdWRpb0J1ZmZlcnMuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgICBidWZmZXJzIEFycmF5IHdpdGggQXJyYXlCdWZmZXJzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgIFJlc29sdmVzIHRvIGFuIGFycmF5IG9mIEF1ZGlvQnVmZmVycyBvciBlcnJvclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5kZWNvZGVBdWRpb1NvdXJjZXMgPSBmdW5jdGlvbihidWZmZXJzKSB7XHJcbiAgdmFyIHByb21pc2VzID0gW107XHJcbiAgYnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlcikge1xyXG4gICAgcHJvbWlzZXMucHVzaCh0aGlzLmRlY29kZUF1ZGlvRGF0YShidWZmZXIpKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVycykge1xyXG4gICAgcmV0dXJuIGF1ZGlvQnVmZmVycztcclxuICB9KVxyXG4gIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgIHJldHVybiBlcnI7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gQXJyYXlCdWZmZXIgd2l0aCBiaW5hcnkgYXVkaW8gZGF0YSBhbmRcclxuICogdHVybnMgaXQgaW50byBhbiBhdWRpbyBidWZmZXIgb2JqZWN0LlxyXG4gKiBKdXN0IGEgd3JhcHBlciBmb3IgdGhlIHdlYi1hdWRpby1hcGkgZGVjb2RlQXVkaW9EYXRhIGZ1bmN0aW9uLlxyXG4gKiBJdCB1c2VzIHRoZSBuZXcgcHJvbWlzZSBzeW50YXggc28gaXQgcHJvYmFibHkgd29uJ3Qgd29yayBpbiBhbGwgYnJvd3NlcnMgYnkgbm93LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheUJ1ZmZlcn0gIHJhd0F1ZGlvU3JjIEF1ZGlvIGRhdGEgaW4gcmF3IGJpbmFyeSBmb3JtYXRcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICAgICAgICBSZXNvbHZlcyB0byBBdWRpb0J1ZmZlciBvciBlcnJvclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5kZWNvZGVBdWRpb0RhdGEgPSBmdW5jdGlvbihyYXdBdWRpb1NyYykge1xyXG4gIHJldHVybiBjb3JlLmRlY29kZUF1ZGlvRGF0YShyYXdBdWRpb1NyYykudGhlbihmdW5jdGlvbihkZWNvZGVkKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlZDtcclxuICB9KVxyXG4gIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgIHJldHVybiBlcnI7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSm9pbnMgYW4gYXJiaXRyYXJ5IG51bWJlciBvZiBBcnJheUJ1ZmZlcnMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBidWZmZXJzIEFycmF5IG9mIEF1ZGlvQnVmZmVyc1xyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICBXYXZlZm9ybSB0aGF0IGluY2x1ZGVzIGFsbCBnaXZlbiBidWZmZXJzLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5qb2luQXVkaW9CdWZmZXJzID0gZnVuY3Rpb24oYnVmZmVycykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgam9pbmVkQnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIoMSwgMCwgY29yZS5zYW1wbGVSYXRlKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgYnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlcikge1xyXG4gICAgICBpZiAoYnVmZmVyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgICAgam9pbmVkQnVmZmVyID0gdGhpcy5hcHBlbmRBdWRpb0J1ZmZlcihqb2luZWRCdWZmZXIsIGJ1ZmZlcik7XHJcbiAgICAgICAgdGhpcy5tZXRhRGF0YS5wdXNoKHRoaXMuY3JlYXRlTWV0YURhdGEoam9pbmVkQnVmZmVyLCBidWZmZXIpKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZWplY3QobmV3IEVycm9yKCdPbmUgb3IgbW9yZSBidWZmZXJzIGFyZSBub3Qgb2YgdHlwZSBBdWRpb0J1ZmZlci4nKSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHNlbGYpO1xyXG4gICAgcmVzb2x2ZShqb2luZWRCdWZmZXIpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIEJvdGggYnVmZmVycyBzaG91bGQgaGF2ZSB0aGUgc2FtZSBhbW91bnRcclxuICogb2YgY2hhbm5lbHMuIElmIG5vdCwgY2hhbm5lbHMgd2lsbCBiZSBkcm9wcGVkLiBGb3IgZXhhbXBsZSwgaWYgeW91XHJcbiAqIGFwcGVuZCBhIHN0ZXJlbyBhbmQgYSBtb25vIGJ1ZmZlciwgdGhlIG91dHB1dCB3aWxsIGJlIG1vbm8gYW5kIG9ubHlcclxuICogb25lIG9mIHRoZSBjaGFubmVscyBvZiB0aGUgc3RlcmVvIHNhbXBsZSB3aWxsIGJlIHVzZWQgKG5vIG1lcmdpbmcgb2YgY2hhbm5lbHMpLlxyXG4gKiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOjxicj5cclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDE0MzY1Mi93ZWItYXVkaW8tYXBpLWFwcGVuZC1jb25jYXRlbmF0ZS1kaWZmZXJlbnQtYXVkaW9idWZmZXJzLWFuZC1wbGF5LXRoZW0tYXMtb25lLXNvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMSBUaGUgZmlyc3QgYXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIyIFRoZSBzZWNvbmQgYXVkaW8gYnVmZmVyXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIGJ1ZmZlcjEgKyBidWZmZXIyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFwcGVuZEF1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyMSwgYnVmZmVyMikge1xyXG4gIGlmIChidWZmZXIxIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmXHJcbiAgYnVmZmVyMiBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgICAgKGJ1ZmZlcjEubGVuZ3RoICsgYnVmZmVyMi5sZW5ndGgpLFxyXG4gICAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgICAgdmFyIGNoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSk7XHJcbiAgICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdCdWZmZXI7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdzZWRmJyk7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ09uZSBvciBib3RoIGJ1ZmZlcnMgYXJlIG5vdCBvZiB0eXBlIEF1ZGlvQnVmZmVyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZGljdGlvbmFyeSB3aXRoIHN0YXJ0L3N0b3AgcG9pbnRzIGFuZCBsZW5ndGggaW4gc2FtcGxlLWZyYW1lc1xyXG4gKiBvZiBhIGJ1ZmZlciBmcmFnbWVudC4uXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIgICAgICBCdWZmZXIgd2l0aCB0aGUgYXBwZW5kYWJsZSBwY20gZnJhZ21lbnRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IHByZWRlY2Vzc29yIFByZWNlZGluZyBidWZmZXJcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIERpY3Rpb25hcnkgd2l0aCBtZXRhIGRhdGEgb3IgZXJyb3IgbXNnXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmdldE1ldGFEYXRhID0gZnVuY3Rpb24oYnVmZmVyLCBwcmVkZWNlc3Nvcikge1xyXG4gIGlmIChidWZmZXIgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIgJiZcclxuICBwcmVkZWNlc3NvciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgdmFyIHByZUxlbmd0aCA9IHByZWRlY2Vzc29yLmxlbmd0aDtcclxuICAgIHZhciBidWZMZW5ndGggPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgJ3N0YXJ0JzogcHJlTGVuZ3RoLFxyXG4gICAgICAnZW5kJzogcHJlTGVuZ3RoICsgYnVmTGVuZ3RoIC0gMSxcclxuICAgICAgJ2xlbmd0aCc6IGJ1Zkxlbmd0aFxyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHsgJ2Vycm9yTXNnJzogJ09uZSBvciBib3RoIGFyZ3VtZW50cyBhcmUgbm90IG9mIHR5cGUgQXVkaW9CdWZmZXInIH07XHJcbiAgfVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIChhdWRpbykgZmlsZSBhbmQgcmV0dXJucyBpdHMgZGF0YSBhcyBBcnJheUJ1ZmZlclxyXG4gKiB3aGVuIHRoZSBwcm9taXNlIGZ1bGZpbGxzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdXJsICAgICAgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICBBIHByb21pc2UgcmVwcmVzZW50aW5nIHRoZSB4aHIgcmVzcG9uc2VcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbih1cmwpIHtcclxuICByZXR1cm4gd2luZG93LmZldGNoKHVybClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmVyIGVycm9yLiBDb3VsZG5cXCd0IGxvYWQgZmlsZTogJyArIHVybCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAudGhlbihmdW5jdGlvbihidWZmZXIpIHtcclxuICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBtdWx0aXBsZSAoYXVkaW8pIGZpbGVzIGFuZCByZXR1cm5zIGFuIGFycmF5XHJcbiAqIHdpdGggdGhlIGRhdGEgZnJvbSB0aGUgZmlsZXMgaW4gdGhlIGdpdmVuIG9yZGVyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGZpbGVuYW1lcyBMaXN0IHdpdGggZmlsZW5hbWVzXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgIEFycmF5IG9mIEFycmF5QnVmZmVyc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkRmlsZXMgPSBmdW5jdGlvbihmaWxlbmFtZXMpIHtcclxuICB2YXIgcHJvbWlzZXMgPSBbXTtcclxuICBmaWxlbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9hZEZpbGUobmFtZSkpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYmluQnVmZmVycykge1xyXG4gICAgcmV0dXJuIGJpbkJ1ZmZlcnM7XHJcbiAgfSlcclxuICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICByZXR1cm4gZXJyO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnQgQXJyYXlCdWZmZXJzIHRoZSBzYW1lIG9yZGVyLCBsaWtlIHRoZSBmaWxlbmFtZVxyXG4gKiBwYXJhbWV0ZXJzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGZpbGVuYW1lcyAgQXJyYXkgd2l0aCBmaWxlbmFtZXNcclxuICogQHBhcmFtICB7QXJyYXl9ICBiaW5CdWZmZXJzIEFycmF5IHdpdGggQXJyYXlCdWZmZXJcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIEFycmF5IHdpdGggc29ydGVkIEFycmF5QnVmZmVyc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5zb3J0QmluQnVmZmVycyA9IGZ1bmN0aW9uKGZpbGVuYW1lcywgYmluQnVmZmVycykge1xyXG4gIC8vIGZ1dGlsZT8/XHJcbiAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoZnVuY3Rpb24oZWwpIHtcclxuICAgIHJldHVybiBiaW5CdWZmZXJzW2VsXTtcclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmRXYXZlO1xyXG4iLCIvKipcclxuICogVGhpcyBpcyB0aGUgZm91bmRhdGlvbiBvZiB0aGUgSW50ZXJtaXggbGlicmFyeS5cclxuICogSXQgc2ltcGx5IGNyZWF0ZXMgdGhlIGF1ZGlvIGNvbnRleHQgb2JqZWN0c1xyXG4gKiBhbmQgZXhwb3J0cyBpdCBzbyBpdCBjYW4gYmUgZWFzaWx5IGNvbnN1bWVkXHJcbiAqIGZyb20gYWxsIGNsYXNzZXMgb2YgdGhlIGxpYnJhcnkuXHJcbiAqXHJcbiAqIEByZXR1cm4ge0F1ZGlvQ29udGV4dH0gVGhlIEF1ZGlvQ29udGV4dCBvYmplY3RcclxuICpcclxuICogQHRvZG8gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqIEB0b2RvIENoZWNrIGZvciBtb2JpbGUvaU9TIGNvbXBhdGliaWxpdHkuXHJcbiAqIEB0b2RvIENoZWNrIGlmIHdlJ3JlIHJ1bm5pbmcgb24gbm9kZVxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5TdXNwZW5kIGFuZCByZXN1bWUgdGhlIGF1ZGlvIGNvbnRleHQgdG9cclxuICogY3JlYXRlIGEgcGF1c2UgYnV0dG9uLiBUaGlzIHNob3VsZCBiZSB1c2VkIHdpdGggY3JlYXRlQXVkaW9Xb3JrZXJcclxuICogYXMgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gd2hlbiBzdXNwZW5kIGlzIGNhbGxlZCBvbiBhbiBvZmZsaW5lIGF1ZGlvIGNvbnRleHQuXHJcbiAqIFlvdSBjYW4gYWxzbyBwYXVzZSBzaW5nbGUgc291bmRzIHdpdGggPGk+U291bmQucGF1c2UoKTwvaT4uXHJcbiAqIFBsZWFzZSByZWFkIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3N1c3BlbmRcIj50aGUgZGV2ZWxvcGVyIGRvY3MgYXQgTUROPC9hPlxyXG4gKiB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiB0aGlzLjwvY2FwdGlvbj5cclxuICogc3VzcmVzQnRuLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuICogICBpZihJbnRlcm1peC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XHJcbiAqICAgICBJbnRlcm1peC5zdXNwZW5kKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1Jlc3VtZSBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH0gZWxzZSBpZiAoSW50ZXJtaXguc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XHJcbiAqICAgICBJbnRlcm1peC5yZXN1bWUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnU3VzcGVuZCBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH1cclxuICogfVxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGF1ZGlvQ3R4ID0gbnVsbDtcclxuXHJcbnZhciBpc01vYmlsZSA9IHtcclxuICAnQW5kcm9pZCc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpO1xyXG4gIH0sXHJcbiAgJ2lPUyc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmV8aVBhZHxpUG9kL2kpO1xyXG4gIH0sXHJcbiAgJ0JsYWNrQmVycnknOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKTtcclxuICB9LFxyXG4gICdPcGVyYSc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9PcGVyYSBNaW5pL2kpO1xyXG4gIH0sXHJcbiAgV2luZG93czogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0lFTW9iaWxlL2kpIHx8XHJcbiAgICB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV1BEZXNrdG9wL2kpO1xyXG4gIH0sXHJcbiAgYW55OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAoaXNNb2JpbGUuQW5kcm9pZCgpIHx8XHJcbiAgICBpc01vYmlsZS5pT1MoKSB8fFxyXG4gICAgaXNNb2JpbGUuQmxhY2tCZXJyeSgpIHx8XHJcbiAgICBpc01vYmlsZS5PcGVyYSgpIHx8XHJcbiAgICBpc01vYmlsZS5XaW5kb3dzKCkpO1xyXG4gIH1cclxufTtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbiAgaWYgKHR5cGVvZiB3aW5kb3cuQXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgYXVkaW9DdHggPSBuZXcgd2luZG93LkF1ZGlvQ29udGV4dCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkblxcJ3QgaW5pdGlhbGl6ZSB0aGUgYXVkaW8gY29udGV4dC4nKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhdWRpb0N0eDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGFib3V0IGphdmFzY3JpcHQgZXZlbnRzISBJdCdzIGp1c3RcclxuICogYSBkZWZpbml0aW9uIG9mIHRoZSBldmVudHMgdGhhdCB0aGUgc2VxdWVuY2VyIGNhbiBoYW5kbGUgcGx1c1xyXG4gKiBzb21lIGZ1bmN0aW9ucyB0byBjcmVhdGUgdmFsaWQgZXZlbnRzLlxyXG4gKiBUaGUgY2xhc3MgZGVmaW5lcyB3aGljaCBzdWJzeXN0ZW0gaXMgaW52b2tlZCB0byBwcm9jZXNzIHRoZSBldmVudC5cclxuICogRXZlcnkgY2xhc3MgY2FuIGhhdmUgc2V2ZXJhbCB0eXBlcyBhbmQgYSB0eXBlIGNvbnNpc3RzIG9mIG9uZSBvclxyXG4gKiBtb3JlIHByb3BlcnRpZXMuXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhIG5vdGUgZXZlbnQgZm9yIGFuIGF1ZGlvIG9iamVjdDwvY2FwdGlvbj5cclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdjMycsIDY1LCAxMjgsIGFTb3VuZE9iamVjdCk7XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBwcm9wZXJ0aWVzIGluIG9uZSBoYW5keSBhcnJheS5cclxuICogQHR5cGUge0FycmF5fVxyXG4gKi9cclxudmFyIGV2UHJvcCA9IFtcclxuICAnaW5zdHJ1bWVudCcsIC8vIHRoZSBldmVudCByZWNlaXZlclxyXG4gICd0b25lJywgICAgICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3IGJlZ2lubmluZyBhdCBjMFxyXG4gICdkdXJhdGlvbicsICAgLy8gSW50IHJlcHJlc2VudGluZyBhIG51bWJlciBvZiA2NHRoIG5vdGVzXHJcbiAgJ3ZlbG9jaXR5JywgICAvLyBJbnQgYmV0d2VlbiAwIGFuZCAxMjdcclxuICAncGl0Y2gnLFxyXG4gICd2b2x1bWUnLFxyXG4gICdwYW4nXHJcbl07XHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IHR5cGVzIGFuZCB0aGUgcHJvcGVydGllcyBhc3NvdGlhdGVkIHdpdGggdGhlbS5cclxuICogVHlwZSBhcmUgdmFsaWQgd2l0aCBvbmUsIHNldmVyYWwgb3IgYWxsIG9mIGl0cyBwcm9wZXJ0aWVzLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2VHlwZSA9IHtcclxuICAnbm90ZSc6IFsgZXZQcm9wWzBdLCBldlByb3BbMV0sIGV2UHJvcFsyXSwgZXZQcm9wWzNdIF0sXHJcbiAgJ2NvbnRyb2wnOiBbIGV2UHJvcFs0XSwgZXZQcm9wWzVdLCBldlByb3BbNl0gXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBjbGFzc2VzIGFuZCB0aGUgdHlwZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG52YXIgZXZDbGFzcyA9IHtcclxuICAnYXVkaW8nOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnc3ludGgnOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnZngnOiBbXSxcclxuICAnbWlkaSc6IFtdLFxyXG4gICdvc2MnOiBbXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyB0aGUgY2xhc3Mgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgdHJ1ZSBpZiBjbGFzcyBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlQ2xhc3MgPSBmdW5jdGlvbihlQ2xhc3MpIHtcclxuICBpZiAoZXZDbGFzcy5oYXNPd25Qcm9wZXJ0eShlQ2xhc3MpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIHR5cGUgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVUeXBlIEV2ZW50IHR5cGVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgdHlwZSBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlVHlwZSA9IGZ1bmN0aW9uKGVUeXBlKSB7XHJcbiAgaWYgKGV2VHlwZS5oYXNPd25Qcm9wZXJ0eShlVHlwZSkpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhbiBpbnN0cnVtZW50IGlzIGFuIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHBvb3JseSB3ZWFrIHRlc3QgYnV0IHRoYXQnc1xyXG4gKiBhbGwgd2UgY2FuIGRvIGhlcmUuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gaW5zdHIgQW4gaW5zdHJ1bWVudCBvYmplY3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICB0cnVlIGlmIGl0J3MgYW4gb2JqZWN0LCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BJbnN0cnVtZW50ID0gZnVuY3Rpb24oaW5zdHIpIHtcclxuICBpZiAodHlwZW9mIGluc3RyID09PSAnb2JqZWN0Jykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgdG9uZSBvciB2ZWxvY2l0eSB2YWx1ZSBpc1xyXG4gKiBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgMTI3LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIFRoZSBudW1iZXIgdGhhdCByZXByZXNlbnRzIGEgdG9uZVxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgdG9uZSwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wVG9uZVZlbG8gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDAgJiYgdmFsdWUgPD0gMTI3KSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgaWYgYSBkdXJhdGlvbiBpcyBhIHBvc2l0aXZlIGludGVnZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0ludH0gIHZhbHVlICAgTnVtYmVyIHJlcHJlc2VudGluZyBtdWx0aXBsZSA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgVHJ1ZSBpZiBpdHMgYSB2YWxpZCBkdXJhdGlvbiwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wRHVyYXRpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBhbiBvYmplY3Qgb2YgZXZlbnQgcHJvcGVydGllcy5cclxuICogSXQgY2hlY2tzIHRoZSBwcm9wZXJ0aWVzIGFyZSB2YWxpZCBmb3IgdGhlIGdpdmVuIHR5cGUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzICBPYmplY3Qgd2l0aCBldmVudCBwcm9wZXJ0aWVzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgICBFdmVudCB0eXBlIHRvIHZhbGlkYXRlIGFnYWluc3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgIHRydWUgaWYgYWxsIHByb3BzIGFyZSB2YWxpZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wcyA9IGZ1bmN0aW9uKGVQcm9wcywgZVR5cGUpIHtcclxuICB2YXIgdHlwZSA9IGV2VHlwZVtlVHlwZV07XHJcbiAgZm9yICh2YXIga2V5IGluIGVQcm9wcykgIHtcclxuICAgIGlmIChldlByb3AuaW5kZXhPZihrZXkpID09PSAtMSAmJlxyXG4gICAgdHlwZS5pbmRleE9mKGtleSkgPT09IC0xKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYSBzdHJpbmcgb2YgdGhlIGZvcm0gYzMgb3IgZCM0IGFuZFxyXG4gKiByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIG51bWJlci5cclxuICogQHBhcmFtICB7U3RyaW5nfSB0b25lIFN0cmluZyByZXByZXNlbnRpbmcgYSBub3RlXHJcbiAqIEByZXR1cm4ge0ludH0gICAgICAgICBOdW1iZXIgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKi9cclxudmFyIGNvbnZlcnRUb25lID0gZnVuY3Rpb24odG9uZSkge1xyXG4gIHZhciBub3RlcyA9IFsnYycsICdjIycsICdkJywgJ2QjJywgJ2UnLCAnZicsICdmIycsICdnJywgJ2cjJywgJ2EnLCAnYSMnLCAnYiddO1xyXG4gIHZhciBzdHIgPSB0b25lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIGlmIChzdHIubWF0Y2goL15bYS1oXSM/WzAtOV0kLykpIHtcclxuICAgIHZhciBub3RlID0gc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSk7XHJcbiAgICB2YXIgb2N0ID0gc3RyLnNsaWNlKC0xKTtcclxuXHJcbiAgICBpZiAobm90ZSA9PT0gJ2gnKSB7XHJcbiAgICAgIG5vdGUgPSAnYic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm90ZXMuaW5kZXhPZihub3RlKSArIG9jdCAqIDEyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VudmFsaWQgc3RyaW5nLiBIYXMgdG8gYmUgbGlrZSBbYS1oXTwjPlswLTldJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzZXF1ZW5jZXIgZXZlbnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgIEV2ZW50IHR5cGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICBTZXF1ZW5jZXIgZXZlbnRcclxuICovXHJcbnZhciBjcmVhdGVFdmVudCA9IGZ1bmN0aW9uKGVDbGFzcywgZVR5cGUsIGVQcm9wcykge1xyXG4gIGlmICh2YWxpZGF0ZUNsYXNzKGVDbGFzcykgJiZcclxuICAgIHZhbGlkYXRlVHlwZShlVHlwZSkgJiZcclxuICAgIHZhbGlkYXRlUHJvcHMoZVByb3BzLCBlVHlwZSkpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICdjbGFzcyc6IGVDbGFzcyxcclxuICAgICAgJ3R5cGUnOiBlVHlwZSxcclxuICAgICAgJ3Byb3BzJzogZVByb3BzXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjcmVhdGUgc2VxdWVuY2VyIGV2ZW50LiBXcm9uZyBwYXJhbWV0ZXJzJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gYXVkaW8gbm90ZSBldmVudFxyXG4gKiBAcGFyYW0gIHtJbnR8U3RyaW5nfSB0b25lICAgICBUb25lIGJldHdlZW4gMCBhbmQgMTI3IG9yIHN0cmluZyAoYzMsIGQjNClcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgdmVsb2NpdHkgVmVsb2NpdHkgYmV0d2VlbiAwIGFuZCAxMjdcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgZHVyYXRpb24gRHVyYXRpb24gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICBBbGwgcHJvcGVydGllcyBpbiBvbmUgb2JqZWN0XHJcbiAqL1xyXG52YXIgY3JlYXRlQXVkaW9Ob3RlID0gZnVuY3Rpb24odG9uZSwgdmVsb2NpdHksIGR1cmF0aW9uLCBpbnN0cikge1xyXG4gIHZhciBwcm9wcyA9IHt9O1xyXG4gIGlmICh0eXBlb2YgdG9uZSA9PT0gJ3N0cmluZycpIHtcclxuICAgIHRvbmUgPSBjb252ZXJ0VG9uZSh0b25lKTtcclxuICB9XHJcbiAgaWYgKHRvbmUgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odG9uZSkpIHtcclxuICAgIHByb3BzLnRvbmUgPSB0b25lO1xyXG4gIH1cclxuICBpZiAodmVsb2NpdHkgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odmVsb2NpdHkpKSB7XHJcbiAgICBwcm9wcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xyXG4gIH1cclxuICBpZiAoZHVyYXRpb24gJiYgdmFsaWRhdGVQcm9wRHVyYXRpb24oZHVyYXRpb24pKSB7XHJcbiAgICBwcm9wcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gIH1cclxuICBpZiAoaW5zdHIgJiYgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudChpbnN0cikpIHtcclxuICAgIHByb3BzLmluc3RydW1lbnQgPSBpbnN0cjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBIHNlcXVlbmNlciBldmVudCBtdXN0IGhhdmUgYW4gaW5zdHJ1bWVudCBhcyBwcm9wZXJ0eScpO1xyXG4gIH1cclxuICByZXR1cm4gY3JlYXRlRXZlbnQoJ2F1ZGlvJywgJ25vdGUnLCBwcm9wcyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBjbGFzczogZXZDbGFzcyxcclxuICB0eXBlOiBldlR5cGUsXHJcbiAgcHJvcGVydHk6IGV2UHJvcCxcclxuICBjcmVhdGVBdWRpb05vdGU6IGNyZWF0ZUF1ZGlvTm90ZVxyXG59O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5JdCBpcyBqdXN0IGZvciBsaWJyYXJ5IGludGVybmFsXHJcbiAqIHVzYWdlLiBTZWUgU2VxdWVuY2VyLmpzIGZvciBkZXRhaWxzLjwvY2FwdGlvbj5cclxuICogd29ya2VyLnBvc3RNZXNzYWdlKHsgJ2ludGVydmFsJzogMjAwIH0pO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gKiB3b3JrZXIudGVybWluYXRlKCk7ICAvL3dlYndvcmtlciBpbnRlcm5hbCBmdW5jdGlvbiwganVzdCBmb3IgY29tcGxldGVuZXNzXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdGltZXIgPSBudWxsO1xyXG52YXIgaW50ZXJ2YWwgPSAxMDA7XHJcblxyXG52YXIgd29ya2VyID0gZnVuY3Rpb24oc2VsZikge1xyXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhLmludGVydmFsKSB7XHJcbiAgICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4gICAgICBpZiAodGltZXIpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gd29ya2VyO1xyXG4iXX0=
