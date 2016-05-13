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

  this.sw = null;           //pointer to the soundWave object
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
    this.sw = soundWave;
    this.soundLength = this.loopEnd = this.sw.wave.duration;
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
  // console.log(this.sw.wave);
  bufferSource.buffer = this.sw.wave;
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
 * var soundWave = new intermix.SoundWave(['file1.wav,file2.wav,file3.wav']);
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
  this.fragments = [];  //AudioBuffers from multiple PCM sources
  this.wave = this.buffer;  //Interface to the internal buffers
  this.metaData = [];   //start-/endpoints and length of single waves

  if (typeof audioSrc !== 'undefined') {
    if (typeof audioSrc === 'string') {
      //one file to load/decode
      this.buffer = this.loadFile(audioSrc).then(function(response) {
        return self.decodeAudioData(response);
      })
      .then(function(decoded) {
        self.buffer = decoded;
        self.useWave(0);
        return self.buffer;
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof Array && typeof audioSrc[0] === 'string') {
      //multiple files to load/decode and cancatinate
      this.buffer = this.loadMultipleFiles(audioSrc).then(function(decoded) {
        self.buffer = decoded;
        self.useWave(0);
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof ArrayBuffer) {
      //one ArrayBuffer to decode
      this.buffer = this.decodeAudioData(audioSrc).then(function(decoded) {
        self.buffer = decoded;
        self.useWave(0);
      });
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple ArrayBuffers to decode and concatenate
      this.decodeAudioSources(audioSrc).then(function(audioBuffers) {
        self.fragments = audioBuffers;
        return self.joinAudioBuffers(audioBuffers);
      })
      .then(function(audioBuffer) {
        self.buffer = audioBuffer;
        self.useWave(0);
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof window.AudioBuffer) {
      this.buffer = audioSrc;
      this.useWave(0);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof window.AudioBuffer) {
      this.buffer = this.joinAudioBuffers(audioSrc).then(function(audioBuffer) {
        self.buffer = audioBuffer;
        self.useWave(0);
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
    self.fragments = audioBuffers;
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
  var input, joinedBuffer;

  return new Promise(function(resolve, reject) {
    if (Array.isArray(buffers)) {
      joinedBuffer = buffers[0];
      input = buffers.slice(1);
    } else {
      reject(new TypeError('Argument is not of type Array'));
    }

    input.forEach(function(buffer) {
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

SoundWave.prototype.useWave = function(waveSource) {
  if (Number.isInteger(waveSource)) {
    if (waveSource === 0) {
      this.wave = this.buffer;
    } else {
      this.wave = this.fragments[waveSource - 1];
    }
  } else {
    throw new TypeError('Argument not of type Integer');
  }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIGludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbmludGVybWl4LmV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XHJcbmludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbmludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5pbnRlcm1peC5TZXF1ZW5jZXIgPSByZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpO1xyXG5pbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGludGVybWl4O1xyXG4iLCJ2YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcblxudmFyIHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgdmFyIHdrZXk7XG4gICAgdmFyIGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICB2YXIgZXhwID0gY2FjaGVba2V5XS5leHBvcnRzO1xuICAgICAgICAvLyBVc2luZyBiYWJlbCBhcyBhIHRyYW5zcGlsZXIgdG8gdXNlIGVzbW9kdWxlLCB0aGUgZXhwb3J0IHdpbGwgYWx3YXlzXG4gICAgICAgIC8vIGJlIGFuIG9iamVjdCB3aXRoIHRoZSBkZWZhdWx0IGV4cG9ydCBhcyBhIHByb3BlcnR5IG9mIGl0LiBUbyBlbnN1cmVcbiAgICAgICAgLy8gdGhlIGV4aXN0aW5nIGFwaSBhbmQgYmFiZWwgZXNtb2R1bGUgZXhwb3J0cyBhcmUgYm90aCBzdXBwb3J0ZWQgd2VcbiAgICAgICAgLy8gY2hlY2sgZm9yIGJvdGhcbiAgICAgICAgaWYgKGV4cCA9PT0gZm4gfHwgZXhwLmRlZmF1bHQgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXdrZXkpIHtcbiAgICAgICAgd2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgd2NhY2hlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgICAgIHdjYWNoZVtrZXldID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZXNbd2tleV0gPSBbXG4gICAgICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnLCdtb2R1bGUnLCdleHBvcnRzJ10sICcoJyArIGZuICsgJykoc2VsZiknKSxcbiAgICAgICAgICAgIHdjYWNoZVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgc2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuXG4gICAgdmFyIHNjYWNoZSA9IHt9OyBzY2FjaGVbd2tleV0gPSB3a2V5O1xuICAgIHNvdXJjZXNbc2tleV0gPSBbXG4gICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZSddLCAoXG4gICAgICAgICAgICAvLyB0cnkgdG8gY2FsbCBkZWZhdWx0IGlmIGRlZmluZWQgdG8gYWxzbyBzdXBwb3J0IGJhYmVsIGVzbW9kdWxlXG4gICAgICAgICAgICAvLyBleHBvcnRzXG4gICAgICAgICAgICAndmFyIGYgPSByZXF1aXJlKCcgKyBzdHJpbmdpZnkod2tleSkgKyAnKTsnICtcbiAgICAgICAgICAgICcoZi5kZWZhdWx0ID8gZi5kZWZhdWx0IDogZikoc2VsZik7J1xuICAgICAgICApKSxcbiAgICAgICAgc2NhY2hlXG4gICAgXTtcblxuICAgIHZhciBzcmMgPSAnKCcgKyBidW5kbGVGbiArICcpKHsnXG4gICAgICAgICsgT2JqZWN0LmtleXMoc291cmNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdpZnkoa2V5KSArICc6WydcbiAgICAgICAgICAgICAgICArIHNvdXJjZXNba2V5XVswXVxuICAgICAgICAgICAgICAgICsgJywnICsgc3RyaW5naWZ5KHNvdXJjZXNba2V5XVsxXSkgKyAnXSdcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSkuam9pbignLCcpXG4gICAgICAgICsgJ30se30sWycgKyBzdHJpbmdpZnkoc2tleSkgKyAnXSknXG4gICAgO1xuXG4gICAgdmFyIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCB8fCB3aW5kb3cubW96VVJMIHx8IHdpbmRvdy5tc1VSTDtcblxuICAgIHJldHVybiBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgIG5ldyBCbG9iKFtzcmNdLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pXG4gICAgKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBwYXJ0IG9mIGEgc2VxdWVuY2UuIEl0IGNhbiBiZVxyXG4gKiB1c2VkIGluIG1hbnkgd2F5czpcclxuICogPHVsPlxyXG4gKiA8bGk+QSBwYXJ0IG9mIGEgdHJhY2sgbGlrZSBpbiBwaWFuby1yb2xsIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8bGk+QSBwYXR0ZXJuIGxpa2UgaW4gc3RlcCBzZXF1ZW5jZXJzLCBkcnVtIGNvbXB1dGVycyBhbmQgdHJhY2tlcnM8L2xpPlxyXG4gKiA8bGk+QSBsb29wIGxpa2UgaW4gbGl2ZSBzZXF1ZW5jZXJzPC9saT5cclxuICogPC91bD5cclxuICogVGVjaG5pY2FsbHkgaXQgY2FuIHN0b3JlIGFueSB0eXBlIG9mIGV2ZW50IHlvdXIgc3lzdGVtIGlzIGNhcGFibGUgb2YuXHJcbiAqIFRoaXMgbWVhbnMgaXQgaXMgbm90IGxpbWl0ZWQgdG8gYXVkaW8sIG1pZGksIG9zYyBvciBkbXggYnV0IGNhbiBob2xkXHJcbiAqIGFueSB0eXBlIG9mIGphdmFzY3JpcHQgb2JqZWN0LiBBIHBvc3NpYmxlIHVzZWNhc2Ugd291bGQgYmUgdG8gdHJpZ2dlclxyXG4gKiBzY3JlZW4gZXZlbnRzIHdpdGggdGhlIGRyYXcgZnVuY3Rpb24gb2YgdGhlIHNlcXVlbmNlciBvYmplY3QuXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmVPYmplY3QpO1xyXG4gKiB2YXIgc2VxID0gbmV3IGludGVybWl4LlNlcXVlbmNlcigpO1xyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBub3RlID0gaW50ZXJtaXguZXZlbnRzLmNyZWF0ZUF1ZGlvTm90ZSgnYTMnLCAxLCAwLCBzb3VuZCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQobm90ZSwgMCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQobm90ZSwgNCk7XHJcbiAqIHNlcS5hZGRQYXJ0KHBhcnQsIDApO1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggICAgICAgTGVuZ3RoIG9mIHRoZSBwYXJ0IGluIDY0dGggbm90ZXMgKGRlZmF1bHQ6IDY0KVxyXG4gKi9cclxudmFyIFBhcnQgPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gMTY7IC8vIChyZXNvbHV0aW9uICogbXVsdGlwbHkpIHNob3VsZCBhbHdhc3kgYmUgNjRcclxuICB0aGlzLm11bHRpcGx5ID0gNDsgICAgLy8gcmVzb2x1dGlvbiBtdWx0aXBsaWVyXHJcbiAgdGhpcy5sZW5ndGggPSA2NDsgICAgIC8vIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAgdGhpcy5uYW1lID0gJ1BhcnQnOyAgIC8vIG5hbWUgb2YgdGhpcyBwYXJ0XHJcbiAgdGhpcy5wYXR0ZXJuID0gW107ICAgIC8vIHRoZSBhY3R1YWwgcGF0dGVybiB3aXRoIG5vdGVzIGV0Yy5cclxuXHJcbiAgaWYgKGxlbmd0aCkge1xyXG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XHJcbiAgfVxyXG5cclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLmluaXRQYXR0ZXJuKHRoaXMubGVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIGFuIGVtcHR5IHBhdHRlcm4gZm9yIHRoZSBwYXJ0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIG1lc3VyZWQgaW4gYmFycyAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhdHRlcm4gPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuICB2YXIgcGF0dGVybiA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgKGxlbmd0aCk7IGkrKykge1xyXG4gICAgcGF0dGVybltpXSA9IFtdO1xyXG4gIH1cclxuICByZXR1cm4gcGF0dGVybjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IHRvIHRoZSBwYXR0ZXJuIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gICAgdGhpcy5wYXR0ZXJuW3Bvc10ucHVzaChzZXFFdmVudCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUG9zaXRpb24gb3V0IG9mIHBhdHRlcm4gYm91bmRzLicpO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFuIGV2ZW50IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gIHZhciBpbmRleCA9IHRoaXMucGF0dGVybltwb3NdLmluZGV4T2Yoc2VxRXZlbnQpO1xyXG4gIHRoaXMucGF0dGVybltwb3NdLnNwbGljZShpbmRleCwgMSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtJbnR9ICAgIExlbmd0aCBvZiB0aGUgcGF0dGVyblxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGF0dGVybi5sZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NpdGlvbnMgdGhhdCBjb250YWluIGF0IGxlYXN0IG9uZSBldmVudC5cclxuICogQ2FuIGJlIGhhbmR5IHRvIGRyYXcgZXZlbnRzIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPmZyb20ge0B0dXRvcmlhbCBTdGVwc2VxdWVuY2VyfTwvY2FwdGlvbj5cclxuICogYmRTdGVwcyA9IGJkUGFydC5nZXROb3RlUG9zaXRpb25zKCk7XHJcbiAqIGJkU3RlcHMuZm9yRWFjaChmdW5jdGlvbihwb3MpIHtcclxuICogICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmQnICsgcG9zKS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmVkJztcclxuICogfSk7XHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpOyAgIC8vcHJlcGFyZXMgdGhlIHdvcmtlciBmb3IgYnJvd3NlcmlmeVxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgd29ya2VyID0gcmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBtYWluIGNsYXNzIG9mIHRoZSBzZXF1ZW5jZXIuIEl0IGRvZXMgdGhlIHF1ZXVpbmcgb2ZcclxuICogcGFydHMgYW5kIGV2ZW50cyBhbmQgcnVucyB0aGUgc2NoZWR1bGVycyB0aGF0IGZpcmUgZXZlbnRzXHJcbiAqIGFuZCBkcmF3cyB0byB0aGUgc2NyZWVuLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQoc29tZU5vdGUsIDApO1xyXG4gKiBzZXEuYWRkUGFydChwYXJ0LCAwKTtcclxuICogc2VxLnN0YXJ0KCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJwbSA9IDEyMDsgICAgICAgICAgICAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5xdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLnRpbWVQZXJTdGVwOyAgICAgICAgICAgLy9wZXJpb2Qgb2YgdGltZSBiZXR3ZWVuIHR3byBzdGVwc1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDsgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBuZXh0IHN0ZXAgd2lsbCBiZSB0cmlnZ2VyZWRcclxuICB0aGlzLm5leHRTdGVwID0gMDsgICAgICAgICAgLy9wb3NpdGlvbiBpbiB0aGUgcXVldWUgdGhhdCB3aWxsIGdldCB0cmlnZ2VyZWQgbmV4dFxyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSAwOyAgICAvL3N0ZXAgaW4gcXVldWUgdGhhdCB3YXMgcGxheWVkIChub3QgdHJpZ2dlcmVkKSByZWNlbnRseSAodXNlZCBmb3IgZHJhd2luZykuXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7ICAgICAgICAgIC8vcGxheSBhIHNlY3Rpb24gb2YgdGhlIHF1ZXVlIGluIGEgbG9vcFxyXG4gIHRoaXMubG9vcFN0YXJ0OyAgICAgICAgICAgICAvL2ZpcnN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmxvb3BFbmQ7ICAgICAgICAgICAgICAgLy9sYXN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlOyAgICAgLy90cnVlIGlmIHNlcXVlbmNlciBpcyBydW5uaW5nLCBvdGhlcndpc2UgZmFsc2VcclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lOyAgICAgICAgLy9oYXMgdG8gYmUgb3ZlcnJpZGRlbiB3aXRoIGEgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGluIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RyYXcgZnVuY3Rpb24gd2l0aCB0aGUgbGFzdFBsYXllZFN0ZXAgaW50IGFzIHBhcmFtZXRlci5cclxuXHJcbiAgLy8gc2V0IHRpbWUgcGVyIHNldFRpbWVQZXJTdGVwXHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAodGhpcy5icG0sIHRoaXMucmVzb2x1dGlvbik7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgdGhlIHNjaGVkdWxlci10aW1lclxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIgPSB3b3JrKHdvcmtlcik7XHJcblxyXG4gIC8qZXNsaW50LWVuYWJsZSAqL1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICd0aWNrJykge1xyXG4gICAgICBzZWxmLnNjaGVkdWxlcigpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoeydpbnRlcnZhbCc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBldmVudHMgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlIGFuZCBmaXJlcyB0aGVtLlxyXG4gKiBJdCBnZXRzIGNhbGxlZCBhdCBhIGNvbnN0YW50IHJhdGUsIGxvb2tzIGFoZWFkIGluXHJcbiAqIHRoZSBxdWV1ZSBhbmQgZmlyZXMgYWxsIGV2ZW50cyBpbiB0aGUgbmVhciBmdXR1cmVcclxuICogd2l0aCBhIGRlbGF5IGNvbXB1dGVkIGZyb20gdGhlIGN1cnJlbnQgYnBtIHZhbHVlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zY2hlZHVsZXIgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbGltaXQgPSBjb3JlLmN1cnJlbnRUaW1lICsgdGhpcy5sb29rYWhlYWQ7XHJcbiAgLy8gaWYgaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUgb3IgcHJldmlvdXNseSBzdG9wcGVkXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCBsaW1pdCkge1xyXG4gICAgdGhpcy5hZGRQYXJ0c1RvUnVucXVldWUoKTtcclxuICAgIHRoaXMuZmlyZUV2ZW50cygpO1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICB0aGlzLnNldFF1ZXVlUG9pbnRlcigpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyBpbiB0aGUgbWFzdGVyIHF1ZXVlIGZvciBwYXJ0cyBhbmQgYWRkc1xyXG4gKiBjb3BpZXMgb2YgdGhlbSB0byB0aGUgcnVucXVldWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnRzVG9SdW5xdWV1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0eXBlb2YgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICB2YXIgcGFydCA9IHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF1bMF07XHJcbiAgICAgIHBhcnQucG9pbnRlciA9IDA7XHJcbiAgICAgIHRoaXMucnVucXVldWUucHVzaChwYXJ0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0uZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XHJcbiAgICAgICAgcGFydC5wb2ludGVyID0gMDtcclxuICAgICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2gocGFydCk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWxldGVzIHBhcnRzIGZyb20gcnVucXVldWUuIEl0IGlzIGltcG9ydGFudCwgdGhhdCB0aGUgaW5kaWNlc1xyXG4gKiBvZiB0aGUgcGFydHMgYXJlIHNvcnRlZCBmcm9tIG1heCB0byBtaW4uIE90aGVyd2lzZSB0aGUgZm9yRWFjaFxyXG4gKiBsb29wIHdvbid0IHdvcmsuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBpbmRpY2VzICBJbmRpY2VzIG9mIHRoZSBwYXJ0cyBpbiB0aGUgcnVucXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZGVsZXRlUGFydHNGcm9tUnVucXVldWUgPSBmdW5jdGlvbihpbmRpY2VzKSB7XHJcbiAgaWYgKGluZGljZXMubGVuZ3RoID4gMCkge1xyXG4gICAgaW5kaWNlcy5mb3JFYWNoKGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLnJ1bnF1ZXVlW2lkXS5wb2ludGVyO1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnNwbGljZShpZCwgMSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRmlyZXMgYWxsIGV2ZW50cyBmb3IgdGhlIHVwY29tbWluZyBzdGVwLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5maXJlRXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIG1hcmtGb3JEZWxldGUgPSBbXTtcclxuICB0aGlzLnJ1bnF1ZXVlLmZvckVhY2goZnVuY3Rpb24ocGFydCwgaW5kZXgpIHtcclxuICAgIGlmIChwYXJ0LnBvaW50ZXIgPT09IHBhcnQubGVuZ3RoIC0gMSkge1xyXG4gICAgICBtYXJrRm9yRGVsZXRlLnVuc2hpZnQoaW5kZXgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyIHNlcUV2ZW50cyA9IHBhcnQucGF0dGVybltwYXJ0LnBvaW50ZXJdO1xyXG4gICAgICBpZiAoc2VxRXZlbnRzICYmIHNlcUV2ZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgc2VxRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAgICAgICAgIHRoaXMucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50LCB0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIH0gZWxzZSBpZiAoc2VxRXZlbnRzICYmIHNlcUV2ZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NTZXFFdmVudChzZXFFdmVudHNbMF0sIHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcGFydC5wb2ludGVyKys7XHJcbiAgfSwgdGhpcyk7XHJcbiAgdGhpcy5kZWxldGVQYXJ0c0Zyb21SdW5xdWV1ZShtYXJrRm9yRGVsZXRlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbnZva2VzIHRoZSBhcHByb3ByaWF0ZSBzdWJzeXN0ZW0gdG8gcHJvY2VzcyB0aGUgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IHRvIHByb2Nlc3NcclxuICogQHBhcmFtICB7ZmxvYXR9ICBkZWxheSAgICAgdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIGV2ZW50IHNob3VsZCBzdGFydFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5wcm9jZXNzU2VxRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgZGVsYXkpIHtcclxuICBpZiAoZGVsYXkpIHtcclxuICAgIHNlcUV2ZW50LnByb3BzWydkZWxheSddID0gZGVsYXk7XHJcbiAgfVxyXG4gIHNlcUV2ZW50LnByb3BzLmluc3RydW1lbnQucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBwb2ludGVyIHRvIHRoZSBuZXh0IHN0ZXAgdGhhdCBzaG91bGQgYmUgcGxheWVkXHJcbiAqIGluIHRoZSBtYXN0ZXIgcXVldWUuIElmIHdlJ3JlIHBsYXlpbmcgaW4gbG9vcCBtb2RlLFxyXG4gKiBqdW1wIGJhY2sgdG8gbG9vcHN0YXJ0IHdoZW4gZW5kIG9mIGxvb3AgaXMgcmVhY2hlZC5cclxuICogSWYgYSBwb2ludGVyIHBvc2l0aW9uIGlzIGdpdmVuLCBqdW1wIHRvIGl0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gICB7SW50fSAgIHBvc2l0aW9uICBOZXcgcG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICBpZiAodHlwZW9mIHBvc2l0aW9uICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgdGhpcy5uZXh0U3RlcCA9IHBvc2l0aW9uO1xyXG4gICAgdGhpcy5ydW5xdWV1ZSA9IFtdO1xyXG4gIH0gZWxzZSBpZiAodGhpcy5sb29wICYmIHRoaXMubmV4dFN0ZXAgPj0gdGhpcy5sb29wRW5kKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICB0aGlzLnJ1bnF1ZXVlID0gW107XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMubmV4dFN0ZXArKztcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoZSBxdWV1ZSBwb2ludGVyIChzZXQgdG8gcG9zaXRpb24gMCkuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zZXRRdWV1ZVBvaW50ZXIoMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIHRoZSBzZXF1ZW5jZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoIXRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gICAgdGhpcy5pc1J1bm5pbmcgPSB0cnVlO1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgKGhhbHRzIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uKVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDtcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgYW5kIHN1c3BlbmRzIHRoZSBBdWRpb0NvbnRleHQgdG9cclxuICogZ2xvYmFsbHkgaGFsdCBhbGwgYXVkaW8gc3RyZWFtcy4gSXQganVzdCBoYWx0cyBpZlxyXG4gKiBpZiBzZXF1ZW5jZXIgYW5kIEF1ZGlvQ29udGV4dCBib3RoIGFyZSBpbiBydW5uaW5nIHN0YXRlLlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGhhbHRlZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKGNvcmUuc3RhdGUgPT09ICdydW5uaW5nJyAmJiB0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zdG9wKCk7XHJcbiAgICBjb3JlLnN1c3BlbmQoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgdGhlIEF1ZGlvQ29udGV4dCBhbmQgc3RhcnRzIHRoZSBzZXF1ZW5jZXIgYXQgaXRzXHJcbiAqIGN1cnJlbnQgcG9zaXRpb24uIEl0IGp1c3Qgc3RhcnRzIGlmIHNlcXVlbmNlciBhbmQgQXVkaW9Db250ZXh0XHJcbiAqIGJvdGggYXJlIHN0b3BwZWQuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgcmVzdW1lZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmIChjb3JlLnN0YXRlID09PSAnc3VzcGVuZGVkJyAmJiAhdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc3RhcnQoKTtcclxuICAgIGNvcmUucmVzdW1lKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY2hlZHVsZXIgdGhhdCBydW5zIGEgZHJhd2luZyBmdW5jdGlvbiBldmVyeSB0aW1lXHJcbiAqIHRoZSBzY3JlZW4gcmVmcmVzaGVzLiBUaGUgZnVuY3Rpb24gU2VxdWVuY2VyLmFuaW1hdGlvbkZyYW1lKClcclxuICogaGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggc3R1ZmYgdG8gYmUgZHJhd24gb24gdGhlIHNjcmVlbi5cclxuICogSXQgY2FsbHMgaXRzZWxmIHJlY3Vyc2l2ZWx5IG9uIGV2ZXJ5IGZyYW1lIGFzIGxvbmcgYXMgdGhlIHNlcXVlbmNlciBpcyBydW5uaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gZmlyc3Qgd2UnbGwgaGF2ZSB0byBmaW5kIG91dCwgd2hhdCBzdGVwIHdhcyBwbGF5ZWQgcmVjZW50bHkuXHJcbiAgLy8gdGhpcyBpcyBzb21laG93IGNsdW1zeSBiZWNhdXNlIHRoZSBzZXF1ZW5jZXIgZG9lc24ndCBrZWVwIHRyYWNrIG9mIHRoYXQuXHJcbiAgdmFyIGxvb2tBaGVhZERlbHRhID0gdGhpcy5uZXh0U3RlcFRpbWUgLSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIGlmIChsb29rQWhlYWREZWx0YSA+PSAwKSB7XHJcbiAgICB2YXIgc3RlcHNBaGVhZCA9IE1hdGgucm91bmQobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKTtcclxuXHJcbiAgICBpZiAodGhpcy5uZXh0U3RlcCA8IHN0ZXBzQWhlYWQpIHtcclxuICAgICAgLy8gd2UganVzdCBqdW1wZWQgdG8gdGhlIHN0YXJ0IG9mIGEgbG9vcFxyXG4gICAgICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5sb29wRW5kICsgdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy51cGRhdGVGcmFtZSh0aGlzLmxhc3RQbGF5ZWRTdGVwKTtcclxuICB9XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJ1bnMgYmV0d2VlbiBzY3JlZW4gcmVmcmVzaC4gSGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlXHJcbiAqIGFwcCB0byByZW5kZXIgdG8gdGhlIHNjcmVlbi5cclxuICogQHBhcmFtICB7SW50fSAgbGFzdFBsYXllZFN0ZXAgIFRoZSA2NHRoIHN0ZXAgdGhhdCB3YXMgcGxheWVkIHJlY2VudGx5XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnVwZGF0ZUZyYW1lID0gZnVuY3Rpb24obGFzdFBsYXllZFN0ZXApIHtcclxuICBjb25zb2xlLmxvZyhsYXN0UGxheWVkU3RlcCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhIHBhcnQgdG8gdGhlIG1hc3RlciBxdWV1ZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICAgQW4gaW5zdGFuY2Ugb2YgUGFydFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmIChwYXJ0Lmxlbmd0aCAmJiBwYXJ0LnBhdHRlcm4pIHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gcGFyYW1ldGVyIGRvZXNuXFwndCBzZWVtIHRvIGJlIGEgcGFydCBvYmplY3QnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHBhcnQgb2JqZWN0IGZyb20gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcnQgICAgIFBhcnQgaW5zdGFuY2UgdG8gYmUgcmVtb3ZlZFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uIFBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVtb3ZlUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHRoaXMucXVldWVbcG9zaXRpb25dIGluc3RhbmNlb2YgQXJyYXkgJiZcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLmxlbmd0aCA+IDApIHtcclxuICAgIHZhciBpbmRleCA9IHRoaXMucXVldWVbcG9zaXRpb25dLmluZGV4T2YocGFydCk7XHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnQgbm90IGZvdW5kIGF0IHBvc2l0aW9uICcgKyBwb3NpdGlvbiArICcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEBwYXJhbSAge0ludH0gICBicG0gYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRCcG0gPSBmdW5jdGlvbihicG0pIHtcclxuICB0aGlzLmJwbSA9IGJwbTtcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcChicG0sIHRoaXMucmVzb2x1dGlvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29tcHV0ZXMgdGhlIHRpbWUgaW4gc2Vjb25kcyBhcyBmbG9hdCB2YWx1ZVxyXG4gKiBiZXR3ZWVuIG9uZSBzaG9ydGVzdCBwb3Nzc2libGUgbm90ZVxyXG4gKiAoNjR0aCBieSBkZWZhdWx0KSBhbmQgdGhlIG5leHQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgYnBtICAgICAgICBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcmVzb2x1dGlvbiBzaG9ydGVzdCBwb3NzaWJsZSBub3RlIHZhbHVlXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgICAgICAgICAgICB0aW1lIGluIHNlY29uZHNcclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0VGltZVBlclN0ZXAgPSBmdW5jdGlvbihicG0sIHJlc29sdXRpb24pIHtcclxuICByZXR1cm4gKDYwICogNCkgLyAoYnBtICogcmVzb2x1dGlvbik7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmdldExhc3RQbGF5ZWRTdGVwID0gZnVuY3Rpb24oKSB7XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1ha2VzIGEgY29weSBvZiBhIGZsYXQgYXJyYXkuXHJcbiAqIFVzZXMgYSBwcmUtYWxsb2NhdGVkIHdoaWxlLWxvb3BcclxuICogd2hpY2ggc2VlbXMgdG8gYmUgdGhlIGZhc3RlZCB3YXlcclxuICogKGJ5IGZhcikgb2YgZG9pbmcgdGhpczpcclxuICogaHR0cDovL2pzcGVyZi5jb20vbmV3LWFycmF5LXZzLXNwbGljZS12cy1zbGljZS8xMTNcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IHNvdXJjZUFycmF5IEFycmF5IHRoYXQgc2hvdWxkIGJlIGNvcGllZC5cclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIENvcHkgb2YgdGhlIHNvdXJjZSBhcnJheS5cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY29weUFycmF5ID0gZnVuY3Rpb24oc291cmNlQXJyYXkpIHtcclxuICB2YXIgZGVzdEFycmF5ID0gbmV3IEFycmF5KHNvdXJjZUFycmF5Lmxlbmd0aCk7XHJcbiAgdmFyIGkgPSBzb3VyY2VBcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGktLSkge1xyXG4gICAgZGVzdEFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XHJcbiAgfVxyXG4gIHJldHVybiBkZXN0QXJyYXk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcXVlbmNlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogUGxheSBhIHNvdW5kIHRoYXQgY2FuIGJlIGxvb3BlZC4gUGF1c2UvU3RhcnQgd29ya3Mgc2FtcGxlLWFjY3VyYXRlXHJcbiAqIGF0IGFueSByYXRlLiBIaXQgdGhlIHN0YXJ0IGJ1dHRvbiBtdWx0aXBsZSB0aW1lcyB0byBoYXZlIG11bHRpcGxlXHJcbiAqIHNvdW5kcyBwbGF5ZWQuIEFsbCBwYXJhbWV0ZXJzIGFyZSBhZGp1c3RhYmxlIGluIHJlYWx0aW1lLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdhdWRpb2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5zdGFydCgpO1xyXG4gKiBAdHV0b3JpYWwgU291bmRcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc291bmRXYXZlIFNvdW5kV2F2ZSBvYmplY3QgaW5jbHVkaW5nIHRoZSBidWZmZXIgd2l0aCBhdWRpbyBkYXRhIHRvIGJlIHBsYXllZFxyXG4gKi9cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oc291bmRXYXZlKSB7XHJcblxyXG4gIHRoaXMuc3cgPSBudWxsOyAgICAgICAgICAgLy9wb2ludGVyIHRvIHRoZSBzb3VuZFdhdmUgb2JqZWN0XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAvL2FsbCBjdXJyZW50bHkgYWN0aXZlIHN0cmVhbXNcclxuICB0aGlzLmxvb3AgPSBmYWxzZTtcclxuICB0aGlzLmdhaW5Ob2RlID0gbnVsbDtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBudWxsO1xyXG5cclxuICB0aGlzLnNvdW5kTGVuZ3RoID0gMDtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgdGhpcy5zdGFydE9mZnNldHMgPSBbXTsgICAvL2hvbGRzIHN0YXJ0IG9mZnNldHMgaWYgcGF1c2VkXHJcbiAgdGhpcy5zdGFydFRpbWUgPSAwOyAgICAgICAvL3doZW4gdGhlIHNvdW5kIHN0YXJ0cyB0byBwbGF5XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IG51bGw7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSAxO1xyXG4gIHRoaXMuZGV0dW5lID0gMDtcclxuXHJcbiAgaWYgKHNvdW5kV2F2ZSkge1xyXG4gICAgdGhpcy5zdyA9IHNvdW5kV2F2ZTtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSB0aGlzLnN3LndhdmUuZHVyYXRpb247XHJcbiAgICB0aGlzLnNldHVwQXVkaW9DaGFpbigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIGluaXRpYWxpc2luZyBTb3VuZCBvYmplY3Q6IHBhcmFtZXRlciBtaXNzaW5nLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZ2FpbiBhbmQgc3RlcmVvLXBhbm5lciBub2RlLCBjb25uZWN0cyB0aGVtXHJcbiAqIChnYWluIC0+IHBhbm5lcikgYW5kIHNldHMgZ2FpbiB0byAxIChtYXggdmFsdWUpLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldHVwQXVkaW9DaGFpbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBjb3JlLmNyZWF0ZUdhaW4oKTtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBjb3JlLmNyZWF0ZVN0ZXJlb1Bhbm5lcigpO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLnBhbm5lck5vZGUpO1xyXG4gIHRoaXMucGFubmVyTm9kZS5jb25uZWN0KGNvcmUuZGVzdGluYXRpb24pO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDE7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbmQgY29uZmlndXJlcyBhIEJ1ZmZlclNvdXJjZU5vZGVcclxuICogdGhhdCBjYW4gYmUgcGxheWVkIG9uY2UgYW5kIHRoZW4gZGVzdHJveXMgaXRzZWxmLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtCdWZmZXJTb3VyY2VOb2RlfSBUaGUgQnVmZmVyU291cmNlTm9kZVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYnVmZmVyU291cmNlID0gY29yZS5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICAvLyBjb25zb2xlLmxvZyh0aGlzLnN3LndhdmUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLnN3LndhdmU7XHJcbiAgYnVmZmVyU291cmNlLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XHJcbiAgYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZShidWZmZXJTb3VyY2UpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGJ1ZmZlclNvdXJjZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXN0cm95ZXMgYSBnaXZlbiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgYW5kIGRlbGV0ZXMgaXRcclxuICogZnJvbSB0aGUgc291cmNlTm9kZSBxdWV1ZS4gVGhpcyBpcyB1c2VkIGluIHRoZSBvbmVuZGVkXHJcbiAqIGNhbGxiYWNrIG9mIGFsbCBCdWZmZXJTb3VyY2VOb2RlcyB0byBhdm9pZCBkZWFkIHJlZmVyZW5jZXMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2JzTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGR1cmF0aW9uICAgVGltZSBwcmVyaW9kIGFmdGVyIHRoZSBzdHJlYW0gc2hvdWxkIGVuZFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ocGxheUxvb3BlZCwgZGVsYXksIGR1cmF0aW9uKSB7XHJcbiAgaWYgKHRoaXMuaXNQYXVzZWQgJiYgdGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICB0aGlzLnJlc3VtZSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgICBpZiAoZGVsYXkpIHtcclxuICAgICAgc3RhcnRUaW1lID0gZGVsYXk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gICAgfVxyXG4gICAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcbiAgICBpZiAocGxheUxvb3BlZCkge1xyXG4gICAgICBicy5sb29wID0gcGxheUxvb3BlZDtcclxuICAgICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgICB9XHJcbiAgICBicy5wbGF5YmFja1JhdGUudmFsdWUgPSBicy50bXBQbGF5YmFja1JhdGUgPSB0aGlzLnBsYXliYWNrUmF0ZTtcclxuICAgIGJzLmRldHVuZS52YWx1ZSA9IHRoaXMuZGV0dW5lO1xyXG4gICAgYnMuc3RhcnRUaW1lID0gc3RhcnRUaW1lOyAgIC8vIGV4dGVuZCBub2RlIHdpdGggYSBzdGFydHRpbWUgcHJvcGVydHlcclxuXHJcbiAgICB0aGlzLnF1ZXVlLnB1c2goYnMpO1xyXG4gICAgaWYgKGR1cmF0aW9uKSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCwgZHVyYXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbSwgZXZlbiB0aGUgb25lcyB0aGF0IGFyZSBqdXN0IHNjaGVkdWxlZC5cclxuICogSXQgYWxzbyBjbGVhbnMgdGhlIHF1ZXVlIHNvIHRoYXQgdGhlIHNvdW5kIG9iamVjdCBpcyByZWFkeSBmb3IgYW5vdGhlciByb3VuZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUuc3RvcCgpO1xyXG4gICAgbm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgfSk7XHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgLy9yZWxlYXNlIGFsbCByZWZlcmVuY2VzXHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbXMgb2YgdGhpcyBzb3VuZCB0ZW1wb3JhcmlseS5cclxuICogVGhpcyBjdXJyZW50bHkganVzdCB3b3JrcyBpbiBDaHJvbWUgNDkrIG9ubHkuXHJcbiAqIElmIHlvdSB3YW50IGEgZ2xvYmFsLCBhY2N1cmF0ZSBwYXVzZSBmdW5jdGlvblxyXG4gKiB1c2Ugc3VzcGVuZC9yZXN1bWUgZnJvbSB0aGUgY29yZSBtb2R1bGUuXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLmlzUGF1c2VkKSB7XHJcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBub2RlLnRtcFBsYXliYWNrUmF0ZSA9IG5vZGUucGxheWJhY2tSYXRlLnZhbHVlO1xyXG4gICAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IDAuMDtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgYWxsIHN0cmVhbXMgaWYgdGhleSB3ZXJlIHBhdXNlZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICAgIGRlbGV0ZSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICB9KTtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvY2Vzc2VzIGFuIGV2ZW50IGZpcmVkIGJ5IHRoZSBzZXF1ZW5jZXIuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgQSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wcm9jZXNzU2VxRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gIC8vdGhpcy5zZXRUb25lKHNlcUV2ZW50LnByb3BzLnRvbmUpO1xyXG4gIGlmIChzZXFFdmVudC5wcm9wcy5kdXJhdGlvbikge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXksXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmR1cmF0aW9uKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXkpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdGFydHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBzdGFydCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGVuZHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBlbmQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BFbmQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcEVuZCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWxlYXNlcyB0aGUgbG9vcCBvZiBhbGwgcnVubmluZyBub2RlcyxcclxuICogTm9kZXMgd2lsbCBydW4gdW50aWwgZW5kIGFuZCBzdG9wLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlbGVhc2VMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcCA9IGZhbHNlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgc3RhcnQgYW5kIGVuZHBvaW50IHRvIHN0YXJ0IGVuZCBlbmRwb2ludCBvZiB0aGUgQXVkaW9CdWZmZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXNldExvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gdGhpcy5zb3VuZExlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHNvdW5kIGluIHBlcmNlbnRhZ2VcclxuICogKDEgPSAxMDAlLCAyID0gMjAwJSlcclxuICogQHBhcmFtICB7ZmxvYXR9ICB2YWx1ZSAgIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRvbmUgd2l0aGluIHR3byBvY3RhdmUgKCsvLTEyIHRvbmVzKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgc2VtaSB0b25lXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgaWYgKHNlbWlUb25lID49IC0xMiAmJiBzZW1pVG9uZSA8PSAxMikge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBzZW1pVG9uZSAqIDEwMDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZW1pIHRvbmUgaXMgJyArIHNlbWlUb25lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxhc3QgcGxheWVkIHNlbWl0b25lLiBUaGlzIGRvZXNuJ3QgaGFzIHRvIGJlIGFuXHJcbiAqIGludGVnZXIgYmV0d2VlbiAtLysxMiBhcyB0aGUgc291bmQgY2FuIGJlIGRldHVuZWQgd2l0aFxyXG4gKiBtb3JlIHByZWNpc2lvbi5cclxuICogQHJldHVybiB7ZmxvYXR9ICBTZW1pdG9uZSBiZXR3ZWVuIC0vKzEyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZSAvIDEwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXR1bmUgdGhlIHNvdW5kIG9zY2lsbGF0aW9uIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHZhbHVlICBkZXR1bmUgaW4gY2VudHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXREZXR1bmUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA+PSAtMTIwMCAmJiB2YWx1ZSA8PSAxMjAwKSB7XHJcbiAgICB0aGlzLmRldHVuZSA9IHZhbHVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldHVuZSBwYXJhbWV0ZXIgaXMgJyArIHZhbHVlICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyMDAuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgY3VycmVudCBkZXR1bmUgaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcmV0dXJuIHtJbnRlZ2VyfSAgRGV0dW5lIGluIGNlbnRzXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RGV0dW5lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGluIHVzZSBhbmQgY2FuIHByb2JhYmx5IGJlIHJlbW92ZWRcclxuICogQHJldHVybiB7SW50fSBSYW5kb20gbnVtYmVyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VUlEID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zdWJzdHIoMiwgOCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxuLyoqXHJcbiAqIDxwPlxyXG4gKiBDcmVhdGVzIGEgd3JhcHBlciBpbiB3aGljaCBhbiBhdWRpbyBidWZmZXIgbGl2ZXMuXHJcbiAqIEEgU291bmRXYXZlIG9iamVjdCBqdXN0IGhvbGRzIGF1ZGlvIGRhdGEgYW5kIGRvZXMgbm90aGluZyBlbHNlLlxyXG4gKiBJZiB5b3Ugd2FudCB0byBwbGF5IHRoZSBzb3VuZCwgeW91IGhhdmUgdG8gYWRkaXRpb25hbGx5IGNyZWF0ZSBhXHJcbiAqIDxhIGhyZWY9XCJTb3VuZC5odG1sXCI+U291bmQ8L2E+IG9iamVjdC5cclxuICogSXQgY2FuIGhhbmRsZSBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqICgqLndhdiwgKi5tcDMpIGFzIGRhdGEgc291cmNlcy5cclxuICogPC9wPjxwPlxyXG4gKiBNdWx0aXBsZSBzb3VyY2VzIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gb25lIGF1ZGlvIGJ1ZmZlci5cclxuICogVGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgY3JlYXRpbmcgbXVsdGlwbGUgU291bmRXYXZlIG9iamVjdHMuXHJcbiAqIEl0J3MgbGlrZSBhIHdhdmV0YWJsZTogQWxsIHN0YXJ0L2VuZCBwb3NpdGlvbnMgd2lsbCBiZSBzYXZlZCBzb1xyXG4gKiB5b3UgY2FuIHRyaWdnZXIgdGhlIG9yaWdpbmFsIHNhbXBsZXMgd2l0aG91dCB1c2luZyBtdWx0aXBsZSBidWZmZXJzLlxyXG4gKiBQb3NzaWJsZSB1c2FnZXMgYXJlIG11bHRpc2FtcGxlZCBzb3VuZHMsIGxvb3BzIG9yIHdhdmVzZXF1ZW5jZXMgKGtpbmQgb2YpLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlBsYXkgYSBzb3VuZCBmcm9tIGFuIGF1ZGlvIGZpbGU6PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNvbmNhdGVuYXRlIG11bHRpcGxlIHNvdXJjZSBmaWxlcyBpbnRvIG9uZSBidWZmZXI8YnI+XHJcbiAqIGluIHRoZSBnaXZlbiBvcmRlciBhbmQgcGxheSB0aGVtIChUaGlzIGlzIGJyb2tlbiBpbiB2MC4xLiBEb24ndCB1c2UgaXQhKTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKFsnZmlsZTEud2F2LGZpbGUyLndhdixmaWxlMy53YXYnXSk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cclxuICogVXNpbmcgQXJyYXlCdWZmZXJzIGluc3RlYWQgb2YgZmlsZW5hbWVzIHdpbGwgY29tZSBpbiBoYW5keSBpZiB5b3Ugd2FudDxicj5cclxuICogdG8gaGF2ZSBmdWxsIGNvbnRyb2wgb3ZlciBYSFIgb3IgdXNlIGEgcHJlbG9hZGVyIChoZXJlOiBwcmVsb2FkLmpzKTpcclxuICogPC9jYXB0aW9uPlxyXG4gKiB2YXIgcXVldWUgPSBuZXcgY3JlYXRlanMuTG9hZFF1ZXVlKCk7XHJcbiAqIHF1ZXVlLm9uKCdjb21wbGV0ZScsIGhhbmRsZUNvbXBsZXRlKTtcclxuICogcXVldWUubG9hZE1hbmlmZXN0KFtcclxuICogICAgIHtpZDogJ3NyYzEnLCBzcmM6J2ZpbGUxLndhdicsIHR5cGU6Y3JlYXRlanMuQWJzdHJhY3RMb2FkZXIuQklOQVJZfSxcclxuICogICAgIHtpZDogJ3NyYzInLCBzcmM6J2ZpbGUyLndhdicsIHR5cGU6Y3JlYXRlanMuQWJzdHJhY3RMb2FkZXIuQklOQVJZfVxyXG4gKiBdKTtcclxuICpcclxuICogZnVuY3Rpb24gaGFuZGxlQ29tcGxldGUoKSB7XHJcbiAqICAgICB2YXIgYmluRGF0YTEgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzEnKTtcclxuICogICAgIHZhciBiaW5EYXRhMiA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMicpO1xyXG4gKiAgICAgdmFyIHdhdmUxID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMSk7XHJcbiAqICAgICB2YXIgd2F2ZTIgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGEyKTtcclxuICogICAgIHZhciBjb25jYXRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShbYmluRGF0YTEsIGJpbkRhdGEyXSk7XHJcbiAqIH07XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHsoT2JqZWN0fE9iamVjdFtdfHN0cmluZyl9IGF1ZGlvU3JjICAgT25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKi9cclxudmFyIFNvdW5kV2F2ZSA9IGZ1bmN0aW9uKGF1ZGlvU3JjKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5idWZmZXIgPSBjb3JlLmNyZWF0ZUJ1ZmZlcigxLCAxLCBjb3JlLnNhbXBsZVJhdGUpOyAgIC8vQXVkaW9CdWZmZXJcclxuICB0aGlzLmZyYWdtZW50cyA9IFtdOyAgLy9BdWRpb0J1ZmZlcnMgZnJvbSBtdWx0aXBsZSBQQ00gc291cmNlc1xyXG4gIHRoaXMud2F2ZSA9IHRoaXMuYnVmZmVyOyAgLy9JbnRlcmZhY2UgdG8gdGhlIGludGVybmFsIGJ1ZmZlcnNcclxuICB0aGlzLm1ldGFEYXRhID0gW107ICAgLy9zdGFydC0vZW5kcG9pbnRzIGFuZCBsZW5ndGggb2Ygc2luZ2xlIHdhdmVzXHJcblxyXG4gIGlmICh0eXBlb2YgYXVkaW9TcmMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJykge1xyXG4gICAgICAvL29uZSBmaWxlIHRvIGxvYWQvZGVjb2RlXHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5sb2FkRmlsZShhdWRpb1NyYykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgIHJldHVybiBzZWxmLmRlY29kZUF1ZGlvRGF0YShyZXNwb25zZSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICAgICAgc2VsZi51c2VXYXZlKDApO1xyXG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlcjtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIHRocm93IGVycjtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgdHlwZW9mIGF1ZGlvU3JjWzBdID09PSAnc3RyaW5nJykge1xyXG4gICAgICAvL211bHRpcGxlIGZpbGVzIHRvIGxvYWQvZGVjb2RlIGFuZCBjYW5jYXRpbmF0ZVxyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMubG9hZE11bHRpcGxlRmlsZXMoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgICAgICBzZWxmLnVzZVdhdmUoMCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIEFycmF5QnVmZmVyIHRvIGRlY29kZVxyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuZGVjb2RlQXVkaW9EYXRhKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICAgICAgc2VsZi51c2VXYXZlKDApO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiBhdWRpb1NyY1swXSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgQXJyYXlCdWZmZXJzIHRvIGRlY29kZSBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgdGhpcy5kZWNvZGVBdWRpb1NvdXJjZXMoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oYXVkaW9CdWZmZXJzKSB7XHJcbiAgICAgICAgc2VsZi5mcmFnbWVudHMgPSBhdWRpb0J1ZmZlcnM7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuam9pbkF1ZGlvQnVmZmVycyhhdWRpb0J1ZmZlcnMpO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbihmdW5jdGlvbihhdWRpb0J1ZmZlcikge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gYXVkaW9CdWZmZXI7XHJcbiAgICAgICAgc2VsZi51c2VXYXZlKDApO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIpIHtcclxuICAgICAgdGhpcy5idWZmZXIgPSBhdWRpb1NyYztcclxuICAgICAgdGhpcy51c2VXYXZlKDApO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5qb2luQXVkaW9CdWZmZXJzKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgICAgc2VsZi5idWZmZXIgPSBhdWRpb0J1ZmZlcjtcclxuICAgICAgICBzZWxmLnVzZVdhdmUoMCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIFNvdW5kV2F2ZSBvYmplY3Q6IFVuc3VwcG9ydGVkIGRhdGEgZm9ybWF0Jyk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vc3RhcnQgdGhlIG9iamVjdCB3aXRoIGVtcHR5IGJ1ZmZlci4gVXNlZnVsbCBmb3IgdGVzdGluZyBhbmQgYWR2YW5jZWQgdXNhZ2UuXHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIGFycmF5IG9mIGZpbGVuYW1lcyBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlc1xyXG4gKiB0byBhbiBBdWRpb0J1ZmZlciBpbmNsdWRpbmcgdGhlIFBDTSBkYXRhIG9mIGFsbCBmaWxlcyBvbiBzdWNjZXNzLlxyXG4gKiBSZXR1cm5zIGFuIGVycm9yIG9uIGZhaWx1cmUuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgICBmaWxlbmFtZXMgQXJyYXkgd2l0aCBmaWxlbmFtZXMgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgUmVzb2x2ZXMgdG8gQXVkaW9CdWZmZXIgb3IgdGhyb3dzIGVycm9yLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkTXVsdGlwbGVGaWxlcyA9IGZ1bmN0aW9uKHVybHMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGZpbGVuYW1lcyA9IHRoaXMuc3RyaXBGaWxlbmFtZXModXJscyk7XHJcblxyXG4gIHJldHVybiB0aGlzLmxvYWRGaWxlcyh1cmxzKS50aGVuKGZ1bmN0aW9uKGJpbkJ1ZmZlcnMpIHtcclxuICAgIHJldHVybiBzZWxmLmRlY29kZUF1ZGlvU291cmNlcyhiaW5CdWZmZXJzKTtcclxuICB9KVxyXG4gIC50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVycykge1xyXG4gICAgdmFyIHByb21pc2VzID0gW107XHJcbiAgICBzZWxmLmZyYWdtZW50cyA9IGF1ZGlvQnVmZmVycztcclxuICAgIHByb21pc2VzLnB1c2goc2VsZi5qb2luQXVkaW9CdWZmZXJzKGF1ZGlvQnVmZmVycyksXHJcbiAgICAgIHNlbGYuc3RvcmVNZXRhRGF0YShhdWRpb0J1ZmZlcnMsIGZpbGVuYW1lcykpO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcclxuICB9KVxyXG4gIC50aGVuKGZ1bmN0aW9uKGJ1ZmZlckFuZE1ldGEpIHtcclxuICAgIHNlbGYubWV0YURhdGEgPSBidWZmZXJBbmRNZXRhWzFdO1xyXG4gICAgcmV0dXJuIGJ1ZmZlckFuZE1ldGFbMF07XHJcbiAgfSlcclxuICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICB0aHJvdyBlcnI7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIGFuZCByZXR1cm5zIGFuIGVxdWFsIG51bWJlciBvZiBBdWRpb0J1ZmZlcnMuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgICBidWZmZXJzIEFycmF5IHdpdGggQXJyYXlCdWZmZXJzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgIFJlc29sdmVzIHRvIGFuIGFycmF5IG9mIEF1ZGlvQnVmZmVycyBvciBlcnJvclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5kZWNvZGVBdWRpb1NvdXJjZXMgPSBmdW5jdGlvbihidWZmZXJzKSB7XHJcbiAgdmFyIHByb21pc2VzID0gW107XHJcbiAgYnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlcikge1xyXG4gICAgcHJvbWlzZXMucHVzaCh0aGlzLmRlY29kZUF1ZGlvRGF0YShidWZmZXIpKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhbiBBcnJheUJ1ZmZlciB3aXRoIGJpbmFyeSBhdWRpbyBkYXRhIGFuZFxyXG4gKiB0dXJucyBpdCBpbnRvIGFuIGF1ZGlvIGJ1ZmZlciBvYmplY3QuXHJcbiAqIEp1c3QgYSB3cmFwcGVyIGZvciB0aGUgd2ViLWF1ZGlvLWFwaSBkZWNvZGVBdWRpb0RhdGEgZnVuY3Rpb24uXHJcbiAqIEl0IHVzZXMgdGhlIG5ldyBwcm9taXNlIHN5bnRheCBzbyBpdCBwcm9iYWJseSB3b24ndCB3b3JrIGluIGFsbCBicm93c2VycyBieSBub3cuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5QnVmZmVyfSAgcmF3QXVkaW9TcmMgQXVkaW8gZGF0YSBpbiByYXcgYmluYXJ5IGZvcm1hdFxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICAgICAgIFJlc29sdmVzIHRvIEF1ZGlvQnVmZmVyIG9yIGVycm9yXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKHJhd0F1ZGlvU3JjKSB7XHJcbiAgcmV0dXJuIGNvcmUuZGVjb2RlQXVkaW9EYXRhKHJhd0F1ZGlvU3JjKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBKb2lucyBhbiBhcmJpdHJhcnkgbnVtYmVyIG9mIEFycmF5QnVmZmVycy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIGJ1ZmZlcnMgQXJyYXkgb2YgQXVkaW9CdWZmZXJzXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIFdhdmVmb3JtIHRoYXQgaW5jbHVkZXMgYWxsIGdpdmVuIGJ1ZmZlcnMuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmpvaW5BdWRpb0J1ZmZlcnMgPSBmdW5jdGlvbihidWZmZXJzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBpbnB1dCwgam9pbmVkQnVmZmVyO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShidWZmZXJzKSkge1xyXG4gICAgICBqb2luZWRCdWZmZXIgPSBidWZmZXJzWzBdO1xyXG4gICAgICBpbnB1dCA9IGJ1ZmZlcnMuc2xpY2UoMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZWplY3QobmV3IFR5cGVFcnJvcignQXJndW1lbnQgaXMgbm90IG9mIHR5cGUgQXJyYXknKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5wdXQuZm9yRWFjaChmdW5jdGlvbihidWZmZXIpIHtcclxuICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlciAmJlxyXG4gICAgICAgIGpvaW5lZEJ1ZmZlciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgICAgIGpvaW5lZEJ1ZmZlciA9IHRoaXMuYXBwZW5kQXVkaW9CdWZmZXIoam9pbmVkQnVmZmVyLCBidWZmZXIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdPbmUgb3IgbW9yZSBidWZmZXJzIGFyZSBub3Qgb2YgdHlwZSBBdWRpb0J1ZmZlci4nKSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHNlbGYpO1xyXG4gICAgcmVzb2x2ZShqb2luZWRCdWZmZXIpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIEJvdGggYnVmZmVycyBzaG91bGQgaGF2ZSB0aGUgc2FtZSBhbW91bnRcclxuICogb2YgY2hhbm5lbHMuIElmIG5vdCwgY2hhbm5lbHMgd2lsbCBiZSBkcm9wcGVkLiBGb3IgZXhhbXBsZSwgaWYgeW91XHJcbiAqIGFwcGVuZCBhIHN0ZXJlbyBhbmQgYSBtb25vIGJ1ZmZlciwgdGhlIG91dHB1dCB3aWxsIGJlIG1vbm8gYW5kIG9ubHlcclxuICogb25lIG9mIHRoZSBjaGFubmVscyBvZiB0aGUgc3RlcmVvIHNhbXBsZSB3aWxsIGJlIHVzZWQgKG5vIG1lcmdpbmcgb2YgY2hhbm5lbHMpLlxyXG4gKiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOjxicj5cclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDE0MzY1Mi93ZWItYXVkaW8tYXBpLWFwcGVuZC1jb25jYXRlbmF0ZS1kaWZmZXJlbnQtYXVkaW9idWZmZXJzLWFuZC1wbGF5LXRoZW0tYXMtb25lLXNvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMSBUaGUgZmlyc3QgYXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIyIFRoZSBzZWNvbmQgYXVkaW8gYnVmZmVyXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIGJ1ZmZlcjEgKyBidWZmZXIyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFwcGVuZEF1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyMSwgYnVmZmVyMikge1xyXG4gIGlmIChidWZmZXIxIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmXHJcbiAgYnVmZmVyMiBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgICAgKGJ1ZmZlcjEubGVuZ3RoICsgYnVmZmVyMi5sZW5ndGgpLFxyXG4gICAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgICAgdmFyIGNoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSk7XHJcbiAgICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdCdWZmZXI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ09uZSBvciBib3RoIGJ1ZmZlcnMgYXJlIG5vdCBvZiB0eXBlIEF1ZGlvQnVmZmVyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yZXMgbWV0YURhdGEgb2JqZWN0cyBpbiB0aGUgbWV0YURhdGEgYXJyYXkuXHJcbiAqIEBwYXJhbSAge0FycmF5fSBhdWRpb0J1ZmZlcnMgQXJyYXkgb2YgQXVkaW9CdWZmZXJzXHJcbiAqIEBwYXJhbSAge0FycmF5fSBuYW1lcyAgICAgICAgQXJyYXkgb2YgbmFtZXNcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICBSZXNvbHZlcyB0byBhIG1ldGFEYXRhIGFycmF5IG9yIGVycm9yLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5zdG9yZU1ldGFEYXRhID0gZnVuY3Rpb24oYXVkaW9CdWZmZXJzLCBuYW1lcykge1xyXG4gIHZhciBmbmFtZXMgPSBbXTtcclxuICB2YXIgbWV0YURhdGEgPSBbXTtcclxuICB2YXIgc3RhcnQgPSAwO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgaWYgKHR5cGVvZiBuYW1lcyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgYXVkaW9CdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyLCBpbmRleCkge1xyXG4gICAgICAgIGZuYW1lcy5wdXNoKCdmcmFnbWVudCcgKyBpbmRleCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChuYW1lcy5sZW5ndGggPT09IGF1ZGlvQnVmZmVycy5sZW5ndGgpIHtcclxuICAgICAgZm5hbWVzID0gbmFtZXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZWplY3QobmV3IEVycm9yKCdhdWRpb0J1ZmZlcnMgYW5kIG5hbWVzIHNob3VsZCBiZSBvZiBzYW1lIGxlbmd0aCcpKTtcclxuICAgIH1cclxuICAgIGF1ZGlvQnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlciwgaW5kZXgpIHtcclxuICAgICAgbWV0YURhdGEucHVzaCh0aGlzLmdldE1ldGFEYXRhKGJ1ZmZlciwgbmFtZXNbaW5kZXhdLCBzdGFydCkpO1xyXG4gICAgICBzdGFydCArPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgfSwgc2VsZik7XHJcbiAgICByZXNvbHZlKG1ldGFEYXRhKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdHJpcHMgZmlsZW5hbWVzIGZyb20gYW4gYXJyYXkgb2YgdXJscyBhbmQgcmV0dXJucyBpdCBpbiBhbiBhcnJheS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IHVybHMgQXJyYXkgb2YgdXJsc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICBBcnJheSBvZiBmaWxlbmFtZXNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc3RyaXBGaWxlbmFtZXMgPSBmdW5jdGlvbih1cmxzKSB7XHJcbiAgcmV0dXJuIHVybHMubWFwKGZ1bmN0aW9uKHVybCkge1xyXG4gICAgcmV0dXJuIHVybC5zcGxpdCgnLycpLnBvcCgpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcCBwb2ludHMgYW5kIGxlbmd0aCBpbiBzYW1wbGUtZnJhbWVzXHJcbiAqIG9mIGEgYnVmZmVyIGZyYWdtZW50Li5cclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlciAgICAgIEJ1ZmZlciB3aXRoIHRoZSBhcHBlbmRhYmxlIHBjbSBmcmFnbWVudFxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgbmFtZSAgICAgICAgTmFtZSBvZiB0aGUgZnJhZ21lbnRcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgIHN0YXJ0ICAgICAgIFN0YXJ0cG9pbnQgb2YgdGhlIGZyYWdtZW50XHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICBEaWN0aW9uYXJ5IHdpdGggbWV0YSBkYXRhIG9yIGVycm9yIG1zZ1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5nZXRNZXRhRGF0YSA9IGZ1bmN0aW9uKGJ1ZmZlciwgbmFtZSwgc3RhcnQpIHtcclxuICBpZiAoYnVmZmVyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgc3RhcnQgPSAwO1xyXG4gICAgfVxyXG4gICAgdmFyIGJ1Zkxlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAnbmFtZSc6IG5hbWUsXHJcbiAgICAgICdzdGFydCc6IHN0YXJ0LFxyXG4gICAgICAnZW5kJzogc3RhcnQgKyBidWZMZW5ndGggLSAxLFxyXG4gICAgICAnbGVuZ3RoJzogYnVmTGVuZ3RoXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgc2hvdWxkIGJlIG9mIHR5cGUgQXVkaW9CdWZmZXIgYW5kIFN0cmluZycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIChhdWRpbykgZmlsZSBhbmQgcmV0dXJucyBpdHMgZGF0YSBhcyBBcnJheUJ1ZmZlclxyXG4gKiB3aGVuIHRoZSBwcm9taXNlIGZ1bGZpbGxzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdXJsICAgICAgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICBBIHByb21pc2UgcmVwcmVzZW50aW5nIHRoZSB4aHIgcmVzcG9uc2VcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbih1cmwpIHtcclxuICByZXR1cm4gd2luZG93LmZldGNoKHVybClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmVyIGVycm9yLiBDb3VsZG5cXCd0IGxvYWQgZmlsZTogJyArIHVybCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIChhdWRpbykgZmlsZXMgYW5kIHJldHVybnMgYW4gYXJyYXlcclxuICogd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBmaWxlcyBpbiB0aGUgZ2l2ZW4gb3JkZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzIExpc3Qgd2l0aCBmaWxlbmFtZXNcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgQXJyYXkgb2YgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHZhciBwcm9taXNlcyA9IFtdO1xyXG4gIGZpbGVuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkRmlsZShuYW1lKSk7XHJcbiAgfSwgdGhpcyk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldCBhbiBBdWRpb0J1ZmZlciB3aXRoIGEgZnJhZ21lbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIG9mIHRoaXMgb2JqZWN0LlxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHN0YXJ0ICAgU3RhcnRwb2ludCBvZiB0aGUgZnJhZ21lbnQgaW4gc2FtcGxlc1xyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIGVuZCAgICAgRW5kcG9pbnQgb2YgdGhlIGZyYWdtZW50IGluIHNhbXBsZXNcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgIEF1ZGlvQnVmZmVyIGluY2x1ZGluZyB0aGUgZnJhZ21lbnRcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZ2V0QnVmZmVyRnJhZ21lbnQgPSBmdW5jdGlvbihzdGFydCwgZW5kKSB7XHJcbiAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBdWRpbyBidWZmZXIgZW1wdHkuIE5vdGhpbmcgdG8gY29weS4nKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcclxuICB9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xyXG4gICAgc3RhcnQgPSAwO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBlbmQgPT09ICd1bmRlZmluZWQnIHx8IGVuZCA+IHRoaXMuYnVmZmVyLmxlbmd0aCkge1xyXG4gICAgZW5kID0gdGhpcy5idWZmZXIubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBcmd1bWVudHMgb3V0IG9mIGJvdW5kcy4nKTtcclxuICB9XHJcblxyXG4gIHZhciBjaG5Db3VudCA9IHRoaXMuYnVmZmVyLm51bWJlck9mQ2hhbm5lbHM7XHJcbiAgdmFyIGZyYW1lQ291bnQgPSBlbmQgLSBzdGFydDtcclxuICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIoY2huQ291bnQsIGZyYW1lQ291bnQsIGNvcmUuc2FtcGxlUmF0ZSk7XHJcblxyXG4gIGZvciAodmFyIGNobiA9IDA7IGNobiA8IGNobkNvdW50OyBjaG4rKykge1xyXG4gICAgdmFyIG5ld0NoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2huKTtcclxuICAgIHZhciBvbGRDaGFubmVsID0gdGhpcy5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2huKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICBuZXdDaGFubmVsW2ldID0gb2xkQ2hhbm5lbFtzdGFydCArIGldO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ld0J1ZmZlcjtcclxufTtcclxuXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUudXNlV2F2ZSA9IGZ1bmN0aW9uKHdhdmVTb3VyY2UpIHtcclxuICBpZiAoTnVtYmVyLmlzSW50ZWdlcih3YXZlU291cmNlKSkge1xyXG4gICAgaWYgKHdhdmVTb3VyY2UgPT09IDApIHtcclxuICAgICAgdGhpcy53YXZlID0gdGhpcy5idWZmZXI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLndhdmUgPSB0aGlzLmZyYWdtZW50c1t3YXZlU291cmNlIC0gMV07XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG5vdCBvZiB0eXBlIEludGVnZXInKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU29ydCBBcnJheUJ1ZmZlcnMgdGhlIHNhbWUgb3JkZXIsIGxpa2UgdGhlIGZpbGVuYW1lXHJcbiAqIHBhcmFtZXRlcnMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzICBBcnJheSB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGJpbkJ1ZmZlcnMgQXJyYXkgd2l0aCBBcnJheUJ1ZmZlclxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQXJyYXkgd2l0aCBzb3J0ZWQgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnNvcnRCaW5CdWZmZXJzID0gZnVuY3Rpb24oZmlsZW5hbWVzLCBiaW5CdWZmZXJzKSB7XHJcbiAgLy8gZnV0aWxlPz9cclxuICByZXR1cm4gZmlsZW5hbWVzLm1hcChmdW5jdGlvbihlbCkge1xyXG4gICAgcmV0dXJuIGJpbkJ1ZmZlcnNbZWxdO1xyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIHRoZSBmb3VuZGF0aW9uIG9mIHRoZSBJbnRlcm1peCBsaWJyYXJ5LlxyXG4gKiBJdCBzaW1wbHkgY3JlYXRlcyB0aGUgYXVkaW8gY29udGV4dCBvYmplY3RzXHJcbiAqIGFuZCBleHBvcnRzIGl0IHNvIGl0IGNhbiBiZSBlYXNpbHkgY29uc3VtZWRcclxuICogZnJvbSBhbGwgY2xhc3NlcyBvZiB0aGUgbGlicmFyeS5cclxuICpcclxuICogQHJldHVybiB7QXVkaW9Db250ZXh0fSBUaGUgQXVkaW9Db250ZXh0IG9iamVjdFxyXG4gKlxyXG4gKiBAdG9kbyBTaG91bGQgd2UgZG8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIG9sZGVyIGFwaS12ZXJzaW9ucz9cclxuICogQHRvZG8gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogQHRvZG8gQ2hlY2sgaWYgd2UncmUgcnVubmluZyBvbiBub2RlXHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlN1c3BlbmQgYW5kIHJlc3VtZSB0aGUgYXVkaW8gY29udGV4dCB0b1xyXG4gKiBjcmVhdGUgYSBwYXVzZSBidXR0b24uIFRoaXMgc2hvdWxkIGJlIHVzZWQgd2l0aCBjcmVhdGVBdWRpb1dvcmtlclxyXG4gKiBhcyBhbiBlcnJvciB3aWxsIGJlIHRocm93biB3aGVuIHN1c3BlbmQgaXMgY2FsbGVkIG9uIGFuIG9mZmxpbmUgYXVkaW8gY29udGV4dC5cclxuICogWW91IGNhbiBhbHNvIHBhdXNlIHNpbmdsZSBzb3VuZHMgd2l0aCA8aT5Tb3VuZC5wYXVzZSgpPC9pPi5cclxuICogUGxlYXNlIHJlYWQgPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RlL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvc3VzcGVuZFwiPnRoZSBkZXZlbG9wZXIgZG9jcyBhdCBNRE48L2E+XHJcbiAqIHRvIGdldCBhIGJldHRlciBpZGVhIG9mIHRoaXMuPC9jYXB0aW9uPlxyXG4gKiBzdXNyZXNCdG4ub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG4gKiAgIGlmKEludGVybWl4LnN0YXRlID09PSAncnVubmluZycpIHtcclxuICogICAgIEludGVybWl4LnN1c3BlbmQoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnUmVzdW1lIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfSBlbHNlIGlmIChJbnRlcm1peC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcclxuICogICAgIEludGVybWl4LnJlc3VtZSgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdTdXNwZW5kIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfVxyXG4gKiB9XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYXVkaW9DdHggPSBudWxsO1xyXG5cclxudmFyIGlzTW9iaWxlID0ge1xyXG4gICdBbmRyb2lkJzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSk7XHJcbiAgfSxcclxuICAnaU9TJzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZXxpUGFkfGlQb2QvaSk7XHJcbiAgfSxcclxuICAnQmxhY2tCZXJyeSc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9CbGFja0JlcnJ5L2kpO1xyXG4gIH0sXHJcbiAgJ09wZXJhJzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL09wZXJhIE1pbmkvaSk7XHJcbiAgfSxcclxuICBXaW5kb3dzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvSUVNb2JpbGUvaSkgfHxcclxuICAgIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XUERlc2t0b3AvaSk7XHJcbiAgfSxcclxuICBhbnk6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIChpc01vYmlsZS5BbmRyb2lkKCkgfHxcclxuICAgIGlzTW9iaWxlLmlPUygpIHx8XHJcbiAgICBpc01vYmlsZS5CbGFja0JlcnJ5KCkgfHxcclxuICAgIGlzTW9iaWxlLk9wZXJhKCkgfHxcclxuICAgIGlzTW9iaWxlLldpbmRvd3MoKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG5cclxuICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xyXG5cclxuICBpZiAodHlwZW9mIHdpbmRvdy5BdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ291bGRuXFwndCBpbml0aWFsaXplIHRoZSBhdWRpbyBjb250ZXh0LicpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGF1ZGlvQ3R4O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogVGhpcyBpcyBub3QgYWJvdXQgamF2YXNjcmlwdCBldmVudHMhIEl0J3MganVzdFxyXG4gKiBhIGRlZmluaXRpb24gb2YgdGhlIGV2ZW50cyB0aGF0IHRoZSBzZXF1ZW5jZXIgY2FuIGhhbmRsZSBwbHVzXHJcbiAqIHNvbWUgZnVuY3Rpb25zIHRvIGNyZWF0ZSB2YWxpZCBldmVudHMuXHJcbiAqIFRoZSBjbGFzcyBkZWZpbmVzIHdoaWNoIHN1YnN5c3RlbSBpcyBpbnZva2VkIHRvIHByb2Nlc3MgdGhlIGV2ZW50LlxyXG4gKiBFdmVyeSBjbGFzcyBjYW4gaGF2ZSBzZXZlcmFsIHR5cGVzIGFuZCBhIHR5cGUgY29uc2lzdHMgb2Ygb25lIG9yXHJcbiAqIG1vcmUgcHJvcGVydGllcy5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGEgbm90ZSBldmVudCBmb3IgYW4gYXVkaW8gb2JqZWN0PC9jYXB0aW9uPlxyXG4gKiB2YXIgbm90ZSA9IGludGVybWl4LmV2ZW50cy5jcmVhdGVBdWRpb05vdGUoJ2MzJywgNjUsIDEyOCwgYVNvdW5kT2JqZWN0KTtcclxuICovXHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IHByb3BlcnRpZXMgaW4gb25lIGhhbmR5IGFycmF5LlxyXG4gKiBAdHlwZSB7QXJyYXl9XHJcbiAqL1xyXG52YXIgZXZQcm9wID0gW1xyXG4gICdpbnN0cnVtZW50JywgLy8gdGhlIGV2ZW50IHJlY2VpdmVyXHJcbiAgJ3RvbmUnLCAgICAgICAvLyBJbnQgYmV0d2VlbiAwIGFuZCAxMjcgYmVnaW5uaW5nIGF0IGMwXHJcbiAgJ2R1cmF0aW9uJywgICAvLyBJbnQgcmVwcmVzZW50aW5nIGEgbnVtYmVyIG9mIDY0dGggbm90ZXNcclxuICAndmVsb2NpdHknLCAgIC8vIEludCBiZXR3ZWVuIDAgYW5kIDEyN1xyXG4gICdwaXRjaCcsXHJcbiAgJ3ZvbHVtZScsXHJcbiAgJ3BhbidcclxuXTtcclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgdHlwZXMgYW5kIHRoZSBwcm9wZXJ0aWVzIGFzc290aWF0ZWQgd2l0aCB0aGVtLlxyXG4gKiBUeXBlIGFyZSB2YWxpZCB3aXRoIG9uZSwgc2V2ZXJhbCBvciBhbGwgb2YgaXRzIHByb3BlcnRpZXMuXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG52YXIgZXZUeXBlID0ge1xyXG4gICdub3RlJzogWyBldlByb3BbMF0sIGV2UHJvcFsxXSwgZXZQcm9wWzJdLCBldlByb3BbM10gXSxcclxuICAnY29udHJvbCc6IFsgZXZQcm9wWzRdLCBldlByb3BbNV0sIGV2UHJvcFs2XSBdXHJcbn07XHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IGNsYXNzZXMgYW5kIHRoZSB0eXBlcyBhc3NvdGlhdGVkIHdpdGggdGhlbS5cclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbnZhciBldkNsYXNzID0ge1xyXG4gICdhdWRpbyc6IFtldlR5cGUubm90ZSwgZXZUeXBlLmNvbnRyb2xdLFxyXG4gICdzeW50aCc6IFtldlR5cGUubm90ZSwgZXZUeXBlLmNvbnRyb2xdLFxyXG4gICdmeCc6IFtdLFxyXG4gICdtaWRpJzogW10sXHJcbiAgJ29zYyc6IFtdXHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSBjbGFzcyBvZiBhIHNlcXVlbmNlciBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICB0cnVlIGlmIGNsYXNzIGV4aXN0cywgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVDbGFzcyA9IGZ1bmN0aW9uKGVDbGFzcykge1xyXG4gIGlmIChldkNsYXNzLmhhc093blByb3BlcnR5KGVDbGFzcykpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyB0aGUgdHlwZSBvZiBhIHNlcXVlbmNlciBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgZVR5cGUgRXZlbnQgdHlwZVxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgdHJ1ZSBpZiB0eXBlIGV4aXN0cywgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVUeXBlID0gZnVuY3Rpb24oZVR5cGUpIHtcclxuICBpZiAoZXZUeXBlLmhhc093blByb3BlcnR5KGVUeXBlKSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGFuIGluc3RydW1lbnQgaXMgYW4gb2JqZWN0LlxyXG4gKiBUaGlzIGlzIGEgcG9vcmx5IHdlYWsgdGVzdCBidXQgdGhhdCdzXHJcbiAqIGFsbCB3ZSBjYW4gZG8gaGVyZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBpbnN0ciBBbiBpbnN0cnVtZW50IG9iamVjdFxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIHRydWUgaWYgaXQncyBhbiBvYmplY3QsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcEluc3RydW1lbnQgPSBmdW5jdGlvbihpbnN0cikge1xyXG4gIGlmICh0eXBlb2YgaW5zdHIgPT09ICdvYmplY3QnKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgaWYgYSB0b25lIG9yIHZlbG9jaXR5IHZhbHVlIGlzXHJcbiAqIGFuIGludGVnZXIgYmV0d2VlbiAwIGFuZCAxMjcuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0ludH0gIHZhbHVlICAgVGhlIG51bWJlciB0aGF0IHJlcHJlc2VudHMgYSB0b25lXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgVHJ1ZSBpZiBpdHMgYSB2YWxpZCB0b25lLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BUb25lVmVsbyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgaWYgKCFpc05hTih2YWx1ZSkgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgJiYgdmFsdWUgPj0gMCAmJiB2YWx1ZSA8PSAxMjcpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBpZiBhIGR1cmF0aW9uIGlzIGEgcG9zaXRpdmUgaW50ZWdlci5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7SW50fSAgdmFsdWUgICBOdW1iZXIgcmVwcmVzZW50aW5nIG11bHRpcGxlIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICBUcnVlIGlmIGl0cyBhIHZhbGlkIGR1cmF0aW9uLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BEdXJhdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgaWYgKCFpc05hTih2YWx1ZSkgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgJiYgdmFsdWUgPj0gMCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGFuIG9iamVjdCBvZiBldmVudCBwcm9wZXJ0aWVzLlxyXG4gKiBJdCBjaGVja3MgdGhlIHByb3BlcnRpZXMgYXJlIHZhbGlkIGZvciB0aGUgZ2l2ZW4gdHlwZS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgIE9iamVjdCB3aXRoIGV2ZW50IHByb3BlcnRpZXNcclxuICogQHBhcmFtICB7U3RyaW5nfSBlVHlwZSAgIEV2ZW50IHR5cGUgdG8gdmFsaWRhdGUgYWdhaW5zdFxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgdHJ1ZSBpZiBhbGwgcHJvcHMgYXJlIHZhbGlkLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BzID0gZnVuY3Rpb24oZVByb3BzLCBlVHlwZSkge1xyXG4gIHZhciB0eXBlID0gZXZUeXBlW2VUeXBlXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZVByb3BzKSAge1xyXG4gICAgaWYgKGV2UHJvcC5pbmRleE9mKGtleSkgPT09IC0xICYmXHJcbiAgICB0eXBlLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIHN0cmluZyBvZiB0aGUgZm9ybSBjMyBvciBkIzQgYW5kXHJcbiAqIHJldHVybnMgdGhlIGNvcnJlc3BvbmRpbmcgbnVtYmVyLlxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHRvbmUgU3RyaW5nIHJlcHJlc2VudGluZyBhIG5vdGVcclxuICogQHJldHVybiB7SW50fSAgICAgICAgIE51bWJlciByZXByZXNlbnRpbmcgYSBub3RlXHJcbiAqL1xyXG52YXIgY29udmVydFRvbmUgPSBmdW5jdGlvbih0b25lKSB7XHJcbiAgdmFyIG5vdGVzID0gWydjJywgJ2MjJywgJ2QnLCAnZCMnLCAnZScsICdmJywgJ2YjJywgJ2cnLCAnZyMnLCAnYScsICdhIycsICdiJ107XHJcbiAgdmFyIHN0ciA9IHRvbmUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgaWYgKHN0ci5tYXRjaCgvXlthLWhdIz9bMC05XSQvKSkge1xyXG4gICAgdmFyIG5vdGUgPSBzdHIuc3Vic3RyaW5nKDAsIHN0ci5sZW5ndGggLSAxKTtcclxuICAgIHZhciBvY3QgPSBzdHIuc2xpY2UoLTEpO1xyXG5cclxuICAgIGlmIChub3RlID09PSAnaCcpIHtcclxuICAgICAgbm90ZSA9ICdiJztcclxuICAgIH1cclxuICAgIHJldHVybiBub3Rlcy5pbmRleE9mKG5vdGUpICsgb2N0ICogMTI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVW52YWxpZCBzdHJpbmcuIEhhcyB0byBiZSBsaWtlIFthLWhdPCM+WzAtOV0nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHNlcXVlbmNlciBldmVudC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSBlQ2xhc3MgRXZlbnQgY2xhc3NcclxuICogQHBhcmFtICB7U3RyaW5nfSBlVHlwZSAgRXZlbnQgdHlwZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGVQcm9wcyBPYmplY3Qgd2l0aCBldmVudCBwcm9wZXJ0aWVzXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgIFNlcXVlbmNlciBldmVudFxyXG4gKi9cclxudmFyIGNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24oZUNsYXNzLCBlVHlwZSwgZVByb3BzKSB7XHJcbiAgaWYgKHZhbGlkYXRlQ2xhc3MoZUNsYXNzKSAmJlxyXG4gICAgdmFsaWRhdGVUeXBlKGVUeXBlKSAmJlxyXG4gICAgdmFsaWRhdGVQcm9wcyhlUHJvcHMsIGVUeXBlKSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgJ2NsYXNzJzogZUNsYXNzLFxyXG4gICAgICAndHlwZSc6IGVUeXBlLFxyXG4gICAgICAncHJvcHMnOiBlUHJvcHNcclxuICAgIH07XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNyZWF0ZSBzZXF1ZW5jZXIgZXZlbnQuIFdyb25nIHBhcmFtZXRlcnMnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbiBhdWRpbyBub3RlIGV2ZW50XHJcbiAqIEBwYXJhbSAge0ludHxTdHJpbmd9IHRvbmUgICAgIFRvbmUgYmV0d2VlbiAwIGFuZCAxMjcgb3Igc3RyaW5nIChjMywgZCM0KVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgICAgICB2ZWxvY2l0eSBWZWxvY2l0eSBiZXR3ZWVuIDAgYW5kIDEyN1xyXG4gKiBAcGFyYW0gIHtJbnR9ICAgICAgICBkdXJhdGlvbiBEdXJhdGlvbiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgIEFsbCBwcm9wZXJ0aWVzIGluIG9uZSBvYmplY3RcclxuICovXHJcbnZhciBjcmVhdGVBdWRpb05vdGUgPSBmdW5jdGlvbih0b25lLCB2ZWxvY2l0eSwgZHVyYXRpb24sIGluc3RyKSB7XHJcbiAgdmFyIHByb3BzID0ge307XHJcbiAgaWYgKHR5cGVvZiB0b25lID09PSAnc3RyaW5nJykge1xyXG4gICAgdG9uZSA9IGNvbnZlcnRUb25lKHRvbmUpO1xyXG4gIH1cclxuICBpZiAodG9uZSAmJiB2YWxpZGF0ZVByb3BUb25lVmVsbyh0b25lKSkge1xyXG4gICAgcHJvcHMudG9uZSA9IHRvbmU7XHJcbiAgfVxyXG4gIGlmICh2ZWxvY2l0eSAmJiB2YWxpZGF0ZVByb3BUb25lVmVsbyh2ZWxvY2l0eSkpIHtcclxuICAgIHByb3BzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XHJcbiAgfVxyXG4gIGlmIChkdXJhdGlvbiAmJiB2YWxpZGF0ZVByb3BEdXJhdGlvbihkdXJhdGlvbikpIHtcclxuICAgIHByb3BzLmR1cmF0aW9uID0gZHVyYXRpb247XHJcbiAgfVxyXG4gIGlmIChpbnN0ciAmJiB2YWxpZGF0ZVByb3BJbnN0cnVtZW50KGluc3RyKSkge1xyXG4gICAgcHJvcHMuaW5zdHJ1bWVudCA9IGluc3RyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Egc2VxdWVuY2VyIGV2ZW50IG11c3QgaGF2ZSBhbiBpbnN0cnVtZW50IGFzIHByb3BlcnR5Jyk7XHJcbiAgfVxyXG4gIHJldHVybiBjcmVhdGVFdmVudCgnYXVkaW8nLCAnbm90ZScsIHByb3BzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGNsYXNzOiBldkNsYXNzLFxyXG4gIHR5cGU6IGV2VHlwZSxcclxuICBwcm9wZXJ0eTogZXZQcm9wLFxyXG4gIGNyZWF0ZUF1ZGlvTm90ZTogY3JlYXRlQXVkaW9Ob3RlXHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIGEgd2Vid29ya2VyIHRoYXQgcHJvdmlkZXMgYSB0aW1lclxyXG4gKiB0aGF0IGZpcmVzIHRoZSBzY2hlZHVsZXIgZm9yIHRoZSBzZXF1ZW5jZXIuXHJcbiAqIFRoaXMgaXMgYmVjYXVzZSB0aW1pbmcgaGVyZSBpcyAgbW9yZSBzdGFibGVcclxuICogdGhhbiBpbiB0aGUgbWFpbiB0aHJlYWQuXHJcbiAqIFRoZSBzeW50YXggaXMgYWRhcHRlZCB0byB0aGUgY29tbW9uanMgbW9kdWxlIHBhdHRlcm4uXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkl0IGlzIGp1c3QgZm9yIGxpYnJhcnkgaW50ZXJuYWxcclxuICogdXNhZ2UuIFNlZSBTZXF1ZW5jZXIuanMgZm9yIGRldGFpbHMuPC9jYXB0aW9uPlxyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoeyAnaW50ZXJ2YWwnOiAyMDAgfSk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICogd29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAqIHdvcmtlci50ZXJtaW5hdGUoKTsgIC8vd2Vid29ya2VyIGludGVybmFsIGZ1bmN0aW9uLCBqdXN0IGZvciBjb21wbGV0ZW5lc3NcclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB0aW1lciA9IG51bGw7XHJcbnZhciBpbnRlcnZhbCA9IDEwMDtcclxuXHJcbnZhciB3b3JrZXIgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuICAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbiAgICAgIGlmICh0aW1lcikge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3b3JrZXI7XHJcbiJdfQ==
