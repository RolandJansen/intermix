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
      this.buffer = this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple ArrayBuffers to decode and concatenate
      this.decodeAudioSources(audioSrc).then(function(audioBuffers) {
        self.fragments = audioBuffers;
        return self.joinAudioBuffers(audioBuffers);
      })
      .then(function(audioBuffer) {
        self.buffer = audioBuffer;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcblxyXG4vL2ludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciBpbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpIHx8IHt9O1xyXG5pbnRlcm1peC5ldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xyXG5pbnRlcm1peC5Tb3VuZFdhdmUgPSByZXF1aXJlKCcuL1NvdW5kV2F2ZS5qcycpO1xyXG5pbnRlcm1peC5Tb3VuZCA9IHJlcXVpcmUoJy4vU291bmQuanMnKTtcclxuaW50ZXJtaXguU2VxdWVuY2VyID0gcmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKTtcclxuaW50ZXJtaXguUGFydCA9IHJlcXVpcmUoJy4vUGFydC5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBpbnRlcm1peDtcclxuIiwidmFyIGJ1bmRsZUZuID0gYXJndW1lbnRzWzNdO1xudmFyIHNvdXJjZXMgPSBhcmd1bWVudHNbNF07XG52YXIgY2FjaGUgPSBhcmd1bWVudHNbNV07XG5cbnZhciBzdHJpbmdpZnkgPSBKU09OLnN0cmluZ2lmeTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIHZhciB3a2V5O1xuICAgIHZhciBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgdmFyIGV4cCA9IGNhY2hlW2tleV0uZXhwb3J0cztcbiAgICAgICAgLy8gVXNpbmcgYmFiZWwgYXMgYSB0cmFuc3BpbGVyIHRvIHVzZSBlc21vZHVsZSwgdGhlIGV4cG9ydCB3aWxsIGFsd2F5c1xuICAgICAgICAvLyBiZSBhbiBvYmplY3Qgd2l0aCB0aGUgZGVmYXVsdCBleHBvcnQgYXMgYSBwcm9wZXJ0eSBvZiBpdC4gVG8gZW5zdXJlXG4gICAgICAgIC8vIHRoZSBleGlzdGluZyBhcGkgYW5kIGJhYmVsIGVzbW9kdWxlIGV4cG9ydHMgYXJlIGJvdGggc3VwcG9ydGVkIHdlXG4gICAgICAgIC8vIGNoZWNrIGZvciBib3RoXG4gICAgICAgIGlmIChleHAgPT09IGZuIHx8IGV4cC5kZWZhdWx0ID09PSBmbikge1xuICAgICAgICAgICAgd2tleSA9IGtleTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF3a2V5KSB7XG4gICAgICAgIHdrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgdmFyIHdjYWNoZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgICAgICB3Y2FjaGVba2V5XSA9IGtleTtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2VzW3drZXldID0gW1xuICAgICAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJywnbW9kdWxlJywnZXhwb3J0cyddLCAnKCcgKyBmbiArICcpKHNlbGYpJyksXG4gICAgICAgICAgICB3Y2FjaGVcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHNrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcblxuICAgIHZhciBzY2FjaGUgPSB7fTsgc2NhY2hlW3drZXldID0gd2tleTtcbiAgICBzb3VyY2VzW3NrZXldID0gW1xuICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnXSwgKFxuICAgICAgICAgICAgLy8gdHJ5IHRvIGNhbGwgZGVmYXVsdCBpZiBkZWZpbmVkIHRvIGFsc28gc3VwcG9ydCBiYWJlbCBlc21vZHVsZVxuICAgICAgICAgICAgLy8gZXhwb3J0c1xuICAgICAgICAgICAgJ3ZhciBmID0gcmVxdWlyZSgnICsgc3RyaW5naWZ5KHdrZXkpICsgJyk7JyArXG4gICAgICAgICAgICAnKGYuZGVmYXVsdCA/IGYuZGVmYXVsdCA6IGYpKHNlbGYpOydcbiAgICAgICAgKSksXG4gICAgICAgIHNjYWNoZVxuICAgIF07XG5cbiAgICB2YXIgc3JjID0gJygnICsgYnVuZGxlRm4gKyAnKSh7J1xuICAgICAgICArIE9iamVjdC5rZXlzKHNvdXJjZXMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5naWZ5KGtleSkgKyAnOlsnXG4gICAgICAgICAgICAgICAgKyBzb3VyY2VzW2tleV1bMF1cbiAgICAgICAgICAgICAgICArICcsJyArIHN0cmluZ2lmeShzb3VyY2VzW2tleV1bMV0pICsgJ10nXG4gICAgICAgICAgICA7XG4gICAgICAgIH0pLmpvaW4oJywnKVxuICAgICAgICArICd9LHt9LFsnICsgc3RyaW5naWZ5KHNrZXkpICsgJ10pJ1xuICAgIDtcblxuICAgIHZhciBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwgfHwgd2luZG93Lm1velVSTCB8fCB3aW5kb3cubXNVUkw7XG5cbiAgICByZXR1cm4gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKFxuICAgICAgICBuZXcgQmxvYihbc3JjXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KVxuICAgICkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgcGFydCBvZiBhIHNlcXVlbmNlLiBJdCBjYW4gYmVcclxuICogdXNlZCBpbiBtYW55IHdheXM6XHJcbiAqIDx1bD5cclxuICogPGxpPkEgcGFydCBvZiBhIHRyYWNrIGxpa2UgaW4gcGlhbm8tcm9sbCBzZXF1ZW5jZXJzPC9saT5cclxuICogPGxpPkEgcGF0dGVybiBsaWtlIGluIHN0ZXAgc2VxdWVuY2VycywgZHJ1bSBjb21wdXRlcnMgYW5kIHRyYWNrZXJzPC9saT5cclxuICogPGxpPkEgbG9vcCBsaWtlIGluIGxpdmUgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDwvdWw+XHJcbiAqIFRlY2huaWNhbGx5IGl0IGNhbiBzdG9yZSBhbnkgdHlwZSBvZiBldmVudCB5b3VyIHN5c3RlbSBpcyBjYXBhYmxlIG9mLlxyXG4gKiBUaGlzIG1lYW5zIGl0IGlzIG5vdCBsaW1pdGVkIHRvIGF1ZGlvLCBtaWRpLCBvc2Mgb3IgZG14IGJ1dCBjYW4gaG9sZFxyXG4gKiBhbnkgdHlwZSBvZiBqYXZhc2NyaXB0IG9iamVjdC4gQSBwb3NzaWJsZSB1c2VjYXNlIHdvdWxkIGJlIHRvIHRyaWdnZXJcclxuICogc2NyZWVuIGV2ZW50cyB3aXRoIHRoZSBkcmF3IGZ1bmN0aW9uIG9mIHRoZSBzZXF1ZW5jZXIgb2JqZWN0LlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlT2JqZWN0KTtcclxuICogdmFyIHNlcSA9IG5ldyBpbnRlcm1peC5TZXF1ZW5jZXIoKTtcclxuICogdmFyIHBhcnQgPSBuZXcgaW50ZXJtaXguUGFydCgpO1xyXG4gKiB2YXIgbm90ZSA9IGludGVybWl4LmV2ZW50cy5jcmVhdGVBdWRpb05vdGUoJ2EzJywgMSwgMCwgc291bmQpO1xyXG4gKiBwYXJ0LmFkZEV2ZW50KG5vdGUsIDApO1xyXG4gKiBwYXJ0LmFkZEV2ZW50KG5vdGUsIDQpO1xyXG4gKiBzZXEuYWRkUGFydChwYXJ0LCAwKTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICAgICAgIExlbmd0aCBvZiB0aGUgcGFydCBpbiA2NHRoIG5vdGVzIChkZWZhdWx0OiA2NClcclxuICovXHJcbnZhciBQYXJ0ID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcblxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDE2OyAvLyAocmVzb2x1dGlvbiAqIG11bHRpcGx5KSBzaG91bGQgYWx3YXN5IGJlIDY0XHJcbiAgdGhpcy5tdWx0aXBseSA9IDQ7ICAgIC8vIHJlc29sdXRpb24gbXVsdGlwbGllclxyXG4gIHRoaXMubGVuZ3RoID0gNjQ7ICAgICAvLyBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gIHRoaXMubmFtZSA9ICdQYXJ0JzsgICAvLyBuYW1lIG9mIHRoaXMgcGFydFxyXG4gIHRoaXMucGF0dGVybiA9IFtdOyAgICAvLyB0aGUgYWN0dWFsIHBhdHRlcm4gd2l0aCBub3RlcyBldGMuXHJcblxyXG4gIGlmIChsZW5ndGgpIHtcclxuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5pbml0UGF0dGVybih0aGlzLmxlbmd0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhbiBlbXB0eSBwYXR0ZXJuIGZvciB0aGUgcGFydC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggIExlbmd0aCBvZiB0aGUgcGF0dGVybiBtZXN1cmVkIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmluaXRQYXR0ZXJuID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcbiAgdmFyIHBhdHRlcm4gPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IChsZW5ndGgpOyBpKyspIHtcclxuICAgIHBhdHRlcm5baV0gPSBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHBhdHRlcm47XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbiBldmVudCB0byB0aGUgcGF0dGVybiBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5hZGRFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIGlmIChwb3NpdGlvbiA8PSB0aGlzLnJlc29sdXRpb24pIHtcclxuICAgIHZhciBwb3MgPSAocG9zaXRpb24pICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvc2l0aW9uIG91dCBvZiBwYXR0ZXJuIGJvdW5kcy4nKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbiBldmVudCBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIHZhciBwb3MgPSAocG9zaXRpb24pICogdGhpcy5tdWx0aXBseTtcclxuICB2YXIgaW5kZXggPSB0aGlzLnBhdHRlcm5bcG9zXS5pbmRleE9mKHNlcUV2ZW50KTtcclxuICB0aGlzLnBhdHRlcm5bcG9zXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgbGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7SW50fSAgICBMZW5ndGggb2YgdGhlIHBhdHRlcm5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBhdHRlcm4ubGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhbGwgcG9zaXRpb25zIHRoYXQgY29udGFpbiBhdCBsZWFzdCBvbmUgZXZlbnQuXHJcbiAqIENhbiBiZSBoYW5keSB0byBkcmF3IGV2ZW50cyBvbiB0aGUgc2NyZWVuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5mcm9tIHtAdHV0b3JpYWwgU3RlcHNlcXVlbmNlcn08L2NhcHRpb24+XHJcbiAqIGJkU3RlcHMgPSBiZFBhcnQuZ2V0Tm90ZVBvc2l0aW9ucygpO1xyXG4gKiBiZFN0ZXBzLmZvckVhY2goZnVuY3Rpb24ocG9zKSB7XHJcbiAqICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JkJyArIHBvcykuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JlZCc7XHJcbiAqIH0pO1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gIExpc3Qgd2l0aCBhbGwgbm9uLWVtcHR5IHBhdHRlcm4gZW50cmllc1xyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0Tm90ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwb3NpdGlvbnMgPSBbXTtcclxuICB0aGlzLnBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbihlbCwgaW5kZXgpIHtcclxuICAgIGlmIChlbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHBvc2l0aW9ucy5wdXNoKGluZGV4IC8gdGhpcy5tdWx0aXBseSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbiAgcmV0dXJuIHBvc2l0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIGEgcGFydCBhdCB0aGUgdG9wL3N0YXJ0LlxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGV4dExlbmd0aCBMZW5ndGggaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25Ub3AgPSBmdW5jdGlvbihleHRMZW5ndGgpIHtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihleHRMZW5ndGgpO1xyXG4gIHRoaXMucGF0dGVybiA9IGV4dGVuc2lvbi5jb25jYXQodGhpcy5wYXR0ZXJuKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIGEgcGFydCBhdCB0aGUgZW5kXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPbkVuZCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5wYXR0ZXJuLmNvbmNhdChleHRlbnNpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYXJ0O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgd29yayA9IHJlcXVpcmUoJ3dlYndvcmtpZnknKTsgICAvL3ByZXBhcmVzIHRoZSB3b3JrZXIgZm9yIGJyb3dzZXJpZnlcclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIHdvcmtlciA9IHJlcXVpcmUoJy4vc2NoZWR1bGVXb3JrZXIuanMnKTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgbWFpbiBjbGFzcyBvZiB0aGUgc2VxdWVuY2VyLiBJdCBkb2VzIHRoZSBxdWV1aW5nIG9mXHJcbiAqIHBhcnRzIGFuZCBldmVudHMgYW5kIHJ1bnMgdGhlIHNjaGVkdWxlcnMgdGhhdCBmaXJlIGV2ZW50c1xyXG4gKiBhbmQgZHJhd3MgdG8gdGhlIHNjcmVlbi5cclxuICogQGV4YW1wbGVcclxuICogdmFyIHBhcnQgPSBuZXcgaW50ZXJtaXguUGFydCgpO1xyXG4gKiB2YXIgc2VxID0gbmV3IGludGVybWl4LlNlcXVlbmNlcigpO1xyXG4gKiBwYXJ0LmFkZEV2ZW50KHNvbWVOb3RlLCAwKTtcclxuICogc2VxLmFkZFBhcnQocGFydCwgMCk7XHJcbiAqIHNlcS5zdGFydCgpO1xyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBTZXF1ZW5jZXIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5icG0gPSAxMjA7ICAgICAgICAgICAgIC8vYmVhdHMgcGVyIG1pbnV0ZVxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDY0OyAgICAgICAvL3Nob3J0ZXN0IHBvc3NpYmxlIG5vdGUuIFlvdSBub3JtYWxseSBkb24ndCB3YW50IHRvIHRvdWNoIHRoaXMuXHJcbiAgdGhpcy5pbnRlcnZhbCA9IDEwMDsgICAgICAgIC8vdGhlIGludGVydmFsIGluIG1pbGlzZWNvbmRzIHRoZSBzY2hlZHVsZXIgZ2V0cyBpbnZva2VkLlxyXG4gIHRoaXMubG9va2FoZWFkID0gMC4zOyAgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGxvb2tzIGFoZWFkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Nob3VsZCBiZSBsb25nZXIgdGhhbiBpbnRlcnZhbC5cclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgICAgLy9MaXN0IHdpdGggYWxsIHBhcnRzIG9mIHRoZSBzY29yZVxyXG4gIHRoaXMucnVucXVldWUgPSBbXTsgICAgICAgICAvL2xpc3Qgd2l0aCBwYXJ0cyB0aGF0IGFyZSBwbGF5aW5nIG9yIHdpbGwgYmUgcGxheWVkIHNob3J0bHlcclxuXHJcbiAgdGhpcy50aW1lUGVyU3RlcDsgICAgICAgICAgIC8vcGVyaW9kIG9mIHRpbWUgYmV0d2VlbiB0d28gc3RlcHNcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7ICAgICAgLy90aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgbmV4dCBzdGVwIHdpbGwgYmUgdHJpZ2dlcmVkXHJcbiAgdGhpcy5uZXh0U3RlcCA9IDA7ICAgICAgICAgIC8vcG9zaXRpb24gaW4gdGhlIHF1ZXVlIHRoYXQgd2lsbCBnZXQgdHJpZ2dlcmVkIG5leHRcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gMDsgICAgLy9zdGVwIGluIHF1ZXVlIHRoYXQgd2FzIHBsYXllZCAobm90IHRyaWdnZXJlZCkgcmVjZW50bHkgKHVzZWQgZm9yIGRyYXdpbmcpLlxyXG4gIHRoaXMubG9vcCA9IGZhbHNlOyAgICAgICAgICAvL3BsYXkgYSBzZWN0aW9uIG9mIHRoZSBxdWV1ZSBpbiBhIGxvb3BcclxuICB0aGlzLmxvb3BTdGFydDsgICAgICAgICAgICAgLy9maXJzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5sb29wRW5kOyAgICAgICAgICAgICAgIC8vbGFzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTsgICAgIC8vdHJ1ZSBpZiBzZXF1ZW5jZXIgaXMgcnVubmluZywgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgdGhpcy5hbmltYXRpb25GcmFtZTsgICAgICAgIC8vaGFzIHRvIGJlIG92ZXJyaWRkZW4gd2l0aCBhIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBpbiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9kcmF3IGZ1bmN0aW9uIHdpdGggdGhlIGxhc3RQbGF5ZWRTdGVwIGludCBhcyBwYXJhbWV0ZXIuXHJcblxyXG4gIC8vIHNldCB0aW1lIHBlciBzZXRUaW1lUGVyU3RlcFxyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKHRoaXMuYnBtLCB0aGlzLnJlc29sdXRpb24pO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBzY2hlZHVsZXItdGltZXJcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyID0gd29yayh3b3JrZXIpO1xyXG5cclxuICAvKmVzbGludC1lbmFibGUgKi9cclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAndGljaycpIHtcclxuICAgICAgc2VsZi5zY2hlZHVsZXIoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKHsnaW50ZXJ2YWwnOiB0aGlzLmludGVydmFsfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgZXZlbnRzIGZyb20gdGhlIG1hc3RlciBxdWV1ZSBhbmQgZmlyZXMgdGhlbS5cclxuICogSXQgZ2V0cyBjYWxsZWQgYXQgYSBjb25zdGFudCByYXRlLCBsb29rcyBhaGVhZCBpblxyXG4gKiB0aGUgcXVldWUgYW5kIGZpcmVzIGFsbCBldmVudHMgaW4gdGhlIG5lYXIgZnV0dXJlXHJcbiAqIHdpdGggYSBkZWxheSBjb21wdXRlZCBmcm9tIHRoZSBjdXJyZW50IGJwbSB2YWx1ZS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGxpbWl0ID0gY29yZS5jdXJyZW50VGltZSArIHRoaXMubG9va2FoZWFkO1xyXG4gIC8vIGlmIGludm9rZWQgZm9yIHRoZSBmaXJzdCB0aW1lIG9yIHByZXZpb3VzbHkgc3RvcHBlZFxyXG4gIGlmICh0aGlzLm5leHRTdGVwVGltZSA9PT0gMCkge1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHRoaXMubmV4dFN0ZXBUaW1lIDwgbGltaXQpIHtcclxuICAgIHRoaXMuYWRkUGFydHNUb1J1bnF1ZXVlKCk7XHJcbiAgICB0aGlzLmZpcmVFdmVudHMoKTtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lICs9IHRoaXMudGltZVBlclN0ZXA7XHJcblxyXG4gICAgdGhpcy5zZXRRdWV1ZVBvaW50ZXIoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogTG9va3MgaW4gdGhlIG1hc3RlciBxdWV1ZSBmb3IgcGFydHMgYW5kIGFkZHNcclxuICogY29waWVzIG9mIHRoZW0gdG8gdGhlIHJ1bnF1ZXVlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5hZGRQYXJ0c1RvUnVucXVldWUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodHlwZW9mIHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5sZW5ndGggPT09IDEpIHtcclxuICAgICAgdmFyIHBhcnQgPSB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdWzBdO1xyXG4gICAgICBwYXJ0LnBvaW50ZXIgPSAwO1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2gocGFydCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICAgIHBhcnQucG9pbnRlciA9IDA7XHJcbiAgICAgICAgdGhpcy5ydW5xdWV1ZS5wdXNoKHBhcnQpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRGVsZXRlcyBwYXJ0cyBmcm9tIHJ1bnF1ZXVlLiBJdCBpcyBpbXBvcnRhbnQsIHRoYXQgdGhlIGluZGljZXNcclxuICogb2YgdGhlIHBhcnRzIGFyZSBzb3J0ZWQgZnJvbSBtYXggdG8gbWluLiBPdGhlcndpc2UgdGhlIGZvckVhY2hcclxuICogbG9vcCB3b24ndCB3b3JrLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gaW5kaWNlcyAgSW5kaWNlcyBvZiB0aGUgcGFydHMgaW4gdGhlIHJ1bnF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRlbGV0ZVBhcnRzRnJvbVJ1bnF1ZXVlID0gZnVuY3Rpb24oaW5kaWNlcykge1xyXG4gIGlmIChpbmRpY2VzLmxlbmd0aCA+IDApIHtcclxuICAgIGluZGljZXMuZm9yRWFjaChmdW5jdGlvbihpZCkge1xyXG4gICAgICBkZWxldGUgdGhpcy5ydW5xdWV1ZVtpZF0ucG9pbnRlcjtcclxuICAgICAgdGhpcy5ydW5xdWV1ZS5zcGxpY2UoaWQsIDEpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpcmVzIGFsbCBldmVudHMgZm9yIHRoZSB1cGNvbW1pbmcgc3RlcC5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZmlyZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBtYXJrRm9yRGVsZXRlID0gW107XHJcbiAgdGhpcy5ydW5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGluZGV4KSB7XHJcbiAgICBpZiAocGFydC5wb2ludGVyID09PSBwYXJ0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgbWFya0ZvckRlbGV0ZS51bnNoaWZ0KGluZGV4KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciBzZXFFdmVudHMgPSBwYXJ0LnBhdHRlcm5bcGFydC5wb2ludGVyXTtcclxuICAgICAgaWYgKHNlcUV2ZW50cyAmJiBzZXFFdmVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIHNlcUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgICAgICAgICB0aGlzLnByb2Nlc3NTZXFFdmVudChzZXFFdmVudCwgdGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9IGVsc2UgaWYgKHNlcUV2ZW50cyAmJiBzZXFFdmVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnRzWzBdLCB0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHBhcnQucG9pbnRlcisrO1xyXG4gIH0sIHRoaXMpO1xyXG4gIHRoaXMuZGVsZXRlUGFydHNGcm9tUnVucXVldWUobWFya0ZvckRlbGV0ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW52b2tlcyB0aGUgYXBwcm9wcmlhdGUgc3Vic3lzdGVtIHRvIHByb2Nlc3MgdGhlIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCB0byBwcm9jZXNzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZGVsYXkgICAgIHRpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBldmVudCBzaG91bGQgc3RhcnRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucHJvY2Vzc1NlcUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIGRlbGF5KSB7XHJcbiAgaWYgKGRlbGF5KSB7XHJcbiAgICBzZXFFdmVudC5wcm9wc1snZGVsYXknXSA9IGRlbGF5O1xyXG4gIH1cclxuICBzZXFFdmVudC5wcm9wcy5pbnN0cnVtZW50LnByb2Nlc3NTZXFFdmVudChzZXFFdmVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgcG9pbnRlciB0byB0aGUgbmV4dCBzdGVwIHRoYXQgc2hvdWxkIGJlIHBsYXllZFxyXG4gKiBpbiB0aGUgbWFzdGVyIHF1ZXVlLiBJZiB3ZSdyZSBwbGF5aW5nIGluIGxvb3AgbW9kZSxcclxuICoganVtcCBiYWNrIHRvIGxvb3BzdGFydCB3aGVuIGVuZCBvZiBsb29wIGlzIHJlYWNoZWQuXHJcbiAqIElmIGEgcG9pbnRlciBwb3NpdGlvbiBpcyBnaXZlbiwganVtcCB0byBpdC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICAge0ludH0gICBwb3NpdGlvbiAgTmV3IHBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiAge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldFF1ZXVlUG9pbnRlciA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHRoaXMubmV4dFN0ZXAgPSBwb3NpdGlvbjtcclxuICAgIHRoaXMucnVucXVldWUgPSBbXTtcclxuICB9IGVsc2UgaWYgKHRoaXMubG9vcCAmJiB0aGlzLm5leHRTdGVwID49IHRoaXMubG9vcEVuZCkge1xyXG4gICAgdGhpcy5uZXh0U3RlcCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgdGhpcy5ydW5xdWV1ZSA9IFtdO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgcXVldWUgcG9pbnRlciAoc2V0IHRvIHBvc2l0aW9uIDApLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZXNldFF1ZXVlUG9pbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2V0UXVldWVQb2ludGVyKDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyB0aGUgc2VxdWVuY2VyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICAgIHRoaXMuaXNSdW5uaW5nID0gdHJ1ZTtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcykpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyB0aGUgc2VxdWVuY2VyIChoYWx0cyBhdCB0aGUgY3VycmVudCBwb3NpdGlvbilcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyB0aGUgc2VxdWVuY2VyIGFuZCBzdXNwZW5kcyB0aGUgQXVkaW9Db250ZXh0IHRvXHJcbiAqIGdsb2JhbGx5IGhhbHQgYWxsIGF1ZGlvIHN0cmVhbXMuIEl0IGp1c3QgaGFsdHMgaWZcclxuICogaWYgc2VxdWVuY2VyIGFuZCBBdWRpb0NvbnRleHQgYm90aCBhcmUgaW4gcnVubmluZyBzdGF0ZS5cclxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBoYWx0ZWQsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmIChjb3JlLnN0YXRlID09PSAncnVubmluZycgJiYgdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgY29yZS5zdXNwZW5kKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXN1bWVzIHRoZSBBdWRpb0NvbnRleHQgYW5kIHN0YXJ0cyB0aGUgc2VxdWVuY2VyIGF0IGl0c1xyXG4gKiBjdXJyZW50IHBvc2l0aW9uLiBJdCBqdXN0IHN0YXJ0cyBpZiBzZXF1ZW5jZXIgYW5kIEF1ZGlvQ29udGV4dFxyXG4gKiBib3RoIGFyZSBzdG9wcGVkLlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHJlc3VtZWQsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoY29yZS5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcgJiYgIXRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICBjb3JlLnJlc3VtZSgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2NoZWR1bGVyIHRoYXQgcnVucyBhIGRyYXdpbmcgZnVuY3Rpb24gZXZlcnkgdGltZVxyXG4gKiB0aGUgc2NyZWVuIHJlZnJlc2hlcy4gVGhlIGZ1bmN0aW9uIFNlcXVlbmNlci5hbmltYXRpb25GcmFtZSgpXHJcbiAqIGhhcyB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZSBhcHBsaWNhdGlvbiB3aXRoIHN0dWZmIHRvIGJlIGRyYXduIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEl0IGNhbGxzIGl0c2VsZiByZWN1cnNpdmVseSBvbiBldmVyeSBmcmFtZSBhcyBsb25nIGFzIHRoZSBzZXF1ZW5jZXIgaXMgcnVubmluZy5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIGZpcnN0IHdlJ2xsIGhhdmUgdG8gZmluZCBvdXQsIHdoYXQgc3RlcCB3YXMgcGxheWVkIHJlY2VudGx5LlxyXG4gIC8vIHRoaXMgaXMgc29tZWhvdyBjbHVtc3kgYmVjYXVzZSB0aGUgc2VxdWVuY2VyIGRvZXNuJ3Qga2VlcCB0cmFjayBvZiB0aGF0LlxyXG4gIHZhciBsb29rQWhlYWREZWx0YSA9IHRoaXMubmV4dFN0ZXBUaW1lIC0gY29yZS5jdXJyZW50VGltZTtcclxuICBpZiAobG9va0FoZWFkRGVsdGEgPj0gMCkge1xyXG4gICAgdmFyIHN0ZXBzQWhlYWQgPSBNYXRoLnJvdW5kKGxvb2tBaGVhZERlbHRhIC8gdGhpcy50aW1lUGVyU3RlcCk7XHJcblxyXG4gICAgaWYgKHRoaXMubmV4dFN0ZXAgPCBzdGVwc0FoZWFkKSB7XHJcbiAgICAgIC8vIHdlIGp1c3QganVtcGVkIHRvIHRoZSBzdGFydCBvZiBhIGxvb3BcclxuICAgICAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubG9vcEVuZCArIHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudXBkYXRlRnJhbWUodGhpcy5sYXN0UGxheWVkU3RlcCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcykpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSdW5zIGJldHdlZW4gc2NyZWVuIHJlZnJlc2guIEhhcyB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZVxyXG4gKiBhcHAgdG8gcmVuZGVyIHRvIHRoZSBzY3JlZW4uXHJcbiAqIEBwYXJhbSAge0ludH0gIGxhc3RQbGF5ZWRTdGVwICBUaGUgNjR0aCBzdGVwIHRoYXQgd2FzIHBsYXllZCByZWNlbnRseVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS51cGRhdGVGcmFtZSA9IGZ1bmN0aW9uKGxhc3RQbGF5ZWRTdGVwKSB7XHJcbiAgY29uc29sZS5sb2cobGFzdFBsYXllZFN0ZXApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSBwYXJ0IHRvIHRoZSBtYXN0ZXIgcXVldWUuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gcGFydCAgICAgIEFuIGluc3RhbmNlIG9mIFBhcnRcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5hZGRQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAocGFydC5sZW5ndGggJiYgcGFydC5wYXR0ZXJuKSB7XHJcbiAgICBpZiAoIXRoaXMucXVldWVbcG9zaXRpb25dKSB7XHJcbiAgICAgIHRoaXMucXVldWVbcG9zaXRpb25dID0gW107XHJcbiAgICB9XHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5wdXNoKHBhcnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIHBhcmFtZXRlciBkb2VzblxcJ3Qgc2VlbSB0byBiZSBhIHBhcnQgb2JqZWN0Jyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBwYXJ0IG9iamVjdCBmcm9tIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICBQYXJ0IGluc3RhbmNlIHRvIGJlIHJlbW92ZWRcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlbW92ZVBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmICh0aGlzLnF1ZXVlW3Bvc2l0aW9uXSBpbnN0YW5jZW9mIEFycmF5ICYmXHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5sZW5ndGggPiAwKSB7XHJcbiAgICB2YXIgaW5kZXggPSB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5pbmRleE9mKHBhcnQpO1xyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0uc3BsaWNlKGluZGV4LCAxKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYXJ0IG5vdCBmb3VuZCBhdCBwb3NpdGlvbiAnICsgcG9zaXRpb24gKyAnLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgYnBtIGJlYXRzIHBlciBtaW51dGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0QnBtID0gZnVuY3Rpb24oYnBtKSB7XHJcbiAgdGhpcy5icG0gPSBicG07XHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAoYnBtLCB0aGlzLnJlc29sdXRpb24pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIHRoZSB0aW1lIGluIHNlY29uZHMgYXMgZmxvYXQgdmFsdWVcclxuICogYmV0d2VlbiBvbmUgc2hvcnRlc3QgcG9zc3NpYmxlIG5vdGVcclxuICogKDY0dGggYnkgZGVmYXVsdCkgYW5kIHRoZSBuZXh0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGJwbSAgICAgICAgYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHJlc29sdXRpb24gc2hvcnRlc3QgcG9zc2libGUgbm90ZSB2YWx1ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gICAgICAgICAgICAgdGltZSBpbiBzZWNvbmRzXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldFRpbWVQZXJTdGVwID0gZnVuY3Rpb24oYnBtLCByZXNvbHV0aW9uKSB7XHJcbiAgcmV0dXJuICg2MCAqIDQpIC8gKGJwbSAqIHJlc29sdXRpb24pO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5nZXRMYXN0UGxheWVkU3RlcCA9IGZ1bmN0aW9uKCkge1xyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIFBsYXkgYSBzb3VuZCB0aGF0IGNhbiBiZSBsb29wZWQuIFBhdXNlL1N0YXJ0IHdvcmtzIHNhbXBsZS1hY2N1cmF0ZVxyXG4gKiBhdCBhbnkgcmF0ZS4gSGl0IHRoZSBzdGFydCBidXR0b24gbXVsdGlwbGUgdGltZXMgdG8gaGF2ZSBtdWx0aXBsZVxyXG4gKiBzb3VuZHMgcGxheWVkLiBBbGwgcGFyYW1ldGVycyBhcmUgYWRqdXN0YWJsZSBpbiByZWFsdGltZS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnYXVkaW9maWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQuc3RhcnQoKTtcclxuICogQHR1dG9yaWFsIFNvdW5kXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNvdW5kV2F2ZSBTb3VuZFdhdmUgb2JqZWN0IGluY2x1ZGluZyB0aGUgYnVmZmVyIHdpdGggYXVkaW8gZGF0YSB0byBiZSBwbGF5ZWRcclxuICovXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKHNvdW5kV2F2ZSkge1xyXG5cclxuICB0aGlzLnN3ID0gbnVsbDsgICAgICAgICAgIC8vcG9pbnRlciB0byB0aGUgc291bmRXYXZlIG9iamVjdFxyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXRzID0gW107ICAgLy9ob2xkcyBzdGFydCBvZmZzZXRzIGlmIHBhdXNlZFxyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDsgICAgICAgLy93aGVuIHRoZSBzb3VuZCBzdGFydHMgdG8gcGxheVxyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gMTtcclxuICB0aGlzLmRldHVuZSA9IDA7XHJcblxyXG4gIGlmIChzb3VuZFdhdmUpIHtcclxuICAgIHRoaXMuc3cgPSBzb3VuZFdhdmU7XHJcbiAgICB0aGlzLnNvdW5kTGVuZ3RoID0gdGhpcy5sb29wRW5kID0gdGhpcy5zdy53YXZlLmR1cmF0aW9uO1xyXG4gICAgdGhpcy5zZXR1cEF1ZGlvQ2hhaW4oKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgbWlzc2luZy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGdhaW4gYW5kIHN0ZXJlby1wYW5uZXIgbm9kZSwgY29ubmVjdHMgdGhlbVxyXG4gKiAoZ2FpbiAtPiBwYW5uZXIpIGFuZCBzZXRzIGdhaW4gdG8gMSAobWF4IHZhbHVlKS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXR1cEF1ZGlvQ2hhaW4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmdhaW5Ob2RlID0gY29yZS5jcmVhdGVHYWluKCk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gY29yZS5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcclxuICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5wYW5uZXJOb2RlKTtcclxuICB0aGlzLnBhbm5lck5vZGUuY29ubmVjdChjb3JlLmRlc3RpbmF0aW9uKTtcclxuICB0aGlzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW5kIGNvbmZpZ3VyZXMgYSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqIHRoYXQgY2FuIGJlIHBsYXllZCBvbmNlIGFuZCB0aGVuIGRlc3Ryb3lzIGl0c2VsZi5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7QnVmZmVyU291cmNlTm9kZX0gVGhlIEJ1ZmZlclNvdXJjZU5vZGVcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJ1ZmZlclNvdXJjZSA9IGNvcmUuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgLy8gY29uc29sZS5sb2codGhpcy5zdy53YXZlKTtcclxuICBidWZmZXJTb3VyY2UuYnVmZmVyID0gdGhpcy5zdy53YXZlO1xyXG4gIGJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdvbmVuZGVkIGZpcmVkJyk7XHJcbiAgICBzZWxmLmRlc3Ryb3lCdWZmZXJTb3VyY2UoYnVmZmVyU291cmNlKTtcclxuICB9O1xyXG4gIHJldHVybiBidWZmZXJTb3VyY2U7XHJcbn07XHJcblxyXG4vKipcclxuICogRGVzdHJveWVzIGEgZ2l2ZW4gQXVkaW9CdWZmZXJTb3VyY2VOb2RlIGFuZCBkZWxldGVzIGl0XHJcbiAqIGZyb20gdGhlIHNvdXJjZU5vZGUgcXVldWUuIFRoaXMgaXMgdXNlZCBpbiB0aGUgb25lbmRlZFxyXG4gKiBjYWxsYmFjayBvZiBhbGwgQnVmZmVyU291cmNlTm9kZXMgdG8gYXZvaWQgZGVhZCByZWZlcmVuY2VzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtic05vZGV9IGJzTm9kZSB0aGUgYnVmZmVyU291cmNlIHRvIGJlIGRlc3Ryb3llZC5cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5kZXN0cm95QnVmZmVyU291cmNlID0gZnVuY3Rpb24oYnNOb2RlKSB7XHJcbiAgYnNOb2RlLmRpc2Nvbm5lY3QoKTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcclxuICAgIGlmIChub2RlID09PSBic05vZGUpIHtcclxuICAgICAgdGhpcy5xdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyBhIHNvdW5kIChBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIGFuZCBzdG9yZXMgYSByZWZlcmVuY2VzXHJcbiAqIGluIGEgcXVldWUuIFRoaXMgZW5hYmxlcyB5b3UgdG8gcGxheSBtdWx0aXBsZSBzb3VuZHMgYXQgb25jZVxyXG4gKiBhbmQgZXZlbiBzdG9wIHRoZW0gYWxsIGF0IGEgZ2l2ZW4gdGltZS5cclxuICogQHBhcmFtICB7Qm9vbGVhbn0gcGxheUxvb3BlZCBXaGV0aGVyIHRoZSBzb3VuZCBzaG91bGQgYmUgbG9vcGVkIG9yIG5vdFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkZWxheSAgICAgIFRpbWUgaW4gc2Vjb25kcyB0aGUgc291bmQgcGF1c2VzIGJlZm9yZSB0aGUgc3RyZWFtIHN0YXJ0c1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gICBkdXJhdGlvbiAgIFRpbWUgcHJlcmlvZCBhZnRlciB0aGUgc3RyZWFtIHNob3VsZCBlbmRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKHBsYXlMb29wZWQsIGRlbGF5LCBkdXJhdGlvbikge1xyXG4gIGlmICh0aGlzLmlzUGF1c2VkICYmIHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgdGhpcy5yZXN1bWUoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHN0YXJ0VGltZSA9IDA7XHJcblxyXG4gICAgaWYgKGRlbGF5KSB7XHJcbiAgICAgIHN0YXJ0VGltZSA9IGRlbGF5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3RhcnRUaW1lID0gY29yZS5jdXJyZW50VGltZTtcclxuICAgIH1cclxuICAgIHZhciBicyA9IHRoaXMuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcblxyXG4gICAgaWYgKHBsYXlMb29wZWQpIHtcclxuICAgICAgYnMubG9vcCA9IHBsYXlMb29wZWQ7XHJcbiAgICAgIGJzLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgICBicy5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG4gICAgfVxyXG4gICAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gYnMudG1wUGxheWJhY2tSYXRlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgICBicy5kZXR1bmUudmFsdWUgPSB0aGlzLmRldHVuZTtcclxuICAgIGJzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTsgICAvLyBleHRlbmQgbm9kZSB3aXRoIGEgc3RhcnR0aW1lIHByb3BlcnR5XHJcblxyXG4gICAgdGhpcy5xdWV1ZS5wdXNoKGJzKTtcclxuICAgIGlmIChkdXJhdGlvbikge1xyXG4gICAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQsIGR1cmF0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW0sIGV2ZW4gdGhlIG9uZXMgdGhhdCBhcmUganVzdCBzY2hlZHVsZWQuXHJcbiAqIEl0IGFsc28gY2xlYW5zIHRoZSBxdWV1ZSBzbyB0aGF0IHRoZSBzb3VuZCBvYmplY3QgaXMgcmVhZHkgZm9yIGFub3RoZXIgcm91bmQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnN0b3AoKTtcclxuICAgIG5vZGUuZGlzY29ubmVjdCgpO1xyXG4gIH0pO1xyXG4gIHRoaXMucXVldWUgPSBbXTsgIC8vcmVsZWFzZSBhbGwgcmVmZXJlbmNlc1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIGFsbCBhdWRpbyBzdHJlYW1zIG9mIHRoaXMgc291bmQgdGVtcG9yYXJpbHkuXHJcbiAqIFRoaXMgY3VycmVudGx5IGp1c3Qgd29ya3MgaW4gQ2hyb21lIDQ5KyBvbmx5LlxyXG4gKiBJZiB5b3Ugd2FudCBhIGdsb2JhbCwgYWNjdXJhdGUgcGF1c2UgZnVuY3Rpb25cclxuICogdXNlIHN1c3BlbmQvcmVzdW1lIGZyb20gdGhlIGNvcmUgbW9kdWxlLlxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICghdGhpcy5pc1BhdXNlZCkge1xyXG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgbm9kZS50bXBQbGF5YmFja1JhdGUgPSBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZTtcclxuICAgICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSAwLjA7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXN1bWVzIGFsbCBzdHJlYW1zIGlmIHRoZXkgd2VyZSBwYXVzZWQuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gbm9kZS50bXBQbGF5YmFja1JhdGU7XHJcbiAgICBkZWxldGUgbm9kZS50bXBQbGF5YmFja1JhdGU7XHJcbiAgfSk7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFByb2Nlc3NlcyBhbiBldmVudCBmaXJlZCBieSB0aGUgc2VxdWVuY2VyLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50IEEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucHJvY2Vzc1NlcUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAvL3RoaXMuc2V0VG9uZShzZXFFdmVudC5wcm9wcy50b25lKTtcclxuICBpZiAoc2VxRXZlbnQucHJvcHMuZHVyYXRpb24pIHtcclxuICAgIHRoaXMuc3RhcnQoZmFsc2UsXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmRlbGF5LFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kdXJhdGlvbik7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMuc3RhcnQoZmFsc2UsXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmRlbGF5KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgc3RhcnRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3Agc3RhcnQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BTdGFydCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wU3RhcnQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBlbmRwb2ludCBvZiB0aGUgbG9vcFxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gdmFsdWUgIGxvb3AgZW5kIGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wRW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wRW5kID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVsZWFzZXMgdGhlIGxvb3Agb2YgYWxsIHJ1bm5pbmcgbm9kZXMsXHJcbiAqIE5vZGVzIHdpbGwgcnVuIHVudGlsIGVuZCBhbmQgc3RvcC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZWxlYXNlTG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3AgPSBmYWxzZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhlIHN0YXJ0IGFuZCBlbmRwb2ludCB0byBzdGFydCBlbmQgZW5kcG9pbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVzZXRMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IHRoaXMuc291bmRMZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBzb3VuZCBpbiBwZXJjZW50YWdlXHJcbiAqICgxID0gMTAwJSwgMiA9IDIwMCUpXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgdmFsdWUgICBSYXRlIGluIHBlcmNlbnRhZ2VcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGVcclxuICogQHJldHVybiB7ZmxvYXR9ICBUaGUgcGxheWJhY2sgcmF0ZSBpbiBwZXJjZW50YWdlICgxLjI1ID0gMTI1JSlcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRQbGF5YmFja1JhdGUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wbGF5YmFja1JhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSB0b25lIHdpdGhpbiB0d28gb2N0YXZlICgrLy0xMiB0b25lcylcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHNlbWkgdG9uZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFRvbmUgPSBmdW5jdGlvbihzZW1pVG9uZSkge1xyXG4gIGlmIChzZW1pVG9uZSA+PSAtMTIgJiYgc2VtaVRvbmUgPD0gMTIpIHtcclxuICAgIHRoaXMuZGV0dW5lID0gc2VtaVRvbmUgKiAxMDA7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignU2VtaSB0b25lIGlzICcgKyBzZW1pVG9uZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMi4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsYXN0IHBsYXllZCBzZW1pdG9uZS4gVGhpcyBkb2Vzbid0IGhhcyB0byBiZSBhblxyXG4gKiBpbnRlZ2VyIGJldHdlZW4gLS8rMTIgYXMgdGhlIHNvdW5kIGNhbiBiZSBkZXR1bmVkIHdpdGhcclxuICogbW9yZSBwcmVjaXNpb24uXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgU2VtaXRvbmUgYmV0d2VlbiAtLysxMlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmUgLyAxMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0dW5lIHRoZSBzb3VuZCBvc2NpbGxhdGlvbiBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICB2YWx1ZSAgZGV0dW5lIGluIGNlbnRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RGV0dW5lID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAodmFsdWUgPj0gLTEyMDAgJiYgdmFsdWUgPD0gMTIwMCkge1xyXG4gICAgdGhpcy5kZXR1bmUgPSB2YWx1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdEZXR1bmUgcGFyYW1ldGVyIGlzICcgKyB2YWx1ZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMjAwLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgdGhlIGN1cnJlbnQgZGV0dW5lIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHJldHVybiB7SW50ZWdlcn0gIERldHVuZSBpbiBjZW50c1xyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldERldHVuZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBpbiB1c2UgYW5kIGNhbiBwcm9iYWJseSBiZSByZW1vdmVkXHJcbiAqIEByZXR1cm4ge0ludH0gUmFuZG9tIG51bWJlclxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiA8cD5cclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgaW4gd2hpY2ggYW4gYXVkaW8gYnVmZmVyIGxpdmVzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcgZWxzZS5cclxuICogSWYgeW91IHdhbnQgdG8gcGxheSB0aGUgc291bmQsIHlvdSBoYXZlIHRvIGFkZGl0aW9uYWxseSBjcmVhdGUgYVxyXG4gKiA8YSBocmVmPVwiU291bmQuaHRtbFwiPlNvdW5kPC9hPiBvYmplY3QuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIDwvcD48cD5cclxuICogTXVsdGlwbGUgc291cmNlcyB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIG9uZSBhdWRpbyBidWZmZXIuXHJcbiAqIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIGNyZWF0aW5nIG11bHRpcGxlIFNvdW5kV2F2ZSBvYmplY3RzLlxyXG4gKiBJdCdzIGxpa2UgYSB3YXZldGFibGU6IEFsbCBzdGFydC9lbmQgcG9zaXRpb25zIHdpbGwgYmUgc2F2ZWQgc29cclxuICogeW91IGNhbiB0cmlnZ2VyIHRoZSBvcmlnaW5hbCBzYW1wbGVzIHdpdGhvdXQgdXNpbmcgbXVsdGlwbGUgYnVmZmVycy5cclxuICogUG9zc2libGUgdXNhZ2VzIGFyZSBtdWx0aXNhbXBsZWQgc291bmRzLCBsb29wcyBvciB3YXZlc2VxdWVuY2VzIChraW5kIG9mKS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db25jYXRlbmF0ZSBtdWx0aXBsZSBzb3VyY2UgZmlsZXMgaW50byBvbmUgYnVmZmVyPGJyPlxyXG4gKiBpbiB0aGUgZ2l2ZW4gb3JkZXIgYW5kIHBsYXkgdGhlbSAoVGhpcyBpcyBicm9rZW4gaW4gdjAuMS4gRG9uJ3QgdXNlIGl0ISk6PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShbJ2ZpbGUxLndhdixmaWxlMi53YXYsZmlsZTMud2F2J10pO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMuYnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIoMSwgMSwgY29yZS5zYW1wbGVSYXRlKTsgICAvL0F1ZGlvQnVmZmVyXHJcbiAgdGhpcy5mcmFnbWVudHMgPSBbXTsgIC8vQXVkaW9CdWZmZXJzIGZyb20gbXVsdGlwbGUgUENNIHNvdXJjZXNcclxuICB0aGlzLndhdmUgPSB0aGlzLmJ1ZmZlcjsgIC8vSW50ZXJmYWNlIHRvIHRoZSBpbnRlcm5hbCBidWZmZXJzXHJcbiAgdGhpcy5tZXRhRGF0YSA9IFtdOyAgIC8vc3RhcnQtL2VuZHBvaW50cyBhbmQgbGVuZ3RoIG9mIHNpbmdsZSB3YXZlc1xyXG5cclxuICBpZiAodHlwZW9mIGF1ZGlvU3JjICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgaWYgKHR5cGVvZiBhdWRpb1NyYyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgLy9vbmUgZmlsZSB0byBsb2FkL2RlY29kZVxyXG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMubG9hZEZpbGUoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICByZXR1cm4gc2VsZi5kZWNvZGVBdWRpb0RhdGEocmVzcG9uc2UpO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbihmdW5jdGlvbihkZWNvZGVkKSB7XHJcbiAgICAgICAgc2VsZi5idWZmZXIgPSBkZWNvZGVkO1xyXG4gICAgICAgIHNlbGYudXNlV2F2ZSgwKTtcclxuICAgICAgICByZXR1cm4gc2VsZi5idWZmZXI7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIHR5cGVvZiBhdWRpb1NyY1swXSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgLy9tdWx0aXBsZSBmaWxlcyB0byBsb2FkL2RlY29kZSBhbmQgY2FuY2F0aW5hdGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmxvYWRNdWx0aXBsZUZpbGVzKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICAgICAgc2VsZi51c2VXYXZlKDApO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL29uZSBBcnJheUJ1ZmZlciB0byBkZWNvZGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgYXVkaW9TcmNbMF0gaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL211bHRpcGxlIEFycmF5QnVmZmVycyB0byBkZWNvZGUgYW5kIGNvbmNhdGVuYXRlXHJcbiAgICAgIHRoaXMuZGVjb2RlQXVkaW9Tb3VyY2VzKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVycykge1xyXG4gICAgICAgIHNlbGYuZnJhZ21lbnRzID0gYXVkaW9CdWZmZXJzO1xyXG4gICAgICAgIHJldHVybiBzZWxmLmpvaW5BdWRpb0J1ZmZlcnMoYXVkaW9CdWZmZXJzKTtcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oZnVuY3Rpb24oYXVkaW9CdWZmZXIpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IGF1ZGlvQnVmZmVyO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIpIHtcclxuICAgICAgdGhpcy5idWZmZXIgPSBhdWRpb1NyYztcclxuICAgICAgdGhpcy51c2VXYXZlKDApO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5qb2luQXVkaW9CdWZmZXJzKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgICAgc2VsZi5idWZmZXIgPSBhdWRpb0J1ZmZlcjtcclxuICAgICAgICBzZWxmLnVzZVdhdmUoMCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIFNvdW5kV2F2ZSBvYmplY3Q6IFVuc3VwcG9ydGVkIGRhdGEgZm9ybWF0Jyk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vc3RhcnQgdGhlIG9iamVjdCB3aXRoIGVtcHR5IGJ1ZmZlci4gVXNlZnVsbCBmb3IgdGVzdGluZyBhbmQgYWR2YW5jZWQgdXNhZ2UuXHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIGFycmF5IG9mIGZpbGVuYW1lcyBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlc1xyXG4gKiB0byBhbiBBdWRpb0J1ZmZlciBpbmNsdWRpbmcgdGhlIFBDTSBkYXRhIG9mIGFsbCBmaWxlcyBvbiBzdWNjZXNzLlxyXG4gKiBSZXR1cm5zIGFuIGVycm9yIG9uIGZhaWx1cmUuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgICBmaWxlbmFtZXMgQXJyYXkgd2l0aCBmaWxlbmFtZXMgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgUmVzb2x2ZXMgdG8gQXVkaW9CdWZmZXIgb3IgdGhyb3dzIGVycm9yLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkTXVsdGlwbGVGaWxlcyA9IGZ1bmN0aW9uKHVybHMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGZpbGVuYW1lcyA9IHRoaXMuc3RyaXBGaWxlbmFtZXModXJscyk7XHJcblxyXG4gIHJldHVybiB0aGlzLmxvYWRGaWxlcyh1cmxzKS50aGVuKGZ1bmN0aW9uKGJpbkJ1ZmZlcnMpIHtcclxuICAgIHJldHVybiBzZWxmLmRlY29kZUF1ZGlvU291cmNlcyhiaW5CdWZmZXJzKTtcclxuICB9KVxyXG4gIC50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVycykge1xyXG4gICAgdmFyIHByb21pc2VzID0gW107XHJcbiAgICBzZWxmLmZyYWdtZW50cyA9IGF1ZGlvQnVmZmVycztcclxuICAgIHByb21pc2VzLnB1c2goc2VsZi5qb2luQXVkaW9CdWZmZXJzKGF1ZGlvQnVmZmVycyksXHJcbiAgICAgIHNlbGYuc3RvcmVNZXRhRGF0YShhdWRpb0J1ZmZlcnMsIGZpbGVuYW1lcykpO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcclxuICB9KVxyXG4gIC50aGVuKGZ1bmN0aW9uKGJ1ZmZlckFuZE1ldGEpIHtcclxuICAgIHNlbGYubWV0YURhdGEgPSBidWZmZXJBbmRNZXRhWzFdO1xyXG4gICAgcmV0dXJuIGJ1ZmZlckFuZE1ldGFbMF07XHJcbiAgfSlcclxuICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICB0aHJvdyBlcnI7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIGFuZCByZXR1cm5zIGFuIGVxdWFsIG51bWJlciBvZiBBdWRpb0J1ZmZlcnMuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgICBidWZmZXJzIEFycmF5IHdpdGggQXJyYXlCdWZmZXJzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgIFJlc29sdmVzIHRvIGFuIGFycmF5IG9mIEF1ZGlvQnVmZmVycyBvciBlcnJvclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5kZWNvZGVBdWRpb1NvdXJjZXMgPSBmdW5jdGlvbihidWZmZXJzKSB7XHJcbiAgdmFyIHByb21pc2VzID0gW107XHJcbiAgYnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlcikge1xyXG4gICAgcHJvbWlzZXMucHVzaCh0aGlzLmRlY29kZUF1ZGlvRGF0YShidWZmZXIpKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhbiBBcnJheUJ1ZmZlciB3aXRoIGJpbmFyeSBhdWRpbyBkYXRhIGFuZFxyXG4gKiB0dXJucyBpdCBpbnRvIGFuIGF1ZGlvIGJ1ZmZlciBvYmplY3QuXHJcbiAqIEp1c3QgYSB3cmFwcGVyIGZvciB0aGUgd2ViLWF1ZGlvLWFwaSBkZWNvZGVBdWRpb0RhdGEgZnVuY3Rpb24uXHJcbiAqIEl0IHVzZXMgdGhlIG5ldyBwcm9taXNlIHN5bnRheCBzbyBpdCBwcm9iYWJseSB3b24ndCB3b3JrIGluIGFsbCBicm93c2VycyBieSBub3cuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5QnVmZmVyfSAgcmF3QXVkaW9TcmMgQXVkaW8gZGF0YSBpbiByYXcgYmluYXJ5IGZvcm1hdFxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICAgICAgIFJlc29sdmVzIHRvIEF1ZGlvQnVmZmVyIG9yIGVycm9yXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKHJhd0F1ZGlvU3JjKSB7XHJcbiAgcmV0dXJuIGNvcmUuZGVjb2RlQXVkaW9EYXRhKHJhd0F1ZGlvU3JjKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBKb2lucyBhbiBhcmJpdHJhcnkgbnVtYmVyIG9mIEFycmF5QnVmZmVycy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIGJ1ZmZlcnMgQXJyYXkgb2YgQXVkaW9CdWZmZXJzXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIFdhdmVmb3JtIHRoYXQgaW5jbHVkZXMgYWxsIGdpdmVuIGJ1ZmZlcnMuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmpvaW5BdWRpb0J1ZmZlcnMgPSBmdW5jdGlvbihidWZmZXJzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBpbnB1dCwgam9pbmVkQnVmZmVyO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShidWZmZXJzKSkge1xyXG4gICAgICBqb2luZWRCdWZmZXIgPSBidWZmZXJzWzBdO1xyXG4gICAgICBpbnB1dCA9IGJ1ZmZlcnMuc2xpY2UoMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZWplY3QobmV3IFR5cGVFcnJvcignQXJndW1lbnQgaXMgbm90IG9mIHR5cGUgQXJyYXknKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5wdXQuZm9yRWFjaChmdW5jdGlvbihidWZmZXIpIHtcclxuICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlciAmJlxyXG4gICAgICAgIGpvaW5lZEJ1ZmZlciBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgICAgIGpvaW5lZEJ1ZmZlciA9IHRoaXMuYXBwZW5kQXVkaW9CdWZmZXIoam9pbmVkQnVmZmVyLCBidWZmZXIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdPbmUgb3IgbW9yZSBidWZmZXJzIGFyZSBub3Qgb2YgdHlwZSBBdWRpb0J1ZmZlci4nKSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHNlbGYpO1xyXG4gICAgcmVzb2x2ZShqb2luZWRCdWZmZXIpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIEJvdGggYnVmZmVycyBzaG91bGQgaGF2ZSB0aGUgc2FtZSBhbW91bnRcclxuICogb2YgY2hhbm5lbHMuIElmIG5vdCwgY2hhbm5lbHMgd2lsbCBiZSBkcm9wcGVkLiBGb3IgZXhhbXBsZSwgaWYgeW91XHJcbiAqIGFwcGVuZCBhIHN0ZXJlbyBhbmQgYSBtb25vIGJ1ZmZlciwgdGhlIG91dHB1dCB3aWxsIGJlIG1vbm8gYW5kIG9ubHlcclxuICogb25lIG9mIHRoZSBjaGFubmVscyBvZiB0aGUgc3RlcmVvIHNhbXBsZSB3aWxsIGJlIHVzZWQgKG5vIG1lcmdpbmcgb2YgY2hhbm5lbHMpLlxyXG4gKiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOjxicj5cclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDE0MzY1Mi93ZWItYXVkaW8tYXBpLWFwcGVuZC1jb25jYXRlbmF0ZS1kaWZmZXJlbnQtYXVkaW9idWZmZXJzLWFuZC1wbGF5LXRoZW0tYXMtb25lLXNvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMSBUaGUgZmlyc3QgYXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIyIFRoZSBzZWNvbmQgYXVkaW8gYnVmZmVyXHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgIGJ1ZmZlcjEgKyBidWZmZXIyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFwcGVuZEF1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyMSwgYnVmZmVyMikge1xyXG4gIGlmIChidWZmZXIxIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmXHJcbiAgYnVmZmVyMiBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgICAgKGJ1ZmZlcjEubGVuZ3RoICsgYnVmZmVyMi5sZW5ndGgpLFxyXG4gICAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgICAgdmFyIGNoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSk7XHJcbiAgICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdCdWZmZXI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ09uZSBvciBib3RoIGJ1ZmZlcnMgYXJlIG5vdCBvZiB0eXBlIEF1ZGlvQnVmZmVyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yZXMgbWV0YURhdGEgb2JqZWN0cyBpbiB0aGUgbWV0YURhdGEgYXJyYXkuXHJcbiAqIEBwYXJhbSAge0FycmF5fSBhdWRpb0J1ZmZlcnMgQXJyYXkgb2YgQXVkaW9CdWZmZXJzXHJcbiAqIEBwYXJhbSAge0FycmF5fSBuYW1lcyAgICAgICAgQXJyYXkgb2YgbmFtZXNcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICBSZXNvbHZlcyB0byBhIG1ldGFEYXRhIGFycmF5IG9yIGVycm9yLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5zdG9yZU1ldGFEYXRhID0gZnVuY3Rpb24oYXVkaW9CdWZmZXJzLCBuYW1lcykge1xyXG4gIHZhciBmbmFtZXMgPSBbXTtcclxuICB2YXIgbWV0YURhdGEgPSBbXTtcclxuICB2YXIgc3RhcnQgPSAwO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgaWYgKHR5cGVvZiBuYW1lcyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgYXVkaW9CdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyLCBpbmRleCkge1xyXG4gICAgICAgIGZuYW1lcy5wdXNoKCdmcmFnbWVudCcgKyBpbmRleCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChuYW1lcy5sZW5ndGggPT09IGF1ZGlvQnVmZmVycy5sZW5ndGgpIHtcclxuICAgICAgZm5hbWVzID0gbmFtZXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZWplY3QobmV3IEVycm9yKCdhdWRpb0J1ZmZlcnMgYW5kIG5hbWVzIHNob3VsZCBiZSBvZiBzYW1lIGxlbmd0aCcpKTtcclxuICAgIH1cclxuICAgIGF1ZGlvQnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlciwgaW5kZXgpIHtcclxuICAgICAgbWV0YURhdGEucHVzaCh0aGlzLmdldE1ldGFEYXRhKGJ1ZmZlciwgbmFtZXNbaW5kZXhdLCBzdGFydCkpO1xyXG4gICAgICBzdGFydCArPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgfSwgc2VsZik7XHJcbiAgICByZXNvbHZlKG1ldGFEYXRhKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdHJpcHMgZmlsZW5hbWVzIGZyb20gYW4gYXJyYXkgb2YgdXJscyBhbmQgcmV0dXJucyBpdCBpbiBhbiBhcnJheS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IHVybHMgQXJyYXkgb2YgdXJsc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICBBcnJheSBvZiBmaWxlbmFtZXNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc3RyaXBGaWxlbmFtZXMgPSBmdW5jdGlvbih1cmxzKSB7XHJcbiAgcmV0dXJuIHVybHMubWFwKGZ1bmN0aW9uKHVybCkge1xyXG4gICAgcmV0dXJuIHVybC5zcGxpdCgnLycpLnBvcCgpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcCBwb2ludHMgYW5kIGxlbmd0aCBpbiBzYW1wbGUtZnJhbWVzXHJcbiAqIG9mIGEgYnVmZmVyIGZyYWdtZW50Li5cclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlciAgICAgIEJ1ZmZlciB3aXRoIHRoZSBhcHBlbmRhYmxlIHBjbSBmcmFnbWVudFxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgbmFtZSAgICAgICAgTmFtZSBvZiB0aGUgZnJhZ21lbnRcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgIHN0YXJ0ICAgICAgIFN0YXJ0cG9pbnQgb2YgdGhlIGZyYWdtZW50XHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICBEaWN0aW9uYXJ5IHdpdGggbWV0YSBkYXRhIG9yIGVycm9yIG1zZ1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5nZXRNZXRhRGF0YSA9IGZ1bmN0aW9uKGJ1ZmZlciwgbmFtZSwgc3RhcnQpIHtcclxuICBpZiAoYnVmZmVyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgc3RhcnQgPSAwO1xyXG4gICAgfVxyXG4gICAgdmFyIGJ1Zkxlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAnbmFtZSc6IG5hbWUsXHJcbiAgICAgICdzdGFydCc6IHN0YXJ0LFxyXG4gICAgICAnZW5kJzogc3RhcnQgKyBidWZMZW5ndGggLSAxLFxyXG4gICAgICAnbGVuZ3RoJzogYnVmTGVuZ3RoXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgc2hvdWxkIGJlIG9mIHR5cGUgQXVkaW9CdWZmZXIgYW5kIFN0cmluZycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIChhdWRpbykgZmlsZSBhbmQgcmV0dXJucyBpdHMgZGF0YSBhcyBBcnJheUJ1ZmZlclxyXG4gKiB3aGVuIHRoZSBwcm9taXNlIGZ1bGZpbGxzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdXJsICAgICAgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICBBIHByb21pc2UgcmVwcmVzZW50aW5nIHRoZSB4aHIgcmVzcG9uc2VcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbih1cmwpIHtcclxuICByZXR1cm4gd2luZG93LmZldGNoKHVybClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmVyIGVycm9yLiBDb3VsZG5cXCd0IGxvYWQgZmlsZTogJyArIHVybCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIChhdWRpbykgZmlsZXMgYW5kIHJldHVybnMgYW4gYXJyYXlcclxuICogd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBmaWxlcyBpbiB0aGUgZ2l2ZW4gb3JkZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzIExpc3Qgd2l0aCBmaWxlbmFtZXNcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgQXJyYXkgb2YgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHZhciBwcm9taXNlcyA9IFtdO1xyXG4gIGZpbGVuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkRmlsZShuYW1lKSk7XHJcbiAgfSwgdGhpcyk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldCBhbiBBdWRpb0J1ZmZlciB3aXRoIGEgZnJhZ21lbnQgb2YgdGhlIEF1ZGlvQnVmZmVyXHJcbiAqIG9mIHRoaXMgb2JqZWN0LlxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHN0YXJ0ICAgU3RhcnRwb2ludCBvZiB0aGUgZnJhZ21lbnQgaW4gc2FtcGxlc1xyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIGVuZCAgICAgRW5kcG9pbnQgb2YgdGhlIGZyYWdtZW50IGluIHNhbXBsZXNcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgIEF1ZGlvQnVmZmVyIGluY2x1ZGluZyB0aGUgZnJhZ21lbnRcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZ2V0QnVmZmVyRnJhZ21lbnQgPSBmdW5jdGlvbihzdGFydCwgZW5kKSB7XHJcbiAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBdWRpbyBidWZmZXIgZW1wdHkuIE5vdGhpbmcgdG8gY29weS4nKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcclxuICB9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xyXG4gICAgc3RhcnQgPSAwO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBlbmQgPT09ICd1bmRlZmluZWQnIHx8IGVuZCA+IHRoaXMuYnVmZmVyLmxlbmd0aCkge1xyXG4gICAgZW5kID0gdGhpcy5idWZmZXIubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBcmd1bWVudHMgb3V0IG9mIGJvdW5kcy4nKTtcclxuICB9XHJcblxyXG4gIHZhciBjaG5Db3VudCA9IHRoaXMuYnVmZmVyLm51bWJlck9mQ2hhbm5lbHM7XHJcbiAgdmFyIGZyYW1lQ291bnQgPSBlbmQgLSBzdGFydDtcclxuICB2YXIgbmV3QnVmZmVyID0gY29yZS5jcmVhdGVCdWZmZXIoY2huQ291bnQsIGZyYW1lQ291bnQsIGNvcmUuc2FtcGxlUmF0ZSk7XHJcblxyXG4gIGZvciAodmFyIGNobiA9IDA7IGNobiA8IGNobkNvdW50OyBjaG4rKykge1xyXG4gICAgdmFyIG5ld0NoYW5uZWwgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2huKTtcclxuICAgIHZhciBvbGRDaGFubmVsID0gdGhpcy5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2huKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICBuZXdDaGFubmVsW2ldID0gb2xkQ2hhbm5lbFtzdGFydCArIGldO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ld0J1ZmZlcjtcclxufTtcclxuXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUudXNlV2F2ZSA9IGZ1bmN0aW9uKHdhdmVTb3VyY2UpIHtcclxuICBpZiAoTnVtYmVyLmlzSW50ZWdlcih3YXZlU291cmNlKSkge1xyXG4gICAgaWYgKHdhdmVTb3VyY2UgPT09IDApIHtcclxuICAgICAgdGhpcy53YXZlID0gdGhpcy5idWZmZXI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLndhdmUgPSB0aGlzLmZyYWdtZW50c1t3YXZlU291cmNlIC0gMV07XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG5vdCBvZiB0eXBlIEludGVnZXInKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU29ydCBBcnJheUJ1ZmZlcnMgdGhlIHNhbWUgb3JkZXIsIGxpa2UgdGhlIGZpbGVuYW1lXHJcbiAqIHBhcmFtZXRlcnMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzICBBcnJheSB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGJpbkJ1ZmZlcnMgQXJyYXkgd2l0aCBBcnJheUJ1ZmZlclxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQXJyYXkgd2l0aCBzb3J0ZWQgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnNvcnRCaW5CdWZmZXJzID0gZnVuY3Rpb24oZmlsZW5hbWVzLCBiaW5CdWZmZXJzKSB7XHJcbiAgLy8gZnV0aWxlPz9cclxuICByZXR1cm4gZmlsZW5hbWVzLm1hcChmdW5jdGlvbihlbCkge1xyXG4gICAgcmV0dXJuIGJpbkJ1ZmZlcnNbZWxdO1xyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIHRoZSBmb3VuZGF0aW9uIG9mIHRoZSBJbnRlcm1peCBsaWJyYXJ5LlxyXG4gKiBJdCBzaW1wbHkgY3JlYXRlcyB0aGUgYXVkaW8gY29udGV4dCBvYmplY3RzXHJcbiAqIGFuZCBleHBvcnRzIGl0IHNvIGl0IGNhbiBiZSBlYXNpbHkgY29uc3VtZWRcclxuICogZnJvbSBhbGwgY2xhc3NlcyBvZiB0aGUgbGlicmFyeS5cclxuICpcclxuICogQHJldHVybiB7QXVkaW9Db250ZXh0fSBUaGUgQXVkaW9Db250ZXh0IG9iamVjdFxyXG4gKlxyXG4gKiBAdG9kbyBTaG91bGQgd2UgZG8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIG9sZGVyIGFwaS12ZXJzaW9ucz9cclxuICogQHRvZG8gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogQHRvZG8gQ2hlY2sgaWYgd2UncmUgcnVubmluZyBvbiBub2RlXHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlN1c3BlbmQgYW5kIHJlc3VtZSB0aGUgYXVkaW8gY29udGV4dCB0b1xyXG4gKiBjcmVhdGUgYSBwYXVzZSBidXR0b24uIFRoaXMgc2hvdWxkIGJlIHVzZWQgd2l0aCBjcmVhdGVBdWRpb1dvcmtlclxyXG4gKiBhcyBhbiBlcnJvciB3aWxsIGJlIHRocm93biB3aGVuIHN1c3BlbmQgaXMgY2FsbGVkIG9uIGFuIG9mZmxpbmUgYXVkaW8gY29udGV4dC5cclxuICogWW91IGNhbiBhbHNvIHBhdXNlIHNpbmdsZSBzb3VuZHMgd2l0aCA8aT5Tb3VuZC5wYXVzZSgpPC9pPi5cclxuICogUGxlYXNlIHJlYWQgPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RlL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvc3VzcGVuZFwiPnRoZSBkZXZlbG9wZXIgZG9jcyBhdCBNRE48L2E+XHJcbiAqIHRvIGdldCBhIGJldHRlciBpZGVhIG9mIHRoaXMuPC9jYXB0aW9uPlxyXG4gKiBzdXNyZXNCdG4ub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG4gKiAgIGlmKEludGVybWl4LnN0YXRlID09PSAncnVubmluZycpIHtcclxuICogICAgIEludGVybWl4LnN1c3BlbmQoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnUmVzdW1lIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfSBlbHNlIGlmIChJbnRlcm1peC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcclxuICogICAgIEludGVybWl4LnJlc3VtZSgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdTdXNwZW5kIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfVxyXG4gKiB9XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYXVkaW9DdHggPSBudWxsO1xyXG5cclxudmFyIGlzTW9iaWxlID0ge1xyXG4gICdBbmRyb2lkJzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSk7XHJcbiAgfSxcclxuICAnaU9TJzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZXxpUGFkfGlQb2QvaSk7XHJcbiAgfSxcclxuICAnQmxhY2tCZXJyeSc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9CbGFja0JlcnJ5L2kpO1xyXG4gIH0sXHJcbiAgJ09wZXJhJzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL09wZXJhIE1pbmkvaSk7XHJcbiAgfSxcclxuICBXaW5kb3dzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvSUVNb2JpbGUvaSkgfHxcclxuICAgIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XUERlc2t0b3AvaSk7XHJcbiAgfSxcclxuICBhbnk6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIChpc01vYmlsZS5BbmRyb2lkKCkgfHxcclxuICAgIGlzTW9iaWxlLmlPUygpIHx8XHJcbiAgICBpc01vYmlsZS5CbGFja0JlcnJ5KCkgfHxcclxuICAgIGlzTW9iaWxlLk9wZXJhKCkgfHxcclxuICAgIGlzTW9iaWxlLldpbmRvd3MoKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG5cclxuICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xyXG5cclxuICBpZiAodHlwZW9mIHdpbmRvdy5BdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ291bGRuXFwndCBpbml0aWFsaXplIHRoZSBhdWRpbyBjb250ZXh0LicpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGF1ZGlvQ3R4O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogVGhpcyBpcyBub3QgYWJvdXQgamF2YXNjcmlwdCBldmVudHMhIEl0J3MganVzdFxyXG4gKiBhIGRlZmluaXRpb24gb2YgdGhlIGV2ZW50cyB0aGF0IHRoZSBzZXF1ZW5jZXIgY2FuIGhhbmRsZSBwbHVzXHJcbiAqIHNvbWUgZnVuY3Rpb25zIHRvIGNyZWF0ZSB2YWxpZCBldmVudHMuXHJcbiAqIFRoZSBjbGFzcyBkZWZpbmVzIHdoaWNoIHN1YnN5c3RlbSBpcyBpbnZva2VkIHRvIHByb2Nlc3MgdGhlIGV2ZW50LlxyXG4gKiBFdmVyeSBjbGFzcyBjYW4gaGF2ZSBzZXZlcmFsIHR5cGVzIGFuZCBhIHR5cGUgY29uc2lzdHMgb2Ygb25lIG9yXHJcbiAqIG1vcmUgcHJvcGVydGllcy5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGEgbm90ZSBldmVudCBmb3IgYW4gYXVkaW8gb2JqZWN0PC9jYXB0aW9uPlxyXG4gKiB2YXIgbm90ZSA9IGludGVybWl4LmV2ZW50cy5jcmVhdGVBdWRpb05vdGUoJ2MzJywgNjUsIDEyOCwgYVNvdW5kT2JqZWN0KTtcclxuICovXHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IHByb3BlcnRpZXMgaW4gb25lIGhhbmR5IGFycmF5LlxyXG4gKiBAdHlwZSB7QXJyYXl9XHJcbiAqL1xyXG52YXIgZXZQcm9wID0gW1xyXG4gICdpbnN0cnVtZW50JywgLy8gdGhlIGV2ZW50IHJlY2VpdmVyXHJcbiAgJ3RvbmUnLCAgICAgICAvLyBJbnQgYmV0d2VlbiAwIGFuZCAxMjcgYmVnaW5uaW5nIGF0IGMwXHJcbiAgJ2R1cmF0aW9uJywgICAvLyBJbnQgcmVwcmVzZW50aW5nIGEgbnVtYmVyIG9mIDY0dGggbm90ZXNcclxuICAndmVsb2NpdHknLCAgIC8vIEludCBiZXR3ZWVuIDAgYW5kIDEyN1xyXG4gICdwaXRjaCcsXHJcbiAgJ3ZvbHVtZScsXHJcbiAgJ3BhbidcclxuXTtcclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgdHlwZXMgYW5kIHRoZSBwcm9wZXJ0aWVzIGFzc290aWF0ZWQgd2l0aCB0aGVtLlxyXG4gKiBUeXBlIGFyZSB2YWxpZCB3aXRoIG9uZSwgc2V2ZXJhbCBvciBhbGwgb2YgaXRzIHByb3BlcnRpZXMuXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG52YXIgZXZUeXBlID0ge1xyXG4gICdub3RlJzogWyBldlByb3BbMF0sIGV2UHJvcFsxXSwgZXZQcm9wWzJdLCBldlByb3BbM10gXSxcclxuICAnY29udHJvbCc6IFsgZXZQcm9wWzRdLCBldlByb3BbNV0sIGV2UHJvcFs2XSBdXHJcbn07XHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IGNsYXNzZXMgYW5kIHRoZSB0eXBlcyBhc3NvdGlhdGVkIHdpdGggdGhlbS5cclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbnZhciBldkNsYXNzID0ge1xyXG4gICdhdWRpbyc6IFtldlR5cGUubm90ZSwgZXZUeXBlLmNvbnRyb2xdLFxyXG4gICdzeW50aCc6IFtldlR5cGUubm90ZSwgZXZUeXBlLmNvbnRyb2xdLFxyXG4gICdmeCc6IFtdLFxyXG4gICdtaWRpJzogW10sXHJcbiAgJ29zYyc6IFtdXHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSBjbGFzcyBvZiBhIHNlcXVlbmNlciBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICB0cnVlIGlmIGNsYXNzIGV4aXN0cywgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVDbGFzcyA9IGZ1bmN0aW9uKGVDbGFzcykge1xyXG4gIGlmIChldkNsYXNzLmhhc093blByb3BlcnR5KGVDbGFzcykpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyB0aGUgdHlwZSBvZiBhIHNlcXVlbmNlciBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgZVR5cGUgRXZlbnQgdHlwZVxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgdHJ1ZSBpZiB0eXBlIGV4aXN0cywgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVUeXBlID0gZnVuY3Rpb24oZVR5cGUpIHtcclxuICBpZiAoZXZUeXBlLmhhc093blByb3BlcnR5KGVUeXBlKSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGFuIGluc3RydW1lbnQgaXMgYW4gb2JqZWN0LlxyXG4gKiBUaGlzIGlzIGEgcG9vcmx5IHdlYWsgdGVzdCBidXQgdGhhdCdzXHJcbiAqIGFsbCB3ZSBjYW4gZG8gaGVyZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBpbnN0ciBBbiBpbnN0cnVtZW50IG9iamVjdFxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIHRydWUgaWYgaXQncyBhbiBvYmplY3QsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcEluc3RydW1lbnQgPSBmdW5jdGlvbihpbnN0cikge1xyXG4gIGlmICh0eXBlb2YgaW5zdHIgPT09ICdvYmplY3QnKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgaWYgYSB0b25lIG9yIHZlbG9jaXR5IHZhbHVlIGlzXHJcbiAqIGFuIGludGVnZXIgYmV0d2VlbiAwIGFuZCAxMjcuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0ludH0gIHZhbHVlICAgVGhlIG51bWJlciB0aGF0IHJlcHJlc2VudHMgYSB0b25lXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgVHJ1ZSBpZiBpdHMgYSB2YWxpZCB0b25lLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BUb25lVmVsbyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgaWYgKCFpc05hTih2YWx1ZSkgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgJiYgdmFsdWUgPj0gMCAmJiB2YWx1ZSA8PSAxMjcpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBpZiBhIGR1cmF0aW9uIGlzIGEgcG9zaXRpdmUgaW50ZWdlci5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7SW50fSAgdmFsdWUgICBOdW1iZXIgcmVwcmVzZW50aW5nIG11bHRpcGxlIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICBUcnVlIGlmIGl0cyBhIHZhbGlkIGR1cmF0aW9uLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BEdXJhdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgaWYgKCFpc05hTih2YWx1ZSkgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgJiYgdmFsdWUgPj0gMCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGFuIG9iamVjdCBvZiBldmVudCBwcm9wZXJ0aWVzLlxyXG4gKiBJdCBjaGVja3MgdGhlIHByb3BlcnRpZXMgYXJlIHZhbGlkIGZvciB0aGUgZ2l2ZW4gdHlwZS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgIE9iamVjdCB3aXRoIGV2ZW50IHByb3BlcnRpZXNcclxuICogQHBhcmFtICB7U3RyaW5nfSBlVHlwZSAgIEV2ZW50IHR5cGUgdG8gdmFsaWRhdGUgYWdhaW5zdFxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgdHJ1ZSBpZiBhbGwgcHJvcHMgYXJlIHZhbGlkLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BzID0gZnVuY3Rpb24oZVByb3BzLCBlVHlwZSkge1xyXG4gIHZhciB0eXBlID0gZXZUeXBlW2VUeXBlXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZVByb3BzKSAge1xyXG4gICAgaWYgKGV2UHJvcC5pbmRleE9mKGtleSkgPT09IC0xICYmXHJcbiAgICB0eXBlLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIHN0cmluZyBvZiB0aGUgZm9ybSBjMyBvciBkIzQgYW5kXHJcbiAqIHJldHVybnMgdGhlIGNvcnJlc3BvbmRpbmcgbnVtYmVyLlxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHRvbmUgU3RyaW5nIHJlcHJlc2VudGluZyBhIG5vdGVcclxuICogQHJldHVybiB7SW50fSAgICAgICAgIE51bWJlciByZXByZXNlbnRpbmcgYSBub3RlXHJcbiAqL1xyXG52YXIgY29udmVydFRvbmUgPSBmdW5jdGlvbih0b25lKSB7XHJcbiAgdmFyIG5vdGVzID0gWydjJywgJ2MjJywgJ2QnLCAnZCMnLCAnZScsICdmJywgJ2YjJywgJ2cnLCAnZyMnLCAnYScsICdhIycsICdiJ107XHJcbiAgdmFyIHN0ciA9IHRvbmUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgaWYgKHN0ci5tYXRjaCgvXlthLWhdIz9bMC05XSQvKSkge1xyXG4gICAgdmFyIG5vdGUgPSBzdHIuc3Vic3RyaW5nKDAsIHN0ci5sZW5ndGggLSAxKTtcclxuICAgIHZhciBvY3QgPSBzdHIuc2xpY2UoLTEpO1xyXG5cclxuICAgIGlmIChub3RlID09PSAnaCcpIHtcclxuICAgICAgbm90ZSA9ICdiJztcclxuICAgIH1cclxuICAgIHJldHVybiBub3Rlcy5pbmRleE9mKG5vdGUpICsgb2N0ICogMTI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVW52YWxpZCBzdHJpbmcuIEhhcyB0byBiZSBsaWtlIFthLWhdPCM+WzAtOV0nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHNlcXVlbmNlciBldmVudC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSBlQ2xhc3MgRXZlbnQgY2xhc3NcclxuICogQHBhcmFtICB7U3RyaW5nfSBlVHlwZSAgRXZlbnQgdHlwZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGVQcm9wcyBPYmplY3Qgd2l0aCBldmVudCBwcm9wZXJ0aWVzXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgIFNlcXVlbmNlciBldmVudFxyXG4gKi9cclxudmFyIGNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24oZUNsYXNzLCBlVHlwZSwgZVByb3BzKSB7XHJcbiAgaWYgKHZhbGlkYXRlQ2xhc3MoZUNsYXNzKSAmJlxyXG4gICAgdmFsaWRhdGVUeXBlKGVUeXBlKSAmJlxyXG4gICAgdmFsaWRhdGVQcm9wcyhlUHJvcHMsIGVUeXBlKSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgJ2NsYXNzJzogZUNsYXNzLFxyXG4gICAgICAndHlwZSc6IGVUeXBlLFxyXG4gICAgICAncHJvcHMnOiBlUHJvcHNcclxuICAgIH07XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNyZWF0ZSBzZXF1ZW5jZXIgZXZlbnQuIFdyb25nIHBhcmFtZXRlcnMnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbiBhdWRpbyBub3RlIGV2ZW50XHJcbiAqIEBwYXJhbSAge0ludHxTdHJpbmd9IHRvbmUgICAgIFRvbmUgYmV0d2VlbiAwIGFuZCAxMjcgb3Igc3RyaW5nIChjMywgZCM0KVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgICAgICB2ZWxvY2l0eSBWZWxvY2l0eSBiZXR3ZWVuIDAgYW5kIDEyN1xyXG4gKiBAcGFyYW0gIHtJbnR9ICAgICAgICBkdXJhdGlvbiBEdXJhdGlvbiBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgIEFsbCBwcm9wZXJ0aWVzIGluIG9uZSBvYmplY3RcclxuICovXHJcbnZhciBjcmVhdGVBdWRpb05vdGUgPSBmdW5jdGlvbih0b25lLCB2ZWxvY2l0eSwgZHVyYXRpb24sIGluc3RyKSB7XHJcbiAgdmFyIHByb3BzID0ge307XHJcbiAgaWYgKHR5cGVvZiB0b25lID09PSAnc3RyaW5nJykge1xyXG4gICAgdG9uZSA9IGNvbnZlcnRUb25lKHRvbmUpO1xyXG4gIH1cclxuICBpZiAodG9uZSAmJiB2YWxpZGF0ZVByb3BUb25lVmVsbyh0b25lKSkge1xyXG4gICAgcHJvcHMudG9uZSA9IHRvbmU7XHJcbiAgfVxyXG4gIGlmICh2ZWxvY2l0eSAmJiB2YWxpZGF0ZVByb3BUb25lVmVsbyh2ZWxvY2l0eSkpIHtcclxuICAgIHByb3BzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XHJcbiAgfVxyXG4gIGlmIChkdXJhdGlvbiAmJiB2YWxpZGF0ZVByb3BEdXJhdGlvbihkdXJhdGlvbikpIHtcclxuICAgIHByb3BzLmR1cmF0aW9uID0gZHVyYXRpb247XHJcbiAgfVxyXG4gIGlmIChpbnN0ciAmJiB2YWxpZGF0ZVByb3BJbnN0cnVtZW50KGluc3RyKSkge1xyXG4gICAgcHJvcHMuaW5zdHJ1bWVudCA9IGluc3RyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Egc2VxdWVuY2VyIGV2ZW50IG11c3QgaGF2ZSBhbiBpbnN0cnVtZW50IGFzIHByb3BlcnR5Jyk7XHJcbiAgfVxyXG4gIHJldHVybiBjcmVhdGVFdmVudCgnYXVkaW8nLCAnbm90ZScsIHByb3BzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGNsYXNzOiBldkNsYXNzLFxyXG4gIHR5cGU6IGV2VHlwZSxcclxuICBwcm9wZXJ0eTogZXZQcm9wLFxyXG4gIGNyZWF0ZUF1ZGlvTm90ZTogY3JlYXRlQXVkaW9Ob3RlXHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIGEgd2Vid29ya2VyIHRoYXQgcHJvdmlkZXMgYSB0aW1lclxyXG4gKiB0aGF0IGZpcmVzIHRoZSBzY2hlZHVsZXIgZm9yIHRoZSBzZXF1ZW5jZXIuXHJcbiAqIFRoaXMgaXMgYmVjYXVzZSB0aW1pbmcgaGVyZSBpcyAgbW9yZSBzdGFibGVcclxuICogdGhhbiBpbiB0aGUgbWFpbiB0aHJlYWQuXHJcbiAqIFRoZSBzeW50YXggaXMgYWRhcHRlZCB0byB0aGUgY29tbW9uanMgbW9kdWxlIHBhdHRlcm4uXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkl0IGlzIGp1c3QgZm9yIGxpYnJhcnkgaW50ZXJuYWxcclxuICogdXNhZ2UuIFNlZSBTZXF1ZW5jZXIuanMgZm9yIGRldGFpbHMuPC9jYXB0aW9uPlxyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoeyAnaW50ZXJ2YWwnOiAyMDAgfSk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICogd29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAqIHdvcmtlci50ZXJtaW5hdGUoKTsgIC8vd2Vid29ya2VyIGludGVybmFsIGZ1bmN0aW9uLCBqdXN0IGZvciBjb21wbGV0ZW5lc3NcclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB0aW1lciA9IG51bGw7XHJcbnZhciBpbnRlcnZhbCA9IDEwMDtcclxuXHJcbnZhciB3b3JrZXIgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuICAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbiAgICAgIGlmICh0aW1lcikge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3b3JrZXI7XHJcbiJdfQ==
