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
      this.loadFiles(audioSrc).then(function(binBuffers) {
        this.buffer = this.concatBinariesToAudioBuffer(binBuffers, this.buffer);
      });
    } else if (audioSrc instanceof ArrayBuffer) {
      //one audio buffer to decode
      this.buffer = this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple audio buffers to decode and concatenate
      this.concatBinariesToAudioBuffer(audioSrc);
    } else {
      throw new Error('Cannot create SoundWave object: Unsupported data format');
    }
  } else {
    //start the object with empty buffer. Usefull for testing and advanced usage.
  }

};

/**
 * Takes binary audio data, turns it into an audio buffer object and
 * stores it in this.buffer.
 * Basically a wrapper for the web-audio-api decodeAudioData function.
 * It uses the new promise syntax so it probably won't work in all browsers by now.
 * @private
 * @param  {ArrayBuffer}  rawAudioSrc Audio data in raw binary format
 * @return {Promise}                  Promise that indicates if operation was successfull.
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
 * Concatenates one or more ArrayBuffers to an AudioBuffer.
 * @private
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
 * @private
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIGludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbmludGVybWl4LmV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XHJcbmludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbmludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5pbnRlcm1peC5TZXF1ZW5jZXIgPSByZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpO1xyXG5pbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGludGVybWl4O1xyXG4iLCJ2YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcblxudmFyIHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgdmFyIHdrZXk7XG4gICAgdmFyIGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICB2YXIgZXhwID0gY2FjaGVba2V5XS5leHBvcnRzO1xuICAgICAgICAvLyBVc2luZyBiYWJlbCBhcyBhIHRyYW5zcGlsZXIgdG8gdXNlIGVzbW9kdWxlLCB0aGUgZXhwb3J0IHdpbGwgYWx3YXlzXG4gICAgICAgIC8vIGJlIGFuIG9iamVjdCB3aXRoIHRoZSBkZWZhdWx0IGV4cG9ydCBhcyBhIHByb3BlcnR5IG9mIGl0LiBUbyBlbnN1cmVcbiAgICAgICAgLy8gdGhlIGV4aXN0aW5nIGFwaSBhbmQgYmFiZWwgZXNtb2R1bGUgZXhwb3J0cyBhcmUgYm90aCBzdXBwb3J0ZWQgd2VcbiAgICAgICAgLy8gY2hlY2sgZm9yIGJvdGhcbiAgICAgICAgaWYgKGV4cCA9PT0gZm4gfHwgZXhwLmRlZmF1bHQgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXdrZXkpIHtcbiAgICAgICAgd2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgd2NhY2hlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgICAgIHdjYWNoZVtrZXldID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZXNbd2tleV0gPSBbXG4gICAgICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnLCdtb2R1bGUnLCdleHBvcnRzJ10sICcoJyArIGZuICsgJykoc2VsZiknKSxcbiAgICAgICAgICAgIHdjYWNoZVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgc2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuXG4gICAgdmFyIHNjYWNoZSA9IHt9OyBzY2FjaGVbd2tleV0gPSB3a2V5O1xuICAgIHNvdXJjZXNbc2tleV0gPSBbXG4gICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZSddLCAoXG4gICAgICAgICAgICAvLyB0cnkgdG8gY2FsbCBkZWZhdWx0IGlmIGRlZmluZWQgdG8gYWxzbyBzdXBwb3J0IGJhYmVsIGVzbW9kdWxlXG4gICAgICAgICAgICAvLyBleHBvcnRzXG4gICAgICAgICAgICAndmFyIGYgPSByZXF1aXJlKCcgKyBzdHJpbmdpZnkod2tleSkgKyAnKTsnICtcbiAgICAgICAgICAgICcoZi5kZWZhdWx0ID8gZi5kZWZhdWx0IDogZikoc2VsZik7J1xuICAgICAgICApKSxcbiAgICAgICAgc2NhY2hlXG4gICAgXTtcblxuICAgIHZhciBzcmMgPSAnKCcgKyBidW5kbGVGbiArICcpKHsnXG4gICAgICAgICsgT2JqZWN0LmtleXMoc291cmNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdpZnkoa2V5KSArICc6WydcbiAgICAgICAgICAgICAgICArIHNvdXJjZXNba2V5XVswXVxuICAgICAgICAgICAgICAgICsgJywnICsgc3RyaW5naWZ5KHNvdXJjZXNba2V5XVsxXSkgKyAnXSdcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSkuam9pbignLCcpXG4gICAgICAgICsgJ30se30sWycgKyBzdHJpbmdpZnkoc2tleSkgKyAnXSknXG4gICAgO1xuXG4gICAgdmFyIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCB8fCB3aW5kb3cubW96VVJMIHx8IHdpbmRvdy5tc1VSTDtcblxuICAgIHJldHVybiBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgIG5ldyBCbG9iKFtzcmNdLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pXG4gICAgKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBwYXJ0IG9mIGEgc2VxdWVuY2UuIEl0IGNhbiBiZVxyXG4gKiB1c2VkIGluIG1hbnkgd2F5czpcclxuICogPHVsPlxyXG4gKiA8bGk+QSBwYXJ0IG9mIGEgdHJhY2sgbGlrZSBpbiBwaWFuby1yb2xsIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8bGk+QSBwYXR0ZXJuIGxpa2UgaW4gc3RlcCBzZXF1ZW5jZXJzLCBkcnVtIGNvbXB1dGVycyBhbmQgdHJhY2tlcnM8L2xpPlxyXG4gKiA8bGk+QSBsb29wIGxpa2UgaW4gbGl2ZSBzZXF1ZW5jZXJzPC9saT5cclxuICogPC91bD5cclxuICogVGVjaG5pY2FsbHkgaXQgY2FuIHN0b3JlIGFueSB0eXBlIG9mIGV2ZW50IHlvdXIgc3lzdGVtIGlzIGNhcGFibGUgb2YuXHJcbiAqIFRoaXMgbWVhbnMgaXQgaXMgbm90IGxpbWl0ZWQgdG8gYXVkaW8sIG1pZGksIG9zYyBvciBkbXggYnV0IGNhbiBob2xkXHJcbiAqIGFueSB0eXBlIG9mIGphdmFzY3JpcHQgb2JqZWN0LiBBIHBvc3NpYmxlIHVzZWNhc2Ugd291bGQgYmUgdG8gdHJpZ2dlclxyXG4gKiBzY3JlZW4gZXZlbnRzIHdpdGggdGhlIGRyYXcgZnVuY3Rpb24gb2YgdGhlIHNlcXVlbmNlciBvYmplY3QuXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmVPYmplY3QpO1xyXG4gKiB2YXIgc2VxID0gbmV3IGludGVybWl4LlNlcXVlbmNlcigpO1xyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBub3RlID0gaW50ZXJtaXguZXZlbnRzLmNyZWF0ZUF1ZGlvTm90ZSgnYTMnLCAxLCAwLCBzb3VuZCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQobm90ZSwgMCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQobm90ZSwgNCk7XHJcbiAqIHNlcS5hZGRQYXJ0KHBhcnQsIDApO1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggICAgICAgTGVuZ3RoIG9mIHRoZSBwYXJ0IGluIDY0dGggbm90ZXMgKGRlZmF1bHQ6IDY0KVxyXG4gKi9cclxudmFyIFBhcnQgPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gMTY7IC8vIChyZXNvbHV0aW9uICogbXVsdGlwbHkpIHNob3VsZCBhbHdhc3kgYmUgNjRcclxuICB0aGlzLm11bHRpcGx5ID0gNDsgICAgLy8gcmVzb2x1dGlvbiBtdWx0aXBsaWVyXHJcbiAgdGhpcy5sZW5ndGggPSA2NDsgICAgIC8vIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAgdGhpcy5uYW1lID0gJ1BhcnQnOyAgIC8vIG5hbWUgb2YgdGhpcyBwYXJ0XHJcbiAgdGhpcy5wYXR0ZXJuID0gW107ICAgIC8vIHRoZSBhY3R1YWwgcGF0dGVybiB3aXRoIG5vdGVzIGV0Yy5cclxuXHJcbiAgaWYgKGxlbmd0aCkge1xyXG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XHJcbiAgfVxyXG5cclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLmluaXRQYXR0ZXJuKHRoaXMubGVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIGFuIGVtcHR5IHBhdHRlcm4gZm9yIHRoZSBwYXJ0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIG1lc3VyZWQgaW4gYmFycyAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhdHRlcm4gPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuICB2YXIgcGF0dGVybiA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgKGxlbmd0aCk7IGkrKykge1xyXG4gICAgcGF0dGVybltpXSA9IFtdO1xyXG4gIH1cclxuICByZXR1cm4gcGF0dGVybjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IHRvIHRoZSBwYXR0ZXJuIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gICAgdGhpcy5wYXR0ZXJuW3Bvc10ucHVzaChzZXFFdmVudCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUG9zaXRpb24gb3V0IG9mIHBhdHRlcm4gYm91bmRzLicpO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFuIGV2ZW50IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gIHZhciBpbmRleCA9IHRoaXMucGF0dGVybltwb3NdLmluZGV4T2Yoc2VxRXZlbnQpO1xyXG4gIHRoaXMucGF0dGVybltwb3NdLnNwbGljZShpbmRleCwgMSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtJbnR9ICAgIExlbmd0aCBvZiB0aGUgcGF0dGVyblxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGF0dGVybi5sZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NpdGlvbnMgdGhhdCBjb250YWluIGF0IGxlYXN0IG9uZSBldmVudC5cclxuICogQ2FuIGJlIGhhbmR5IHRvIGRyYXcgZXZlbnRzIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPmZyb20ge0B0dXRvcmlhbCBTdGVwc2VxdWVuY2VyfTwvY2FwdGlvbj5cclxuICogYmRTdGVwcyA9IGJkUGFydC5nZXROb3RlUG9zaXRpb25zKCk7XHJcbiAqIGJkU3RlcHMuZm9yRWFjaChmdW5jdGlvbihwb3MpIHtcclxuICogICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmQnICsgcG9zKS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmVkJztcclxuICogfSk7XHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpOyAgIC8vcHJlcGFyZXMgdGhlIHdvcmtlciBmb3IgYnJvd3NlcmlmeVxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgd29ya2VyID0gcmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBtYWluIGNsYXNzIG9mIHRoZSBzZXF1ZW5jZXIuIEl0IGRvZXMgdGhlIHF1ZXVpbmcgb2ZcclxuICogcGFydHMgYW5kIGV2ZW50cyBhbmQgcnVucyB0aGUgc2NoZWR1bGVycyB0aGF0IGZpcmUgZXZlbnRzXHJcbiAqIGFuZCBkcmF3cyB0byB0aGUgc2NyZWVuLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQoc29tZU5vdGUsIDApO1xyXG4gKiBzZXEuYWRkUGFydChwYXJ0LCAwKTtcclxuICogc2VxLnN0YXJ0KCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJwbSA9IDEyMDsgICAgICAgICAgICAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5xdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLnRpbWVQZXJTdGVwOyAgICAgICAgICAgLy9wZXJpb2Qgb2YgdGltZSBiZXR3ZWVuIHR3byBzdGVwc1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDsgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBuZXh0IHN0ZXAgd2lsbCBiZSB0cmlnZ2VyZWRcclxuICB0aGlzLm5leHRTdGVwID0gMDsgICAgICAgICAgLy9wb3NpdGlvbiBpbiB0aGUgcXVldWUgdGhhdCB3aWxsIGdldCB0cmlnZ2VyZWQgbmV4dFxyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSAwOyAgICAvL3N0ZXAgaW4gcXVldWUgdGhhdCB3YXMgcGxheWVkIChub3QgdHJpZ2dlcmVkKSByZWNlbnRseSAodXNlZCBmb3IgZHJhd2luZykuXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7ICAgICAgICAgIC8vcGxheSBhIHNlY3Rpb24gb2YgdGhlIHF1ZXVlIGluIGEgbG9vcFxyXG4gIHRoaXMubG9vcFN0YXJ0OyAgICAgICAgICAgICAvL2ZpcnN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmxvb3BFbmQ7ICAgICAgICAgICAgICAgLy9sYXN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlOyAgICAgLy90cnVlIGlmIHNlcXVlbmNlciBpcyBydW5uaW5nLCBvdGhlcndpc2UgZmFsc2VcclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lOyAgICAgICAgLy9oYXMgdG8gYmUgb3ZlcnJpZGRlbiB3aXRoIGEgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGluIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RyYXcgZnVuY3Rpb24gd2l0aCB0aGUgbGFzdFBsYXllZFN0ZXAgaW50IGFzIHBhcmFtZXRlci5cclxuXHJcbiAgLy8gc2V0IHRpbWUgcGVyIHNldFRpbWVQZXJTdGVwXHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAodGhpcy5icG0sIHRoaXMucmVzb2x1dGlvbik7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgdGhlIHNjaGVkdWxlci10aW1lclxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIgPSB3b3JrKHdvcmtlcik7XHJcblxyXG4gIC8qZXNsaW50LWVuYWJsZSAqL1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICd0aWNrJykge1xyXG4gICAgICBzZWxmLnNjaGVkdWxlcigpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoeydpbnRlcnZhbCc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBldmVudHMgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlIGFuZCBmaXJlcyB0aGVtLlxyXG4gKiBJdCBnZXRzIGNhbGxlZCBhdCBhIGNvbnN0YW50IHJhdGUsIGxvb2tzIGFoZWFkIGluXHJcbiAqIHRoZSBxdWV1ZSBhbmQgZmlyZXMgYWxsIGV2ZW50cyBpbiB0aGUgbmVhciBmdXR1cmVcclxuICogd2l0aCBhIGRlbGF5IGNvbXB1dGVkIGZyb20gdGhlIGN1cnJlbnQgYnBtIHZhbHVlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zY2hlZHVsZXIgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbGltaXQgPSBjb3JlLmN1cnJlbnRUaW1lICsgdGhpcy5sb29rYWhlYWQ7XHJcbiAgLy8gaWYgaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUgb3IgcHJldmlvdXNseSBzdG9wcGVkXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCBsaW1pdCkge1xyXG4gICAgdGhpcy5hZGRQYXJ0c1RvUnVucXVldWUoKTtcclxuICAgIHRoaXMuZmlyZUV2ZW50cygpO1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICB0aGlzLnNldFF1ZXVlUG9pbnRlcigpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyBpbiB0aGUgbWFzdGVyIHF1ZXVlIGZvciBwYXJ0cyBhbmQgYWRkc1xyXG4gKiBjb3BpZXMgb2YgdGhlbSB0byB0aGUgcnVucXVldWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnRzVG9SdW5xdWV1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0eXBlb2YgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICB2YXIgcGFydCA9IHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF1bMF07XHJcbiAgICAgIHBhcnQucG9pbnRlciA9IDA7XHJcbiAgICAgIHRoaXMucnVucXVldWUucHVzaChwYXJ0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0uZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XHJcbiAgICAgICAgcGFydC5wb2ludGVyID0gMDtcclxuICAgICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2gocGFydCk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWxldGVzIHBhcnRzIGZyb20gcnVucXVldWUuIEl0IGlzIGltcG9ydGFudCwgdGhhdCB0aGUgaW5kaWNlc1xyXG4gKiBvZiB0aGUgcGFydHMgYXJlIHNvcnRlZCBmcm9tIG1heCB0byBtaW4uIE90aGVyd2lzZSB0aGUgZm9yRWFjaFxyXG4gKiBsb29wIHdvbid0IHdvcmsuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBpbmRpY2VzICBJbmRpY2VzIG9mIHRoZSBwYXJ0cyBpbiB0aGUgcnVucXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZGVsZXRlUGFydHNGcm9tUnVucXVldWUgPSBmdW5jdGlvbihpbmRpY2VzKSB7XHJcbiAgaWYgKGluZGljZXMubGVuZ3RoID4gMCkge1xyXG4gICAgaW5kaWNlcy5mb3JFYWNoKGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLnJ1bnF1ZXVlW2lkXS5wb2ludGVyO1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnNwbGljZShpZCwgMSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRmlyZXMgYWxsIGV2ZW50cyBmb3IgdGhlIHVwY29tbWluZyBzdGVwLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5maXJlRXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIG1hcmtGb3JEZWxldGUgPSBbXTtcclxuICB0aGlzLnJ1bnF1ZXVlLmZvckVhY2goZnVuY3Rpb24ocGFydCwgaW5kZXgpIHtcclxuICAgIGlmIChwYXJ0LnBvaW50ZXIgPT09IHBhcnQubGVuZ3RoIC0gMSkge1xyXG4gICAgICBtYXJrRm9yRGVsZXRlLnVuc2hpZnQoaW5kZXgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyIHNlcUV2ZW50cyA9IHBhcnQucGF0dGVybltwYXJ0LnBvaW50ZXJdO1xyXG4gICAgICBpZiAoc2VxRXZlbnRzICYmIHNlcUV2ZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgc2VxRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAgICAgICAgIHRoaXMucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50LCB0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIH0gZWxzZSBpZiAoc2VxRXZlbnRzICYmIHNlcUV2ZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NTZXFFdmVudChzZXFFdmVudHNbMF0sIHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcGFydC5wb2ludGVyKys7XHJcbiAgfSwgdGhpcyk7XHJcbiAgdGhpcy5kZWxldGVQYXJ0c0Zyb21SdW5xdWV1ZShtYXJrRm9yRGVsZXRlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbnZva2VzIHRoZSBhcHByb3ByaWF0ZSBzdWJzeXN0ZW0gdG8gcHJvY2VzcyB0aGUgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IHRvIHByb2Nlc3NcclxuICogQHBhcmFtICB7ZmxvYXR9ICBkZWxheSAgICAgdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIGV2ZW50IHNob3VsZCBzdGFydFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5wcm9jZXNzU2VxRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgZGVsYXkpIHtcclxuICBpZiAoZGVsYXkpIHtcclxuICAgIHNlcUV2ZW50LnByb3BzWydkZWxheSddID0gZGVsYXk7XHJcbiAgfVxyXG4gIHNlcUV2ZW50LnByb3BzLmluc3RydW1lbnQucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBwb2ludGVyIHRvIHRoZSBuZXh0IHN0ZXAgdGhhdCBzaG91bGQgYmUgcGxheWVkXHJcbiAqIGluIHRoZSBtYXN0ZXIgcXVldWUuIElmIHdlJ3JlIHBsYXlpbmcgaW4gbG9vcCBtb2RlLFxyXG4gKiBqdW1wIGJhY2sgdG8gbG9vcHN0YXJ0IHdoZW4gZW5kIG9mIGxvb3AgaXMgcmVhY2hlZC5cclxuICogSWYgYSBwb2ludGVyIHBvc2l0aW9uIGlzIGdpdmVuLCBqdW1wIHRvIGl0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gICB7SW50fSAgIHBvc2l0aW9uICBOZXcgcG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICBpZiAodHlwZW9mIHBvc2l0aW9uICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgdGhpcy5uZXh0U3RlcCA9IHBvc2l0aW9uO1xyXG4gICAgdGhpcy5ydW5xdWV1ZSA9IFtdO1xyXG4gIH0gZWxzZSBpZiAodGhpcy5sb29wICYmIHRoaXMubmV4dFN0ZXAgPj0gdGhpcy5sb29wRW5kKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICB0aGlzLnJ1bnF1ZXVlID0gW107XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMubmV4dFN0ZXArKztcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoZSBxdWV1ZSBwb2ludGVyIChzZXQgdG8gcG9zaXRpb24gMCkuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zZXRRdWV1ZVBvaW50ZXIoMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIHRoZSBzZXF1ZW5jZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoIXRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gICAgdGhpcy5pc1J1bm5pbmcgPSB0cnVlO1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgKGhhbHRzIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uKVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDtcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgYW5kIHN1c3BlbmRzIHRoZSBBdWRpb0NvbnRleHQgdG9cclxuICogZ2xvYmFsbHkgaGFsdCBhbGwgYXVkaW8gc3RyZWFtcy4gSXQganVzdCBoYWx0cyBpZlxyXG4gKiBpZiBzZXF1ZW5jZXIgYW5kIEF1ZGlvQ29udGV4dCBib3RoIGFyZSBpbiBydW5uaW5nIHN0YXRlLlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGhhbHRlZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKGNvcmUuc3RhdGUgPT09ICdydW5uaW5nJyAmJiB0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zdG9wKCk7XHJcbiAgICBjb3JlLnN1c3BlbmQoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgdGhlIEF1ZGlvQ29udGV4dCBhbmQgc3RhcnRzIHRoZSBzZXF1ZW5jZXIgYXQgaXRzXHJcbiAqIGN1cnJlbnQgcG9zaXRpb24uIEl0IGp1c3Qgc3RhcnRzIGlmIHNlcXVlbmNlciBhbmQgQXVkaW9Db250ZXh0XHJcbiAqIGJvdGggYXJlIHN0b3BwZWQuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgcmVzdW1lZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmIChjb3JlLnN0YXRlID09PSAnc3VzcGVuZGVkJyAmJiAhdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc3RhcnQoKTtcclxuICAgIGNvcmUucmVzdW1lKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY2hlZHVsZXIgdGhhdCBydW5zIGEgZHJhd2luZyBmdW5jdGlvbiBldmVyeSB0aW1lXHJcbiAqIHRoZSBzY3JlZW4gcmVmcmVzaGVzLiBUaGUgZnVuY3Rpb24gU2VxdWVuY2VyLmFuaW1hdGlvbkZyYW1lKClcclxuICogaGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggc3R1ZmYgdG8gYmUgZHJhd24gb24gdGhlIHNjcmVlbi5cclxuICogSXQgY2FsbHMgaXRzZWxmIHJlY3Vyc2l2ZWx5IG9uIGV2ZXJ5IGZyYW1lIGFzIGxvbmcgYXMgdGhlIHNlcXVlbmNlciBpcyBydW5uaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gZmlyc3Qgd2UnbGwgaGF2ZSB0byBmaW5kIG91dCwgd2hhdCBzdGVwIHdhcyBwbGF5ZWQgcmVjZW50bHkuXHJcbiAgLy8gdGhpcyBpcyBzb21laG93IGNsdW1zeSBiZWNhdXNlIHRoZSBzZXF1ZW5jZXIgZG9lc24ndCBrZWVwIHRyYWNrIG9mIHRoYXQuXHJcbiAgdmFyIGxvb2tBaGVhZERlbHRhID0gdGhpcy5uZXh0U3RlcFRpbWUgLSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIGlmIChsb29rQWhlYWREZWx0YSA+PSAwKSB7XHJcbiAgICB2YXIgc3RlcHNBaGVhZCA9IE1hdGgucm91bmQobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKTtcclxuXHJcbiAgICBpZiAodGhpcy5uZXh0U3RlcCA8IHN0ZXBzQWhlYWQpIHtcclxuICAgICAgLy8gd2UganVzdCBqdW1wZWQgdG8gdGhlIHN0YXJ0IG9mIGEgbG9vcFxyXG4gICAgICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5sb29wRW5kICsgdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy51cGRhdGVGcmFtZSh0aGlzLmxhc3RQbGF5ZWRTdGVwKTtcclxuICB9XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJ1bnMgYmV0d2VlbiBzY3JlZW4gcmVmcmVzaC4gSGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlXHJcbiAqIGFwcCB0byByZW5kZXIgdG8gdGhlIHNjcmVlbi5cclxuICogQHBhcmFtICB7SW50fSAgbGFzdFBsYXllZFN0ZXAgIFRoZSA2NHRoIHN0ZXAgdGhhdCB3YXMgcGxheWVkIHJlY2VudGx5XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnVwZGF0ZUZyYW1lID0gZnVuY3Rpb24obGFzdFBsYXllZFN0ZXApIHtcclxuICBjb25zb2xlLmxvZyhsYXN0UGxheWVkU3RlcCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhIHBhcnQgdG8gdGhlIG1hc3RlciBxdWV1ZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICAgQW4gaW5zdGFuY2Ugb2YgUGFydFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmIChwYXJ0Lmxlbmd0aCAmJiBwYXJ0LnBhdHRlcm4pIHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gcGFyYW1ldGVyIGRvZXNuXFwndCBzZWVtIHRvIGJlIGEgcGFydCBvYmplY3QnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHBhcnQgb2JqZWN0IGZyb20gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcnQgICAgIFBhcnQgaW5zdGFuY2UgdG8gYmUgcmVtb3ZlZFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uIFBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVtb3ZlUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHRoaXMucXVldWVbcG9zaXRpb25dIGluc3RhbmNlb2YgQXJyYXkgJiZcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLmxlbmd0aCA+IDApIHtcclxuICAgIHZhciBpbmRleCA9IHRoaXMucXVldWVbcG9zaXRpb25dLmluZGV4T2YocGFydCk7XHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnQgbm90IGZvdW5kIGF0IHBvc2l0aW9uICcgKyBwb3NpdGlvbiArICcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEBwYXJhbSAge0ludH0gICBicG0gYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRCcG0gPSBmdW5jdGlvbihicG0pIHtcclxuICB0aGlzLmJwbSA9IGJwbTtcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcChicG0sIHRoaXMucmVzb2x1dGlvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29tcHV0ZXMgdGhlIHRpbWUgaW4gc2Vjb25kcyBhcyBmbG9hdCB2YWx1ZVxyXG4gKiBiZXR3ZWVuIG9uZSBzaG9ydGVzdCBwb3Nzc2libGUgbm90ZVxyXG4gKiAoNjR0aCBieSBkZWZhdWx0KSBhbmQgdGhlIG5leHQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgYnBtICAgICAgICBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcmVzb2x1dGlvbiBzaG9ydGVzdCBwb3NzaWJsZSBub3RlIHZhbHVlXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgICAgICAgICAgICB0aW1lIGluIHNlY29uZHNcclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0VGltZVBlclN0ZXAgPSBmdW5jdGlvbihicG0sIHJlc29sdXRpb24pIHtcclxuICByZXR1cm4gKDYwICogNCkgLyAoYnBtICogcmVzb2x1dGlvbik7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmdldExhc3RQbGF5ZWRTdGVwID0gZnVuY3Rpb24oKSB7XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1ha2VzIGEgY29weSBvZiBhIGZsYXQgYXJyYXkuXHJcbiAqIFVzZXMgYSBwcmUtYWxsb2NhdGVkIHdoaWxlLWxvb3BcclxuICogd2hpY2ggc2VlbXMgdG8gYmUgdGhlIGZhc3RlZCB3YXlcclxuICogKGJ5IGZhcikgb2YgZG9pbmcgdGhpczpcclxuICogaHR0cDovL2pzcGVyZi5jb20vbmV3LWFycmF5LXZzLXNwbGljZS12cy1zbGljZS8xMTNcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IHNvdXJjZUFycmF5IEFycmF5IHRoYXQgc2hvdWxkIGJlIGNvcGllZC5cclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIENvcHkgb2YgdGhlIHNvdXJjZSBhcnJheS5cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY29weUFycmF5ID0gZnVuY3Rpb24oc291cmNlQXJyYXkpIHtcclxuICB2YXIgZGVzdEFycmF5ID0gbmV3IEFycmF5KHNvdXJjZUFycmF5Lmxlbmd0aCk7XHJcbiAgdmFyIGkgPSBzb3VyY2VBcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGktLSkge1xyXG4gICAgZGVzdEFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XHJcbiAgfVxyXG4gIHJldHVybiBkZXN0QXJyYXk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcXVlbmNlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogUGxheSBhIHNvdW5kIHRoYXQgY2FuIGJlIGxvb3BlZC4gUGF1c2UvU3RhcnQgd29ya3Mgc2FtcGxlLWFjY3VyYXRlXHJcbiAqIGF0IGFueSByYXRlLiBIaXQgdGhlIHN0YXJ0IGJ1dHRvbiBtdWx0aXBsZSB0aW1lcyB0byBoYXZlIG11bHRpcGxlXHJcbiAqIHNvdW5kcyBwbGF5ZWQuIEFsbCBwYXJhbWV0ZXJzIGFyZSBhZGp1c3RhYmxlIGluIHJlYWx0aW1lLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdhdWRpb2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5zdGFydCgpO1xyXG4gKiBAdHV0b3JpYWwgU291bmRcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc291bmRXYXZlIFNvdW5kV2F2ZSBvYmplY3QgaW5jbHVkaW5nIHRoZSBidWZmZXIgd2l0aCBhdWRpbyBkYXRhIHRvIGJlIHBsYXllZFxyXG4gKi9cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oc291bmRXYXZlKSB7XHJcblxyXG4gIHRoaXMud2F2ZSA9IG51bGw7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAvL2FsbCBjdXJyZW50bHkgYWN0aXZlIHN0cmVhbXNcclxuICB0aGlzLmxvb3AgPSBmYWxzZTtcclxuICB0aGlzLmdhaW5Ob2RlID0gbnVsbDtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBudWxsO1xyXG5cclxuICB0aGlzLnNvdW5kTGVuZ3RoID0gMDtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgdGhpcy5zdGFydE9mZnNldHMgPSBbXTsgICAvL2hvbGRzIHN0YXJ0IG9mZnNldHMgaWYgcGF1c2VkXHJcbiAgdGhpcy5zdGFydFRpbWUgPSAwOyAgICAgICAvL3doZW4gdGhlIHNvdW5kIHN0YXJ0cyB0byBwbGF5XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IG51bGw7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSAxO1xyXG4gIHRoaXMuZGV0dW5lID0gMDtcclxuXHJcbiAgaWYgKHNvdW5kV2F2ZSkge1xyXG4gICAgdGhpcy53YXZlID0gc291bmRXYXZlO1xyXG4gICAgdGhpcy5idWZmZXIgPSBzb3VuZFdhdmUuYnVmZmVyO1xyXG4gICAgdGhpcy5zb3VuZExlbmd0aCA9IHRoaXMubG9vcEVuZCA9IHRoaXMuYnVmZmVyLmR1cmF0aW9uO1xyXG4gICAgdGhpcy5zZXR1cEF1ZGlvQ2hhaW4oKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgbWlzc2luZy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGdhaW4gYW5kIHN0ZXJlby1wYW5uZXIgbm9kZSwgY29ubmVjdHMgdGhlbVxyXG4gKiAoZ2FpbiAtPiBwYW5uZXIpIGFuZCBzZXRzIGdhaW4gdG8gMSAobWF4IHZhbHVlKS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXR1cEF1ZGlvQ2hhaW4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmdhaW5Ob2RlID0gY29yZS5jcmVhdGVHYWluKCk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gY29yZS5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcclxuICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5wYW5uZXJOb2RlKTtcclxuICB0aGlzLnBhbm5lck5vZGUuY29ubmVjdChjb3JlLmRlc3RpbmF0aW9uKTtcclxuICB0aGlzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW5kIGNvbmZpZ3VyZXMgYSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqIHRoYXQgY2FuIGJlIHBsYXllZCBvbmNlIGFuZCB0aGVuIGRlc3Ryb3lzIGl0c2VsZi5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7QnVmZmVyU291cmNlTm9kZX0gVGhlIEJ1ZmZlclNvdXJjZU5vZGVcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJ1ZmZlclNvdXJjZSA9IGNvcmUuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xyXG4gIGJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdvbmVuZGVkIGZpcmVkJyk7XHJcbiAgICBzZWxmLmRlc3Ryb3lCdWZmZXJTb3VyY2UoYnVmZmVyU291cmNlKTtcclxuICB9O1xyXG4gIHJldHVybiBidWZmZXJTb3VyY2U7XHJcbn07XHJcblxyXG4vKipcclxuICogRGVzdHJveWVzIGEgZ2l2ZW4gQXVkaW9CdWZmZXJTb3VyY2VOb2RlIGFuZCBkZWxldGVzIGl0XHJcbiAqIGZyb20gdGhlIHNvdXJjZU5vZGUgcXVldWUuIFRoaXMgaXMgdXNlZCBpbiB0aGUgb25lbmRlZFxyXG4gKiBjYWxsYmFjayBvZiBhbGwgQnVmZmVyU291cmNlTm9kZXMgdG8gYXZvaWQgZGVhZCByZWZlcmVuY2VzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtic05vZGV9IGJzTm9kZSB0aGUgYnVmZmVyU291cmNlIHRvIGJlIGRlc3Ryb3llZC5cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5kZXN0cm95QnVmZmVyU291cmNlID0gZnVuY3Rpb24oYnNOb2RlKSB7XHJcbiAgYnNOb2RlLmRpc2Nvbm5lY3QoKTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcclxuICAgIGlmIChub2RlID09PSBic05vZGUpIHtcclxuICAgICAgdGhpcy5xdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyBhIHNvdW5kIChBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIGFuZCBzdG9yZXMgYSByZWZlcmVuY2VzXHJcbiAqIGluIGEgcXVldWUuIFRoaXMgZW5hYmxlcyB5b3UgdG8gcGxheSBtdWx0aXBsZSBzb3VuZHMgYXQgb25jZVxyXG4gKiBhbmQgZXZlbiBzdG9wIHRoZW0gYWxsIGF0IGEgZ2l2ZW4gdGltZS5cclxuICogQHBhcmFtICB7Qm9vbGVhbn0gcGxheUxvb3BlZCBXaGV0aGVyIHRoZSBzb3VuZCBzaG91bGQgYmUgbG9vcGVkIG9yIG5vdFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkZWxheSAgICAgIFRpbWUgaW4gc2Vjb25kcyB0aGUgc291bmQgcGF1c2VzIGJlZm9yZSB0aGUgc3RyZWFtIHN0YXJ0c1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkdXJhdGlvbiAgIFRpbWUgcHJlcmlvZCBhZnRlciB0aGUgc3RyZWFtIHNob3VsZCBlbmRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKHBsYXlMb29wZWQsIGRlbGF5LCBkdXJhdGlvbikge1xyXG4gIGlmICh0aGlzLmlzUGF1c2VkICYmIHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgdGhpcy5yZXN1bWUoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHN0YXJ0VGltZSA9IDA7XHJcblxyXG4gICAgaWYgKGRlbGF5KSB7XHJcbiAgICAgIHN0YXJ0VGltZSA9IGRlbGF5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3RhcnRUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICAgIH1cclxuICAgIHZhciBicyA9IHRoaXMuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcblxyXG4gICAgaWYgKHBsYXlMb29wZWQpIHtcclxuICAgICAgYnMubG9vcCA9IHBsYXlMb29wZWQ7XHJcbiAgICAgIGJzLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgICBicy5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG4gICAgfVxyXG4gICAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gYnMudG1wUGxheWJhY2tSYXRlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgICBicy5kZXR1bmUudmFsdWUgPSB0aGlzLmRldHVuZTtcclxuICAgIGJzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTsgICAvLyBleHRlbmQgbm9kZSB3aXRoIGEgc3RhcnR0aW1lIHByb3BlcnR5XHJcblxyXG4gICAgdGhpcy5xdWV1ZS5wdXNoKGJzKTtcclxuICAgIGlmIChkdXJhdGlvbikge1xyXG4gICAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQsIGR1cmF0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW0sIGV2ZW4gdGhlIG9uZXMgdGhhdCBhcmUganVzdCBzY2hlZHVsZWQuXHJcbiAqIEl0IGFsc28gY2xlYW5zIHRoZSBxdWV1ZSBzbyB0aGF0IHRoZSBzb3VuZCBvYmplY3QgaXMgcmVhZHkgZm9yIGFub3RoZXIgcm91bmQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnN0b3AoKTtcclxuICAgIG5vZGUuZGlzY29ubmVjdCgpO1xyXG4gIH0pO1xyXG4gIHRoaXMucXVldWUgPSBbXTsgIC8vcmVsZWFzZSBhbGwgcmVmZXJlbmNlc1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW1zIG9mIHRoaXMgc291bmQgdGVtcG9yYXJpbHkuXHJcbiAqIFRoaXMgY3VycmVudGx5IGp1c3Qgd29ya3MgaW4gQ2hyb21lIDQ5KyBvbmx5LlxyXG4gKiBJZiB5b3Ugd2FudCBhIGdsb2JhbCwgYWNjdXJhdGUgcGF1c2UgZnVuY3Rpb25cclxuICogdXNlIHN1c3BlbmQvcmVzdW1lIGZyb20gdGhlIGNvcmUgbW9kdWxlLlxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICghdGhpcy5pc1BhdXNlZCkge1xyXG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgbm9kZS50bXBQbGF5YmFja1JhdGUgPSBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZTtcclxuICAgICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSAwLjA7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXN1bWVzIGFsbCBzdHJlYW1zIGlmIHRoZXkgd2VyZSBwYXVzZWQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gbm9kZS50bXBQbGF5YmFja1JhdGU7XHJcbiAgICBkZWxldGUgbm9kZS50bXBQbGF5YmFja1JhdGU7XHJcbiAgfSk7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFByb2Nlc3NlcyBhbiBldmVudCBmaXJlZCBieSB0aGUgc2VxdWVuY2VyLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50IEEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucHJvY2Vzc1NlcUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAvL3RoaXMuc2V0VG9uZShzZXFFdmVudC5wcm9wcy50b25lKTtcclxuICBpZiAoc2VxRXZlbnQucHJvcHMuZHVyYXRpb24pIHtcclxuICAgIHRoaXMuc3RhcnQoZmFsc2UsXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmRlbGF5LFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kdXJhdGlvbik7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMuc3RhcnQoZmFsc2UsXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmRlbGF5KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgc3RhcnRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3Agc3RhcnQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BTdGFydCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wU3RhcnQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBlbmRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3AgZW5kIGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wRW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wRW5kID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVsZWFzZXMgdGhlIGxvb3Agb2YgYWxsIHJ1bm5pbmcgbm9kZXMsXHJcbiAqIE5vZGVzIHdpbGwgcnVuIHVudGlsIGVuZCBhbmQgc3RvcC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZWxlYXNlTG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3AgPSBmYWxzZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHN0YXJ0IGFuZCBlbmRwb2ludCB0byBzdGFydCBlbmQgZW5kcG9pbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzZXRMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IHRoaXMuc291bmRMZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBzb3VuZCBpbiBwZXJjZW50YWdlXHJcbiAqICgxID0gMTAwJSwgMiA9IDIwMCUpXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgdmFsdWUgICBSYXRlIGluIHBlcmNlbnRhZ2VcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGVcclxuICogQHJldHVybiB7ZmxvYXR9ICBUaGUgcGxheWJhY2sgcmF0ZSBpbiBwZXJjZW50YWdlICgxLjI1ID0gMTI1JSlcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wbGF5YmFja1JhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSB0b25lIHdpdGhpbiB0d28gb2N0YXZlICgrLy0xMiB0b25lcylcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHNlbWkgdG9uZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFRvbmUgPSBmdW5jdGlvbihzZW1pVG9uZSkge1xyXG4gIGlmIChzZW1pVG9uZSA+PSAtMTIgJiYgc2VtaVRvbmUgPD0gMTIpIHtcclxuICAgIHRoaXMuZGV0dW5lID0gc2VtaVRvbmUgKiAxMDA7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignU2VtaSB0b25lIGlzICcgKyBzZW1pVG9uZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMi4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsYXN0IHBsYXllZCBzZW1pdG9uZS4gVGhpcyBkb2Vzbid0IGhhcyB0byBiZSBhblxyXG4gKiBpbnRlZ2VyIGJldHdlZW4gLS8rMTIgYXMgdGhlIHNvdW5kIGNhbiBiZSBkZXR1bmVkIHdpdGhcclxuICogbW9yZSBwcmVjaXNpb24uXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgU2VtaXRvbmUgYmV0d2VlbiAtLysxMlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmUgLyAxMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0dW5lIHRoZSBzb3VuZCBvc2NpbGxhdGlvbiBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICB2YWx1ZSAgZGV0dW5lIGluIGNlbnRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RGV0dW5lID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAodmFsdWUgPj0gLTEyMDAgJiYgdmFsdWUgPD0gMTIwMCkge1xyXG4gICAgdGhpcy5kZXR1bmUgPSB2YWx1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdEZXR1bmUgcGFyYW1ldGVyIGlzICcgKyB2YWx1ZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMjAwLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgdGhlIGN1cnJlbnQgZGV0dW5lIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHJldHVybiB7SW50ZWdlcn0gIERldHVuZSBpbiBjZW50c1xyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldERldHVuZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBpbiB1c2UgYW5kIGNhbiBwcm9iYWJseSBiZSByZW1vdmVkXHJcbiAqIEByZXR1cm4ge0ludH0gUmFuZG9tIG51bWJlclxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgaW4gd2hpY2ggYW4gYXVkaW8gYnVmZmVyIGxpdmVzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcgZWxzZS5cclxuICogSWYgeW91IHdhbnQgdG8gcGxheSB0aGUgc291bmQsIHlvdSBoYXZlIHRvIGFkZGl0aW9uYWxseSBjcmVhdGUgYVxyXG4gKiA8YSBocmVmPVwiU291bmQuaHRtbFwiPlNvdW5kPC9hPiBvYmplY3QuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIDwvcD48cD5cclxuICogTXVsdGlwbGUgc291cmNlcyB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIG9uZSBhdWRpbyBidWZmZXIuXHJcbiAqIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIGNyZWF0aW5nIG11bHRpcGxlIFNvdW5kV2F2ZSBvYmplY3RzLlxyXG4gKiBJdCdzIGxpa2UgYSB3YXZldGFibGU6IEFsbCBzdGFydC9lbmQgcG9zaXRpb25zIHdpbGwgYmUgc2F2ZWQgc29cclxuICogeW91IGNhbiB0cmlnZ2VyIHRoZSBvcmlnaW5hbCBzYW1wbGVzIHdpdGhvdXQgdXNpbmcgbXVsdGlwbGUgYnVmZmVycy5cclxuICogUG9zc2libGUgdXNhZ2VzIGFyZSBtdWx0aXNhbXBsZWQgc291bmRzLCBsb29wcyBvciB3YXZlc2VxdWVuY2VzIChraW5kIG9mKS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db25jYXRlbmF0ZSBtdWx0aXBsZSBzb3VyY2UgZmlsZXMgaW50byBvbmUgYnVmZmVyPGJyPlxyXG4gKiBpbiB0aGUgZ2l2ZW4gb3JkZXIgYW5kIHBsYXkgdGhlbSAoVGhpcyBpcyBicm9rZW4gaW4gdjAuMS4gRG9uJ3QgdXNlIGl0ISk6PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnZmlsZTEud2F2LGZpbGUyLndhdixmaWxlMy53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlxyXG4gKiBVc2luZyBBcnJheUJ1ZmZlcnMgaW5zdGVhZCBvZiBmaWxlbmFtZXMgd2lsbCBjb21lIGluIGhhbmR5IGlmIHlvdSB3YW50PGJyPlxyXG4gKiB0byBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIFhIUiBvciB1c2UgYSBwcmVsb2FkZXIgKGhlcmU6IHByZWxvYWQuanMpOlxyXG4gKiA8L2NhcHRpb24+XHJcbiAqIHZhciBxdWV1ZSA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKTtcclxuICogcXVldWUub24oJ2NvbXBsZXRlJywgaGFuZGxlQ29tcGxldGUpO1xyXG4gKiBxdWV1ZS5sb2FkTWFuaWZlc3QoW1xyXG4gKiAgICAge2lkOiAnc3JjMScsIHNyYzonZmlsZTEud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9LFxyXG4gKiAgICAge2lkOiAnc3JjMicsIHNyYzonZmlsZTIud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9XHJcbiAqIF0pO1xyXG4gKlxyXG4gKiBmdW5jdGlvbiBoYW5kbGVDb21wbGV0ZSgpIHtcclxuICogICAgIHZhciBiaW5EYXRhMSA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMScpO1xyXG4gKiAgICAgdmFyIGJpbkRhdGEyID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMyJyk7XHJcbiAqICAgICB2YXIgd2F2ZTEgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGExKTtcclxuICogICAgIHZhciB3YXZlMiA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTIpO1xyXG4gKiAgICAgdmFyIGNvbmNhdFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKFtiaW5EYXRhMSwgYmluRGF0YTJdKTtcclxuICogfTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAgeyhPYmplY3R8T2JqZWN0W118c3RyaW5nKX0gYXVkaW9TcmMgICBPbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqL1xyXG52YXIgU291bmRXYXZlID0gZnVuY3Rpb24oYXVkaW9TcmMpIHtcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDsgICAvL0F1ZGlvQnVmZmVyXHJcbiAgdGhpcy5tZXRhRGF0YSA9IFtdOyAgIC8vc3RhcnQtL2VuZHBvaW50cyBhbmQgbGVuZ3RoIG9mIHNpbmdsZSB3YXZlc1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKHR5cGVvZiBhdWRpb1NyYyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuZGVjb2RlQXVkaW9EYXRhKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgdHlwZW9mIGF1ZGlvU3JjWzBdID09PSAnc3RyaW5nJykge1xyXG4gICAgICAvL211bHRpcGxlIGZpbGVzIHRvIGxvYWQvZGVjb2RlIGFuZCBjYW5jYXRpbmF0ZVxyXG4gICAgICB0aGlzLmxvYWRGaWxlcyhhdWRpb1NyYykudGhlbihmdW5jdGlvbihiaW5CdWZmZXJzKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihiaW5CdWZmZXJzLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIGF1ZGlvIGJ1ZmZlciB0byBkZWNvZGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgYXVkaW9TcmNbMF0gaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL211bHRpcGxlIGF1ZGlvIGJ1ZmZlcnMgdG8gZGVjb2RlIGFuZCBjb25jYXRlbmF0ZVxyXG4gICAgICB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgU291bmRXYXZlIG9iamVjdDogVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9zdGFydCB0aGUgb2JqZWN0IHdpdGggZW1wdHkgYnVmZmVyLiBVc2VmdWxsIGZvciB0ZXN0aW5nIGFuZCBhZHZhbmNlZCB1c2FnZS5cclxuICB9XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGJpbmFyeSBhdWRpbyBkYXRhLCB0dXJucyBpdCBpbnRvIGFuIGF1ZGlvIGJ1ZmZlciBvYmplY3QgYW5kXHJcbiAqIHN0b3JlcyBpdCBpbiB0aGlzLmJ1ZmZlci5cclxuICogQmFzaWNhbGx5IGEgd3JhcHBlciBmb3IgdGhlIHdlYi1hdWRpby1hcGkgZGVjb2RlQXVkaW9EYXRhIGZ1bmN0aW9uLlxyXG4gKiBJdCB1c2VzIHRoZSBuZXcgcHJvbWlzZSBzeW50YXggc28gaXQgcHJvYmFibHkgd29uJ3Qgd29yayBpbiBhbGwgYnJvd3NlcnMgYnkgbm93LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheUJ1ZmZlcn0gIHJhd0F1ZGlvU3JjIEF1ZGlvIGRhdGEgaW4gcmF3IGJpbmFyeSBmb3JtYXRcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICAgICAgICBQcm9taXNlIHRoYXQgaW5kaWNhdGVzIGlmIG9wZXJhdGlvbiB3YXMgc3VjY2Vzc2Z1bGwuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKHJhd0F1ZGlvU3JjKSB7XHJcbiAgcmV0dXJuIGNvcmUuZGVjb2RlQXVkaW9EYXRhKHJhd0F1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgIHJldHVybiBkZWNvZGVkO1xyXG4gIH0pXHJcbiAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgcmV0dXJuIGVycjtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBKb2lucyBhbiBhcmJpdHJhcnkgbnVtYmVyIG9mIEFycmF5QnVmZmVycy5cclxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIGJ1ZmZlcnMgQXJyYXkgb2YgQXVkaW9CdWZmZXJzXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIFdhdmVmb3JtIHRoYXQgaW5jbHVkZXMgYWxsIGdpdmVuIGJ1ZmZlcnMuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmpvaW5BdWRpb0J1ZmZlcnMgPSBmdW5jdGlvbihidWZmZXJzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBqb2luZWRCdWZmZXIgPSBjb3JlLmNyZWF0ZUJ1ZmZlcigxLCAwLCBjb3JlLnNhbXBsZVJhdGUpO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICBidWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyKSB7XHJcbiAgICAgIGlmIChidWZmZXIgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIpIHtcclxuICAgICAgICBqb2luZWRCdWZmZXIgPSB0aGlzLmFwcGVuZEF1ZGlvQnVmZmVyKGpvaW5lZEJ1ZmZlciwgYnVmZmVyKTtcclxuICAgICAgICB0aGlzLm1ldGFEYXRhLnB1c2godGhpcy5jcmVhdGVNZXRhRGF0YShqb2luZWRCdWZmZXIsIGJ1ZmZlcikpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ09uZSBvciBtb3JlIGJ1ZmZlcnMgYXJlIG5vdCBvZiB0eXBlIEF1ZGlvQnVmZmVyLicpKTtcclxuICAgICAgfVxyXG4gICAgfSwgc2VsZik7XHJcbiAgICByZXNvbHZlKGpvaW5lZEJ1ZmZlcik7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29uY2F0ZW5hdGVzIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyB0byBhbiBBdWRpb0J1ZmZlci5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IGJpbmFyeUJ1ZmZlcnMgIEFycmF5IGhvbGRpbmcgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBhdWRpb0J1ZmZlciAgIEFuIGV4aXN0aW5nIEF1ZGlvQnVmZmVyIG9iamVjdFxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICAgICAgICBUaGUgY29uY2F0ZW5hdGVkIEF1ZGlvQnVmZmVyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJpbmFyeUJ1ZmZlcnMsIGF1ZGlvQnVmZmVyKSB7XHJcbiAgYmluYXJ5QnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJpbkJ1ZmZlcikge1xyXG4gICAgdmFyIHRtcEF1ZGlvQnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYmluQnVmZmVyKTtcclxuICAgIHRoaXMubWV0YURhdGEucHVzaCh0aGlzLmFkZFdhdmVNZXRhRGF0YShhdWRpb0J1ZmZlciwgdG1wQXVkaW9CdWZmZXIpKTtcclxuICAgIGF1ZGlvQnVmZmVyID0gdGhpcy5hcHBlbmRBdWRpb0J1ZmZlcihhdWRpb0J1ZmZlciwgdG1wQXVkaW9CdWZmZXIpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gYXVkaW9CdWZmZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogQXBwZW5kcyB0d28gYXVkaW8gYnVmZmVycy4gU3VnZ2VzdGVkIGJ5IENocmlzIFdpbHNvbjo8YnI+XHJcbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTQxNDM2NTIvd2ViLWF1ZGlvLWFwaS1hcHBlbmQtY29uY2F0ZW5hdGUtZGlmZmVyZW50LWF1ZGlvYnVmZmVycy1hbmQtcGxheS10aGVtLWFzLW9uZS1zb25cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjEgVGhlIGZpcnN0IGF1ZGlvIGJ1ZmZlclxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMiBUaGUgc2Vjb25kIGF1ZGlvIGJ1ZmZlclxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICBidWZmZXIxICsgYnVmZmVyMlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5hcHBlbmRBdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJ1ZmZlcjEsIGJ1ZmZlcjIpIHtcclxuICB2YXIgbnVtYmVyT2ZDaGFubmVscyA9IE1hdGgubWluKGJ1ZmZlcjEubnVtYmVyT2ZDaGFubmVscywgYnVmZmVyMi5udW1iZXJPZkNoYW5uZWxzKTtcclxuICB2YXIgdG1wID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgIChidWZmZXIxLmxlbmd0aCArIGJ1ZmZlcjIubGVuZ3RoKSxcclxuICAgIGJ1ZmZlcjEuc2FtcGxlUmF0ZSk7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgIHZhciBjaGFubmVsID0gdG1wLmdldENoYW5uZWxEYXRhKGkpO1xyXG4gICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjEuZ2V0Q2hhbm5lbERhdGEoaSksIDApO1xyXG4gICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICB9XHJcbiAgcmV0dXJuIHRtcDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZGljdGlvbmFyeSB3aXRoIHN0YXJ0L3N0b3AgcG9pbnRzIGFuZCBsZW5ndGggaW4gc2FtcGxlLWZyYW1lc1xyXG4gKiBvZiBhIGJ1ZmZlciBmcmFnbWVudC4uXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIgICAgICBCdWZmZXIgd2l0aCB0aGUgYXBwZW5kYWJsZSBwY20gZnJhZ21lbnRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IHByZWRlY2Vzc29yIFByZWNlZGluZyBidWZmZXJcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIERpY3Rpb25hcnkgd2l0aCBtZXRhIGRhdGEgb3IgZXJyb3IgbXNnXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmdldE1ldGFEYXRhID0gZnVuY3Rpb24oYnVmZmVyLCBwcmVkZWNlc3Nvcikge1xyXG4gIGlmIChidWZmZXIgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIgJiZcclxuICBwcmVkZWNlc3NvciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgdmFyIHByZUxlbmd0aCA9IHByZWRlY2Vzc29yLmxlbmd0aDtcclxuICAgIHZhciBidWZMZW5ndGggPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgJ3N0YXJ0JzogcHJlTGVuZ3RoLFxyXG4gICAgICAnZW5kJzogcHJlTGVuZ3RoICsgYnVmTGVuZ3RoIC0gMSxcclxuICAgICAgJ2xlbmd0aCc6IGJ1Zkxlbmd0aFxyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHsgJ2Vycm9yTXNnJzogJ09uZSBvciBib3RoIGFyZ3VtZW50cyBhcmUgbm90IG9mIHR5cGUgQXVkaW9CdWZmZXInIH07XHJcbiAgfVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIChhdWRpbykgZmlsZSBhbmQgcmV0dXJucyBpdHMgZGF0YSBhcyBBcnJheUJ1ZmZlclxyXG4gKiB3aGVuIHRoZSBwcm9taXNlIGZ1bGZpbGxzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdXJsICAgICAgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICBBIHByb21pc2UgcmVwcmVzZW50aW5nIHRoZSB4aHIgcmVzcG9uc2VcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbih1cmwpIHtcclxuICByZXR1cm4gd2luZG93LmZldGNoKHVybClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmVyIGVycm9yLiBDb3VsZG5cXCd0IGxvYWQgZmlsZTogJyArIHVybCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAudGhlbihmdW5jdGlvbihidWZmZXIpIHtcclxuICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBtdWx0aXBsZSAoYXVkaW8pIGZpbGVzIGFuZCByZXR1cm5zIGFuIGFycmF5XHJcbiAqIHdpdGggdGhlIGRhdGEgZnJvbSB0aGUgZmlsZXMgaW4gdGhlIGdpdmVuIG9yZGVyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGZpbGVuYW1lcyBMaXN0IHdpdGggZmlsZW5hbWVzXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgIEFycmF5IG9mIEFycmF5QnVmZmVyc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkRmlsZXMgPSBmdW5jdGlvbihmaWxlbmFtZXMpIHtcclxuICB2YXIgcHJvbWlzZXMgPSBbXTtcclxuICBmaWxlbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9hZEZpbGUobmFtZSkpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYmluQnVmZmVycykge1xyXG4gICAgcmV0dXJuIGJpbkJ1ZmZlcnM7XHJcbiAgfSlcclxuICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICByZXR1cm4gZXJyO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnQgQXJyYXlCdWZmZXJzIHRoZSBzYW1lIG9yZGVyLCBsaWtlIHRoZSBmaWxlbmFtZVxyXG4gKiBwYXJhbWV0ZXJzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGZpbGVuYW1lcyAgQXJyYXkgd2l0aCBmaWxlbmFtZXNcclxuICogQHBhcmFtICB7QXJyYXl9ICBiaW5CdWZmZXJzIEFycmF5IHdpdGggQXJyYXlCdWZmZXJcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIEFycmF5IHdpdGggc29ydGVkIEFycmF5QnVmZmVyc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5zb3J0QmluQnVmZmVycyA9IGZ1bmN0aW9uKGZpbGVuYW1lcywgYmluQnVmZmVycykge1xyXG4gIC8vIGZ1dGlsZT8/XHJcbiAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoZnVuY3Rpb24oZWwpIHtcclxuICAgIHJldHVybiBiaW5CdWZmZXJzW2VsXTtcclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmRXYXZlO1xyXG4iLCIvKipcclxuICogVGhpcyBpcyB0aGUgZm91bmRhdGlvbiBvZiB0aGUgSW50ZXJtaXggbGlicmFyeS5cclxuICogSXQgc2ltcGx5IGNyZWF0ZXMgdGhlIGF1ZGlvIGNvbnRleHQgb2JqZWN0c1xyXG4gKiBhbmQgZXhwb3J0cyBpdCBzbyBpdCBjYW4gYmUgZWFzaWx5IGNvbnN1bWVkXHJcbiAqIGZyb20gYWxsIGNsYXNzZXMgb2YgdGhlIGxpYnJhcnkuXHJcbiAqXHJcbiAqIEByZXR1cm4ge0F1ZGlvQ29udGV4dH0gVGhlIEF1ZGlvQ29udGV4dCBvYmplY3RcclxuICpcclxuICogQHRvZG8gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqIEB0b2RvIENoZWNrIGZvciBtb2JpbGUvaU9TIGNvbXBhdGliaWxpdHkuXHJcbiAqIEB0b2RvIENoZWNrIGlmIHdlJ3JlIHJ1bm5pbmcgb24gbm9kZVxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5TdXNwZW5kIGFuZCByZXN1bWUgdGhlIGF1ZGlvIGNvbnRleHQgdG9cclxuICogY3JlYXRlIGEgcGF1c2UgYnV0dG9uLiBUaGlzIHNob3VsZCBiZSB1c2VkIHdpdGggY3JlYXRlQXVkaW9Xb3JrZXJcclxuICogYXMgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gd2hlbiBzdXNwZW5kIGlzIGNhbGxlZCBvbiBhbiBvZmZsaW5lIGF1ZGlvIGNvbnRleHQuXHJcbiAqIFlvdSBjYW4gYWxzbyBwYXVzZSBzaW5nbGUgc291bmRzIHdpdGggPGk+U291bmQucGF1c2UoKTwvaT4uXHJcbiAqIFBsZWFzZSByZWFkIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3N1c3BlbmRcIj50aGUgZGV2ZWxvcGVyIGRvY3MgYXQgTUROPC9hPlxyXG4gKiB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiB0aGlzLjwvY2FwdGlvbj5cclxuICogc3VzcmVzQnRuLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuICogICBpZihJbnRlcm1peC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XHJcbiAqICAgICBJbnRlcm1peC5zdXNwZW5kKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1Jlc3VtZSBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH0gZWxzZSBpZiAoSW50ZXJtaXguc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XHJcbiAqICAgICBJbnRlcm1peC5yZXN1bWUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnU3VzcGVuZCBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH1cclxuICogfVxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGF1ZGlvQ3R4ID0gbnVsbDtcclxuXHJcbnZhciBpc01vYmlsZSA9IHtcclxuICAnQW5kcm9pZCc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpO1xyXG4gIH0sXHJcbiAgJ2lPUyc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmV8aVBhZHxpUG9kL2kpO1xyXG4gIH0sXHJcbiAgJ0JsYWNrQmVycnknOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKTtcclxuICB9LFxyXG4gICdPcGVyYSc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9PcGVyYSBNaW5pL2kpO1xyXG4gIH0sXHJcbiAgV2luZG93czogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0lFTW9iaWxlL2kpIHx8XHJcbiAgICB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV1BEZXNrdG9wL2kpO1xyXG4gIH0sXHJcbiAgYW55OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAoaXNNb2JpbGUuQW5kcm9pZCgpIHx8XHJcbiAgICBpc01vYmlsZS5pT1MoKSB8fFxyXG4gICAgaXNNb2JpbGUuQmxhY2tCZXJyeSgpIHx8XHJcbiAgICBpc01vYmlsZS5PcGVyYSgpIHx8XHJcbiAgICBpc01vYmlsZS5XaW5kb3dzKCkpO1xyXG4gIH1cclxufTtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbiAgaWYgKHR5cGVvZiB3aW5kb3cuQXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgYXVkaW9DdHggPSBuZXcgd2luZG93LkF1ZGlvQ29udGV4dCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkblxcJ3QgaW5pdGlhbGl6ZSB0aGUgYXVkaW8gY29udGV4dC4nKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhdWRpb0N0eDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGFib3V0IGphdmFzY3JpcHQgZXZlbnRzISBJdCdzIGp1c3RcclxuICogYSBkZWZpbml0aW9uIG9mIHRoZSBldmVudHMgdGhhdCB0aGUgc2VxdWVuY2VyIGNhbiBoYW5kbGUgcGx1c1xyXG4gKiBzb21lIGZ1bmN0aW9ucyB0byBjcmVhdGUgdmFsaWQgZXZlbnRzLlxyXG4gKiBUaGUgY2xhc3MgZGVmaW5lcyB3aGljaCBzdWJzeXN0ZW0gaXMgaW52b2tlZCB0byBwcm9jZXNzIHRoZSBldmVudC5cclxuICogRXZlcnkgY2xhc3MgY2FuIGhhdmUgc2V2ZXJhbCB0eXBlcyBhbmQgYSB0eXBlIGNvbnNpc3RzIG9mIG9uZSBvclxyXG4gKiBtb3JlIHByb3BlcnRpZXMuXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhIG5vdGUgZXZlbnQgZm9yIGFuIGF1ZGlvIG9iamVjdDwvY2FwdGlvbj5cclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdjMycsIDY1LCAxMjgsIGFTb3VuZE9iamVjdCk7XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBwcm9wZXJ0aWVzIGluIG9uZSBoYW5keSBhcnJheS5cclxuICogQHR5cGUge0FycmF5fVxyXG4gKi9cclxudmFyIGV2UHJvcCA9IFtcclxuICAnaW5zdHJ1bWVudCcsIC8vIHRoZSBldmVudCByZWNlaXZlclxyXG4gICd0b25lJywgICAgICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3IGJlZ2lubmluZyBhdCBjMFxyXG4gICdkdXJhdGlvbicsICAgLy8gSW50IHJlcHJlc2VudGluZyBhIG51bWJlciBvZiA2NHRoIG5vdGVzXHJcbiAgJ3ZlbG9jaXR5JywgICAvLyBJbnQgYmV0d2VlbiAwIGFuZCAxMjdcclxuICAncGl0Y2gnLFxyXG4gICd2b2x1bWUnLFxyXG4gICdwYW4nXHJcbl07XHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IHR5cGVzIGFuZCB0aGUgcHJvcGVydGllcyBhc3NvdGlhdGVkIHdpdGggdGhlbS5cclxuICogVHlwZSBhcmUgdmFsaWQgd2l0aCBvbmUsIHNldmVyYWwgb3IgYWxsIG9mIGl0cyBwcm9wZXJ0aWVzLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2VHlwZSA9IHtcclxuICAnbm90ZSc6IFsgZXZQcm9wWzBdLCBldlByb3BbMV0sIGV2UHJvcFsyXSwgZXZQcm9wWzNdIF0sXHJcbiAgJ2NvbnRyb2wnOiBbIGV2UHJvcFs0XSwgZXZQcm9wWzVdLCBldlByb3BbNl0gXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBjbGFzc2VzIGFuZCB0aGUgdHlwZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG52YXIgZXZDbGFzcyA9IHtcclxuICAnYXVkaW8nOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnc3ludGgnOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnZngnOiBbXSxcclxuICAnbWlkaSc6IFtdLFxyXG4gICdvc2MnOiBbXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyB0aGUgY2xhc3Mgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgdHJ1ZSBpZiBjbGFzcyBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlQ2xhc3MgPSBmdW5jdGlvbihlQ2xhc3MpIHtcclxuICBpZiAoZXZDbGFzcy5oYXNPd25Qcm9wZXJ0eShlQ2xhc3MpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIHR5cGUgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVUeXBlIEV2ZW50IHR5cGVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgdHlwZSBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlVHlwZSA9IGZ1bmN0aW9uKGVUeXBlKSB7XHJcbiAgaWYgKGV2VHlwZS5oYXNPd25Qcm9wZXJ0eShlVHlwZSkpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhbiBpbnN0cnVtZW50IGlzIGFuIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHBvb3JseSB3ZWFrIHRlc3QgYnV0IHRoYXQnc1xyXG4gKiBhbGwgd2UgY2FuIGRvIGhlcmUuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gaW5zdHIgQW4gaW5zdHJ1bWVudCBvYmplY3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICB0cnVlIGlmIGl0J3MgYW4gb2JqZWN0LCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BJbnN0cnVtZW50ID0gZnVuY3Rpb24oaW5zdHIpIHtcclxuICBpZiAodHlwZW9mIGluc3RyID09PSAnb2JqZWN0Jykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgdG9uZSBvciB2ZWxvY2l0eSB2YWx1ZSBpc1xyXG4gKiBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgMTI3LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIFRoZSBudW1iZXIgdGhhdCByZXByZXNlbnRzIGEgdG9uZVxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgdG9uZSwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wVG9uZVZlbG8gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDAgJiYgdmFsdWUgPD0gMTI3KSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgaWYgYSBkdXJhdGlvbiBpcyBhIHBvc2l0aXZlIGludGVnZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0ludH0gIHZhbHVlICAgTnVtYmVyIHJlcHJlc2VudGluZyBtdWx0aXBsZSA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgVHJ1ZSBpZiBpdHMgYSB2YWxpZCBkdXJhdGlvbiwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wRHVyYXRpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBhbiBvYmplY3Qgb2YgZXZlbnQgcHJvcGVydGllcy5cclxuICogSXQgY2hlY2tzIHRoZSBwcm9wZXJ0aWVzIGFyZSB2YWxpZCBmb3IgdGhlIGdpdmVuIHR5cGUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzICBPYmplY3Qgd2l0aCBldmVudCBwcm9wZXJ0aWVzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgICBFdmVudCB0eXBlIHRvIHZhbGlkYXRlIGFnYWluc3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgIHRydWUgaWYgYWxsIHByb3BzIGFyZSB2YWxpZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wcyA9IGZ1bmN0aW9uKGVQcm9wcywgZVR5cGUpIHtcclxuICB2YXIgdHlwZSA9IGV2VHlwZVtlVHlwZV07XHJcbiAgZm9yICh2YXIga2V5IGluIGVQcm9wcykgIHtcclxuICAgIGlmIChldlByb3AuaW5kZXhPZihrZXkpID09PSAtMSAmJlxyXG4gICAgdHlwZS5pbmRleE9mKGtleSkgPT09IC0xKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYSBzdHJpbmcgb2YgdGhlIGZvcm0gYzMgb3IgZCM0IGFuZFxyXG4gKiByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIG51bWJlci5cclxuICogQHBhcmFtICB7U3RyaW5nfSB0b25lIFN0cmluZyByZXByZXNlbnRpbmcgYSBub3RlXHJcbiAqIEByZXR1cm4ge0ludH0gICAgICAgICBOdW1iZXIgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKi9cclxudmFyIGNvbnZlcnRUb25lID0gZnVuY3Rpb24odG9uZSkge1xyXG4gIHZhciBub3RlcyA9IFsnYycsICdjIycsICdkJywgJ2QjJywgJ2UnLCAnZicsICdmIycsICdnJywgJ2cjJywgJ2EnLCAnYSMnLCAnYiddO1xyXG4gIHZhciBzdHIgPSB0b25lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIGlmIChzdHIubWF0Y2goL15bYS1oXSM/WzAtOV0kLykpIHtcclxuICAgIHZhciBub3RlID0gc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSk7XHJcbiAgICB2YXIgb2N0ID0gc3RyLnNsaWNlKC0xKTtcclxuXHJcbiAgICBpZiAobm90ZSA9PT0gJ2gnKSB7XHJcbiAgICAgIG5vdGUgPSAnYic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm90ZXMuaW5kZXhPZihub3RlKSArIG9jdCAqIDEyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VudmFsaWQgc3RyaW5nLiBIYXMgdG8gYmUgbGlrZSBbYS1oXTwjPlswLTldJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzZXF1ZW5jZXIgZXZlbnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgIEV2ZW50IHR5cGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICBTZXF1ZW5jZXIgZXZlbnRcclxuICovXHJcbnZhciBjcmVhdGVFdmVudCA9IGZ1bmN0aW9uKGVDbGFzcywgZVR5cGUsIGVQcm9wcykge1xyXG4gIGlmICh2YWxpZGF0ZUNsYXNzKGVDbGFzcykgJiZcclxuICAgIHZhbGlkYXRlVHlwZShlVHlwZSkgJiZcclxuICAgIHZhbGlkYXRlUHJvcHMoZVByb3BzLCBlVHlwZSkpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICdjbGFzcyc6IGVDbGFzcyxcclxuICAgICAgJ3R5cGUnOiBlVHlwZSxcclxuICAgICAgJ3Byb3BzJzogZVByb3BzXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjcmVhdGUgc2VxdWVuY2VyIGV2ZW50LiBXcm9uZyBwYXJhbWV0ZXJzJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gYXVkaW8gbm90ZSBldmVudFxyXG4gKiBAcGFyYW0gIHtJbnR8U3RyaW5nfSB0b25lICAgICBUb25lIGJldHdlZW4gMCBhbmQgMTI3IG9yIHN0cmluZyAoYzMsIGQjNClcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgdmVsb2NpdHkgVmVsb2NpdHkgYmV0d2VlbiAwIGFuZCAxMjdcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgZHVyYXRpb24gRHVyYXRpb24gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICBBbGwgcHJvcGVydGllcyBpbiBvbmUgb2JqZWN0XHJcbiAqL1xyXG52YXIgY3JlYXRlQXVkaW9Ob3RlID0gZnVuY3Rpb24odG9uZSwgdmVsb2NpdHksIGR1cmF0aW9uLCBpbnN0cikge1xyXG4gIHZhciBwcm9wcyA9IHt9O1xyXG4gIGlmICh0eXBlb2YgdG9uZSA9PT0gJ3N0cmluZycpIHtcclxuICAgIHRvbmUgPSBjb252ZXJ0VG9uZSh0b25lKTtcclxuICB9XHJcbiAgaWYgKHRvbmUgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odG9uZSkpIHtcclxuICAgIHByb3BzLnRvbmUgPSB0b25lO1xyXG4gIH1cclxuICBpZiAodmVsb2NpdHkgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odmVsb2NpdHkpKSB7XHJcbiAgICBwcm9wcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xyXG4gIH1cclxuICBpZiAoZHVyYXRpb24gJiYgdmFsaWRhdGVQcm9wRHVyYXRpb24oZHVyYXRpb24pKSB7XHJcbiAgICBwcm9wcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gIH1cclxuICBpZiAoaW5zdHIgJiYgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudChpbnN0cikpIHtcclxuICAgIHByb3BzLmluc3RydW1lbnQgPSBpbnN0cjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBIHNlcXVlbmNlciBldmVudCBtdXN0IGhhdmUgYW4gaW5zdHJ1bWVudCBhcyBwcm9wZXJ0eScpO1xyXG4gIH1cclxuICByZXR1cm4gY3JlYXRlRXZlbnQoJ2F1ZGlvJywgJ25vdGUnLCBwcm9wcyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBjbGFzczogZXZDbGFzcyxcclxuICB0eXBlOiBldlR5cGUsXHJcbiAgcHJvcGVydHk6IGV2UHJvcCxcclxuICBjcmVhdGVBdWRpb05vdGU6IGNyZWF0ZUF1ZGlvTm90ZVxyXG59O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5JdCBpcyBqdXN0IGZvciBsaWJyYXJ5IGludGVybmFsXHJcbiAqIHVzYWdlLiBTZWUgU2VxdWVuY2VyLmpzIGZvciBkZXRhaWxzLjwvY2FwdGlvbj5cclxuICogd29ya2VyLnBvc3RNZXNzYWdlKHsgJ2ludGVydmFsJzogMjAwIH0pO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gKiB3b3JrZXIudGVybWluYXRlKCk7ICAvL3dlYndvcmtlciBpbnRlcm5hbCBmdW5jdGlvbiwganVzdCBmb3IgY29tcGxldGVuZXNzXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdGltZXIgPSBudWxsO1xyXG52YXIgaW50ZXJ2YWwgPSAxMDA7XHJcblxyXG52YXIgd29ya2VyID0gZnVuY3Rpb24oc2VsZikge1xyXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhLmludGVydmFsKSB7XHJcbiAgICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4gICAgICBpZiAodGltZXIpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gd29ya2VyO1xyXG4iXX0=
