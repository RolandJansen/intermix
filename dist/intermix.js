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
  if (this.queue[this.nextStep]) {
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
  // console.log('next step: ' + this.nextStep);
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
 * Takes binary audio data, turns it into an audio buffer object and
 * stores it in this.buffer.
 * Basically a wrapper for the web-audio-api decodeAudioData function.
 * It uses the new promise syntax so it probably won't work in all browsers by now.
 * @private
 * @param  {ArrayBuffer}  rawAudioSrc Audio data in raw binary format
 * @param  {function}     [func]      Can be used to run code inside the inner decode function.
 * @return {Promise}                  Promise that indicates if operation was successfull.
 */
SoundWave.prototype.decodeAudioData = function(rawAudioSrc) {
  var self = this;
  return core.decodeAudioData(rawAudioSrc).then(function(decoded) {
    self.buffer = decoded;
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

SoundWave.prototype.transferComplete = function() {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIGludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbmludGVybWl4LmV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XHJcbmludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbmludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5pbnRlcm1peC5TZXF1ZW5jZXIgPSByZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpO1xyXG5pbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGludGVybWl4O1xyXG4iLCJ2YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcblxudmFyIHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgdmFyIHdrZXk7XG4gICAgdmFyIGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICB2YXIgZXhwID0gY2FjaGVba2V5XS5leHBvcnRzO1xuICAgICAgICAvLyBVc2luZyBiYWJlbCBhcyBhIHRyYW5zcGlsZXIgdG8gdXNlIGVzbW9kdWxlLCB0aGUgZXhwb3J0IHdpbGwgYWx3YXlzXG4gICAgICAgIC8vIGJlIGFuIG9iamVjdCB3aXRoIHRoZSBkZWZhdWx0IGV4cG9ydCBhcyBhIHByb3BlcnR5IG9mIGl0LiBUbyBlbnN1cmVcbiAgICAgICAgLy8gdGhlIGV4aXN0aW5nIGFwaSBhbmQgYmFiZWwgZXNtb2R1bGUgZXhwb3J0cyBhcmUgYm90aCBzdXBwb3J0ZWQgd2VcbiAgICAgICAgLy8gY2hlY2sgZm9yIGJvdGhcbiAgICAgICAgaWYgKGV4cCA9PT0gZm4gfHwgZXhwLmRlZmF1bHQgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXdrZXkpIHtcbiAgICAgICAgd2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgd2NhY2hlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgICAgIHdjYWNoZVtrZXldID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZXNbd2tleV0gPSBbXG4gICAgICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnLCdtb2R1bGUnLCdleHBvcnRzJ10sICcoJyArIGZuICsgJykoc2VsZiknKSxcbiAgICAgICAgICAgIHdjYWNoZVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgc2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuXG4gICAgdmFyIHNjYWNoZSA9IHt9OyBzY2FjaGVbd2tleV0gPSB3a2V5O1xuICAgIHNvdXJjZXNbc2tleV0gPSBbXG4gICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZSddLCAoXG4gICAgICAgICAgICAvLyB0cnkgdG8gY2FsbCBkZWZhdWx0IGlmIGRlZmluZWQgdG8gYWxzbyBzdXBwb3J0IGJhYmVsIGVzbW9kdWxlXG4gICAgICAgICAgICAvLyBleHBvcnRzXG4gICAgICAgICAgICAndmFyIGYgPSByZXF1aXJlKCcgKyBzdHJpbmdpZnkod2tleSkgKyAnKTsnICtcbiAgICAgICAgICAgICcoZi5kZWZhdWx0ID8gZi5kZWZhdWx0IDogZikoc2VsZik7J1xuICAgICAgICApKSxcbiAgICAgICAgc2NhY2hlXG4gICAgXTtcblxuICAgIHZhciBzcmMgPSAnKCcgKyBidW5kbGVGbiArICcpKHsnXG4gICAgICAgICsgT2JqZWN0LmtleXMoc291cmNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdpZnkoa2V5KSArICc6WydcbiAgICAgICAgICAgICAgICArIHNvdXJjZXNba2V5XVswXVxuICAgICAgICAgICAgICAgICsgJywnICsgc3RyaW5naWZ5KHNvdXJjZXNba2V5XVsxXSkgKyAnXSdcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSkuam9pbignLCcpXG4gICAgICAgICsgJ30se30sWycgKyBzdHJpbmdpZnkoc2tleSkgKyAnXSknXG4gICAgO1xuXG4gICAgdmFyIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCB8fCB3aW5kb3cubW96VVJMIHx8IHdpbmRvdy5tc1VSTDtcblxuICAgIHJldHVybiBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgIG5ldyBCbG9iKFtzcmNdLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pXG4gICAgKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBwYXJ0IG9mIGEgc2VxdWVuY2UuIEl0IGNhbiBiZVxyXG4gKiB1c2VkIGluIG1hbnkgd2F5czpcclxuICogPHVsPlxyXG4gKiA8bGk+QSBwYXJ0IG9mIGEgdHJhY2sgbGlrZSBpbiBwaWFuby1yb2xsIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8bGk+QSBwYXR0ZXJuIGxpa2UgaW4gc3RlcCBzZXF1ZW5jZXJzLCBkcnVtIGNvbXB1dGVycyBhbmQgdHJhY2tlcnM8L2xpPlxyXG4gKiA8bGk+QSBsb29wIGxpa2UgaW4gbGl2ZSBzZXF1ZW5jZXJzPC9saT5cclxuICogPC91bD5cclxuICogVGVjaG5pY2FsbHkgaXQgY2FuIHN0b3JlIGFueSB0eXBlIG9mIGV2ZW50IHlvdXIgc3lzdGVtIGlzIGNhcGFibGUgb2YuXHJcbiAqIFRoaXMgbWVhbnMgaXQgaXMgbm90IGxpbWl0ZWQgdG8gYXVkaW8sIG1pZGksIG9zYyBvciBkbXggYnV0IGNhbiBob2xkXHJcbiAqIGFueSB0eXBlIG9mIGphdmFzY3JpcHQgb2JqZWN0LiBBIHBvc3NpYmxlIHVzZWNhc2Ugd291bGQgYmUgdG8gdHJpZ2dlclxyXG4gKiBzY3JlZW4gZXZlbnRzIHdpdGggdGhlIGRyYXcgZnVuY3Rpb24gb2YgdGhlIHNlcXVlbmNlciBvYmplY3QuXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmVPYmplY3QpO1xyXG4gKiB2YXIgc2VxID0gbmV3IGludGVybWl4LlNlcXVlbmNlcigpO1xyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBub3RlID0gaW50ZXJtaXguZXZlbnRzLmNyZWF0ZUF1ZGlvTm90ZSgnYTMnLCAxLCAwLCBzb3VuZCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQobm90ZSwgMCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQobm90ZSwgNCk7XHJcbiAqIHNlcS5hZGRQYXJ0KHBhcnQsIDApO1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggICAgICAgTGVuZ3RoIG9mIHRoZSBwYXJ0IGluIDY0dGggbm90ZXMgKGRlZmF1bHQ6IDY0KVxyXG4gKi9cclxudmFyIFBhcnQgPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gMTY7IC8vIChyZXNvbHV0aW9uICogbXVsdGlwbHkpIHNob3VsZCBhbHdhc3kgYmUgNjRcclxuICB0aGlzLm11bHRpcGx5ID0gNDsgICAgLy8gcmVzb2x1dGlvbiBtdWx0aXBsaWVyXHJcbiAgdGhpcy5sZW5ndGggPSA2NDsgICAgIC8vIGxlbmd0aCBvZiB0aGUgcGF0dGVybiBpbiA2NHRoIG5vdGVzXHJcbiAgdGhpcy5uYW1lID0gJ1BhcnQnOyAgIC8vIG5hbWUgb2YgdGhpcyBwYXJ0XHJcbiAgdGhpcy5wYXR0ZXJuID0gW107ICAgIC8vIHRoZSBhY3R1YWwgcGF0dGVybiB3aXRoIG5vdGVzIGV0Yy5cclxuXHJcbiAgaWYgKGxlbmd0aCkge1xyXG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XHJcbiAgfVxyXG5cclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLmluaXRQYXR0ZXJuKHRoaXMubGVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIGFuIGVtcHR5IHBhdHRlcm4gZm9yIHRoZSBwYXJ0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIG1lc3VyZWQgaW4gYmFycyAoNCBiZWF0cyA9IDEgYmFyKVxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhdHRlcm4gPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuICB2YXIgcGF0dGVybiA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgKGxlbmd0aCk7IGkrKykge1xyXG4gICAgcGF0dGVybltpXSA9IFtdO1xyXG4gIH1cclxuICByZXR1cm4gcGF0dGVybjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IHRvIHRoZSBwYXR0ZXJuIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gICAgdGhpcy5wYXR0ZXJuW3Bvc10ucHVzaChzZXFFdmVudCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUG9zaXRpb24gb3V0IG9mIHBhdHRlcm4gYm91bmRzLicpO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFuIGV2ZW50IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlLCBjb250cm9sbGVyLCB3aGF0ZXZlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gIHZhciBpbmRleCA9IHRoaXMucGF0dGVybltwb3NdLmluZGV4T2Yoc2VxRXZlbnQpO1xyXG4gIHRoaXMucGF0dGVybltwb3NdLnNwbGljZShpbmRleCwgMSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtJbnR9ICAgIExlbmd0aCBvZiB0aGUgcGF0dGVyblxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGF0dGVybi5sZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NpdGlvbnMgdGhhdCBjb250YWluIGF0IGxlYXN0IG9uZSBldmVudC5cclxuICogQ2FuIGJlIGhhbmR5IHRvIGRyYXcgZXZlbnRzIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPmZyb20ge0B0dXRvcmlhbCBTdGVwc2VxdWVuY2VyfTwvY2FwdGlvbj5cclxuICogYmRTdGVwcyA9IGJkUGFydC5nZXROb3RlUG9zaXRpb25zKCk7XHJcbiAqIGJkU3RlcHMuZm9yRWFjaChmdW5jdGlvbihwb3MpIHtcclxuICogICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmQnICsgcG9zKS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmVkJztcclxuICogfSk7XHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpOyAgIC8vcHJlcGFyZXMgdGhlIHdvcmtlciBmb3IgYnJvd3NlcmlmeVxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgd29ya2VyID0gcmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBtYWluIGNsYXNzIG9mIHRoZSBzZXF1ZW5jZXIuIEl0IGRvZXMgdGhlIHF1ZXVpbmcgb2ZcclxuICogcGFydHMgYW5kIGV2ZW50cyBhbmQgcnVucyB0aGUgc2NoZWR1bGVycyB0aGF0IGZpcmUgZXZlbnRzXHJcbiAqIGFuZCBkcmF3cyB0byB0aGUgc2NyZWVuLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQoc29tZU5vdGUsIDApO1xyXG4gKiBzZXEuYWRkUGFydChwYXJ0LCAwKTtcclxuICogc2VxLnN0YXJ0KCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJwbSA9IDEyMDsgICAgICAgICAgICAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5xdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLnRpbWVQZXJTdGVwOyAgICAgICAgICAgLy9wZXJpb2Qgb2YgdGltZSBiZXR3ZWVuIHR3byBzdGVwc1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDsgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBuZXh0IHN0ZXAgd2lsbCBiZSB0cmlnZ2VyZWRcclxuICB0aGlzLm5leHRTdGVwID0gMDsgICAgICAgICAgLy9wb3NpdGlvbiBpbiB0aGUgcXVldWUgdGhhdCB3aWxsIGdldCB0cmlnZ2VyZWQgbmV4dFxyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSAwOyAgICAvL3N0ZXAgaW4gcXVldWUgdGhhdCB3YXMgcGxheWVkIChub3QgdHJpZ2dlcmVkKSByZWNlbnRseSAodXNlZCBmb3IgZHJhd2luZykuXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7ICAgICAgICAgIC8vcGxheSBhIHNlY3Rpb24gb2YgdGhlIHF1ZXVlIGluIGEgbG9vcFxyXG4gIHRoaXMubG9vcFN0YXJ0OyAgICAgICAgICAgICAvL2ZpcnN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmxvb3BFbmQ7ICAgICAgICAgICAgICAgLy9sYXN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlOyAgICAgLy90cnVlIGlmIHNlcXVlbmNlciBpcyBydW5uaW5nLCBvdGhlcndpc2UgZmFsc2VcclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lOyAgICAgICAgLy9oYXMgdG8gYmUgb3ZlcnJpZGRlbiB3aXRoIGEgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGluIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RyYXcgZnVuY3Rpb24gd2l0aCB0aGUgbGFzdFBsYXllZFN0ZXAgaW50IGFzIHBhcmFtZXRlci5cclxuXHJcbiAgLy8gc2V0IHRpbWUgcGVyIHNldFRpbWVQZXJTdGVwXHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAodGhpcy5icG0sIHRoaXMucmVzb2x1dGlvbik7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgdGhlIHNjaGVkdWxlci10aW1lclxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIgPSB3b3JrKHdvcmtlcik7XHJcblxyXG4gIC8qZXNsaW50LWVuYWJsZSAqL1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICd0aWNrJykge1xyXG4gICAgICBzZWxmLnNjaGVkdWxlcigpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoeydpbnRlcnZhbCc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBldmVudHMgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlIGFuZCBmaXJlcyB0aGVtLlxyXG4gKiBJdCBnZXRzIGNhbGxlZCBhdCBhIGNvbnN0YW50IHJhdGUsIGxvb2tzIGFoZWFkIGluXHJcbiAqIHRoZSBxdWV1ZSBhbmQgZmlyZXMgYWxsIGV2ZW50cyBpbiB0aGUgbmVhciBmdXR1cmVcclxuICogd2l0aCBhIGRlbGF5IGNvbXB1dGVkIGZyb20gdGhlIGN1cnJlbnQgYnBtIHZhbHVlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zY2hlZHVsZXIgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbGltaXQgPSBjb3JlLmN1cnJlbnRUaW1lICsgdGhpcy5sb29rYWhlYWQ7XHJcbiAgLy8gaWYgaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUgb3IgcHJldmlvdXNseSBzdG9wcGVkXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCBsaW1pdCkge1xyXG4gICAgdGhpcy5hZGRQYXJ0c1RvUnVucXVldWUoKTtcclxuICAgIHRoaXMuZmlyZUV2ZW50cygpO1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICB0aGlzLnNldFF1ZXVlUG9pbnRlcigpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyBpbiB0aGUgbWFzdGVyIHF1ZXVlIGZvciBwYXJ0cyBhbmQgYWRkc1xyXG4gKiBjb3BpZXMgb2YgdGhlbSB0byB0aGUgcnVucXVldWUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnRzVG9SdW5xdWV1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdKSB7XHJcbiAgICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5sZW5ndGggPT09IDEpIHtcclxuICAgICAgdmFyIHBhcnQgPSB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdWzBdO1xyXG4gICAgICBwYXJ0LnBvaW50ZXIgPSAwO1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2gocGFydCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICAgIHBhcnQucG9pbnRlciA9IDA7XHJcbiAgICAgICAgdGhpcy5ydW5xdWV1ZS5wdXNoKHBhcnQpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRGVsZXRlcyBwYXJ0cyBmcm9tIHJ1bnF1ZXVlLiBJdCBpcyBpbXBvcnRhbnQsIHRoYXQgdGhlIGluZGljZXNcclxuICogb2YgdGhlIHBhcnRzIGFyZSBzb3J0ZWQgZnJvbSBtYXggdG8gbWluLiBPdGhlcndpc2UgdGhlIGZvckVhY2hcclxuICogbG9vcCB3b24ndCB3b3JrLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gaW5kaWNlcyAgSW5kaWNlcyBvZiB0aGUgcGFydHMgaW4gdGhlIHJ1bnF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRlbGV0ZVBhcnRzRnJvbVJ1bnF1ZXVlID0gZnVuY3Rpb24oaW5kaWNlcykge1xyXG4gIGlmIChpbmRpY2VzLmxlbmd0aCA+IDApIHtcclxuICAgIGluZGljZXMuZm9yRWFjaChmdW5jdGlvbihpZCkge1xyXG4gICAgICBkZWxldGUgdGhpcy5ydW5xdWV1ZVtpZF0ucG9pbnRlcjtcclxuICAgICAgdGhpcy5ydW5xdWV1ZS5zcGxpY2UoaWQsIDEpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpcmVzIGFsbCBldmVudHMgZm9yIHRoZSB1cGNvbW1pbmcgc3RlcC5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZmlyZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBtYXJrRm9yRGVsZXRlID0gW107XHJcbiAgdGhpcy5ydW5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGluZGV4KSB7XHJcbiAgICBpZiAocGFydC5wb2ludGVyID09PSBwYXJ0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgbWFya0ZvckRlbGV0ZS51bnNoaWZ0KGluZGV4KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciBzZXFFdmVudHMgPSBwYXJ0LnBhdHRlcm5bcGFydC5wb2ludGVyXTtcclxuICAgICAgaWYgKHNlcUV2ZW50cyAmJiBzZXFFdmVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIHNlcUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgICAgICAgICB0aGlzLnByb2Nlc3NTZXFFdmVudChzZXFFdmVudCwgdGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9IGVsc2UgaWYgKHNlcUV2ZW50cyAmJiBzZXFFdmVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnRzWzBdLCB0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHBhcnQucG9pbnRlcisrO1xyXG4gIH0sIHRoaXMpO1xyXG4gIHRoaXMuZGVsZXRlUGFydHNGcm9tUnVucXVldWUobWFya0ZvckRlbGV0ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW52b2tlcyB0aGUgYXBwcm9wcmlhdGUgc3Vic3lzdGVtIHRvIHByb2Nlc3MgdGhlIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCB0byBwcm9jZXNzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZGVsYXkgICAgIHRpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBldmVudCBzaG91bGQgc3RhcnRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucHJvY2Vzc1NlcUV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIGRlbGF5KSB7XHJcbiAgaWYgKGRlbGF5KSB7XHJcbiAgICBzZXFFdmVudC5wcm9wc1snZGVsYXknXSA9IGRlbGF5O1xyXG4gIH1cclxuICBzZXFFdmVudC5wcm9wcy5pbnN0cnVtZW50LnByb2Nlc3NTZXFFdmVudChzZXFFdmVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgcG9pbnRlciB0byB0aGUgbmV4dCBzdGVwIHRoYXQgc2hvdWxkIGJlIHBsYXllZFxyXG4gKiBpbiB0aGUgbWFzdGVyIHF1ZXVlLiBJZiB3ZSdyZSBwbGF5aW5nIGluIGxvb3AgbW9kZSxcclxuICoganVtcCBiYWNrIHRvIGxvb3BzdGFydCB3aGVuIGVuZCBvZiBsb29wIGlzIHJlYWNoZWQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAgIHtJbnR9ICAgcG9zaXRpb24gIE5ldyBwb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRRdWV1ZVBvaW50ZXIgPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gIGlmICh0aGlzLmxvb3ApIHtcclxuICAgIGlmICh0aGlzLm5leHRTdGVwID49IHRoaXMubG9vcEVuZCkge1xyXG4gICAgICB0aGlzLm5leHRTdGVwID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgIHRoaXMucnVuUXVldWUgPSBbXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubmV4dFN0ZXArKztcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHBvc2l0aW9uKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwID0gcG9zaXRpb247XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMubmV4dFN0ZXArKztcclxuICB9XHJcbiAgLy8gY29uc29sZS5sb2coJ25leHQgc3RlcDogJyArIHRoaXMubmV4dFN0ZXApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyB0aGUgc2VxdWVuY2VyXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICAgIHRoaXMuaXNSdW5uaW5nID0gdHJ1ZTtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcykpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyB0aGUgc2VxdWVuY2VyIChoYWx0cyBhdCB0aGUgY3VycmVudCBwb3NpdGlvbilcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICAvL3RoaXMucnVuUXVldWUgPSBbXTtcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY2hlZHVsZXIgdGhhdCBydW5zIGEgZHJhd2luZyBmdW5jdGlvbiBldmVyeSB0aW1lXHJcbiAqIHRoZSBzY3JlZW4gcmVmcmVzaGVzLiBUaGUgZnVuY3Rpb24gU2VxdWVuY2VyLmFuaW1hdGlvbkZyYW1lKClcclxuICogaGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggc3R1ZmYgdG8gYmUgZHJhd24gb24gdGhlIHNjcmVlbi5cclxuICogSXQgY2FsbHMgaXRzZWxmIHJlY3Vyc2l2ZWx5IG9uIGV2ZXJ5IGZyYW1lIGFzIGxvbmcgYXMgdGhlIHNlcXVlbmNlciBpcyBydW5uaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gZmlyc3Qgd2UnbGwgaGF2ZSB0byBmaW5kIG91dCwgd2hhdCBzdGVwIHdhcyBwbGF5ZWQgcmVjZW50bHkuXHJcbiAgLy8gdGhpcyBpcyBzb21laG93IGNsdW1zeSBiZWNhdXNlIHRoZSBzZXF1ZW5jZXIgZG9lc24ndCBrZWVwIHRyYWNrIG9mIHRoYXQuXHJcbiAgdmFyIGxvb2tBaGVhZERlbHRhID0gdGhpcy5uZXh0U3RlcFRpbWUgLSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIGlmIChsb29rQWhlYWREZWx0YSA+PSAwKSB7XHJcbiAgICB2YXIgc3RlcHNBaGVhZCA9IE1hdGgucm91bmQobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKTtcclxuXHJcbiAgICBpZiAodGhpcy5uZXh0U3RlcCA8IHN0ZXBzQWhlYWQpIHtcclxuICAgICAgLy8gd2UganVzdCBqdW1wZWQgdG8gdGhlIHN0YXJ0IG9mIGEgbG9vcFxyXG4gICAgICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5sb29wRW5kICsgdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy51cGRhdGVGcmFtZSh0aGlzLmxhc3RQbGF5ZWRTdGVwKTtcclxuICB9XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJ1bnMgYmV0d2VlbiBzY3JlZW4gcmVmcmVzaC4gSGFzIHRvIGJlIG92ZXJyaWRkZW4gYnkgdGhlXHJcbiAqIGFwcCB0byByZW5kZXIgdG8gdGhlIHNjcmVlbi5cclxuICogQHBhcmFtICB7SW50fSAgbGFzdFBsYXllZFN0ZXAgIFRoZSA2NHRoIHN0ZXAgdGhhdCB3YXMgcGxheWVkIHJlY2VudGx5XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnVwZGF0ZUZyYW1lID0gZnVuY3Rpb24obGFzdFBsYXllZFN0ZXApIHtcclxuICBjb25zb2xlLmxvZyhsYXN0UGxheWVkU3RlcCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhIHBhcnQgdG8gdGhlIG1hc3RlciBxdWV1ZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICAgQW4gaW5zdGFuY2Ugb2YgUGFydFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmIChwYXJ0Lmxlbmd0aCAmJiBwYXJ0LnBhdHRlcm4pIHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gcGFyYW1ldGVyIGRvZXNuXFwnIHNlZW0gdG8gYmUgYSBwYXJ0IG9iamVjdCcpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgcGFydCBvYmplY3QgZnJvbSB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gcGFydCAgICAgUGFydCBpbnN0YW5jZSB0byBiZSByZW1vdmVkXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gUG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZW1vdmVQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAodGhpcy5xdWV1ZVtwb3NpdGlvbl0gaW5zdGFuY2VvZiBBcnJheSAmJlxyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ubGVuZ3RoID4gMCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5xdWV1ZVtwb3NpdGlvbl0uaW5kZXhPZihwYXJ0KTtcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnNwbGljZShpbmRleCwgMSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUGFydCBub3QgZm91bmQgYXQgcG9zaXRpb24gJyArIHBvc2l0aW9uICsgJy4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgIGJwbSBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldEJwbSA9IGZ1bmN0aW9uKGJwbSkge1xyXG4gIHRoaXMuYnBtID0gYnBtO1xyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKGJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlcyB0aGUgdGltZSBpbiBzZWNvbmRzIGFzIGZsb2F0IHZhbHVlXHJcbiAqIGJldHdlZW4gb25lIHNob3J0ZXN0IHBvc3NzaWJsZSBub3RlXHJcbiAqICg2NHRoIGJ5IGRlZmF1bHQpIGFuZCB0aGUgbmV4dC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBicG0gICAgICAgIGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgICByZXNvbHV0aW9uIHNob3J0ZXN0IHBvc3NpYmxlIG5vdGUgdmFsdWVcclxuICogQHJldHVybiB7ZmxvYXR9ICAgICAgICAgICAgIHRpbWUgaW4gc2Vjb25kc1xyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZ2V0TGFzdFBsYXllZFN0ZXAgPSBmdW5jdGlvbigpIHtcclxuXHJcbn07XHJcblxyXG4vKipcclxuICogTWFrZXMgYSBjb3B5IG9mIGEgZmxhdCBhcnJheS5cclxuICogVXNlcyBhIHByZS1hbGxvY2F0ZWQgd2hpbGUtbG9vcFxyXG4gKiB3aGljaCBzZWVtcyB0byBiZSB0aGUgZmFzdGVkIHdheVxyXG4gKiAoYnkgZmFyKSBvZiBkb2luZyB0aGlzOlxyXG4gKiBodHRwOi8vanNwZXJmLmNvbS9uZXctYXJyYXktdnMtc3BsaWNlLXZzLXNsaWNlLzExM1xyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gc291cmNlQXJyYXkgQXJyYXkgdGhhdCBzaG91bGQgYmUgY29waWVkLlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQ29weSBvZiB0aGUgc291cmNlIGFycmF5LlxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5jb3B5QXJyYXkgPSBmdW5jdGlvbihzb3VyY2VBcnJheSkge1xyXG4gIHZhciBkZXN0QXJyYXkgPSBuZXcgQXJyYXkoc291cmNlQXJyYXkubGVuZ3RoKTtcclxuICB2YXIgaSA9IHNvdXJjZUFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAoaS0tKSB7XHJcbiAgICBkZXN0QXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcclxuICB9XHJcbiAgcmV0dXJuIGRlc3RBcnJheTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VxdWVuY2VyO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxuLyoqXHJcbiAqIDxwPlxyXG4gKiBQbGF5IGEgc291bmQgdGhhdCBjYW4gYmUgbG9vcGVkLiBQYXVzZS9TdGFydCB3b3JrcyBzYW1wbGUtYWNjdXJhdGVcclxuICogYXQgYW55IHJhdGUuIEhpdCB0aGUgc3RhcnQgYnV0dG9uIG11bHRpcGxlIHRpbWVzIHRvIGhhdmUgbXVsdGlwbGVcclxuICogc291bmRzIHBsYXllZC4gQWxsIHBhcmFtZXRlcnMgYXJlIGFkanVzdGFibGUgaW4gcmVhbHRpbWUuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2F1ZGlvZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnN0YXJ0KCk7XHJcbiAqIEB0dXRvcmlhbCBTb3VuZFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7T2JqZWN0fSBzb3VuZFdhdmUgU291bmRXYXZlIG9iamVjdCBpbmNsdWRpbmcgdGhlIGJ1ZmZlciB3aXRoIGF1ZGlvIGRhdGEgdG8gYmUgcGxheWVkXHJcbiAqL1xyXG52YXIgU291bmQgPSBmdW5jdGlvbihzb3VuZFdhdmUpIHtcclxuXHJcbiAgdGhpcy53YXZlID0gbnVsbDtcclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgIC8vYWxsIGN1cnJlbnRseSBhY3RpdmUgc3RyZWFtc1xyXG4gIHRoaXMubG9vcCA9IGZhbHNlO1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBudWxsO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IG51bGw7XHJcblxyXG4gIHRoaXMuc291bmRMZW5ndGggPSAwO1xyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0cyA9IFtdOyAgIC8vaG9sZHMgc3RhcnQgb2Zmc2V0cyBpZiBwYXVzZWRcclxuICB0aGlzLnN0YXJ0VGltZSA9IDA7ICAgICAgIC8vd2hlbiB0aGUgc291bmQgc3RhcnRzIHRvIHBsYXlcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gbnVsbDtcclxuICB0aGlzLnBsYXliYWNrUmF0ZSA9IDE7XHJcbiAgdGhpcy5kZXR1bmUgPSAwO1xyXG5cclxuICBpZiAoc291bmRXYXZlKSB7XHJcbiAgICB0aGlzLndhdmUgPSBzb3VuZFdhdmU7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IHNvdW5kV2F2ZS5idWZmZXI7XHJcbiAgICB0aGlzLnNvdW5kTGVuZ3RoID0gdGhpcy5sb29wRW5kID0gdGhpcy5idWZmZXIuZHVyYXRpb247XHJcbiAgICB0aGlzLnNldHVwQXVkaW9DaGFpbigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIGluaXRpYWxpc2luZyBTb3VuZCBvYmplY3Q6IHBhcmFtZXRlciBtaXNzaW5nLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZ2FpbiBhbmQgc3RlcmVvLXBhbm5lciBub2RlLCBjb25uZWN0cyB0aGVtXHJcbiAqIChnYWluIC0+IHBhbm5lcikgYW5kIHNldHMgZ2FpbiB0byAxIChtYXggdmFsdWUpLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldHVwQXVkaW9DaGFpbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBjb3JlLmNyZWF0ZUdhaW4oKTtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBjb3JlLmNyZWF0ZVN0ZXJlb1Bhbm5lcigpO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLnBhbm5lck5vZGUpO1xyXG4gIHRoaXMucGFubmVyTm9kZS5jb25uZWN0KGNvcmUuZGVzdGluYXRpb24pO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDE7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbmQgY29uZmlndXJlcyBhIEJ1ZmZlclNvdXJjZU5vZGVcclxuICogdGhhdCBjYW4gYmUgcGxheWVkIG9uY2UgYW5kIHRoZW4gZGVzdHJveXMgaXRzZWxmLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtCdWZmZXJTb3VyY2VOb2RlfSBUaGUgQnVmZmVyU291cmNlTm9kZVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYnVmZmVyU291cmNlID0gY29yZS5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICBidWZmZXJTb3VyY2UuYnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgYnVmZmVyU291cmNlLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XHJcbiAgYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZShidWZmZXJTb3VyY2UpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGJ1ZmZlclNvdXJjZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXN0cm95ZXMgYSBnaXZlbiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgYW5kIGRlbGV0ZXMgaXRcclxuICogZnJvbSB0aGUgc291cmNlTm9kZSBxdWV1ZS4gVGhpcyBpcyB1c2VkIGluIHRoZSBvbmVuZGVkXHJcbiAqIGNhbGxiYWNrIG9mIGFsbCBCdWZmZXJTb3VyY2VOb2RlcyB0byBhdm9pZCBkZWFkIHJlZmVyZW5jZXMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2JzTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGR1cmF0aW9uICAgVGltZSBwcmVyaW9kIGFmdGVyIHRoZSBzdHJlYW0gc2hvdWxkIGVuZFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ocGxheUxvb3BlZCwgZGVsYXksIGR1cmF0aW9uKSB7XHJcbiAgaWYgKHRoaXMuaXNQYXVzZWQgJiYgdGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICB0aGlzLnJlc3VtZSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgICBpZiAoZGVsYXkpIHtcclxuICAgICAgc3RhcnRUaW1lID0gZGVsYXk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzdGFydFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gICAgfVxyXG4gICAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcbiAgICBpZiAocGxheUxvb3BlZCkge1xyXG4gICAgICBicy5sb29wID0gcGxheUxvb3BlZDtcclxuICAgICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgICB9XHJcbiAgICBicy5wbGF5YmFja1JhdGUudmFsdWUgPSBicy50bXBQbGF5YmFja1JhdGUgPSB0aGlzLnBsYXliYWNrUmF0ZTtcclxuICAgIGJzLmRldHVuZS52YWx1ZSA9IHRoaXMuZGV0dW5lO1xyXG4gICAgYnMuc3RhcnRUaW1lID0gc3RhcnRUaW1lOyAgIC8vIGV4dGVuZCBub2RlIHdpdGggYSBzdGFydHRpbWUgcHJvcGVydHlcclxuXHJcbiAgICB0aGlzLnF1ZXVlLnB1c2goYnMpO1xyXG4gICAgaWYgKGR1cmF0aW9uKSB7XHJcbiAgICAgIGJzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCwgZHVyYXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbSwgZXZlbiB0aGUgb25lcyB0aGF0IGFyZSBqdXN0IHNjaGVkdWxlZC5cclxuICogSXQgYWxzbyBjbGVhbnMgdGhlIHF1ZXVlIHNvIHRoYXQgdGhlIHNvdW5kIG9iamVjdCBpcyByZWFkeSBmb3IgYW5vdGhlciByb3VuZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUuc3RvcCgpO1xyXG4gICAgbm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgfSk7XHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgLy9yZWxlYXNlIGFsbCByZWZlcmVuY2VzXHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgYWxsIGF1ZGlvIHN0cmVhbXMgb2YgdGhpcyBzb3VuZCB0ZW1wb3JhcmlseS5cclxuICogVGhpcyBjdXJyZW50bHkganVzdCB3b3JrcyBpbiBDaHJvbWUgNDkrIG9ubHkuXHJcbiAqIElmIHlvdSB3YW50IGEgZ2xvYmFsLCBhY2N1cmF0ZSBwYXVzZSBmdW5jdGlvblxyXG4gKiB1c2Ugc3VzcGVuZC9yZXN1bWUgZnJvbSB0aGUgY29yZSBtb2R1bGUuXHJcbiAqIEByZXR1cm4gIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLmlzUGF1c2VkKSB7XHJcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBub2RlLnRtcFBsYXliYWNrUmF0ZSA9IG5vZGUucGxheWJhY2tSYXRlLnZhbHVlO1xyXG4gICAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IDAuMDtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgYWxsIHN0cmVhbXMgaWYgdGhleSB3ZXJlIHBhdXNlZC5cclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICAgIGRlbGV0ZSBub2RlLnRtcFBsYXliYWNrUmF0ZTtcclxuICB9KTtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvY2Vzc2VzIGFuIGV2ZW50IGZpcmVkIGJ5IHRoZSBzZXF1ZW5jZXIuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgQSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5wcm9jZXNzU2VxRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gIC8vdGhpcy5zZXRUb25lKHNlcUV2ZW50LnByb3BzLnRvbmUpO1xyXG4gIGlmIChzZXFFdmVudC5wcm9wcy5kdXJhdGlvbikge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXksXHJcbiAgICAgIHNlcUV2ZW50LnByb3BzLmR1cmF0aW9uKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5zdGFydChmYWxzZSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZGVsYXkpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdGFydHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBzdGFydCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BTdGFydCA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGVuZHBvaW50IG9mIHRoZSBsb29wXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSB2YWx1ZSAgbG9vcCBlbmQgaW4gc2Vjb25kc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldExvb3BFbmQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcEVuZCA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLmxvb3BFbmQgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWxlYXNlcyB0aGUgbG9vcCBvZiBhbGwgcnVubmluZyBub2RlcyxcclxuICogTm9kZXMgd2lsbCBydW4gdW50aWwgZW5kIGFuZCBzdG9wLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlbGVhc2VMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcCA9IGZhbHNlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgc3RhcnQgYW5kIGVuZHBvaW50IHRvIHN0YXJ0IGVuZCBlbmRwb2ludCBvZiB0aGUgQXVkaW9CdWZmZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5yZXNldExvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gdGhpcy5zb3VuZExlbmd0aDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHNvdW5kIGluIHBlcmNlbnRhZ2VcclxuICogKDEgPSAxMDAlLCAyID0gMjAwJSlcclxuICogQHBhcmFtICB7ZmxvYXR9ICB2YWx1ZSAgIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRvbmUgd2l0aGluIHR3byBvY3RhdmUgKCsvLTEyIHRvbmVzKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgc2VtaSB0b25lXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgaWYgKHNlbWlUb25lID49IC0xMiAmJiBzZW1pVG9uZSA8PSAxMikge1xyXG4gICAgdGhpcy5kZXR1bmUgPSBzZW1pVG9uZSAqIDEwMDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZW1pIHRvbmUgaXMgJyArIHNlbWlUb25lICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxhc3QgcGxheWVkIHNlbWl0b25lLiBUaGlzIGRvZXNuJ3QgaGFzIHRvIGJlIGFuXHJcbiAqIGludGVnZXIgYmV0d2VlbiAtLysxMiBhcyB0aGUgc291bmQgY2FuIGJlIGRldHVuZWQgd2l0aFxyXG4gKiBtb3JlIHByZWNpc2lvbi5cclxuICogQHJldHVybiB7ZmxvYXR9ICBTZW1pdG9uZSBiZXR3ZWVuIC0vKzEyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZSAvIDEwMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXR1bmUgdGhlIHNvdW5kIG9zY2lsbGF0aW9uIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIHZhbHVlICBkZXR1bmUgaW4gY2VudHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXREZXR1bmUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA+PSAtMTIwMCAmJiB2YWx1ZSA8PSAxMjAwKSB7XHJcbiAgICB0aGlzLmRldHVuZSA9IHZhbHVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldHVuZSBwYXJhbWV0ZXIgaXMgJyArIHZhbHVlICsgJy4gTXVzdCBiZSBiZXR3ZWVuICsvLTEyMDAuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgY3VycmVudCBkZXR1bmUgaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcmV0dXJuIHtJbnRlZ2VyfSAgRGV0dW5lIGluIGNlbnRzXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RGV0dW5lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGluIHVzZSBhbmQgY2FuIHByb2JhYmx5IGJlIHJlbW92ZWRcclxuICogQHJldHVybiB7SW50fSBSYW5kb20gbnVtYmVyXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VUlEID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zdWJzdHIoMiwgOCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxuLyoqXHJcbiAqIDxwPlxyXG4gKiBDcmVhdGVzIGEgd3JhcHBlciBpbiB3aGljaCBhbiBhdWRpbyBidWZmZXIgbGl2ZXMuXHJcbiAqIEEgU291bmRXYXZlIG9iamVjdCBqdXN0IGhvbGRzIGF1ZGlvIGRhdGEgYW5kIGRvZXMgbm90aGluZyBlbHNlLlxyXG4gKiBJZiB5b3Ugd2FudCB0byBwbGF5IHRoZSBzb3VuZCwgeW91IGhhdmUgdG8gYWRkaXRpb25hbGx5IGNyZWF0ZSBhXHJcbiAqIDxhIGhyZWY9XCJTb3VuZC5odG1sXCI+U291bmQ8L2E+IG9iamVjdC5cclxuICogSXQgY2FuIGhhbmRsZSBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqICgqLndhdiwgKi5tcDMpIGFzIGRhdGEgc291cmNlcy5cclxuICogPC9wPjxwPlxyXG4gKiBNdWx0aXBsZSBzb3VyY2VzIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gb25lIGF1ZGlvIGJ1ZmZlci5cclxuICogVGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgY3JlYXRpbmcgbXVsdGlwbGUgU291bmRXYXZlIG9iamVjdHMuXHJcbiAqIEl0J3MgbGlrZSBhIHdhdmV0YWJsZTogQWxsIHN0YXJ0L2VuZCBwb3NpdGlvbnMgd2lsbCBiZSBzYXZlZCBzb1xyXG4gKiB5b3UgY2FuIHRyaWdnZXIgdGhlIG9yaWdpbmFsIHNhbXBsZXMgd2l0aG91dCB1c2luZyBtdWx0aXBsZSBidWZmZXJzLlxyXG4gKiBQb3NzaWJsZSB1c2FnZXMgYXJlIG11bHRpc2FtcGxlZCBzb3VuZHMsIGxvb3BzIG9yIHdhdmVzZXF1ZW5jZXMgKGtpbmQgb2YpLlxyXG4gKiA8L3A+XHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlBsYXkgYSBzb3VuZCBmcm9tIGFuIGF1ZGlvIGZpbGU6PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnZmlsZS53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNvbmNhdGVuYXRlIG11bHRpcGxlIHNvdXJjZSBmaWxlcyBpbnRvIG9uZSBidWZmZXI8YnI+XHJcbiAqIGluIHRoZSBnaXZlbiBvcmRlciBhbmQgcGxheSB0aGVtIChUaGlzIGlzIGJyb2tlbiBpbiB2MC4xLiBEb24ndCB1c2UgaXQhKTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdmaWxlMS53YXYsZmlsZTIud2F2LGZpbGUzLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG5cclxuICB0aGlzLmFjID0gY29yZTsgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDsgICAvL0F1ZGlvQnVmZmVyXHJcbiAgdGhpcy5tZXRhRGF0YSA9IFtdOyAgIC8vc3RhcnQtL2VuZHBvaW50cyBhbmQgbGVuZ3RoIG9mIHNpbmdsZSB3YXZlc1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKGF1ZGlvU3JjKSB7XHJcbiAgICBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL29uZSBhdWRpbyBidWZmZXIgdG8gZGVjb2RlXHJcbiAgICAgIHRoaXMuZGVjb2RlQXVkaW9EYXRhKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiBhdWRpb1NyY1swXSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgYXVkaW8gYnVmZmVycyB0byBkZWNvZGUgYW5kIGNvbmNhdGVuYXRlXHJcbiAgICAgIHRoaXMuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyKGF1ZGlvU3JjKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPT09IC0xKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdGhpcy5sb2FkRmlsZShhdWRpb1NyYywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IHNlbGYuZGVjb2RlQXVkaW9EYXRhKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhdWRpb1NyYyA9PT0gJ3N0cmluZycgJiYgYXVkaW9TcmMuaW5kZXhPZignLCcpID4gLTEpIHtcclxuICAgICAgLy9tdWx0aXBsZSBmaWxlcyB0byBsb2FkL2RlY29kZSBhbmQgY2FuY2F0aW5hdGVcclxuICAgICAgdmFyIGJpbkJ1ZmZlcnMgPSB0aGlzLmxvYWRGaWxlcyhhdWRpb1NyYyk7XHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIoYmluQnVmZmVycywgdGhpcy5idWZmZXIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIFNvdW5kV2F2ZSBvYmplY3Q6IFVuc3VwcG9ydGVkIGRhdGEgZm9ybWF0Jyk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vc3RhcnQgdGhlIG9iamVjdCB3aXRoIGVtcHR5IGJ1ZmZlci4gVXNlZnVsbCBmb3IgdGVzdGluZyBhbmQgYWR2YW5jZWQgdXNhZ2UuXHJcbiAgfVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBiaW5hcnkgYXVkaW8gZGF0YSwgdHVybnMgaXQgaW50byBhbiBhdWRpbyBidWZmZXIgb2JqZWN0IGFuZFxyXG4gKiBzdG9yZXMgaXQgaW4gdGhpcy5idWZmZXIuXHJcbiAqIEJhc2ljYWxseSBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgW2Z1bmNdICAgICAgQ2FuIGJlIHVzZWQgdG8gcnVuIGNvZGUgaW5zaWRlIHRoZSBpbm5lciBkZWNvZGUgZnVuY3Rpb24uXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUHJvbWlzZSB0aGF0IGluZGljYXRlcyBpZiBvcGVyYXRpb24gd2FzIHN1Y2Nlc3NmdWxsLlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5kZWNvZGVBdWRpb0RhdGEgPSBmdW5jdGlvbihyYXdBdWRpb1NyYykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICByZXR1cm4gY29yZS5kZWNvZGVBdWRpb0RhdGEocmF3QXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgc2VsZi5idWZmZXIgPSBkZWNvZGVkO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbmNhdGVuYXRlcyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgdG8gYW4gQXVkaW9CdWZmZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBiaW5hcnlCdWZmZXJzICBBcnJheSBob2xkaW5nIG9uZSBvciBtb3JlIEFycmF5QnVmZmVyc1xyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYXVkaW9CdWZmZXIgICBBbiBleGlzdGluZyBBdWRpb0J1ZmZlciBvYmplY3RcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgICAgICAgVGhlIGNvbmNhdGVuYXRlZCBBdWRpb0J1ZmZlclxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihiaW5hcnlCdWZmZXJzLCBhdWRpb0J1ZmZlcikge1xyXG4gIGJpbmFyeUJ1ZmZlcnMuZm9yRWFjaChmdW5jdGlvbihiaW5CdWZmZXIpIHtcclxuICAgIHZhciB0bXBBdWRpb0J1ZmZlciA9IHRoaXMuZGVjb2RlQXVkaW9EYXRhKGJpbkJ1ZmZlcik7XHJcbiAgICB0aGlzLm1ldGFEYXRhLnB1c2godGhpcy5hZGRXYXZlTWV0YURhdGEoYXVkaW9CdWZmZXIsIHRtcEF1ZGlvQnVmZmVyKSk7XHJcbiAgICBhdWRpb0J1ZmZlciA9IHRoaXMuYXBwZW5kQXVkaW9CdWZmZXIoYXVkaW9CdWZmZXIsIHRtcEF1ZGlvQnVmZmVyKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIGF1ZGlvQnVmZmVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIFN1Z2dlc3RlZCBieSBDaHJpcyBXaWxzb246PGJyPlxyXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTQzNjUyL3dlYi1hdWRpby1hcGktYXBwZW5kLWNvbmNhdGVuYXRlLWRpZmZlcmVudC1hdWRpb2J1ZmZlcnMtYW5kLXBsYXktdGhlbS1hcy1vbmUtc29uXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIxIFRoZSBmaXJzdCBhdWRpbyBidWZmZXJcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjIgVGhlIHNlY29uZCBhdWRpbyBidWZmZXJcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgYnVmZmVyMSArIGJ1ZmZlcjJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYXBwZW5kQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihidWZmZXIxLCBidWZmZXIyKSB7XHJcbiAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgdmFyIHRtcCA9IGNvcmUuY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHMsXHJcbiAgICAoYnVmZmVyMS5sZW5ndGggKyBidWZmZXIyLmxlbmd0aCksXHJcbiAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZDaGFubmVsczsgaSsrKSB7XHJcbiAgICB2YXIgY2hhbm5lbCA9IHRtcC5nZXRDaGFubmVsRGF0YShpKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIyLmdldENoYW5uZWxEYXRhKGkpLCBidWZmZXIxLmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiB0bXA7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGRpY3Rpb25hcnkgd2l0aCBzdGFydC9zdG9wIHBvaW50cyBhbmQgbGVuZ3RoIGluIHNhbXBsZS1mcmFtZXNcclxuICogb2YgYW4gYXBwZW5kZWQgd2F2ZWZvcm0gYW5kIGFkZHMgaXQgdG8gdGhlIG1ldGFEYXRhIGFycmF5LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gZXhpc3RpbmdCdWZmZXIgVGhlICdvbGQnIGJ1ZmZlciB0aGF0IGdldHMgYXBwZW5kZWRcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IG5ld0J1ZmZlciAgICAgIFRoZSBidWZmZXIgdGhhdCBnZXRzIGFwcGVuZGVkXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBEaWN0aW9uYXJ5IHdpdGggc3RhcnQvc3RvcC9sZW5ndGggZGF0YVxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5hZGRXYXZlTWV0YURhdGEgPSBmdW5jdGlvbihleGlzdGluZ0J1ZmZlciwgbmV3QnVmZmVyKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBleGlzdGluZ0J1ZmZlci5sZW5ndGggKyAxLFxyXG4gICAgZW5kOiBleGlzdGluZ0J1ZmZlci5sZW5ndGggKyBuZXdCdWZmZXIubGVuZ3RoLFxyXG4gICAgbGVuZ3RoOiBuZXdCdWZmZXIubGVuZ3RoXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBhIGJpbmFyeSBmaWxlIGFuZCBjYWxscyBhIGZ1bmN0aW9uIHdpdGggdGhlXHJcbiAqIHJldHVybmVkIEFycmF5QnVmZmVyIGFzIGl0cyBhcmd1bWVudCB3aGVuIGRvbmUuXHJcbiAqIEB0b2RvICAgIFRlc3QgaW4gc3luY2hyb25vdXMgbW9kZSBvciByZW1vdmUgaXQgY29tcGxldGVseVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgZmlsZW5hbWUgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBvbmxvYWRDYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXHJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICBbYXN5bmM9dHJ1ZV0gICBBc3luY2hyb25vdXMgbG9hZGluZ1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgYXJyYXlCdWZmZXI7XHJcbiAqIHRoaXMubG9hZEZpbGUoJ2ZpbGUxLndhdicsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAqICAgYXJyYXlCdWZmZXIgPSByZXNwb25zZTtcclxuICogfSk7XHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlID0gZnVuY3Rpb24oZmlsZW5hbWUsIG9ubG9hZENhbGxiYWNrLCBhc3luYykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYXN5bmNocm9ub3VzbHkgPSB0cnVlO1xyXG4gIHZhciByZXF1ZXN0ID0gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpO1xyXG5cclxuICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgc2VsZi51cGRhdGVQcm9ncmVzcyk7XHJcbiAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgc2VsZi50cmFuc2ZlckNvbXBsZXRlKTtcclxuICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgc2VsZi50cmFuc2ZlckZhaWxlZCk7XHJcbiAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIHNlbGYudHJhbnNmZXJDYW5jZWxlZCk7XHJcblxyXG4gIGlmIChhc3luYykge1xyXG4gICAgYXN5bmNocm9ub3VzbHkgPSBhc3luYztcclxuICB9XHJcblxyXG4gIHJlcXVlc3Qub3BlbignR0VUJywgZmlsZW5hbWUsIGFzeW5jaHJvbm91c2x5KTtcclxuICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XHJcblxyXG4gIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBvbmxvYWRDYWxsYmFjayhyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICB9O1xyXG5cclxuICByZXF1ZXN0LnNlbmQoKTtcclxufTtcclxuXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUudXBkYXRlUHJvZ3Jlc3MgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS50cmFuc2ZlckNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XHJcblxyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS50cmFuc2ZlckZhaWxlZCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnRyYW5zZmVyQ2FuY2VsZWQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIGJpbmFyeSBmaWxlcyBhbmQgcmV0dXJucyBhbiBhcnJheVxyXG4gKiB3aXRoIHRoZSBkYXRhIGZyb20gdGhlIGZpbGVzIGluIHRoZSBnaXZlbiBvcmRlci5cclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgTGlzdCB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICBBcnJheSBvZiBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGVzID0gZnVuY3Rpb24oZmlsZW5hbWVzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBiaW5CdWZmZXJzID0gW107XHJcbiAgdmFyIG5hbWVzID0gZmlsZW5hbWVzLnNwbGl0KCcsJyk7XHJcbiAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBzZWxmLmxvYWRGaWxlKG5hbWUsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGJpbkJ1ZmZlcnNbbmFtZV0gPSByZXNwb25zZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdGhpcy5zb3J0QmluQnVmZmVycyhuYW1lcywgYmluQnVmZmVycyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU29ydCBBcnJheUJ1ZmZlcnMgdGhlIHNhbWUgb3JkZXIsIGxpa2UgdGhlIGZpbGVuYW1lXHJcbiAqIHBhcmFtZXRlcnMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzICBBcnJheSB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGJpbkJ1ZmZlcnMgQXJyYXkgd2l0aCBBcnJheUJ1ZmZlclxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQXJyYXkgd2l0aCBzb3J0ZWQgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnNvcnRCaW5CdWZmZXJzID0gZnVuY3Rpb24oZmlsZW5hbWVzLCBiaW5CdWZmZXJzKSB7XHJcbiAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoZnVuY3Rpb24oZWwpIHtcclxuICAgIHJldHVybiBiaW5CdWZmZXJzW2VsXTtcclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmRXYXZlO1xyXG4iLCIvKipcclxuICogVGhpcyBpcyB0aGUgZm91bmRhdGlvbiBvZiB0aGUgSW50ZXJtaXggbGlicmFyeS5cclxuICogSXQgc2ltcGx5IGNyZWF0ZXMgdGhlIGF1ZGlvIGNvbnRleHQgb2JqZWN0c1xyXG4gKiBhbmQgZXhwb3J0cyBpdCBzbyBpdCBjYW4gYmUgZWFzaWx5IGNvbnN1bWVkXHJcbiAqIGZyb20gYWxsIGNsYXNzZXMgb2YgdGhlIGxpYnJhcnkuXHJcbiAqXHJcbiAqIEByZXR1cm4ge0F1ZGlvQ29udGV4dH0gVGhlIEF1ZGlvQ29udGV4dCBvYmplY3RcclxuICpcclxuICogQHRvZG8gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqIEB0b2RvIENoZWNrIGZvciBtb2JpbGUvaU9TIGNvbXBhdGliaWxpdHkuXHJcbiAqIEB0b2RvIENoZWNrIGlmIHdlJ3JlIHJ1bm5pbmcgb24gbm9kZVxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5TdXNwZW5kIGFuZCByZXN1bWUgdGhlIGF1ZGlvIGNvbnRleHQgdG9cclxuICogY3JlYXRlIGEgcGF1c2UgYnV0dG9uLiBUaGlzIHNob3VsZCBiZSB1c2VkIHdpdGggY3JlYXRlQXVkaW9Xb3JrZXJcclxuICogYXMgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gd2hlbiBzdXNwZW5kIGlzIGNhbGxlZCBvbiBhbiBvZmZsaW5lIGF1ZGlvIGNvbnRleHQuXHJcbiAqIFlvdSBjYW4gYWxzbyBwYXVzZSBzaW5nbGUgc291bmRzIHdpdGggPGk+U291bmQucGF1c2UoKTwvaT4uXHJcbiAqIFBsZWFzZSByZWFkIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3N1c3BlbmRcIj50aGUgZGV2ZWxvcGVyIGRvY3MgYXQgTUROPC9hPlxyXG4gKiB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiB0aGlzLjwvY2FwdGlvbj5cclxuICogc3VzcmVzQnRuLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuICogICBpZihJbnRlcm1peC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XHJcbiAqICAgICBJbnRlcm1peC5zdXNwZW5kKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1Jlc3VtZSBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH0gZWxzZSBpZiAoSW50ZXJtaXguc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XHJcbiAqICAgICBJbnRlcm1peC5yZXN1bWUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnU3VzcGVuZCBjb250ZXh0JztcclxuICogICAgIH0pO1xyXG4gKiAgIH1cclxuICogfVxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGF1ZGlvQ3R4ID0gbnVsbDtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbiAgaWYgKHdpbmRvdy5BdWRpb0NvbnRleHQpIHtcclxuICAgIGF1ZGlvQ3R4ID0gbmV3IHdpbmRvdy5BdWRpb0NvbnRleHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZG5cXCd0IGluaXRpYWxpemUgdGhlIGF1ZGlvIGNvbnRleHQuJyk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXVkaW9DdHg7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBhYm91dCBqYXZhc2NyaXB0IGV2ZW50cyEgSXQncyBqdXN0XHJcbiAqIGEgZGVmaW5pdGlvbiBvZiB0aGUgZXZlbnRzIHRoYXQgdGhlIHNlcXVlbmNlciBjYW4gaGFuZGxlIHBsdXNcclxuICogc29tZSBmdW5jdGlvbnMgdG8gY3JlYXRlIHZhbGlkIGV2ZW50cy5cclxuICogVGhlIGNsYXNzIGRlZmluZXMgd2hpY2ggc3Vic3lzdGVtIGlzIGludm9rZWQgdG8gcHJvY2VzcyB0aGUgZXZlbnQuXHJcbiAqIEV2ZXJ5IGNsYXNzIGNhbiBoYXZlIHNldmVyYWwgdHlwZXMgYW5kIGEgdHlwZSBjb25zaXN0cyBvZiBvbmUgb3JcclxuICogbW9yZSBwcm9wZXJ0aWVzLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYSBub3RlIGV2ZW50IGZvciBhbiBhdWRpbyBvYmplY3Q8L2NhcHRpb24+XHJcbiAqIHZhciBub3RlID0gaW50ZXJtaXguZXZlbnRzLmNyZWF0ZUF1ZGlvTm90ZSgnYzMnLCA2NSwgMTI4LCBhU291bmRPYmplY3QpO1xyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgcHJvcGVydGllcyBpbiBvbmUgaGFuZHkgYXJyYXkuXHJcbiAqIEB0eXBlIHtBcnJheX1cclxuICovXHJcbnZhciBldlByb3AgPSBbXHJcbiAgJ2luc3RydW1lbnQnLCAvLyB0aGUgZXZlbnQgcmVjZWl2ZXJcclxuICAndG9uZScsICAgICAgIC8vIEludCBiZXR3ZWVuIDAgYW5kIDEyNyBiZWdpbm5pbmcgYXQgYzBcclxuICAnZHVyYXRpb24nLCAgIC8vIEludCByZXByZXNlbnRpbmcgYSBudW1iZXIgb2YgNjR0aCBub3Rlc1xyXG4gICd2ZWxvY2l0eScsICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAgJ3BpdGNoJyxcclxuICAndm9sdW1lJyxcclxuICAncGFuJ1xyXG5dO1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCB0eXBlcyBhbmQgdGhlIHByb3BlcnRpZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIFR5cGUgYXJlIHZhbGlkIHdpdGggb25lLCBzZXZlcmFsIG9yIGFsbCBvZiBpdHMgcHJvcGVydGllcy5cclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbnZhciBldlR5cGUgPSB7XHJcbiAgJ25vdGUnOiBbIGV2UHJvcFswXSwgZXZQcm9wWzFdLCBldlByb3BbMl0sIGV2UHJvcFszXSBdLFxyXG4gICdjb250cm9sJzogWyBldlByb3BbNF0sIGV2UHJvcFs1XSwgZXZQcm9wWzZdIF1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgY2xhc3NlcyBhbmQgdGhlIHR5cGVzIGFzc290aWF0ZWQgd2l0aCB0aGVtLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2Q2xhc3MgPSB7XHJcbiAgJ2F1ZGlvJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ3N5bnRoJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ2Z4JzogW10sXHJcbiAgJ21pZGknOiBbXSxcclxuICAnb3NjJzogW11cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIGNsYXNzIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlQ2xhc3MgRXZlbnQgY2xhc3NcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgY2xhc3MgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZUNsYXNzID0gZnVuY3Rpb24oZUNsYXNzKSB7XHJcbiAgaWYgKGV2Q2xhc3MuaGFzT3duUHJvcGVydHkoZUNsYXNzKSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSB0eXBlIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlVHlwZSBFdmVudCB0eXBlXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICB0cnVlIGlmIHR5cGUgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVR5cGUgPSBmdW5jdGlvbihlVHlwZSkge1xyXG4gIGlmIChldlR5cGUuaGFzT3duUHJvcGVydHkoZVR5cGUpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYW4gaW5zdHJ1bWVudCBpcyBhbiBvYmplY3QuXHJcbiAqIFRoaXMgaXMgYSBwb29ybHkgd2VhayB0ZXN0IGJ1dCB0aGF0J3NcclxuICogYWxsIHdlIGNhbiBkbyBoZXJlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGluc3RyIEFuIGluc3RydW1lbnQgb2JqZWN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgdHJ1ZSBpZiBpdCdzIGFuIG9iamVjdCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudCA9IGZ1bmN0aW9uKGluc3RyKSB7XHJcbiAgaWYgKHR5cGVvZiBpbnN0ciA9PT0gJ29iamVjdCcpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBpZiBhIHRvbmUgb3IgdmVsb2NpdHkgdmFsdWUgaXNcclxuICogYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDEyNy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7SW50fSAgdmFsdWUgICBUaGUgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyBhIHRvbmVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICBUcnVlIGlmIGl0cyBhIHZhbGlkIHRvbmUsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcFRvbmVWZWxvID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDEyNykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgZHVyYXRpb24gaXMgYSBwb3NpdGl2ZSBpbnRlZ2VyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIE51bWJlciByZXByZXNlbnRpbmcgbXVsdGlwbGUgNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgZHVyYXRpb24sIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcER1cmF0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgYW4gb2JqZWN0IG9mIGV2ZW50IHByb3BlcnRpZXMuXHJcbiAqIEl0IGNoZWNrcyB0aGUgcHJvcGVydGllcyBhcmUgdmFsaWQgZm9yIHRoZSBnaXZlbiB0eXBlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGVQcm9wcyAgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICAgRXZlbnQgdHlwZSB0byB2YWxpZGF0ZSBhZ2FpbnN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICB0cnVlIGlmIGFsbCBwcm9wcyBhcmUgdmFsaWQsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcHMgPSBmdW5jdGlvbihlUHJvcHMsIGVUeXBlKSB7XHJcbiAgdmFyIHR5cGUgPSBldlR5cGVbZVR5cGVdO1xyXG4gIGZvciAodmFyIGtleSBpbiBlUHJvcHMpICB7XHJcbiAgICBpZiAoZXZQcm9wLmluZGV4T2Yoa2V5KSA9PT0gLTEgJiZcclxuICAgIHR5cGUuaW5kZXhPZihrZXkpID09PSAtMSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGEgc3RyaW5nIG9mIHRoZSBmb3JtIGMzIG9yIGQjNCBhbmRcclxuICogcmV0dXJucyB0aGUgY29ycmVzcG9uZGluZyBudW1iZXIuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gdG9uZSBTdHJpbmcgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKiBAcmV0dXJuIHtJbnR9ICAgICAgICAgTnVtYmVyIHJlcHJlc2VudGluZyBhIG5vdGVcclxuICovXHJcbnZhciBjb252ZXJ0VG9uZSA9IGZ1bmN0aW9uKHRvbmUpIHtcclxuICB2YXIgbm90ZXMgPSBbJ2MnLCAnYyMnLCAnZCcsICdkIycsICdlJywgJ2YnLCAnZiMnLCAnZycsICdnIycsICdhJywgJ2EjJywgJ2InXTtcclxuICB2YXIgc3RyID0gdG9uZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICBpZiAoc3RyLm1hdGNoKC9eW2EtaF0jP1swLTldJC8pKSB7XHJcbiAgICB2YXIgbm90ZSA9IHN0ci5zdWJzdHJpbmcoMCwgc3RyLmxlbmd0aCAtIDEpO1xyXG4gICAgdmFyIG9jdCA9IHN0ci5zbGljZSgtMSk7XHJcblxyXG4gICAgaWYgKG5vdGUgPT09ICdoJykge1xyXG4gICAgICBub3RlID0gJ2InO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5vdGVzLmluZGV4T2Yobm90ZSkgKyBvY3QgKiAxMjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnZhbGlkIHN0cmluZy4gSGFzIHRvIGJlIGxpa2UgW2EtaF08Iz5bMC05XScpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgc2VxdWVuY2VyIGV2ZW50LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICBFdmVudCB0eXBlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzIE9iamVjdCB3aXRoIGV2ZW50IHByb3BlcnRpZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgU2VxdWVuY2VyIGV2ZW50XHJcbiAqL1xyXG52YXIgY3JlYXRlRXZlbnQgPSBmdW5jdGlvbihlQ2xhc3MsIGVUeXBlLCBlUHJvcHMpIHtcclxuICBpZiAodmFsaWRhdGVDbGFzcyhlQ2xhc3MpICYmXHJcbiAgICB2YWxpZGF0ZVR5cGUoZVR5cGUpICYmXHJcbiAgICB2YWxpZGF0ZVByb3BzKGVQcm9wcywgZVR5cGUpKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAnY2xhc3MnOiBlQ2xhc3MsXHJcbiAgICAgICd0eXBlJzogZVR5cGUsXHJcbiAgICAgICdwcm9wcyc6IGVQcm9wc1xyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY3JlYXRlIHNlcXVlbmNlciBldmVudC4gV3JvbmcgcGFyYW1ldGVycycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuIGF1ZGlvIG5vdGUgZXZlbnRcclxuICogQHBhcmFtICB7SW50fFN0cmluZ30gdG9uZSAgICAgVG9uZSBiZXR3ZWVuIDAgYW5kIDEyNyBvciBzdHJpbmcgKGMzLCBkIzQpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgICAgIHZlbG9jaXR5IFZlbG9jaXR5IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAqIEBwYXJhbSAge0ludH0gICAgICAgIGR1cmF0aW9uIER1cmF0aW9uIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgQWxsIHByb3BlcnRpZXMgaW4gb25lIG9iamVjdFxyXG4gKi9cclxudmFyIGNyZWF0ZUF1ZGlvTm90ZSA9IGZ1bmN0aW9uKHRvbmUsIHZlbG9jaXR5LCBkdXJhdGlvbiwgaW5zdHIpIHtcclxuICB2YXIgcHJvcHMgPSB7fTtcclxuICBpZiAodHlwZW9mIHRvbmUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICB0b25lID0gY29udmVydFRvbmUodG9uZSk7XHJcbiAgfVxyXG4gIGlmICh0b25lICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHRvbmUpKSB7XHJcbiAgICBwcm9wcy50b25lID0gdG9uZTtcclxuICB9XHJcbiAgaWYgKHZlbG9jaXR5ICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHZlbG9jaXR5KSkge1xyXG4gICAgcHJvcHMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcclxuICB9XHJcbiAgaWYgKGR1cmF0aW9uICYmIHZhbGlkYXRlUHJvcER1cmF0aW9uKGR1cmF0aW9uKSkge1xyXG4gICAgcHJvcHMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICB9XHJcbiAgaWYgKGluc3RyICYmIHZhbGlkYXRlUHJvcEluc3RydW1lbnQoaW5zdHIpKSB7XHJcbiAgICBwcm9wcy5pbnN0cnVtZW50ID0gaW5zdHI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQSBzZXF1ZW5jZXIgZXZlbnQgbXVzdCBoYXZlIGFuIGluc3RydW1lbnQgYXMgcHJvcGVydHknKTtcclxuICB9XHJcbiAgcmV0dXJuIGNyZWF0ZUV2ZW50KCdhdWRpbycsICdub3RlJywgcHJvcHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgY2xhc3M6IGV2Q2xhc3MsXHJcbiAgdHlwZTogZXZUeXBlLFxyXG4gIHByb3BlcnR5OiBldlByb3AsXHJcbiAgY3JlYXRlQXVkaW9Ob3RlOiBjcmVhdGVBdWRpb05vdGVcclxufTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgYSB3ZWJ3b3JrZXIgdGhhdCBwcm92aWRlcyBhIHRpbWVyXHJcbiAqIHRoYXQgZmlyZXMgdGhlIHNjaGVkdWxlciBmb3IgdGhlIHNlcXVlbmNlci5cclxuICogVGhpcyBpcyBiZWNhdXNlIHRpbWluZyBoZXJlIGlzICBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+SXQgaXMganVzdCBmb3IgbGlicmFyeSBpbnRlcm5hbFxyXG4gKiB1c2FnZS4gU2VlIFNlcXVlbmNlci5qcyBmb3IgZGV0YWlscy48L2NhcHRpb24+XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSh7ICdpbnRlcnZhbCc6IDIwMCB9KTtcclxuICogd29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICogd29ya2VyLnRlcm1pbmF0ZSgpOyAgLy93ZWJ3b3JrZXIgaW50ZXJuYWwgZnVuY3Rpb24sIGp1c3QgZm9yIGNvbXBsZXRlbmVzc1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRpbWVyID0gbnVsbDtcclxudmFyIGludGVydmFsID0gMTAwO1xyXG5cclxudmFyIHdvcmtlciA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAnc3RhcnQnKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhID09PSAnc3RvcCcpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4gICAgICBpbnRlcnZhbCA9IGUuZGF0YS5pbnRlcnZhbDtcclxuICAgICAgaWYgKHRpbWVyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtlcjtcclxuIl19
