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
/**
 * Part.js
 */
'use strict';

var Part = function(audioCtx, instrument, length) {
  this.audioCtx;
  this.instrument;
  this.resolution = 16;
  this.multiply = 4;
  this.length = 1;      //1 = one bar (4 beats)
  this.name = 'Part';
  this.data;
  this.pattern = [];
  this.monophonic = false; //probably futile
  this.zeroPoint = 0;

  if (audioCtx && instrument) {
    this.audioCtx = audioCtx;
    this.instrument = instrument;
    this.initPart();
  } else {
    throw new Error('Failed to initialize part. AudioCtx and/or instrument missing.');
  }

  if (length) {
    this.length = length;
  }

};

Part.prototype.initPart = function() {
  this.pattern = this.initPattern(this.length);
  //do we really need this? And, if yes, why?
  this.data = {
    'name': this.name,
    'instrument': this.instrument,
    'resolution': this.resolution,
    'pattern': this.pattern
  };
};

/**
 * initPattern: Initialize an empty pattern in this part
 * @param  {Float}  length  Length of the pattern mesured in bars
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
 * addEvent: adds an event to the pattern at a given position
 * @param  {Object} seqEvent  The event (note or controller)
 * @param  {Int}    position  Position in the pattern
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.addEvent = function(seqEvent, position) {
  if (position <= this.resolution) {
    var pos = (position - 1) * this.multiply;
    this.pattern[pos].push(seqEvent);
  }
  return this;
};

Part.prototype.removeEvent = function(position) {
  //removes all entries at a specific position.
  //this is not exactly what it should do.
  var pos = position * this.multiply;
  this.pattern[pos] = [];
};

/**
 * clearPattern: Delete all events in this part
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.clearPattern = function() {
  this.pattern = [];
  return this;
};

Part.prototype.getLength = function() {
  return this.pattern.length;
};

Part.prototype.getNotePositions = function() {
  var positions = [];
  this.pattern.forEach(function(el, index) {
    if (el.length > 0) {
      positions.push(index / this.multiply);
    }
  }, this);
  return positions;
};

Part.prototype.extendOnStart = function(pattern, extLength) {
  var entries = extLength * 64;
  var extension = this.initPattern(entries);
  return pattern.push.apply(extension, pattern);
};

Part.prototype.extendOnEnd = function(pattern, extLength) {
  var entries = extLength * 64;
  var extension = this.initPattern(entries);
  return pattern.push.apply(pattern, extension);
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

var Sound = function(audioCtx, soundBuffer) {

  this.audioCtx = null;
  this.buffer = null;
  this.queue = [];          //all currently active streams
  this.loop = false;
  this.isPaused = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.soundLength = 0;
  this.startOffset = 0;
  this.startTime = 0;
  this.loopStart = 0;
  this.loopEnd = null;

  if (soundBuffer && audioCtx) {
    this.audioCtx = audioCtx;
    this.buffer = soundBuffer;
    this.soundLength = this.loopEnd = soundBuffer.duration;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

Sound.prototype.setupAudioChain = function() {
  this.gainNode = this.audioCtx.createGain();
  this.pannerNode = this.audioCtx.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(this.audioCtx.destination);
  this.gainNode.gain.value = 1;
  console.log('audiochain ready');
};

Sound.prototype.createBufferSource = function() {
  var self = this;
  var bufferSource = this.audioCtx.createBufferSource();
  bufferSource.buffer = this.buffer;
  bufferSource.connect(this.gainNode);
  bufferSource.onended = function() {
    console.log('onended fired');
    self.destroyBufferSource(bufferSource);
  };
  return bufferSource;
};

Sound.prototype.destroyBufferSource = function(bsNode) {
  var self = this;
  bsNode.disconnect();
  this.queue.forEach(function(node, index) {
    if (node === bsNode) {
      self.queue.splice(index, 1);
    }
  });
  bsNode = null; //probably futile
  console.log('BufferSourceNode destroyed');
};

Sound.prototype.play = function(delay, playLooped) {
  var startTime = 0;

  if (delay) {
    console.log('set start time: ' + delay);
    startTime = delay;
  } else {
    startTime = this.audioCtx.currentTime;
  }
  var bs = this.createBufferSource();
  bs.loop = playLooped;

  // if (playLooped) {
  //   bs.loopStart = this.loopStart;
  //   bs.loopEnd = this.loopEnd;
  // }

  // if (this.startOffset === 0 || this.startOffset >= this.buffer.duration) {
  //   console.log('resetting starttime');
  //   this.startTime = this.audioCtx.currentTime;
  // }
  this.queue.push(bs);
  //bs.start(startTime, this.startOffset);
  bs.start(startTime);

  this.startOffset = 0;
};

Sound.prototype.stop = function(paused) {
  if (paused) { //this has to be rewritten since there could be multiple start times.
    this.startOffset = this.audioCtx.currentTime - this.startTime;
    this.paused = false;
  }
  if (this.queue.length > 0) {
    this.queue.forEach(function(node) {
      node.stop();
    });
  } else {
    //fail silently
  }
};

Sound.prototype.pause = function() {
  this.isPaused = true;
  this.stop(this.isPaused);
};

Sound.prototype.setLoopStart = function(value) {
  this.loopStart = value * this.soundLength;
  this.bufferSource.loopStart = this.loopStart;
};

Sound.prototype.setLoopEnd = function(value) {
  this.loopEnd = value * this.soundLength;
  this.bufferSource.loopEnd = this.loopEnd;
};

Sound.prototype.resetLoop = function() {
  this.loopStart = 0;
  this.loopEnd = this.soundLength;
};

Sound.prototype.setFrequency = function(freq) {
  this.bufferSource.playbackRate.value = freq;
};

Sound.prototype.getFrequency = function() {
  return this.bufferSource.playbackRate.value;
};

Sound.prototype.setTone = function(semiTone) {
  this.bufferSource.detune.value = semiTone * 100;
};

Sound.prototype.getTone = function() {
  return this.bufferSource.detune.value;
};

Sound.prototype.getUID = function() {
  return Math.random().toString().substr(2, 8);
};

module.exports = Sound;

},{}],6:[function(_dereq_,module,exports){
'use strict';

var SoundWave = function(audioCtx, binaryData, collection) {

  this.audioCtx = null;
  this.buffer = null;


  if (audioCtx) {
    this.audioCtx = audioCtx;
  } else {
    console.log('No AudioContext found');
  }

  var self = this;

  if (binaryData) {
    this.audioCtx.decodeAudioData(binaryData).then(function(decoded) {
      self.buffer = decoded;
      console.log('buffer created');
    });
  } else {
    //TODO: throw error
  }

  if (collection) {
    //TODO: put buffer into soundbank
  }

};

module.exports = SoundWave;

},{}],7:[function(_dereq_,module,exports){
/**
 * This simply creates the audio context objects
 * and exports it.
 *
 * TODO: - Should we do backwards-compatibility for older api-versions?
 *       - Check for mobile/iOS compatibility.
 *       - Check if we're running on node (and throw an error if so)
 */
'use strict';

var audioCtx = null;

(function() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if (window.AudioContext) {
    audioCtx = new window.AudioContext();
  } else {
    //TODO: throw error, probably surround with try/catch
  }

})();

module.exports = {
  audioCtx: audioCtx
};

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcblxyXG4vL0ludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciBJbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpIHx8IHt9O1xyXG5JbnRlcm1peC5Tb3VuZFdhdmUgPSByZXF1aXJlKCcuL1NvdW5kV2F2ZS5qcycpO1xyXG5JbnRlcm1peC5Tb3VuZCA9IHJlcXVpcmUoJy4vU291bmQuanMnKTtcclxuSW50ZXJtaXguU2VxdWVuY2VyID0gcmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKTtcclxuSW50ZXJtaXguUGFydCA9IHJlcXVpcmUoJy4vUGFydC5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcm1peDtcclxuIiwidmFyIGJ1bmRsZUZuID0gYXJndW1lbnRzWzNdO1xudmFyIHNvdXJjZXMgPSBhcmd1bWVudHNbNF07XG52YXIgY2FjaGUgPSBhcmd1bWVudHNbNV07XG5cbnZhciBzdHJpbmdpZnkgPSBKU09OLnN0cmluZ2lmeTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIHZhciB3a2V5O1xuICAgIHZhciBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgdmFyIGV4cCA9IGNhY2hlW2tleV0uZXhwb3J0cztcbiAgICAgICAgLy8gVXNpbmcgYmFiZWwgYXMgYSB0cmFuc3BpbGVyIHRvIHVzZSBlc21vZHVsZSwgdGhlIGV4cG9ydCB3aWxsIGFsd2F5c1xuICAgICAgICAvLyBiZSBhbiBvYmplY3Qgd2l0aCB0aGUgZGVmYXVsdCBleHBvcnQgYXMgYSBwcm9wZXJ0eSBvZiBpdC4gVG8gZW5zdXJlXG4gICAgICAgIC8vIHRoZSBleGlzdGluZyBhcGkgYW5kIGJhYmVsIGVzbW9kdWxlIGV4cG9ydHMgYXJlIGJvdGggc3VwcG9ydGVkIHdlXG4gICAgICAgIC8vIGNoZWNrIGZvciBib3RoXG4gICAgICAgIGlmIChleHAgPT09IGZuIHx8IGV4cC5kZWZhdWx0ID09PSBmbikge1xuICAgICAgICAgICAgd2tleSA9IGtleTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF3a2V5KSB7XG4gICAgICAgIHdrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgdmFyIHdjYWNoZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgICAgICB3Y2FjaGVba2V5XSA9IGtleTtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2VzW3drZXldID0gW1xuICAgICAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJywnbW9kdWxlJywnZXhwb3J0cyddLCAnKCcgKyBmbiArICcpKHNlbGYpJyksXG4gICAgICAgICAgICB3Y2FjaGVcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHNrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcblxuICAgIHZhciBzY2FjaGUgPSB7fTsgc2NhY2hlW3drZXldID0gd2tleTtcbiAgICBzb3VyY2VzW3NrZXldID0gW1xuICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnXSwgKFxuICAgICAgICAgICAgLy8gdHJ5IHRvIGNhbGwgZGVmYXVsdCBpZiBkZWZpbmVkIHRvIGFsc28gc3VwcG9ydCBiYWJlbCBlc21vZHVsZVxuICAgICAgICAgICAgLy8gZXhwb3J0c1xuICAgICAgICAgICAgJ3ZhciBmID0gcmVxdWlyZSgnICsgc3RyaW5naWZ5KHdrZXkpICsgJyk7JyArXG4gICAgICAgICAgICAnKGYuZGVmYXVsdCA/IGYuZGVmYXVsdCA6IGYpKHNlbGYpOydcbiAgICAgICAgKSksXG4gICAgICAgIHNjYWNoZVxuICAgIF07XG5cbiAgICB2YXIgc3JjID0gJygnICsgYnVuZGxlRm4gKyAnKSh7J1xuICAgICAgICArIE9iamVjdC5rZXlzKHNvdXJjZXMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5naWZ5KGtleSkgKyAnOlsnXG4gICAgICAgICAgICAgICAgKyBzb3VyY2VzW2tleV1bMF1cbiAgICAgICAgICAgICAgICArICcsJyArIHN0cmluZ2lmeShzb3VyY2VzW2tleV1bMV0pICsgJ10nXG4gICAgICAgICAgICA7XG4gICAgICAgIH0pLmpvaW4oJywnKVxuICAgICAgICArICd9LHt9LFsnICsgc3RyaW5naWZ5KHNrZXkpICsgJ10pJ1xuICAgIDtcblxuICAgIHZhciBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwgfHwgd2luZG93Lm1velVSTCB8fCB3aW5kb3cubXNVUkw7XG5cbiAgICByZXR1cm4gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKFxuICAgICAgICBuZXcgQmxvYihbc3JjXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KVxuICAgICkpO1xufTtcbiIsIi8qKlxyXG4gKiBQYXJ0LmpzXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUGFydCA9IGZ1bmN0aW9uKGF1ZGlvQ3R4LCBpbnN0cnVtZW50LCBsZW5ndGgpIHtcclxuICB0aGlzLmF1ZGlvQ3R4O1xyXG4gIHRoaXMuaW5zdHJ1bWVudDtcclxuICB0aGlzLnJlc29sdXRpb24gPSAxNjtcclxuICB0aGlzLm11bHRpcGx5ID0gNDtcclxuICB0aGlzLmxlbmd0aCA9IDE7ICAgICAgLy8xID0gb25lIGJhciAoNCBiZWF0cylcclxuICB0aGlzLm5hbWUgPSAnUGFydCc7XHJcbiAgdGhpcy5kYXRhO1xyXG4gIHRoaXMucGF0dGVybiA9IFtdO1xyXG4gIHRoaXMubW9ub3Bob25pYyA9IGZhbHNlOyAvL3Byb2JhYmx5IGZ1dGlsZVxyXG4gIHRoaXMuemVyb1BvaW50ID0gMDtcclxuXHJcbiAgaWYgKGF1ZGlvQ3R4ICYmIGluc3RydW1lbnQpIHtcclxuICAgIHRoaXMuYXVkaW9DdHggPSBhdWRpb0N0eDtcclxuICAgIHRoaXMuaW5zdHJ1bWVudCA9IGluc3RydW1lbnQ7XHJcbiAgICB0aGlzLmluaXRQYXJ0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGluaXRpYWxpemUgcGFydC4gQXVkaW9DdHggYW5kL29yIGluc3RydW1lbnQgbWlzc2luZy4nKTtcclxuICB9XHJcblxyXG4gIGlmIChsZW5ndGgpIHtcclxuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xyXG4gIH1cclxuXHJcbn07XHJcblxyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMuaW5pdFBhdHRlcm4odGhpcy5sZW5ndGgpO1xyXG4gIC8vZG8gd2UgcmVhbGx5IG5lZWQgdGhpcz8gQW5kLCBpZiB5ZXMsIHdoeT9cclxuICB0aGlzLmRhdGEgPSB7XHJcbiAgICAnbmFtZSc6IHRoaXMubmFtZSxcclxuICAgICdpbnN0cnVtZW50JzogdGhpcy5pbnN0cnVtZW50LFxyXG4gICAgJ3Jlc29sdXRpb24nOiB0aGlzLnJlc29sdXRpb24sXHJcbiAgICAncGF0dGVybic6IHRoaXMucGF0dGVyblxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogaW5pdFBhdHRlcm46IEluaXRpYWxpemUgYW4gZW1wdHkgcGF0dGVybiBpbiB0aGlzIHBhcnRcclxuICogQHBhcmFtICB7RmxvYXR9ICBsZW5ndGggIExlbmd0aCBvZiB0aGUgcGF0dGVybiBtZXN1cmVkIGluIGJhcnNcclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmluaXRQYXR0ZXJuID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcbiAgdmFyIHBhdHRlcm4gPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IChsZW5ndGggKiA2NCk7IGkrKykge1xyXG4gICAgcGF0dGVybltpXSA9IFtdO1xyXG4gIH1cclxuICByZXR1cm4gcGF0dGVybjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBhZGRFdmVudDogYWRkcyBhbiBldmVudCB0byB0aGUgcGF0dGVybiBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSBvciBjb250cm9sbGVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuYWRkRXZlbnQgPSBmdW5jdGlvbihzZXFFdmVudCwgcG9zaXRpb24pIHtcclxuICBpZiAocG9zaXRpb24gPD0gdGhpcy5yZXNvbHV0aW9uKSB7XHJcbiAgICB2YXIgcG9zID0gKHBvc2l0aW9uIC0gMSkgKiB0aGlzLm11bHRpcGx5O1xyXG4gICAgdGhpcy5wYXR0ZXJuW3Bvc10ucHVzaChzZXFFdmVudCk7XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gIC8vcmVtb3ZlcyBhbGwgZW50cmllcyBhdCBhIHNwZWNpZmljIHBvc2l0aW9uLlxyXG4gIC8vdGhpcyBpcyBub3QgZXhhY3RseSB3aGF0IGl0IHNob3VsZCBkby5cclxuICB2YXIgcG9zID0gcG9zaXRpb24gKiB0aGlzLm11bHRpcGx5O1xyXG4gIHRoaXMucGF0dGVybltwb3NdID0gW107XHJcbn07XHJcblxyXG4vKipcclxuICogY2xlYXJQYXR0ZXJuOiBEZWxldGUgYWxsIGV2ZW50cyBpbiB0aGlzIHBhcnRcclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmNsZWFyUGF0dGVybiA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucGF0dGVybiA9IFtdO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGF0dGVybi5sZW5ndGg7XHJcbn07XHJcblxyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGVsLCBpbmRleCkge1xyXG4gICAgaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgcG9zaXRpb25zLnB1c2goaW5kZXggLyB0aGlzLm11bHRpcGx5KTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25TdGFydCA9IGZ1bmN0aW9uKHBhdHRlcm4sIGV4dExlbmd0aCkge1xyXG4gIHZhciBlbnRyaWVzID0gZXh0TGVuZ3RoICogNjQ7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZW50cmllcyk7XHJcbiAgcmV0dXJuIHBhdHRlcm4ucHVzaC5hcHBseShleHRlbnNpb24sIHBhdHRlcm4pO1xyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25FbmQgPSBmdW5jdGlvbihwYXR0ZXJuLCBleHRMZW5ndGgpIHtcclxuICB2YXIgZW50cmllcyA9IGV4dExlbmd0aCAqIDY0O1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGVudHJpZXMpO1xyXG4gIHJldHVybiBwYXR0ZXJuLnB1c2guYXBwbHkocGF0dGVybiwgZXh0ZW5zaW9uKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFydDtcclxuIiwiLyoqXHJcbiAqIFNlcXVlbmNlclxyXG4gKlxyXG4gKiBTY2hlZHVsaW5nIGluc3BpcmVkIGJ5IFwiQSBUYWxlIG9mIFR3byBDbG9ja3NcIiBieSBDaHJpcyBXaWxzb246XHJcbiAqIGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2F1ZGlvL3NjaGVkdWxpbmcvXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgd29yayA9IHJlcXVpcmUoJ3dlYndvcmtpZnknKTtcclxuXHJcbnZhciBTZXF1ZW5jZXIgPSBmdW5jdGlvbihhdWRpb0N0eCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hdWRpb0N0eCA9IGF1ZGlvQ3R4O1xyXG4gIHRoaXMuYmVhdHNQZXJNaW51dGUgPSAxMjA7ICAvL2JlYXRzIHBlciBtaW51dGVcclxuICB0aGlzLnJlc29sdXRpb24gPSA2NDsgICAgICAgLy9zaG9ydGVzdCBwb3NzaWJsZSBub3RlLiBZb3Ugbm9ybWFsbHkgZG9uJ3Qgd2FudCB0byB0b3VjaCB0aGlzLlxyXG4gIHRoaXMuaW50ZXJ2YWwgPSAxMDA7ICAgICAgICAvL3RoZSBpbnRlcnZhbCBpbiBtaWxpc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGdldHMgaW52b2tlZC5cclxuICB0aGlzLmxvb2thaGVhZCA9IDAuMzsgICAgICAgLy90aW1lIGluIHNlY29uZHMgdGhlIHNjaGVkdWxlciBsb29rcyBhaGVhZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9zaG91bGQgYmUgbG9uZ2VyIHRoYW4gaW50ZXJ2YWwuXHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAgIC8vTGlzdCB3aXRoIGFsbCBwYXJ0cyBvZiB0aGUgc2NvcmVcclxuICB0aGlzLnJ1blF1ZXVlID0gW107ICAgICAgICAgLy9saXN0IHdpdGggcGFydHMgdGhhdCBhcmUgcGxheWluZyBvciB3aWxsIGJlIHBsYXllZCBzaG9ydGx5XHJcblxyXG4gIHRoaXMubm93OyAgICAgICAgICAgICAgICAgICAgLy90aW1lc3RhbXAgZnJvbSBhdWRpb2NvbnRleHQgd2hlbiB0aGUgc2NoZWR1bGVyIGlzIGludm9rZWQuXHJcbiAgdGhpcy50aW1lUGVyU3RlcDsgICAgICAgICAgIC8vcGVyaW9kIG9mIHRpbWUgYmV0d2VlbiB0d28gc3RlcHNcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7ICAgICAgLy90aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgbmV4dCBzdGVwIHdpbGwgYmUgdHJpZ2dlcmVkXHJcbiAgdGhpcy5uZXh0U3RlcCA9IDA7ICAgICAgICAgIC8vcG9zaXRpb24gaW4gdGhlIHF1ZXVlIHRoYXQgd2lsbCBnZXQgdHJpZ2dlcmVkIG5leHRcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gMDsgICAgLy9zdGVwIGluIHF1ZXVlIHRoYXQgd2FzIHBsYXllZCAobm90IHRyaWdnZXJlZCkgcmVjZW50bHkgKHVzZWQgZm9yIGRyYXdpbmcpLlxyXG4gIHRoaXMubG9vcCA9IGZhbHNlOyAgICAgICAgICAvL3BsYXkgYSBzZWN0aW9uIG9mIHRoZSBxdWV1ZSBpbiBhIGxvb3BcclxuICB0aGlzLmxvb3BTdGFydDsgICAgICAgICAgICAgLy9maXJzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5sb29wRW5kOyAgICAgICAgICAgICAgIC8vbGFzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTsgICAgIC8vdHJ1ZSBpZiBzZXF1ZW5jZXIgaXMgcnVubmluZywgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgdGhpcy5hbmltYXRpb25GcmFtZTsgICAgICAgIC8vaGFzIHRvIGJlIG92ZXJyaWRkZW4gd2l0aCBhIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBpbiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9kcmF3IGZ1bmN0aW9uIHdpdGggdGhlIGxhc3RQbGF5ZWRTdGVwIGludCBhcyBwYXJhbWV0ZXIuXHJcblxyXG4gIC8vIHNldCB0aW1lIHBlciBzZXRUaW1lUGVyU3RlcFxyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKHRoaXMuYmVhdHNQZXJNaW51dGUsIHRoaXMucmVzb2x1dGlvbik7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgdGhlIHNjaGVkdWxlci10aW1lclxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIgPSB3b3JrKHJlcXVpcmUoJy4vc2NoZWR1bGVXb3JrZXIuanMnKSk7XHJcblxyXG4gIC8qZXNsaW50LWVuYWJsZSAqL1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICd0aWNrJykge1xyXG4gICAgICBzZWxmLnNjaGVkdWxlcigpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoeydtZXNzYWdlJzogdGhpcy5pbnRlcnZhbH0pO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zY2hlZHVsZXIgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLm5vdyA9IHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWU7XHJcblxyXG4gIGlmICh0aGlzLm5leHRTdGVwVGltZSA9PT0gMCkge1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgPSB0aGlzLm5vdztcclxuICB9XHJcblxyXG4gIHdoaWxlICh0aGlzLm5leHRTdGVwVGltZSA8IHRoaXMubm93ICsgdGhpcy5sb29rYWhlYWQpIHtcclxuICAgIGlmICh0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdKSB7XHJcbiAgICAgIHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0uZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XHJcbiAgICAgICAgdGhpcy5ydW5RdWV1ZS5wdXNoKHtcclxuICAgICAgICAgICdpbnN0cnVtZW50JzogcGFydC5pbnN0cnVtZW50LFxyXG4gICAgICAgICAgJ3BhdHRlcm4nOiB0aGlzLmNvcHlBcnJheShwYXJ0LnBhdHRlcm4pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucnVuUXVldWUuZm9yRWFjaChmdW5jdGlvbihwYXJ0LCBpbmRleCkge1xyXG4gICAgICB2YXIgc2VxRXZlbnRzID0gcGFydC5wYXR0ZXJuLnNoaWZ0KCk7ICAvL3JldHVybiBmaXJzdCBlbGVtZW50IGFuZCByZW1vdmUgaXQgZnJvbSBwYXJ0XHJcbiAgICAgIGlmIChzZXFFdmVudHMpIHtcclxuICAgICAgICAvL3ZhciBpbnN0cnVtZW50ID0gcGFydC5pbnN0cnVtZW50O1xyXG4gICAgICAgIHNlcUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgICAgICAgICBpZiAoc2VxRXZlbnQubm90ZSkge1xyXG4gICAgICAgICAgICAvL1RPRE86IHNob3VsZCBiZSBleHRlbmRlZCB0byBwbGF5IHJlYWwgbm90ZXNcclxuICAgICAgICAgICAgcGFydC5pbnN0cnVtZW50LnBsYXkodGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChzZXFFdmVudC5jb250cm9sbGVyKSB7XHJcbiAgICAgICAgICAgIC8vIHByb2Nlc3MgY29udHJvbGxlciBldmVudDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvL3JlbW92ZSBwYXJ0IGZyb20gcnVuUXVldWUgaWYgZW1wdHlcclxuICAgICAgICAgIGlmIChwYXJ0LnBhdHRlcm4ubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucnVuUXVldWUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lICs9IHRoaXMudGltZVBlclN0ZXA7XHJcblxyXG4gICAgLy8gc2V0IHBvaW50ZXIgdG8gdGhlIG5leHQgc3RlcCBpbiB0aGUgcXVldWUgdGhhdCBzaG91bGQgYmUgcGxheWVkLlxyXG4gICAgLy8gSWYgd2UncmUgcGxheWluZyBpbiBsb29wIG1vZGUsIGp1bXAgYmFjayB0byBsb29wc3RhcnQgd2hlblxyXG4gICAgLy8gZW5kIG9mIGxvb3AgaXMgcmVhY2hlZC5cclxuICAgIGlmICh0aGlzLmxvb3ApIHtcclxuICAgICAgaWYgKHRoaXMubmV4dFN0ZXAgPj0gdGhpcy5sb29wRW5kKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0U3RlcCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgICAgIHRoaXMucnVuUXVldWUgPSBbXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubmV4dFN0ZXArKztcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RhcnQnKTtcclxuICB0aGlzLmlzUnVubmluZyA9IHRydWU7XHJcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcpO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gIHRoaXMucnVuUXVldWUgPSBbXTtcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gZmlyc3Qgd2UnbGwgaGF2ZSB0byBmaW5kIG91dCwgd2hhdCBzdGVwIHdhcyByZWNlbnRseSBwbGF5ZWQuXHJcbiAgLy8gdGhpcyBpcyBzb21laG93IGNsdW1zeSBiZWNhdXNlIHRoZSBzZXF1ZW5jZXIgZG9lc24ndCBrZWVwIHRyYWNrIG9mIHRoYXQuXHJcbiAgdmFyIGxvb2tBaGVhZERlbHRhID0gdGhpcy5uZXh0U3RlcFRpbWUgLSB0aGlzLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xyXG4gIHZhciBzdGVwc0FoZWFkID0gTWF0aC5mbG9vcihsb29rQWhlYWREZWx0YSAvIHRoaXMudGltZVBlclN0ZXApICsgMTtcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gdGhpcy5uZXh0U3RlcCAtIHN0ZXBzQWhlYWQ7XHJcblxyXG4gIC8vc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgdGhlIGFwcGxpY2F0aW9uXHJcbiAgdGhpcy5hbmltYXRpb25GcmFtZSh0aGlzLmxhc3RQbGF5ZWRTdGVwKTtcclxuXHJcbiAgaWYgKHRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdyk7XHJcbiAgfVxyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5hZGRQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAoIXRoaXMucXVldWVbcG9zaXRpb25dKSB7XHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXSA9IFtdO1xyXG4gIH1cclxuICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5wdXNoKHBhcnQpO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5jcmVhdGVOb3RlRXZlbnQgPSBmdW5jdGlvbihub3RlLCBsZW5ndGgpIHtcclxuICByZXR1cm4ge1xyXG4gICAgJ25vdGUnOiBub3RlLFxyXG4gICAgJ2xlbmd0aCc6IGxlbmd0aFxyXG4gIH07XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldFRpbWVQZXJTdGVwID0gZnVuY3Rpb24oYnBtLCByZXNvbHV0aW9uKSB7XHJcbiAgcmV0dXJuICg2MCAqIDQpIC8gKGJwbSAqIHJlc29sdXRpb24pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGNvcHlBcnJheTogTWFrZXMgYSBjb3B5IG9mIGEgZmxhdCBhcnJheS5cclxuICogXHRcdFx0XHRcdFx0VXNlcyBhIHByZS1hbGxvY2F0ZWQgd2hpbGUtbG9vcFxyXG4gKiBcdFx0XHRcdFx0XHR3aGljaCBzZWVtcyB0byBiZSB0aGUgZmFzdGVkIHdheVxyXG4gKiBcdFx0XHRcdFx0XHQoYnkgZmFyKSBvZiBkb2luZyB0aGlzOlxyXG4gKiBcdFx0XHRcdFx0XHRodHRwOi8vanNwZXJmLmNvbS9uZXctYXJyYXktdnMtc3BsaWNlLXZzLXNsaWNlLzExM1xyXG4gKiBAcGFyYW0gIHtBcnJheX0gc291cmNlQXJyYXkgQXJyYXkgdGhhdCBzaG91bGQgYmUgY29waWVkLlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgQ29weSBvZiB0aGUgc291cmNlIGFycmF5LlxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5jb3B5QXJyYXkgPSBmdW5jdGlvbihzb3VyY2VBcnJheSkge1xyXG4gIHZhciBkZXN0QXJyYXkgPSBuZXcgQXJyYXkoc291cmNlQXJyYXkubGVuZ3RoKTtcclxuICB2YXIgaSA9IHNvdXJjZUFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAoaS0tKSB7XHJcbiAgICBkZXN0QXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcclxuICB9XHJcbiAgcmV0dXJuIGRlc3RBcnJheTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VxdWVuY2VyO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU291bmQgPSBmdW5jdGlvbihhdWRpb0N0eCwgc291bmRCdWZmZXIpIHtcclxuXHJcbiAgdGhpcy5hdWRpb0N0eCA9IG51bGw7XHJcbiAgdGhpcy5idWZmZXIgPSBudWxsO1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBudWxsO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IG51bGw7XHJcblxyXG4gIHRoaXMuc291bmRMZW5ndGggPSAwO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDtcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gbnVsbDtcclxuXHJcbiAgaWYgKHNvdW5kQnVmZmVyICYmIGF1ZGlvQ3R4KSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IHNvdW5kQnVmZmVyO1xyXG4gICAgdGhpcy5zb3VuZExlbmd0aCA9IHRoaXMubG9vcEVuZCA9IHNvdW5kQnVmZmVyLmR1cmF0aW9uO1xyXG4gICAgdGhpcy5zZXR1cEF1ZGlvQ2hhaW4oKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgbWlzc2luZy4nKTtcclxuICB9XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QodGhpcy5hdWRpb0N0eC5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxuICBjb25zb2xlLmxvZygnYXVkaW9jaGFpbiByZWFkeScpO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYnVmZmVyU291cmNlID0gdGhpcy5hdWRpb0N0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICBidWZmZXJTb3VyY2UuYnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgYnVmZmVyU291cmNlLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XHJcbiAgYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKCdvbmVuZGVkIGZpcmVkJyk7XHJcbiAgICBzZWxmLmRlc3Ryb3lCdWZmZXJTb3VyY2UoYnVmZmVyU291cmNlKTtcclxuICB9O1xyXG4gIHJldHVybiBidWZmZXJTb3VyY2U7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuZGVzdHJveUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKGJzTm9kZSkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICBzZWxmLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgYnNOb2RlID0gbnVsbDsgLy9wcm9iYWJseSBmdXRpbGVcclxuICBjb25zb2xlLmxvZygnQnVmZmVyU291cmNlTm9kZSBkZXN0cm95ZWQnKTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24oZGVsYXksIHBsYXlMb29wZWQpIHtcclxuICB2YXIgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgaWYgKGRlbGF5KSB7XHJcbiAgICBjb25zb2xlLmxvZygnc2V0IHN0YXJ0IHRpbWU6ICcgKyBkZWxheSk7XHJcbiAgICBzdGFydFRpbWUgPSBkZWxheTtcclxuICB9IGVsc2Uge1xyXG4gICAgc3RhcnRUaW1lID0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuICB9XHJcbiAgdmFyIGJzID0gdGhpcy5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICBicy5sb29wID0gcGxheUxvb3BlZDtcclxuXHJcbiAgLy8gaWYgKHBsYXlMb29wZWQpIHtcclxuICAvLyAgIGJzLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gIC8vICAgYnMubG9vcEVuZCA9IHRoaXMubG9vcEVuZDtcclxuICAvLyB9XHJcblxyXG4gIC8vIGlmICh0aGlzLnN0YXJ0T2Zmc2V0ID09PSAwIHx8IHRoaXMuc3RhcnRPZmZzZXQgPj0gdGhpcy5idWZmZXIuZHVyYXRpb24pIHtcclxuICAvLyAgIGNvbnNvbGUubG9nKCdyZXNldHRpbmcgc3RhcnR0aW1lJyk7XHJcbiAgLy8gICB0aGlzLnN0YXJ0VGltZSA9IHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWU7XHJcbiAgLy8gfVxyXG4gIHRoaXMucXVldWUucHVzaChicyk7XHJcbiAgLy9icy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG4gIGJzLnN0YXJ0KHN0YXJ0VGltZSk7XHJcblxyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbihwYXVzZWQpIHtcclxuICBpZiAocGF1c2VkKSB7IC8vdGhpcyBoYXMgdG8gYmUgcmV3cml0dGVuIHNpbmNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIHN0YXJ0IHRpbWVzLlxyXG4gICAgdGhpcy5zdGFydE9mZnNldCA9IHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWUgLSB0aGlzLnN0YXJ0VGltZTtcclxuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XHJcbiAgfVxyXG4gIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgIG5vZGUuc3RvcCgpO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vZmFpbCBzaWxlbnRseVxyXG4gIH1cclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gIHRoaXMuc3RvcCh0aGlzLmlzUGF1c2VkKTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wU3RhcnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gdmFsdWUgKiB0aGlzLnNvdW5kTGVuZ3RoO1xyXG4gIHRoaXMuYnVmZmVyU291cmNlLmxvb3BTdGFydCA9IHRoaXMubG9vcFN0YXJ0O1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnNldExvb3BFbmQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcEVuZCA9IHZhbHVlICogdGhpcy5zb3VuZExlbmd0aDtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnJlc2V0TG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnNldEZyZXF1ZW5jeSA9IGZ1bmN0aW9uKGZyZXEpIHtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSBmcmVxO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmdldEZyZXF1ZW5jeSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUudmFsdWU7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0VG9uZSA9IGZ1bmN0aW9uKHNlbWlUb25lKSB7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2UuZGV0dW5lLnZhbHVlID0gc2VtaVRvbmUgKiAxMDA7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmJ1ZmZlclNvdXJjZS5kZXR1bmUudmFsdWU7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0VUlEID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zdWJzdHIoMiwgOCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU291bmRXYXZlID0gZnVuY3Rpb24oYXVkaW9DdHgsIGJpbmFyeURhdGEsIGNvbGxlY3Rpb24pIHtcclxuXHJcbiAgdGhpcy5hdWRpb0N0eCA9IG51bGw7XHJcbiAgdGhpcy5idWZmZXIgPSBudWxsO1xyXG5cclxuXHJcbiAgaWYgKGF1ZGlvQ3R4KSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKCdObyBBdWRpb0NvbnRleHQgZm91bmQnKTtcclxuICB9XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKGJpbmFyeURhdGEpIHtcclxuICAgIHRoaXMuYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKGJpbmFyeURhdGEpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdidWZmZXIgY3JlYXRlZCcpO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vVE9ETzogdGhyb3cgZXJyb3JcclxuICB9XHJcblxyXG4gIGlmIChjb2xsZWN0aW9uKSB7XHJcbiAgICAvL1RPRE86IHB1dCBidWZmZXIgaW50byBzb3VuZGJhbmtcclxuICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQuXHJcbiAqXHJcbiAqIFRPRE86IC0gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqICAgICAgIC0gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogICAgICAgLSBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGUgKGFuZCB0aHJvdyBhbiBlcnJvciBpZiBzbylcclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh3aW5kb3cuQXVkaW9Db250ZXh0KSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vVE9ETzogdGhyb3cgZXJyb3IsIHByb2JhYmx5IHN1cnJvdW5kIHdpdGggdHJ5L2NhdGNoXHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGF1ZGlvQ3R4OiBhdWRpb0N0eFxyXG59O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgbXVjaCBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICpcclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB0aW1lciA9IG51bGw7XHJcbnZhciBpbnRlcnZhbCA9IDEwMDtcclxuXHJcbnZhciB3b3JrZXIgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuICAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbiAgICAgIGlmICh0aW1lcikge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3b3JrZXI7XHJcblxyXG4vKmVzbGludC1kaXNhYmxlICovXHJcbi8vIHNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4vLyAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuLy8gICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7cG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbi8vICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4vLyAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbi8vICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuLy8gICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4vLyAgICAgaWYgKHRpbWVyKSB7XHJcbi8vICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4vLyAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3Bvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4vLyAgICAgfVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICBzZWxmLmNsb3NlKCk7XHJcbi8vIH07XHJcbiJdfQ==
