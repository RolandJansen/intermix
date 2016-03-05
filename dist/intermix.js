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

var core = _dereq_('./core.js');

/**
 * Creates a wrapper in which an audio buffer lives.
 * It can handle one or more ArrayBuffers or filenames
 * (*.wav, *.mp3) as data sources.
 * Multiple sources will be concatenated into one audio buffer.<br>
 * You normally shouldn't use any of the provided methods.
 * A SoundWave object just holds audio data and does nothing.
 * If you want to play the sound, you have to additionally create a Sound object.
 * @example <caption>Play a sound from an audio file:</caption>
 * var soundWave = new Intermix.SoundWave('file.wav');
 * var sound = new Intermix.Sound(soundWave.buffer);
 * sound.play;
 * @example <caption>concatenate multiple source files into one buffer<br>
 * in the given order and play them:</caption>
 * var soundWave = new Intermix.SoundWave('file1.wav,file2.wav,file3.wav');
 * var sound = new Intermix.Sound(soundWave.buffer);
 * sound.play;
 * @example <caption>
 * Using ArrayBuffers instead of filenames will come in handy if you want<br>
 * to have full control over XHR or use a preloader (here: preload.js):
 * </caption>
 * var queue = new createjs.LoadQueue();
 * queue.on('complete', handleComplete);
 * queue.loadManifest([{id: 'src1', src:'file1.wav', type:createjs.AbstractLoader.BINARY},
 *     {id:"src2", src:"file2.wav", type:createjs.AbstractLoader.BINARY}]);
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

  this.audioCtx = core.audioCtx;  //window.AudioContext
  this.buffer = null;             //AudioBuffer

  if (audioSrc) {
    if (audioSrc instanceof ArrayBuffer) {
      //one audio buffer to decode
      this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple audio buffers to decode and concatenate
      this.concatBinariesToAudioBuffer(audioSrc);
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') === 0) {
      //one file to load/decode
      var binBuffer;
      this.loadFile(audioSrc, function(response) {
        binBuffer = response;
      });
      this.buffer = this.decodeAudioData(binBuffer);
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') > -1) {
      //multiple files to load/decode and cancatinate
      var binBuffers = this.loadFiles(audioSrc);
      this.concatBinariesToAudioBuffer(binBuffers);
    }
  } else {
    throw new Error('Cannot create SoundWave object: Binary data missing.');
  }

};

/**
 * Takes binary audio data and turns it into an audio buffer object.
 * This is a wrapper for the web-audio-api decodeAudioData function.
 * @param  {ArrayBuffer} rawAudioSrc Audio data in raw binary format
 * @return {AudioBuffer}             Ready to use audio buffer
 */
SoundWave.prototype.decodeAudioData = function(rawAudioSrc) {
  return this.audioCtx.decodeAudioData(rawAudioSrc).then(function(decoded) {
    return decoded;
  });
};

/**
 * Concatenates one or more ArrayBuffers to an AudioBuffer.
 * @param  {Array} binaryBuffers  Array holding one or more ArrayBuffers
 * @param  {AudioBuffer} audioBuffer   An existing AudioBuffer object
 * @return {AudioBuffer}               The concatenated AudioBuffer
 */
SoundWave.prototype.concatBinariesToAudioBuffer = function(binaryBuffers, audioBuffer) {
  var self = this;

  binaryBuffers.forEach(function(binBuffer) {
    var tmpAudioBuffer = self.decodeAudioData(binBuffer);
    audioBuffer = self.appendAudioBuffer(self.Buffer, tmpAudioBuffer);
  });

  return audioBuffer;
};

/**
 * Appends two audio buffers. Suggested by Chris Wilson:
 * http://stackoverflow.com/questions/14143652/web-audio-api-append-concatenate-different-audiobuffers-and-play-them-as-one-son
 * @param  {AudioBuffer} buffer1 The first audio buffer
 * @param  {AudioBuffer} buffer2 The second audio buffer
 * @return {AudioBuffer}         buffer1 + buffer2
 */
SoundWave.prototype.appendAudioBuffer = function(buffer1, buffer2) {
  var numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
  var tmp = this.audioCtx.createBuffer(numberOfChannels,
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
 * Loads a binary file and calls a function with the
 * returned ArrayBuffer as its argument when done.
 * @param  {string}   filename       The file to be loaded
 * @param  {function} onloadCallback The function to be called
 * @param  {boolean}  [sync=true]   Asynchronous loading
 * @example
 * var arrayBuffer;
 * this.loadFile('file1.wav', function(response) {
 *   arrayBuffer = response;
 * });
 */
SoundWave.prototype.loadFile = function(filename, onloadCallback, sync) {
  var asynchronously = true;
  var request = new window.XMLHttpRequest();

  if (sync) {
    asynchronously = sync;
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
    binBuffers[el];
  });
};

module.exports = SoundWave;

},{"./core.js":7}],7:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy9JbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgSW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKSB8fCB7fTtcclxuSW50ZXJtaXguU291bmRXYXZlID0gcmVxdWlyZSgnLi9Tb3VuZFdhdmUuanMnKTtcclxuSW50ZXJtaXguU291bmQgPSByZXF1aXJlKCcuL1NvdW5kLmpzJyk7XHJcbkludGVybWl4LlNlcXVlbmNlciA9IHJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJyk7XHJcbkludGVybWl4LlBhcnQgPSByZXF1aXJlKCcuL1BhcnQuanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW50ZXJtaXg7XHJcbiIsInZhciBidW5kbGVGbiA9IGFyZ3VtZW50c1szXTtcbnZhciBzb3VyY2VzID0gYXJndW1lbnRzWzRdO1xudmFyIGNhY2hlID0gYXJndW1lbnRzWzVdO1xuXG52YXIgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIgd2tleTtcbiAgICB2YXIgY2FjaGVLZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIHZhciBleHAgPSBjYWNoZVtrZXldLmV4cG9ydHM7XG4gICAgICAgIC8vIFVzaW5nIGJhYmVsIGFzIGEgdHJhbnNwaWxlciB0byB1c2UgZXNtb2R1bGUsIHRoZSBleHBvcnQgd2lsbCBhbHdheXNcbiAgICAgICAgLy8gYmUgYW4gb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgZXhwb3J0IGFzIGEgcHJvcGVydHkgb2YgaXQuIFRvIGVuc3VyZVxuICAgICAgICAvLyB0aGUgZXhpc3RpbmcgYXBpIGFuZCBiYWJlbCBlc21vZHVsZSBleHBvcnRzIGFyZSBib3RoIHN1cHBvcnRlZCB3ZVxuICAgICAgICAvLyBjaGVjayBmb3IgYm90aFxuICAgICAgICBpZiAoZXhwID09PSBmbiB8fCBleHAuZGVmYXVsdCA9PT0gZm4pIHtcbiAgICAgICAgICAgIHdrZXkgPSBrZXk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghd2tleSkge1xuICAgICAgICB3a2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgICAgIHZhciB3Y2FjaGUgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICAgICAgd2NhY2hlW2tleV0gPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlc1t3a2V5XSA9IFtcbiAgICAgICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZScsJ21vZHVsZScsJ2V4cG9ydHMnXSwgJygnICsgZm4gKyAnKShzZWxmKScpLFxuICAgICAgICAgICAgd2NhY2hlXG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBza2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG5cbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sIChcbiAgICAgICAgICAgIC8vIHRyeSB0byBjYWxsIGRlZmF1bHQgaWYgZGVmaW5lZCB0byBhbHNvIHN1cHBvcnQgYmFiZWwgZXNtb2R1bGVcbiAgICAgICAgICAgIC8vIGV4cG9ydHNcbiAgICAgICAgICAgICd2YXIgZiA9IHJlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpOycgK1xuICAgICAgICAgICAgJyhmLmRlZmF1bHQgPyBmLmRlZmF1bHQgOiBmKShzZWxmKTsnXG4gICAgICAgICkpLFxuICAgICAgICBzY2FjaGVcbiAgICBdO1xuXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICA7XG5cbiAgICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgICAgbmV3IEJsb2IoW3NyY10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSlcbiAgICApKTtcbn07XG4iLCIvKipcclxuICogUGFydC5qc1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhcnQgPSBmdW5jdGlvbihhdWRpb0N0eCwgaW5zdHJ1bWVudCwgbGVuZ3RoKSB7XHJcbiAgdGhpcy5hdWRpb0N0eDtcclxuICB0aGlzLmluc3RydW1lbnQ7XHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gMTY7XHJcbiAgdGhpcy5tdWx0aXBseSA9IDQ7XHJcbiAgdGhpcy5sZW5ndGggPSAxOyAgICAgIC8vMSA9IG9uZSBiYXIgKDQgYmVhdHMpXHJcbiAgdGhpcy5uYW1lID0gJ1BhcnQnO1xyXG4gIHRoaXMuZGF0YTtcclxuICB0aGlzLnBhdHRlcm4gPSBbXTtcclxuICB0aGlzLm1vbm9waG9uaWMgPSBmYWxzZTsgLy9wcm9iYWJseSBmdXRpbGVcclxuICB0aGlzLnplcm9Qb2ludCA9IDA7XHJcblxyXG4gIGlmIChhdWRpb0N0eCAmJiBpbnN0cnVtZW50KSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgICB0aGlzLmluc3RydW1lbnQgPSBpbnN0cnVtZW50O1xyXG4gICAgdGhpcy5pbml0UGFydCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIHBhcnQuIEF1ZGlvQ3R4IGFuZC9vciBpbnN0cnVtZW50IG1pc3NpbmcuJyk7XHJcbiAgfVxyXG5cclxuICBpZiAobGVuZ3RoKSB7XHJcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICB9XHJcblxyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhcnQgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLmluaXRQYXR0ZXJuKHRoaXMubGVuZ3RoKTtcclxuICAvL2RvIHdlIHJlYWxseSBuZWVkIHRoaXM/IEFuZCwgaWYgeWVzLCB3aHk/XHJcbiAgdGhpcy5kYXRhID0ge1xyXG4gICAgJ25hbWUnOiB0aGlzLm5hbWUsXHJcbiAgICAnaW5zdHJ1bWVudCc6IHRoaXMuaW5zdHJ1bWVudCxcclxuICAgICdyZXNvbHV0aW9uJzogdGhpcy5yZXNvbHV0aW9uLFxyXG4gICAgJ3BhdHRlcm4nOiB0aGlzLnBhdHRlcm5cclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGluaXRQYXR0ZXJuOiBJbml0aWFsaXplIGFuIGVtcHR5IHBhdHRlcm4gaW4gdGhpcyBwYXJ0XHJcbiAqIEBwYXJhbSAge0Zsb2F0fSAgbGVuZ3RoICBMZW5ndGggb2YgdGhlIHBhdHRlcm4gbWVzdXJlZCBpbiBiYXJzXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGF0dGVybiA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gIHZhciBwYXR0ZXJuID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAobGVuZ3RoICogNjQpOyBpKyspIHtcclxuICAgIHBhdHRlcm5baV0gPSBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHBhdHRlcm47XHJcbn07XHJcblxyXG4vKipcclxuICogYWRkRXZlbnQ6IGFkZHMgYW4gZXZlbnQgdG8gdGhlIHBhdHRlcm4gYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUgb3IgY29udHJvbGxlcilcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIHBhdHRlcm5cclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24oc2VxRXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBvc2l0aW9uIDw9IHRoaXMucmVzb2x1dGlvbikge1xyXG4gICAgdmFyIHBvcyA9IChwb3NpdGlvbiAtIDEpICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAvL3JlbW92ZXMgYWxsIGVudHJpZXMgYXQgYSBzcGVjaWZpYyBwb3NpdGlvbi5cclxuICAvL3RoaXMgaXMgbm90IGV4YWN0bHkgd2hhdCBpdCBzaG91bGQgZG8uXHJcbiAgdmFyIHBvcyA9IHBvc2l0aW9uICogdGhpcy5tdWx0aXBseTtcclxuICB0aGlzLnBhdHRlcm5bcG9zXSA9IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGNsZWFyUGF0dGVybjogRGVsZXRlIGFsbCBldmVudHMgaW4gdGhpcyBwYXJ0XHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5jbGVhclBhdHRlcm4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnBhdHRlcm4gPSBbXTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBhdHRlcm4ubGVuZ3RoO1xyXG59O1xyXG5cclxuUGFydC5wcm90b3R5cGUuZ2V0Tm90ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwb3NpdGlvbnMgPSBbXTtcclxuICB0aGlzLnBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbihlbCwgaW5kZXgpIHtcclxuICAgIGlmIChlbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHBvc2l0aW9ucy5wdXNoKGluZGV4IC8gdGhpcy5tdWx0aXBseSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbiAgcmV0dXJuIHBvc2l0aW9ucztcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uU3RhcnQgPSBmdW5jdGlvbihwYXR0ZXJuLCBleHRMZW5ndGgpIHtcclxuICB2YXIgZW50cmllcyA9IGV4dExlbmd0aCAqIDY0O1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGVudHJpZXMpO1xyXG4gIHJldHVybiBwYXR0ZXJuLnB1c2guYXBwbHkoZXh0ZW5zaW9uLCBwYXR0ZXJuKTtcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24ocGF0dGVybiwgZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGVudHJpZXMgPSBleHRMZW5ndGggKiA2NDtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihlbnRyaWVzKTtcclxuICByZXR1cm4gcGF0dGVybi5wdXNoLmFwcGx5KHBhdHRlcm4sIGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIi8qKlxyXG4gKiBTZXF1ZW5jZXJcclxuICpcclxuICogU2NoZWR1bGluZyBpbnNwaXJlZCBieSBcIkEgVGFsZSBvZiBUd28gQ2xvY2tzXCIgYnkgQ2hyaXMgV2lsc29uOlxyXG4gKiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9hdWRpby9zY2hlZHVsaW5nL1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHdvcmsgPSByZXF1aXJlKCd3ZWJ3b3JraWZ5Jyk7XHJcblxyXG52YXIgU2VxdWVuY2VyID0gZnVuY3Rpb24oYXVkaW9DdHgpIHtcclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuYXVkaW9DdHggPSBhdWRpb0N0eDtcclxuICB0aGlzLmJlYXRzUGVyTWludXRlID0gMTIwOyAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5RdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLm5vdzsgICAgICAgICAgICAgICAgICAgIC8vdGltZXN0YW1wIGZyb20gYXVkaW9jb250ZXh0IHdoZW4gdGhlIHNjaGVkdWxlciBpcyBpbnZva2VkLlxyXG4gIHRoaXMudGltZVBlclN0ZXA7ICAgICAgICAgICAvL3BlcmlvZCBvZiB0aW1lIGJldHdlZW4gdHdvIHN0ZXBzXHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwOyAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIG5leHQgc3RlcCB3aWxsIGJlIHRyaWdnZXJlZFxyXG4gIHRoaXMubmV4dFN0ZXAgPSAwOyAgICAgICAgICAvL3Bvc2l0aW9uIGluIHRoZSBxdWV1ZSB0aGF0IHdpbGwgZ2V0IHRyaWdnZXJlZCBuZXh0XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IDA7ICAgIC8vc3RlcCBpbiBxdWV1ZSB0aGF0IHdhcyBwbGF5ZWQgKG5vdCB0cmlnZ2VyZWQpIHJlY2VudGx5ICh1c2VkIGZvciBkcmF3aW5nKS5cclxuICB0aGlzLmxvb3AgPSBmYWxzZTsgICAgICAgICAgLy9wbGF5IGEgc2VjdGlvbiBvZiB0aGUgcXVldWUgaW4gYSBsb29wXHJcbiAgdGhpcy5sb29wU3RhcnQ7ICAgICAgICAgICAgIC8vZmlyc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMubG9vcEVuZDsgICAgICAgICAgICAgICAvL2xhc3Qgc3RlcCBvZiB0aGUgbG9vcFxyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7ICAgICAvL3RydWUgaWYgc2VxdWVuY2VyIGlzIHJ1bm5pbmcsIG90aGVyd2lzZSBmYWxzZVxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWU7ICAgICAgICAvL2hhcyB0byBiZSBvdmVycmlkZGVuIHdpdGggYSBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgaW4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJhdyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0UGxheWVkU3RlcCBpbnQgYXMgcGFyYW1ldGVyLlxyXG5cclxuICAvLyBzZXQgdGltZSBwZXIgc2V0VGltZVBlclN0ZXBcclxuICB0aGlzLnRpbWVQZXJTdGVwID0gdGhpcy5zZXRUaW1lUGVyU3RlcCh0aGlzLmJlYXRzUGVyTWludXRlLCB0aGlzLnJlc29sdXRpb24pO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBzY2hlZHVsZXItdGltZXJcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyID0gd29yayhyZXF1aXJlKCcuL3NjaGVkdWxlV29ya2VyLmpzJykpO1xyXG5cclxuICAvKmVzbGludC1lbmFibGUgKi9cclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAndGljaycpIHtcclxuICAgICAgc2VsZi5zY2hlZHVsZXIoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKHsnbWVzc2FnZSc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5ub3cgPSB0aGlzLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xyXG5cclxuICBpZiAodGhpcy5uZXh0U3RlcFRpbWUgPT09IDApIHtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lID0gdGhpcy5ub3c7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAodGhpcy5uZXh0U3RlcFRpbWUgPCB0aGlzLm5vdyArIHRoaXMubG9va2FoZWFkKSB7XHJcbiAgICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXSkge1xyXG4gICAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICAgIHRoaXMucnVuUXVldWUucHVzaCh7XHJcbiAgICAgICAgICAnaW5zdHJ1bWVudCc6IHBhcnQuaW5zdHJ1bWVudCxcclxuICAgICAgICAgICdwYXR0ZXJuJzogdGhpcy5jb3B5QXJyYXkocGFydC5wYXR0ZXJuKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJ1blF1ZXVlLmZvckVhY2goZnVuY3Rpb24ocGFydCwgaW5kZXgpIHtcclxuICAgICAgdmFyIHNlcUV2ZW50cyA9IHBhcnQucGF0dGVybi5zaGlmdCgpOyAgLy9yZXR1cm4gZmlyc3QgZWxlbWVudCBhbmQgcmVtb3ZlIGl0IGZyb20gcGFydFxyXG4gICAgICBpZiAoc2VxRXZlbnRzKSB7XHJcbiAgICAgICAgLy92YXIgaW5zdHJ1bWVudCA9IHBhcnQuaW5zdHJ1bWVudDtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgaWYgKHNlcUV2ZW50Lm5vdGUpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBzaG91bGQgYmUgZXh0ZW5kZWQgdG8gcGxheSByZWFsIG5vdGVzXHJcbiAgICAgICAgICAgIHBhcnQuaW5zdHJ1bWVudC5wbGF5KHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoc2VxRXZlbnQuY29udHJvbGxlcikge1xyXG4gICAgICAgICAgICAvLyBwcm9jZXNzIGNvbnRyb2xsZXIgZXZlbnQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9yZW1vdmUgcGFydCBmcm9tIHJ1blF1ZXVlIGlmIGVtcHR5XHJcbiAgICAgICAgICBpZiAocGFydC5wYXR0ZXJuLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJ1blF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSArPSB0aGlzLnRpbWVQZXJTdGVwO1xyXG5cclxuICAgIC8vIHNldCBwb2ludGVyIHRvIHRoZSBuZXh0IHN0ZXAgaW4gdGhlIHF1ZXVlIHRoYXQgc2hvdWxkIGJlIHBsYXllZC5cclxuICAgIC8vIElmIHdlJ3JlIHBsYXlpbmcgaW4gbG9vcCBtb2RlLCBqdW1wIGJhY2sgdG8gbG9vcHN0YXJ0IHdoZW5cclxuICAgIC8vIGVuZCBvZiBsb29wIGlzIHJlYWNoZWQuXHJcbiAgICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICAgIGlmICh0aGlzLm5leHRTdGVwID49IHRoaXMubG9vcEVuZCkge1xyXG4gICAgICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgICAgICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSB0cnVlO1xyXG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIGZpcnN0IHdlJ2xsIGhhdmUgdG8gZmluZCBvdXQsIHdoYXQgc3RlcCB3YXMgcmVjZW50bHkgcGxheWVkLlxyXG4gIC8vIHRoaXMgaXMgc29tZWhvdyBjbHVtc3kgYmVjYXVzZSB0aGUgc2VxdWVuY2VyIGRvZXNuJ3Qga2VlcCB0cmFjayBvZiB0aGF0LlxyXG4gIHZhciBsb29rQWhlYWREZWx0YSA9IHRoaXMubmV4dFN0ZXBUaW1lIC0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuICB2YXIgc3RlcHNBaGVhZCA9IE1hdGguZmxvb3IobG9va0FoZWFkRGVsdGEgLyB0aGlzLnRpbWVQZXJTdGVwKSArIDE7XHJcbiAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG5cclxuICAvL3Nob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHRoZSBhcHBsaWNhdGlvblxyXG4gIHRoaXMuYW5pbWF0aW9uRnJhbWUodGhpcy5sYXN0UGxheWVkU3RlcCk7XHJcblxyXG4gIGlmICh0aGlzLmlzUnVubmluZykge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuYWRkUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKCF0aGlzLnF1ZXVlW3Bvc2l0aW9uXSkge1xyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICB9XHJcbiAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ucHVzaChwYXJ0KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY3JlYXRlTm90ZUV2ZW50ID0gZnVuY3Rpb24obm90ZSwgbGVuZ3RoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICdub3RlJzogbm90ZSxcclxuICAgICdsZW5ndGgnOiBsZW5ndGhcclxuICB9O1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjb3B5QXJyYXk6IE1ha2VzIGEgY29weSBvZiBhIGZsYXQgYXJyYXkuXHJcbiAqIFx0XHRcdFx0XHRcdFVzZXMgYSBwcmUtYWxsb2NhdGVkIHdoaWxlLWxvb3BcclxuICogXHRcdFx0XHRcdFx0d2hpY2ggc2VlbXMgdG8gYmUgdGhlIGZhc3RlZCB3YXlcclxuICogXHRcdFx0XHRcdFx0KGJ5IGZhcikgb2YgZG9pbmcgdGhpczpcclxuICogXHRcdFx0XHRcdFx0aHR0cDovL2pzcGVyZi5jb20vbmV3LWFycmF5LXZzLXNwbGljZS12cy1zbGljZS8xMTNcclxuICogQHBhcmFtICB7QXJyYXl9IHNvdXJjZUFycmF5IEFycmF5IHRoYXQgc2hvdWxkIGJlIGNvcGllZC5cclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgIENvcHkgb2YgdGhlIHNvdXJjZSBhcnJheS5cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuY29weUFycmF5ID0gZnVuY3Rpb24oc291cmNlQXJyYXkpIHtcclxuICB2YXIgZGVzdEFycmF5ID0gbmV3IEFycmF5KHNvdXJjZUFycmF5Lmxlbmd0aCk7XHJcbiAgdmFyIGkgPSBzb3VyY2VBcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGktLSkge1xyXG4gICAgZGVzdEFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XHJcbiAgfVxyXG4gIHJldHVybiBkZXN0QXJyYXk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcXVlbmNlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oYXVkaW9DdHgsIHNvdW5kQnVmZmVyKSB7XHJcblxyXG4gIHRoaXMuYXVkaW9DdHggPSBudWxsO1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgIC8vYWxsIGN1cnJlbnRseSBhY3RpdmUgc3RyZWFtc1xyXG4gIHRoaXMubG9vcCA9IGZhbHNlO1xyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICB0aGlzLmdhaW5Ob2RlID0gbnVsbDtcclxuICB0aGlzLnBhbm5lck5vZGUgPSBudWxsO1xyXG5cclxuICB0aGlzLnNvdW5kTGVuZ3RoID0gMDtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxuICB0aGlzLnN0YXJ0VGltZSA9IDA7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IG51bGw7XHJcblxyXG4gIGlmIChzb3VuZEJ1ZmZlciAmJiBhdWRpb0N0eCkge1xyXG4gICAgdGhpcy5hdWRpb0N0eCA9IGF1ZGlvQ3R4O1xyXG4gICAgdGhpcy5idWZmZXIgPSBzb3VuZEJ1ZmZlcjtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSBzb3VuZEJ1ZmZlci5kdXJhdGlvbjtcclxuICAgIHRoaXMuc2V0dXBBdWRpb0NoYWluKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgaW5pdGlhbGlzaW5nIFNvdW5kIG9iamVjdDogcGFyYW1ldGVyIG1pc3NpbmcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnNldHVwQXVkaW9DaGFpbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSB0aGlzLmF1ZGlvQ3R4LmNyZWF0ZUdhaW4oKTtcclxuICB0aGlzLnBhbm5lck5vZGUgPSB0aGlzLmF1ZGlvQ3R4LmNyZWF0ZVN0ZXJlb1Bhbm5lcigpO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLnBhbm5lck5vZGUpO1xyXG4gIHRoaXMucGFubmVyTm9kZS5jb25uZWN0KHRoaXMuYXVkaW9DdHguZGVzdGluYXRpb24pO1xyXG4gIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDE7XHJcbiAgY29uc29sZS5sb2coJ2F1ZGlvY2hhaW4gcmVhZHknKTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJ1ZmZlclNvdXJjZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xyXG4gIGJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIGJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmxvZygnb25lbmRlZCBmaXJlZCcpO1xyXG4gICAgc2VsZi5kZXN0cm95QnVmZmVyU291cmNlKGJ1ZmZlclNvdXJjZSk7XHJcbiAgfTtcclxuICByZXR1cm4gYnVmZmVyU291cmNlO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgYnNOb2RlLmRpc2Nvbm5lY3QoKTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcclxuICAgIGlmIChub2RlID09PSBic05vZGUpIHtcclxuICAgICAgc2VsZi5xdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIGJzTm9kZSA9IG51bGw7IC8vcHJvYmFibHkgZnV0aWxlXHJcbiAgY29uc29sZS5sb2coJ0J1ZmZlclNvdXJjZU5vZGUgZGVzdHJveWVkJyk7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uKGRlbGF5LCBwbGF5TG9vcGVkKSB7XHJcbiAgdmFyIHN0YXJ0VGltZSA9IDA7XHJcblxyXG4gIGlmIChkZWxheSkge1xyXG4gICAgY29uc29sZS5sb2coJ3NldCBzdGFydCB0aW1lOiAnICsgZGVsYXkpO1xyXG4gICAgc3RhcnRUaW1lID0gZGVsYXk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHN0YXJ0VGltZSA9IHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWU7XHJcbiAgfVxyXG4gIHZhciBicyA9IHRoaXMuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgYnMubG9vcCA9IHBsYXlMb29wZWQ7XHJcblxyXG4gIC8vIGlmIChwbGF5TG9vcGVkKSB7XHJcbiAgLy8gICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAvLyAgIGJzLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbiAgLy8gfVxyXG5cclxuICAvLyBpZiAodGhpcy5zdGFydE9mZnNldCA9PT0gMCB8fCB0aGlzLnN0YXJ0T2Zmc2V0ID49IHRoaXMuYnVmZmVyLmR1cmF0aW9uKSB7XHJcbiAgLy8gICBjb25zb2xlLmxvZygncmVzZXR0aW5nIHN0YXJ0dGltZScpO1xyXG4gIC8vICAgdGhpcy5zdGFydFRpbWUgPSB0aGlzLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xyXG4gIC8vIH1cclxuICB0aGlzLnF1ZXVlLnB1c2goYnMpO1xyXG4gIC8vYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICBicy5zdGFydChzdGFydFRpbWUpO1xyXG5cclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24ocGF1c2VkKSB7XHJcbiAgaWYgKHBhdXNlZCkgeyAvL3RoaXMgaGFzIHRvIGJlIHJld3JpdHRlbiBzaW5jZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBzdGFydCB0aW1lcy5cclxuICAgIHRoaXMuc3RhcnRPZmZzZXQgPSB0aGlzLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lIC0gdGhpcy5zdGFydFRpbWU7XHJcbiAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG4gIH1cclxuICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBub2RlLnN0b3AoKTtcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL2ZhaWwgc2lsZW50bHlcclxuICB9XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICB0aGlzLnN0b3AodGhpcy5pc1BhdXNlZCk7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcFN0YXJ0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IHZhbHVlICogdGhpcy5zb3VuZExlbmd0aDtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wRW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLmxvb3BFbmQgPSB2YWx1ZSAqIHRoaXMuc291bmRMZW5ndGg7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2UubG9vcEVuZCA9IHRoaXMubG9vcEVuZDtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5yZXNldExvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmxvb3BTdGFydCA9IDA7XHJcbiAgdGhpcy5sb29wRW5kID0gdGhpcy5zb3VuZExlbmd0aDtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zZXRGcmVxdWVuY3kgPSBmdW5jdGlvbihmcmVxKSB7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gZnJlcTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5nZXRGcmVxdWVuY3kgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnNldFRvbmUgPSBmdW5jdGlvbihzZW1pVG9uZSkge1xyXG4gIHRoaXMuYnVmZmVyU291cmNlLmRldHVuZS52YWx1ZSA9IHNlbWlUb25lICogMTAwO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5idWZmZXJTb3VyY2UuZGV0dW5lLnZhbHVlO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDIsIDgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgd3JhcHBlciBpbiB3aGljaCBhbiBhdWRpbyBidWZmZXIgbGl2ZXMuXHJcbiAqIEl0IGNhbiBoYW5kbGUgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKiAoKi53YXYsICoubXAzKSBhcyBkYXRhIHNvdXJjZXMuXHJcbiAqIE11bHRpcGxlIHNvdXJjZXMgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byBvbmUgYXVkaW8gYnVmZmVyLjxicj5cclxuICogWW91IG5vcm1hbGx5IHNob3VsZG4ndCB1c2UgYW55IG9mIHRoZSBwcm92aWRlZCBtZXRob2RzLlxyXG4gKiBBIFNvdW5kV2F2ZSBvYmplY3QganVzdCBob2xkcyBhdWRpbyBkYXRhIGFuZCBkb2VzIG5vdGhpbmcuXHJcbiAqIElmIHlvdSB3YW50IHRvIHBsYXkgdGhlIHNvdW5kLCB5b3UgaGF2ZSB0byBhZGRpdGlvbmFsbHkgY3JlYXRlIGEgU291bmQgb2JqZWN0LlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5QbGF5IGEgc291bmQgZnJvbSBhbiBhdWRpbyBmaWxlOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUuYnVmZmVyKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Y29uY2F0ZW5hdGUgbXVsdGlwbGUgc291cmNlIGZpbGVzIGludG8gb25lIGJ1ZmZlcjxicj5cclxuICogaW4gdGhlIGdpdmVuIG9yZGVyIGFuZCBwbGF5IHRoZW06PC9jYXB0aW9uPlxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZSgnZmlsZTEud2F2LGZpbGUyLndhdixmaWxlMy53YXYnKTtcclxuICogdmFyIHNvdW5kID0gbmV3IEludGVybWl4LlNvdW5kKHNvdW5kV2F2ZS5idWZmZXIpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cclxuICogVXNpbmcgQXJyYXlCdWZmZXJzIGluc3RlYWQgb2YgZmlsZW5hbWVzIHdpbGwgY29tZSBpbiBoYW5keSBpZiB5b3Ugd2FudDxicj5cclxuICogdG8gaGF2ZSBmdWxsIGNvbnRyb2wgb3ZlciBYSFIgb3IgdXNlIGEgcHJlbG9hZGVyIChoZXJlOiBwcmVsb2FkLmpzKTpcclxuICogPC9jYXB0aW9uPlxyXG4gKiB2YXIgcXVldWUgPSBuZXcgY3JlYXRlanMuTG9hZFF1ZXVlKCk7XHJcbiAqIHF1ZXVlLm9uKCdjb21wbGV0ZScsIGhhbmRsZUNvbXBsZXRlKTtcclxuICogcXVldWUubG9hZE1hbmlmZXN0KFt7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6XCJzcmMyXCIsIHNyYzpcImZpbGUyLndhdlwiLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1dKTtcclxuICpcclxuICogZnVuY3Rpb24gaGFuZGxlQ29tcGxldGUoKSB7XHJcbiAqICAgICB2YXIgYmluRGF0YTEgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzEnKTtcclxuICogICAgIHZhciBiaW5EYXRhMiA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMicpO1xyXG4gKiAgICAgdmFyIHdhdmUxID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMSk7XHJcbiAqICAgICB2YXIgd2F2ZTIgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGEyKTtcclxuICogICAgIHZhciBjb25jYXRXYXZlID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZShbYmluRGF0YTEsIGJpbkRhdGEyXSk7XHJcbiAqIH07XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHsoT2JqZWN0fE9iamVjdFtdfHN0cmluZyl9IGF1ZGlvU3JjICAgT25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKi9cclxudmFyIFNvdW5kV2F2ZSA9IGZ1bmN0aW9uKGF1ZGlvU3JjKSB7XHJcblxyXG4gIHRoaXMuYXVkaW9DdHggPSBjb3JlLmF1ZGlvQ3R4OyAgLy93aW5kb3cuQXVkaW9Db250ZXh0XHJcbiAgdGhpcy5idWZmZXIgPSBudWxsOyAgICAgICAgICAgICAvL0F1ZGlvQnVmZmVyXHJcblxyXG4gIGlmIChhdWRpb1NyYykge1xyXG4gICAgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9vbmUgYXVkaW8gYnVmZmVyIHRvIGRlY29kZVxyXG4gICAgICB0aGlzLmRlY29kZUF1ZGlvRGF0YShhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgYXVkaW9TcmNbMF0gaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAvL211bHRpcGxlIGF1ZGlvIGJ1ZmZlcnMgdG8gZGVjb2RlIGFuZCBjb25jYXRlbmF0ZVxyXG4gICAgICB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihhdWRpb1NyYyk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhdWRpb1NyYyA9PT0gJ3N0cmluZycgJiYgYXVkaW9TcmMuaW5kZXhPZignLCcpID09PSAwKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdmFyIGJpbkJ1ZmZlcjtcclxuICAgICAgdGhpcy5sb2FkRmlsZShhdWRpb1NyYywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICBiaW5CdWZmZXIgPSByZXNwb25zZTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYmluQnVmZmVyKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPiAtMSkge1xyXG4gICAgICAvL211bHRpcGxlIGZpbGVzIHRvIGxvYWQvZGVjb2RlIGFuZCBjYW5jYXRpbmF0ZVxyXG4gICAgICB2YXIgYmluQnVmZmVycyA9IHRoaXMubG9hZEZpbGVzKGF1ZGlvU3JjKTtcclxuICAgICAgdGhpcy5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIoYmluQnVmZmVycyk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBTb3VuZFdhdmUgb2JqZWN0OiBCaW5hcnkgZGF0YSBtaXNzaW5nLicpO1xyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYmluYXJ5IGF1ZGlvIGRhdGEgYW5kIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9IHJhd0F1ZGlvU3JjIEF1ZGlvIGRhdGEgaW4gcmF3IGJpbmFyeSBmb3JtYXRcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgICAgIFJlYWR5IHRvIHVzZSBhdWRpbyBidWZmZXJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMpIHtcclxuICByZXR1cm4gdGhpcy5hdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEocmF3QXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgcmV0dXJuIGRlY29kZWQ7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29uY2F0ZW5hdGVzIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyB0byBhbiBBdWRpb0J1ZmZlci5cclxuICogQHBhcmFtICB7QXJyYXl9IGJpbmFyeUJ1ZmZlcnMgIEFycmF5IGhvbGRpbmcgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBhdWRpb0J1ZmZlciAgIEFuIGV4aXN0aW5nIEF1ZGlvQnVmZmVyIG9iamVjdFxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICAgICAgICBUaGUgY29uY2F0ZW5hdGVkIEF1ZGlvQnVmZmVyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJpbmFyeUJ1ZmZlcnMsIGF1ZGlvQnVmZmVyKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBiaW5hcnlCdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYmluQnVmZmVyKSB7XHJcbiAgICB2YXIgdG1wQXVkaW9CdWZmZXIgPSBzZWxmLmRlY29kZUF1ZGlvRGF0YShiaW5CdWZmZXIpO1xyXG4gICAgYXVkaW9CdWZmZXIgPSBzZWxmLmFwcGVuZEF1ZGlvQnVmZmVyKHNlbGYuQnVmZmVyLCB0bXBBdWRpb0J1ZmZlcik7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhdWRpb0J1ZmZlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBcHBlbmRzIHR3byBhdWRpbyBidWZmZXJzLiBTdWdnZXN0ZWQgYnkgQ2hyaXMgV2lsc29uOlxyXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTQzNjUyL3dlYi1hdWRpby1hcGktYXBwZW5kLWNvbmNhdGVuYXRlLWRpZmZlcmVudC1hdWRpb2J1ZmZlcnMtYW5kLXBsYXktdGhlbS1hcy1vbmUtc29uXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIxIFRoZSBmaXJzdCBhdWRpbyBidWZmZXJcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjIgVGhlIHNlY29uZCBhdWRpbyBidWZmZXJcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgYnVmZmVyMSArIGJ1ZmZlcjJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYXBwZW5kQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihidWZmZXIxLCBidWZmZXIyKSB7XHJcbiAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgdmFyIHRtcCA9IHRoaXMuYXVkaW9DdHguY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHMsXHJcbiAgICAoYnVmZmVyMS5sZW5ndGggKyBidWZmZXIyLmxlbmd0aCksXHJcbiAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZDaGFubmVsczsgaSsrKSB7XHJcbiAgICB2YXIgY2hhbm5lbCA9IHRtcC5nZXRDaGFubmVsRGF0YShpKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIyLmdldENoYW5uZWxEYXRhKGkpLCBidWZmZXIxLmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiB0bXA7XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgYSBiaW5hcnkgZmlsZSBhbmQgY2FsbHMgYSBmdW5jdGlvbiB3aXRoIHRoZVxyXG4gKiByZXR1cm5lZCBBcnJheUJ1ZmZlciBhcyBpdHMgYXJndW1lbnQgd2hlbiBkb25lLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgZmlsZW5hbWUgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBvbmxvYWRDYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXHJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICBbc3luYz10cnVlXSAgIEFzeW5jaHJvbm91cyBsb2FkaW5nXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBhcnJheUJ1ZmZlcjtcclxuICogdGhpcy5sb2FkRmlsZSgnZmlsZTEud2F2JywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICogICBhcnJheUJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gKiB9KTtcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbihmaWxlbmFtZSwgb25sb2FkQ2FsbGJhY2ssIHN5bmMpIHtcclxuICB2YXIgYXN5bmNocm9ub3VzbHkgPSB0cnVlO1xyXG4gIHZhciByZXF1ZXN0ID0gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpO1xyXG5cclxuICBpZiAoc3luYykge1xyXG4gICAgYXN5bmNocm9ub3VzbHkgPSBzeW5jO1xyXG4gIH1cclxuXHJcbiAgcmVxdWVzdC5vcGVuKCdHRVQnLCBmaWxlbmFtZSwgYXN5bmNocm9ub3VzbHkpO1xyXG4gIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuXHJcbiAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIG9ubG9hZENhbGxiYWNrKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gIH07XHJcblxyXG4gIHJlcXVlc3Quc2VuZCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIG11bHRpcGxlIGJpbmFyeSBmaWxlcyBhbmQgcmV0dXJucyBhbiBhcnJheVxyXG4gKiB3aXRoIHRoZSBkYXRhIGZyb20gdGhlIGZpbGVzIGluIHRoZSBnaXZlbiBvcmRlci5cclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgTGlzdCB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICBBcnJheSBvZiBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGVzID0gZnVuY3Rpb24oZmlsZW5hbWVzKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBiaW5CdWZmZXJzID0gW107XHJcbiAgdmFyIG5hbWVzID0gZmlsZW5hbWVzLnNwbGl0KCcsJyk7XHJcbiAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBzZWxmLmxvYWRGaWxlKG5hbWUsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgIGJpbkJ1ZmZlcnNbbmFtZV0gPSByZXNwb25zZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdGhpcy5zb3J0QmluQnVmZmVycyhuYW1lcywgYmluQnVmZmVycyk7XHJcbn07XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnNvcnRCaW5CdWZmZXJzID0gZnVuY3Rpb24oZmlsZW5hbWVzLCBiaW5CdWZmZXJzKSB7XHJcbiAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoZnVuY3Rpb24oZWwpIHtcclxuICAgIGJpbkJ1ZmZlcnNbZWxdO1xyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQuXHJcbiAqXHJcbiAqIFRPRE86IC0gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqICAgICAgIC0gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogICAgICAgLSBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGUgKGFuZCB0aHJvdyBhbiBlcnJvciBpZiBzbylcclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh3aW5kb3cuQXVkaW9Db250ZXh0KSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vVE9ETzogdGhyb3cgZXJyb3IsIHByb2JhYmx5IHN1cnJvdW5kIHdpdGggdHJ5L2NhdGNoXHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGF1ZGlvQ3R4OiBhdWRpb0N0eFxyXG59O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgbXVjaCBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICpcclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB0aW1lciA9IG51bGw7XHJcbnZhciBpbnRlcnZhbCA9IDEwMDtcclxuXHJcbnZhciB3b3JrZXIgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuICAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbiAgICAgIGlmICh0aW1lcikge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3b3JrZXI7XHJcblxyXG4vKmVzbGludC1kaXNhYmxlICovXHJcbi8vIHNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4vLyAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuLy8gICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7cG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbi8vICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4vLyAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbi8vICAgfSBlbHNlIGlmIChlLmRhdGEuaW50ZXJ2YWwpIHtcclxuLy8gICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4vLyAgICAgaWYgKHRpbWVyKSB7XHJcbi8vICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG4vLyAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3Bvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4vLyAgICAgfVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICBzZWxmLmNsb3NlKCk7XHJcbi8vIH07XHJcbiJdfQ==
