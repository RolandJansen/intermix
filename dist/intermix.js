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
 * var sound = new Intermix.Sound(soundWave.buffer);
 * sound.play;
 * @example <caption>Concatenate multiple source files into one buffer<br>
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

  this.audioCtx = core.audioCtx;  //window.AudioContext
  this.buffer = null;             //AudioBuffer

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
      this.concatBinariesToAudioBuffer(binBuffers);
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
  this.buffer = this.audioCtx.decodeAudioData(rawAudioSrc).then(function(decoded) {
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
SoundWave.prototype.concatBinariesToAudioBuffer = function(binaryBuffers, audioBuffer, func) {
  var self = this;

  binaryBuffers.forEach(function(binBuffer) {
    var tmpAudioBuffer = self.decodeAudioData(binBuffer, func);
    audioBuffer = self.appendAudioBuffer(self.buffer, tmpAudioBuffer);
  });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vSW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIEludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbkludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbkludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5JbnRlcm1peC5TZXF1ZW5jZXIgPSByZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpO1xyXG5JbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEludGVybWl4O1xyXG4iLCJ2YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcblxudmFyIHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgdmFyIHdrZXk7XG4gICAgdmFyIGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICB2YXIgZXhwID0gY2FjaGVba2V5XS5leHBvcnRzO1xuICAgICAgICAvLyBVc2luZyBiYWJlbCBhcyBhIHRyYW5zcGlsZXIgdG8gdXNlIGVzbW9kdWxlLCB0aGUgZXhwb3J0IHdpbGwgYWx3YXlzXG4gICAgICAgIC8vIGJlIGFuIG9iamVjdCB3aXRoIHRoZSBkZWZhdWx0IGV4cG9ydCBhcyBhIHByb3BlcnR5IG9mIGl0LiBUbyBlbnN1cmVcbiAgICAgICAgLy8gdGhlIGV4aXN0aW5nIGFwaSBhbmQgYmFiZWwgZXNtb2R1bGUgZXhwb3J0cyBhcmUgYm90aCBzdXBwb3J0ZWQgd2VcbiAgICAgICAgLy8gY2hlY2sgZm9yIGJvdGhcbiAgICAgICAgaWYgKGV4cCA9PT0gZm4gfHwgZXhwLmRlZmF1bHQgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXdrZXkpIHtcbiAgICAgICAgd2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgd2NhY2hlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgICAgIHdjYWNoZVtrZXldID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZXNbd2tleV0gPSBbXG4gICAgICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnLCdtb2R1bGUnLCdleHBvcnRzJ10sICcoJyArIGZuICsgJykoc2VsZiknKSxcbiAgICAgICAgICAgIHdjYWNoZVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgc2tleSA9IE1hdGguZmxvb3IoTWF0aC5wb3coMTYsIDgpICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuXG4gICAgdmFyIHNjYWNoZSA9IHt9OyBzY2FjaGVbd2tleV0gPSB3a2V5O1xuICAgIHNvdXJjZXNbc2tleV0gPSBbXG4gICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZSddLCAoXG4gICAgICAgICAgICAvLyB0cnkgdG8gY2FsbCBkZWZhdWx0IGlmIGRlZmluZWQgdG8gYWxzbyBzdXBwb3J0IGJhYmVsIGVzbW9kdWxlXG4gICAgICAgICAgICAvLyBleHBvcnRzXG4gICAgICAgICAgICAndmFyIGYgPSByZXF1aXJlKCcgKyBzdHJpbmdpZnkod2tleSkgKyAnKTsnICtcbiAgICAgICAgICAgICcoZi5kZWZhdWx0ID8gZi5kZWZhdWx0IDogZikoc2VsZik7J1xuICAgICAgICApKSxcbiAgICAgICAgc2NhY2hlXG4gICAgXTtcblxuICAgIHZhciBzcmMgPSAnKCcgKyBidW5kbGVGbiArICcpKHsnXG4gICAgICAgICsgT2JqZWN0LmtleXMoc291cmNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdpZnkoa2V5KSArICc6WydcbiAgICAgICAgICAgICAgICArIHNvdXJjZXNba2V5XVswXVxuICAgICAgICAgICAgICAgICsgJywnICsgc3RyaW5naWZ5KHNvdXJjZXNba2V5XVsxXSkgKyAnXSdcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSkuam9pbignLCcpXG4gICAgICAgICsgJ30se30sWycgKyBzdHJpbmdpZnkoc2tleSkgKyAnXSknXG4gICAgO1xuXG4gICAgdmFyIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCB8fCB3aW5kb3cubW96VVJMIHx8IHdpbmRvdy5tc1VSTDtcblxuICAgIHJldHVybiBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgIG5ldyBCbG9iKFtzcmNdLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pXG4gICAgKSk7XG59O1xuIiwiLyoqXHJcbiAqIFBhcnQuanNcclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXJ0ID0gZnVuY3Rpb24oYXVkaW9DdHgsIGluc3RydW1lbnQsIGxlbmd0aCkge1xyXG4gIHRoaXMuYXVkaW9DdHg7XHJcbiAgdGhpcy5pbnN0cnVtZW50O1xyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDE2O1xyXG4gIHRoaXMubXVsdGlwbHkgPSA0O1xyXG4gIHRoaXMubGVuZ3RoID0gMTsgICAgICAvLzEgPSBvbmUgYmFyICg0IGJlYXRzKVxyXG4gIHRoaXMubmFtZSA9ICdQYXJ0JztcclxuICB0aGlzLmRhdGE7XHJcbiAgdGhpcy5wYXR0ZXJuID0gW107XHJcbiAgdGhpcy5tb25vcGhvbmljID0gZmFsc2U7IC8vcHJvYmFibHkgZnV0aWxlXHJcbiAgdGhpcy56ZXJvUG9pbnQgPSAwO1xyXG5cclxuICBpZiAoYXVkaW9DdHggJiYgaW5zdHJ1bWVudCkge1xyXG4gICAgdGhpcy5hdWRpb0N0eCA9IGF1ZGlvQ3R4O1xyXG4gICAgdGhpcy5pbnN0cnVtZW50ID0gaW5zdHJ1bWVudDtcclxuICAgIHRoaXMuaW5pdFBhcnQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBwYXJ0LiBBdWRpb0N0eCBhbmQvb3IgaW5zdHJ1bWVudCBtaXNzaW5nLicpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGxlbmd0aCkge1xyXG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XHJcbiAgfVxyXG5cclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmluaXRQYXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5pbml0UGF0dGVybih0aGlzLmxlbmd0aCk7XHJcbiAgLy9kbyB3ZSByZWFsbHkgbmVlZCB0aGlzPyBBbmQsIGlmIHllcywgd2h5P1xyXG4gIHRoaXMuZGF0YSA9IHtcclxuICAgICduYW1lJzogdGhpcy5uYW1lLFxyXG4gICAgJ2luc3RydW1lbnQnOiB0aGlzLmluc3RydW1lbnQsXHJcbiAgICAncmVzb2x1dGlvbic6IHRoaXMucmVzb2x1dGlvbixcclxuICAgICdwYXR0ZXJuJzogdGhpcy5wYXR0ZXJuXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBpbml0UGF0dGVybjogSW5pdGlhbGl6ZSBhbiBlbXB0eSBwYXR0ZXJuIGluIHRoaXMgcGFydFxyXG4gKiBAcGFyYW0gIHtGbG9hdH0gIGxlbmd0aCAgTGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIG1lc3VyZWQgaW4gYmFyc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuaW5pdFBhdHRlcm4gPSBmdW5jdGlvbihsZW5ndGgpIHtcclxuICB2YXIgcGF0dGVybiA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgKGxlbmd0aCAqIDY0KTsgaSsrKSB7XHJcbiAgICBwYXR0ZXJuW2ldID0gW107XHJcbiAgfVxyXG4gIHJldHVybiBwYXR0ZXJuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGFkZEV2ZW50OiBhZGRzIGFuIGV2ZW50IHRvIHRoZSBwYXR0ZXJuIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCAgVGhlIGV2ZW50IChub3RlIG9yIGNvbnRyb2xsZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5hZGRFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIGlmIChwb3NpdGlvbiA8PSB0aGlzLnJlc29sdXRpb24pIHtcclxuICAgIHZhciBwb3MgPSAocG9zaXRpb24gLSAxKSAqIHRoaXMubXVsdGlwbHk7XHJcbiAgICB0aGlzLnBhdHRlcm5bcG9zXS5wdXNoKHNlcUV2ZW50KTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXJ0LnByb3RvdHlwZS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgLy9yZW1vdmVzIGFsbCBlbnRyaWVzIGF0IGEgc3BlY2lmaWMgcG9zaXRpb24uXHJcbiAgLy90aGlzIGlzIG5vdCBleGFjdGx5IHdoYXQgaXQgc2hvdWxkIGRvLlxyXG4gIHZhciBwb3MgPSBwb3NpdGlvbiAqIHRoaXMubXVsdGlwbHk7XHJcbiAgdGhpcy5wYXR0ZXJuW3Bvc10gPSBbXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjbGVhclBhdHRlcm46IERlbGV0ZSBhbGwgZXZlbnRzIGluIHRoaXMgcGFydFxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IGNvbnRleHQgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlLlxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuY2xlYXJQYXR0ZXJuID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5wYXR0ZXJuID0gW107XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXJ0LnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5wYXR0ZXJuLmxlbmd0aDtcclxufTtcclxuXHJcblBhcnQucHJvdG90eXBlLmdldE5vdGVQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcG9zaXRpb25zID0gW107XHJcbiAgdGhpcy5wYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24oZWwsIGluZGV4KSB7XHJcbiAgICBpZiAoZWwubGVuZ3RoID4gMCkge1xyXG4gICAgICBwb3NpdGlvbnMucHVzaChpbmRleCAvIHRoaXMubXVsdGlwbHkpO1xyXG4gICAgfVxyXG4gIH0sIHRoaXMpO1xyXG4gIHJldHVybiBwb3NpdGlvbnM7XHJcbn07XHJcblxyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblN0YXJ0ID0gZnVuY3Rpb24ocGF0dGVybiwgZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGVudHJpZXMgPSBleHRMZW5ndGggKiA2NDtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihlbnRyaWVzKTtcclxuICByZXR1cm4gcGF0dGVybi5wdXNoLmFwcGx5KGV4dGVuc2lvbiwgcGF0dGVybik7XHJcbn07XHJcblxyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPbkVuZCA9IGZ1bmN0aW9uKHBhdHRlcm4sIGV4dExlbmd0aCkge1xyXG4gIHZhciBlbnRyaWVzID0gZXh0TGVuZ3RoICogNjQ7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZW50cmllcyk7XHJcbiAgcmV0dXJuIHBhdHRlcm4ucHVzaC5hcHBseShwYXR0ZXJuLCBleHRlbnNpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYXJ0O1xyXG4iLCIvKipcclxuICogU2VxdWVuY2VyXHJcbiAqXHJcbiAqIFNjaGVkdWxpbmcgaW5zcGlyZWQgYnkgXCJBIFRhbGUgb2YgVHdvIENsb2Nrc1wiIGJ5IENocmlzIFdpbHNvbjpcclxuICogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvYXVkaW8vc2NoZWR1bGluZy9cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpO1xyXG5cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKGF1ZGlvQ3R4KSB7XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgdGhpcy5iZWF0c1Blck1pbnV0ZSA9IDEyMDsgIC8vYmVhdHMgcGVyIG1pbnV0ZVxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDY0OyAgICAgICAvL3Nob3J0ZXN0IHBvc3NpYmxlIG5vdGUuIFlvdSBub3JtYWxseSBkb24ndCB3YW50IHRvIHRvdWNoIHRoaXMuXHJcbiAgdGhpcy5pbnRlcnZhbCA9IDEwMDsgICAgICAgIC8vdGhlIGludGVydmFsIGluIG1pbGlzZWNvbmRzIHRoZSBzY2hlZHVsZXIgZ2V0cyBpbnZva2VkLlxyXG4gIHRoaXMubG9va2FoZWFkID0gMC4zOyAgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGxvb2tzIGFoZWFkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Nob3VsZCBiZSBsb25nZXIgdGhhbiBpbnRlcnZhbC5cclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgICAgLy9MaXN0IHdpdGggYWxsIHBhcnRzIG9mIHRoZSBzY29yZVxyXG4gIHRoaXMucnVuUXVldWUgPSBbXTsgICAgICAgICAvL2xpc3Qgd2l0aCBwYXJ0cyB0aGF0IGFyZSBwbGF5aW5nIG9yIHdpbGwgYmUgcGxheWVkIHNob3J0bHlcclxuXHJcbiAgdGhpcy5ub3c7ICAgICAgICAgICAgICAgICAgICAvL3RpbWVzdGFtcCBmcm9tIGF1ZGlvY29udGV4dCB3aGVuIHRoZSBzY2hlZHVsZXIgaXMgaW52b2tlZC5cclxuICB0aGlzLnRpbWVQZXJTdGVwOyAgICAgICAgICAgLy9wZXJpb2Qgb2YgdGltZSBiZXR3ZWVuIHR3byBzdGVwc1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDsgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBuZXh0IHN0ZXAgd2lsbCBiZSB0cmlnZ2VyZWRcclxuICB0aGlzLm5leHRTdGVwID0gMDsgICAgICAgICAgLy9wb3NpdGlvbiBpbiB0aGUgcXVldWUgdGhhdCB3aWxsIGdldCB0cmlnZ2VyZWQgbmV4dFxyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSAwOyAgICAvL3N0ZXAgaW4gcXVldWUgdGhhdCB3YXMgcGxheWVkIChub3QgdHJpZ2dlcmVkKSByZWNlbnRseSAodXNlZCBmb3IgZHJhd2luZykuXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7ICAgICAgICAgIC8vcGxheSBhIHNlY3Rpb24gb2YgdGhlIHF1ZXVlIGluIGEgbG9vcFxyXG4gIHRoaXMubG9vcFN0YXJ0OyAgICAgICAgICAgICAvL2ZpcnN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmxvb3BFbmQ7ICAgICAgICAgICAgICAgLy9sYXN0IHN0ZXAgb2YgdGhlIGxvb3BcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlOyAgICAgLy90cnVlIGlmIHNlcXVlbmNlciBpcyBydW5uaW5nLCBvdGhlcndpc2UgZmFsc2VcclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lOyAgICAgICAgLy9oYXMgdG8gYmUgb3ZlcnJpZGRlbiB3aXRoIGEgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGluIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RyYXcgZnVuY3Rpb24gd2l0aCB0aGUgbGFzdFBsYXllZFN0ZXAgaW50IGFzIHBhcmFtZXRlci5cclxuXHJcbiAgLy8gc2V0IHRpbWUgcGVyIHNldFRpbWVQZXJTdGVwXHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAodGhpcy5iZWF0c1Blck1pbnV0ZSwgdGhpcy5yZXNvbHV0aW9uKTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSB0aGUgc2NoZWR1bGVyLXRpbWVyXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlciA9IHdvcmsocmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpKTtcclxuXHJcbiAgLyplc2xpbnQtZW5hYmxlICovXHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKGUuZGF0YSA9PT0gJ3RpY2snKSB7XHJcbiAgICAgIHNlbGYuc2NoZWR1bGVyKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSh7J21lc3NhZ2UnOiB0aGlzLmludGVydmFsfSk7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubm93ID0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IHRoaXMubm93O1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHRoaXMubmV4dFN0ZXBUaW1lIDwgdGhpcy5ub3cgKyB0aGlzLmxvb2thaGVhZCkge1xyXG4gICAgaWYgKHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcclxuICAgICAgICB0aGlzLnJ1blF1ZXVlLnB1c2goe1xyXG4gICAgICAgICAgJ2luc3RydW1lbnQnOiBwYXJ0Lmluc3RydW1lbnQsXHJcbiAgICAgICAgICAncGF0dGVybic6IHRoaXMuY29weUFycmF5KHBhcnQucGF0dGVybilcclxuICAgICAgICB9KTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ydW5RdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGluZGV4KSB7XHJcbiAgICAgIHZhciBzZXFFdmVudHMgPSBwYXJ0LnBhdHRlcm4uc2hpZnQoKTsgIC8vcmV0dXJuIGZpcnN0IGVsZW1lbnQgYW5kIHJlbW92ZSBpdCBmcm9tIHBhcnRcclxuICAgICAgaWYgKHNlcUV2ZW50cykge1xyXG4gICAgICAgIC8vdmFyIGluc3RydW1lbnQgPSBwYXJ0Lmluc3RydW1lbnQ7XHJcbiAgICAgICAgc2VxRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oc2VxRXZlbnQpIHtcclxuICAgICAgICAgIGlmIChzZXFFdmVudC5ub3RlKSB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogc2hvdWxkIGJlIGV4dGVuZGVkIHRvIHBsYXkgcmVhbCBub3Rlc1xyXG4gICAgICAgICAgICBwYXJ0Lmluc3RydW1lbnQucGxheSh0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHNlcUV2ZW50LmNvbnRyb2xsZXIpIHtcclxuICAgICAgICAgICAgLy8gcHJvY2VzcyBjb250cm9sbGVyIGV2ZW50O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vcmVtb3ZlIHBhcnQgZnJvbSBydW5RdWV1ZSBpZiBlbXB0eVxyXG4gICAgICAgICAgaWYgKHBhcnQucGF0dGVybi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5ydW5RdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgKz0gdGhpcy50aW1lUGVyU3RlcDtcclxuXHJcbiAgICAvLyBzZXQgcG9pbnRlciB0byB0aGUgbmV4dCBzdGVwIGluIHRoZSBxdWV1ZSB0aGF0IHNob3VsZCBiZSBwbGF5ZWQuXHJcbiAgICAvLyBJZiB3ZSdyZSBwbGF5aW5nIGluIGxvb3AgbW9kZSwganVtcCBiYWNrIHRvIGxvb3BzdGFydCB3aGVuXHJcbiAgICAvLyBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gICAgaWYgKHRoaXMubG9vcCkge1xyXG4gICAgICBpZiAodGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgICAgICB0aGlzLm5leHRTdGVwID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgICAgICAgdGhpcy5ydW5RdWV1ZSA9IFtdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubmV4dFN0ZXArKztcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gdHJ1ZTtcclxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdyk7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAgdGhpcy5ydW5RdWV1ZSA9IFtdO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcclxuICAvLyBmaXJzdCB3ZSdsbCBoYXZlIHRvIGZpbmQgb3V0LCB3aGF0IHN0ZXAgd2FzIHJlY2VudGx5IHBsYXllZC5cclxuICAvLyB0aGlzIGlzIHNvbWVob3cgY2x1bXN5IGJlY2F1c2UgdGhlIHNlcXVlbmNlciBkb2Vzbid0IGtlZXAgdHJhY2sgb2YgdGhhdC5cclxuICB2YXIgbG9va0FoZWFkRGVsdGEgPSB0aGlzLm5leHRTdGVwVGltZSAtIHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWU7XHJcbiAgdmFyIHN0ZXBzQWhlYWQgPSBNYXRoLmZsb29yKGxvb2tBaGVhZERlbHRhIC8gdGhpcy50aW1lUGVyU3RlcCkgKyAxO1xyXG4gIHRoaXMubGFzdFBsYXllZFN0ZXAgPSB0aGlzLm5leHRTdGVwIC0gc3RlcHNBaGVhZDtcclxuXHJcbiAgLy9zaG91bGQgYmUgb3ZlcnJpZGRlbiBieSB0aGUgYXBwbGljYXRpb25cclxuICB0aGlzLmFuaW1hdGlvbkZyYW1lKHRoaXMubGFzdFBsYXllZFN0ZXApO1xyXG5cclxuICBpZiAodGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3KTtcclxuICB9XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dID0gW107XHJcbiAgfVxyXG4gIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbn07XHJcblxyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNyZWF0ZU5vdGVFdmVudCA9IGZ1bmN0aW9uKG5vdGUsIGxlbmd0aCkge1xyXG4gIHJldHVybiB7XHJcbiAgICAnbm90ZSc6IG5vdGUsXHJcbiAgICAnbGVuZ3RoJzogbGVuZ3RoXHJcbiAgfTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0VGltZVBlclN0ZXAgPSBmdW5jdGlvbihicG0sIHJlc29sdXRpb24pIHtcclxuICByZXR1cm4gKDYwICogNCkgLyAoYnBtICogcmVzb2x1dGlvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogY29weUFycmF5OiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBcdFx0XHRcdFx0XHRVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIFx0XHRcdFx0XHRcdHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIFx0XHRcdFx0XHRcdChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIFx0XHRcdFx0XHRcdGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKGF1ZGlvQ3R4LCBzb3VuZEJ1ZmZlcikge1xyXG5cclxuICB0aGlzLmF1ZGlvQ3R4ID0gbnVsbDtcclxuICB0aGlzLmJ1ZmZlciA9IG51bGw7XHJcbiAgdGhpcy5xdWV1ZSA9IFtdOyAgICAgICAgICAvL2FsbCBjdXJyZW50bHkgYWN0aXZlIHN0cmVhbXNcclxuICB0aGlzLmxvb3AgPSBmYWxzZTtcclxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbiAgdGhpcy5zdGFydFRpbWUgPSAwO1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG5cclxuICBpZiAoc291bmRCdWZmZXIgJiYgYXVkaW9DdHgpIHtcclxuICAgIHRoaXMuYXVkaW9DdHggPSBhdWRpb0N0eDtcclxuICAgIHRoaXMuYnVmZmVyID0gc291bmRCdWZmZXI7XHJcbiAgICB0aGlzLnNvdW5kTGVuZ3RoID0gdGhpcy5sb29wRW5kID0gc291bmRCdWZmZXIuZHVyYXRpb247XHJcbiAgICB0aGlzLnNldHVwQXVkaW9DaGFpbigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIGluaXRpYWxpc2luZyBTb3VuZCBvYmplY3Q6IHBhcmFtZXRlciBtaXNzaW5nLicpO1xyXG4gIH1cclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zZXR1cEF1ZGlvQ2hhaW4gPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmdhaW5Ob2RlID0gdGhpcy5hdWRpb0N0eC5jcmVhdGVHYWluKCk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gdGhpcy5hdWRpb0N0eC5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcclxuICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5wYW5uZXJOb2RlKTtcclxuICB0aGlzLnBhbm5lck5vZGUuY29ubmVjdCh0aGlzLmF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcclxuICB0aGlzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSAxO1xyXG4gIGNvbnNvbGUubG9nKCdhdWRpb2NoYWluIHJlYWR5Jyk7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSB0aGlzLmF1ZGlvQ3R4LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICBidWZmZXJTb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcclxuICBidWZmZXJTb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZShidWZmZXJTb3VyY2UpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGJ1ZmZlclNvdXJjZTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5kZXN0cm95QnVmZmVyU291cmNlID0gZnVuY3Rpb24oYnNOb2RlKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIGJzTm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUsIGluZGV4KSB7XHJcbiAgICBpZiAobm9kZSA9PT0gYnNOb2RlKSB7XHJcbiAgICAgIHNlbGYucXVldWUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICB9KTtcclxuICBic05vZGUgPSBudWxsOyAvL3Byb2JhYmx5IGZ1dGlsZVxyXG4gIGNvbnNvbGUubG9nKCdCdWZmZXJTb3VyY2VOb2RlIGRlc3Ryb3llZCcpO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbihkZWxheSwgcGxheUxvb3BlZCkge1xyXG4gIHZhciBzdGFydFRpbWUgPSAwO1xyXG5cclxuICBpZiAoZGVsYXkpIHtcclxuICAgIGNvbnNvbGUubG9nKCdzZXQgc3RhcnQgdGltZTogJyArIGRlbGF5KTtcclxuICAgIHN0YXJ0VGltZSA9IGRlbGF5O1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzdGFydFRpbWUgPSB0aGlzLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuICB2YXIgYnMgPSB0aGlzLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJzLmxvb3AgPSBwbGF5TG9vcGVkO1xyXG5cclxuICAvLyBpZiAocGxheUxvb3BlZCkge1xyXG4gIC8vICAgYnMubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbiAgLy8gICBicy5sb29wRW5kID0gdGhpcy5sb29wRW5kO1xyXG4gIC8vIH1cclxuXHJcbiAgLy8gaWYgKHRoaXMuc3RhcnRPZmZzZXQgPT09IDAgfHwgdGhpcy5zdGFydE9mZnNldCA+PSB0aGlzLmJ1ZmZlci5kdXJhdGlvbikge1xyXG4gIC8vICAgY29uc29sZS5sb2coJ3Jlc2V0dGluZyBzdGFydHRpbWUnKTtcclxuICAvLyAgIHRoaXMuc3RhcnRUaW1lID0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuICAvLyB9XHJcbiAgdGhpcy5xdWV1ZS5wdXNoKGJzKTtcclxuICAvL2JzLnN0YXJ0KHN0YXJ0VGltZSwgdGhpcy5zdGFydE9mZnNldCk7XHJcbiAgYnMuc3RhcnQoc3RhcnRUaW1lKTtcclxuXHJcbiAgdGhpcy5zdGFydE9mZnNldCA9IDA7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKHBhdXNlZCkge1xyXG4gIGlmIChwYXVzZWQpIHsgLy90aGlzIGhhcyB0byBiZSByZXdyaXR0ZW4gc2luY2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgc3RhcnQgdGltZXMuXHJcbiAgICB0aGlzLnN0YXJ0T2Zmc2V0ID0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZSAtIHRoaXMuc3RhcnRUaW1lO1xyXG4gICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcclxuICB9XHJcbiAgaWYgKHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgbm9kZS5zdG9wKCk7XHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy9mYWlsIHNpbGVudGx5XHJcbiAgfVxyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgdGhpcy5zdG9wKHRoaXMuaXNQYXVzZWQpO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnNldExvb3BTdGFydCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSB2YWx1ZSAqIHRoaXMuc291bmRMZW5ndGg7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2UubG9vcFN0YXJ0ID0gdGhpcy5sb29wU3RhcnQ7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcEVuZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wRW5kID0gdmFsdWUgKiB0aGlzLnNvdW5kTGVuZ3RoO1xyXG4gIHRoaXMuYnVmZmVyU291cmNlLmxvb3BFbmQgPSB0aGlzLmxvb3BFbmQ7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUucmVzZXRMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5sb29wU3RhcnQgPSAwO1xyXG4gIHRoaXMubG9vcEVuZCA9IHRoaXMuc291bmRMZW5ndGg7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RnJlcXVlbmN5ID0gZnVuY3Rpb24oZnJlcSkge1xyXG4gIHRoaXMuYnVmZmVyU291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IGZyZXE7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0RnJlcXVlbmN5ID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuYnVmZmVyU291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zZXRUb25lID0gZnVuY3Rpb24oc2VtaVRvbmUpIHtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5kZXR1bmUudmFsdWUgPSBzZW1pVG9uZSAqIDEwMDtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5nZXRUb25lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuYnVmZmVyU291cmNlLmRldHVuZS52YWx1ZTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cigyLCA4KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIENyZWF0ZXMgYSB3cmFwcGVyIGluIHdoaWNoIGFuIGF1ZGlvIGJ1ZmZlciBsaXZlcy5cclxuICogQSBTb3VuZFdhdmUgb2JqZWN0IGp1c3QgaG9sZHMgYXVkaW8gZGF0YSBhbmQgZG9lcyBub3RoaW5nIGVsc2UuXHJcbiAqIElmIHlvdSB3YW50IHRvIHBsYXkgdGhlIHNvdW5kLCB5b3UgaGF2ZSB0byBhZGRpdGlvbmFsbHkgY3JlYXRlIGFcclxuICogPGEgaHJlZj1cIlNvdW5kLmh0bWxcIj5Tb3VuZDwvYT4gb2JqZWN0LlxyXG4gKiBJdCBjYW4gaGFuZGxlIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICogKCoud2F2LCAqLm1wMykgYXMgZGF0YSBzb3VyY2VzLlxyXG4gKiA8L3A+PHA+XHJcbiAqIE11bHRpcGxlIHNvdXJjZXMgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byBvbmUgYXVkaW8gYnVmZmVyLlxyXG4gKiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBjcmVhdGluZyBtdWx0aXBsZSBTb3VuZFdhdmUgb2JqZWN0cy5cclxuICogSXQncyBsaWtlIGEgd2F2ZXRhYmxlOiBBbGwgc3RhcnQvZW5kIHBvc2l0aW9ucyB3aWxsIGJlIHNhdmVkIHNvXHJcbiAqIHlvdSBjYW4gdHJpZ2dlciB0aGUgb3JpZ2luYWwgc2FtcGxlcyB3aXRob3V0IHVzaW5nIG11bHRpcGxlIGJ1ZmZlcnMuXHJcbiAqIFBvc3NpYmxlIHVzYWdlcyBhcmUgbXVsdGlzYW1wbGVkIHNvdW5kcywgbG9vcHMgb3Igd2F2ZXNlcXVlbmNlcyAoa2luZCBvZikuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+UGxheSBhIHNvdW5kIGZyb20gYW4gYXVkaW8gZmlsZTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgSW50ZXJtaXguU291bmRXYXZlKCdmaWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgSW50ZXJtaXguU291bmQoc291bmRXYXZlLmJ1ZmZlcik7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNvbmNhdGVuYXRlIG11bHRpcGxlIHNvdXJjZSBmaWxlcyBpbnRvIG9uZSBidWZmZXI8YnI+XHJcbiAqIGluIHRoZSBnaXZlbiBvcmRlciBhbmQgcGxheSB0aGVtOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUxLndhdixmaWxlMi53YXYsZmlsZTMud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBJbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUuYnVmZmVyKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+XHJcbiAqIFVzaW5nIEFycmF5QnVmZmVycyBpbnN0ZWFkIG9mIGZpbGVuYW1lcyB3aWxsIGNvbWUgaW4gaGFuZHkgaWYgeW91IHdhbnQ8YnI+XHJcbiAqIHRvIGhhdmUgZnVsbCBjb250cm9sIG92ZXIgWEhSIG9yIHVzZSBhIHByZWxvYWRlciAoaGVyZTogcHJlbG9hZC5qcyk6XHJcbiAqIDwvY2FwdGlvbj5cclxuICogdmFyIHF1ZXVlID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpO1xyXG4gKiBxdWV1ZS5vbignY29tcGxldGUnLCBoYW5kbGVDb21wbGV0ZSk7XHJcbiAqIHF1ZXVlLmxvYWRNYW5pZmVzdChbXHJcbiAqICAgICB7aWQ6ICdzcmMxJywgc3JjOidmaWxlMS53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX0sXHJcbiAqICAgICB7aWQ6ICdzcmMyJywgc3JjOidmaWxlMi53YXYnLCB0eXBlOmNyZWF0ZWpzLkFic3RyYWN0TG9hZGVyLkJJTkFSWX1cclxuICogXSk7XHJcbiAqXHJcbiAqIGZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlKCkge1xyXG4gKiAgICAgdmFyIGJpbkRhdGExID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMxJyk7XHJcbiAqICAgICB2YXIgYmluRGF0YTIgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzInKTtcclxuICogICAgIHZhciB3YXZlMSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTEpO1xyXG4gKiAgICAgdmFyIHdhdmUyID0gbmV3IEludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMik7XHJcbiAqICAgICB2YXIgY29uY2F0V2F2ZSA9IG5ldyBJbnRlcm1peC5Tb3VuZFdhdmUoW2JpbkRhdGExLCBiaW5EYXRhMl0pO1xyXG4gKiB9O1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtICB7KE9iamVjdHxPYmplY3RbXXxzdHJpbmcpfSBhdWRpb1NyYyAgIE9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICovXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihhdWRpb1NyYykge1xyXG5cclxuICB0aGlzLmF1ZGlvQ3R4ID0gY29yZS5hdWRpb0N0eDsgIC8vd2luZG93LkF1ZGlvQ29udGV4dFxyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDsgICAgICAgICAgICAgLy9BdWRpb0J1ZmZlclxyXG5cclxuICBpZiAoYXVkaW9TcmMpIHtcclxuICAgIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIGF1ZGlvIGJ1ZmZlciB0byBkZWNvZGVcclxuICAgICAgdGhpcy5kZWNvZGVBdWRpb0RhdGEoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9tdWx0aXBsZSBhdWRpbyBidWZmZXJzIHRvIGRlY29kZSBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgdGhpcy5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA9PT0gLTEpIHtcclxuICAgICAgLy9vbmUgZmlsZSB0byBsb2FkL2RlY29kZVxyXG4gICAgICB2YXIgYmluQnVmZmVyO1xyXG4gICAgICB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgIGJpbkJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmRlY29kZUF1ZGlvRGF0YShiaW5CdWZmZXIpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA+IC0xKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgZmlsZXMgdG8gbG9hZC9kZWNvZGUgYW5kIGNhbmNhdGluYXRlXHJcbiAgICAgIHZhciBiaW5CdWZmZXJzID0gdGhpcy5sb2FkRmlsZXMoYXVkaW9TcmMpO1xyXG4gICAgICB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihiaW5CdWZmZXJzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBTb3VuZFdhdmUgb2JqZWN0OiBVbnN1cHBvcnRlZCBkYXRhIGZvcm1hdCcpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICAvL3N0YXJ0IHRoZSBvYmplY3Qgd2l0aCBlbXB0eSBidWZmZXIuIFVzZWZ1bGwgZm9yIHRlc3RpbmcgYW5kIGFkdmFuY2VkIHVzYWdlLlxyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYmluYXJ5IGF1ZGlvIGRhdGEgYW5kIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSAgICAgW2Z1bmNdICAgICAgQ2FuIGJlIHVzZWQgdG8gcnVuIGNvZGUgaW5zaWRlIHRoZSBpbm5lciBkZWNvZGUgZnVuY3Rpb24uXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUHJvbWlzZSBvYmplY3QgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIGF1ZGlvIGJ1ZmZlciBhZnRlciBkZWNvZGluZy5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMsIGZ1bmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vbmV3IHByb21pc2UgYmFzZWQgc3ludGF4IGN1cnJlbnRseSBub3QgYXZhaWxhYmxlIGluIENocm9tZSA8NDksIElFLCBTYWZhcmlcclxuICB0aGlzLmJ1ZmZlciA9IHRoaXMuYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKHJhd0F1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgIGlmIChmdW5jKSB7XHJcbiAgICAgIGZ1bmMoKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb25jYXRlbmF0ZXMgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIHRvIGFuIEF1ZGlvQnVmZmVyLlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gYmluYXJ5QnVmZmVycyAgQXJyYXkgaG9sZGluZyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnNcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGF1ZGlvQnVmZmVyICAgQW4gZXhpc3RpbmcgQXVkaW9CdWZmZXIgb2JqZWN0XHJcbiAqIEByZXR1cm4ge0F1ZGlvQnVmZmVyfSAgICAgICAgICAgICAgIFRoZSBjb25jYXRlbmF0ZWQgQXVkaW9CdWZmZXJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuY29uY2F0QmluYXJpZXNUb0F1ZGlvQnVmZmVyID0gZnVuY3Rpb24oYmluYXJ5QnVmZmVycywgYXVkaW9CdWZmZXIsIGZ1bmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGJpbmFyeUJ1ZmZlcnMuZm9yRWFjaChmdW5jdGlvbihiaW5CdWZmZXIpIHtcclxuICAgIHZhciB0bXBBdWRpb0J1ZmZlciA9IHNlbGYuZGVjb2RlQXVkaW9EYXRhKGJpbkJ1ZmZlciwgZnVuYyk7XHJcbiAgICBhdWRpb0J1ZmZlciA9IHNlbGYuYXBwZW5kQXVkaW9CdWZmZXIoc2VsZi5idWZmZXIsIHRtcEF1ZGlvQnVmZmVyKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGF1ZGlvQnVmZmVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGVuZHMgdHdvIGF1ZGlvIGJ1ZmZlcnMuIFN1Z2dlc3RlZCBieSBDaHJpcyBXaWxzb246PGJyPlxyXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTQzNjUyL3dlYi1hdWRpby1hcGktYXBwZW5kLWNvbmNhdGVuYXRlLWRpZmZlcmVudC1hdWRpb2J1ZmZlcnMtYW5kLXBsYXktdGhlbS1hcy1vbmUtc29uXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIxIFRoZSBmaXJzdCBhdWRpbyBidWZmZXJcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjIgVGhlIHNlY29uZCBhdWRpbyBidWZmZXJcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgYnVmZmVyMSArIGJ1ZmZlcjJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYXBwZW5kQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihidWZmZXIxLCBidWZmZXIyKSB7XHJcbiAgdmFyIG51bWJlck9mQ2hhbm5lbHMgPSBNYXRoLm1pbihidWZmZXIxLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlcjIubnVtYmVyT2ZDaGFubmVscyk7XHJcbiAgdmFyIHRtcCA9IHRoaXMuYXVkaW9DdHguY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHMsXHJcbiAgICAoYnVmZmVyMS5sZW5ndGggKyBidWZmZXIyLmxlbmd0aCksXHJcbiAgICBidWZmZXIxLnNhbXBsZVJhdGUpO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZDaGFubmVsczsgaSsrKSB7XHJcbiAgICB2YXIgY2hhbm5lbCA9IHRtcC5nZXRDaGFubmVsRGF0YShpKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIxLmdldENoYW5uZWxEYXRhKGkpLCAwKTtcclxuICAgIGNoYW5uZWwuc2V0KCBidWZmZXIyLmdldENoYW5uZWxEYXRhKGkpLCBidWZmZXIxLmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiB0bXA7XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgYSBiaW5hcnkgZmlsZSBhbmQgY2FsbHMgYSBmdW5jdGlvbiB3aXRoIHRoZVxyXG4gKiByZXR1cm5lZCBBcnJheUJ1ZmZlciBhcyBpdHMgYXJndW1lbnQgd2hlbiBkb25lLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgZmlsZW5hbWUgICAgICAgVGhlIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBvbmxvYWRDYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXHJcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICBbYXN5bmM9dHJ1ZV0gICBBc3luY2hyb25vdXMgbG9hZGluZ1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgYXJyYXlCdWZmZXI7XHJcbiAqIHRoaXMubG9hZEZpbGUoJ2ZpbGUxLndhdicsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAqICAgYXJyYXlCdWZmZXIgPSByZXNwb25zZTtcclxuICogfSk7XHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlID0gZnVuY3Rpb24oZmlsZW5hbWUsIG9ubG9hZENhbGxiYWNrLCBhc3luYykge1xyXG4gIHZhciBhc3luY2hyb25vdXNseSA9IHRydWU7XHJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gIGlmIChhc3luYykge1xyXG4gICAgYXN5bmNocm9ub3VzbHkgPSBhc3luYztcclxuICB9XHJcblxyXG4gIHJlcXVlc3Qub3BlbignR0VUJywgZmlsZW5hbWUsIGFzeW5jaHJvbm91c2x5KTtcclxuICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XHJcblxyXG4gIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBvbmxvYWRDYWxsYmFjayhyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICB9O1xyXG5cclxuICByZXF1ZXN0LnNlbmQoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBtdWx0aXBsZSBiaW5hcnkgZmlsZXMgYW5kIHJldHVybnMgYW4gYXJyYXlcclxuICogd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBmaWxlcyBpbiB0aGUgZ2l2ZW4gb3JkZXIuXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgZmlsZW5hbWVzIExpc3Qgd2l0aCBmaWxlbmFtZXNcclxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICAgQXJyYXkgb2YgQXJyYXlCdWZmZXJzXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVuYW1lcykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgYmluQnVmZmVycyA9IFtdO1xyXG4gIHZhciBuYW1lcyA9IGZpbGVuYW1lcy5zcGxpdCgnLCcpO1xyXG4gIG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xyXG4gICAgc2VsZi5sb2FkRmlsZShuYW1lLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICBiaW5CdWZmZXJzW25hbWVdID0gcmVzcG9uc2U7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRoaXMuc29ydEJpbkJ1ZmZlcnMobmFtZXMsIGJpbkJ1ZmZlcnMpO1xyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS5zb3J0QmluQnVmZmVycyA9IGZ1bmN0aW9uKGZpbGVuYW1lcywgYmluQnVmZmVycykge1xyXG4gIHJldHVybiBmaWxlbmFtZXMubWFwKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICByZXR1cm4gYmluQnVmZmVyc1tlbF07XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kV2F2ZTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgc2ltcGx5IGNyZWF0ZXMgdGhlIGF1ZGlvIGNvbnRleHQgb2JqZWN0c1xyXG4gKiBhbmQgZXhwb3J0cyBpdC5cclxuICpcclxuICogVE9ETzogLSBTaG91bGQgd2UgZG8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIG9sZGVyIGFwaS12ZXJzaW9ucz9cclxuICogICAgICAgLSBDaGVjayBmb3IgbW9iaWxlL2lPUyBjb21wYXRpYmlsaXR5LlxyXG4gKiAgICAgICAtIENoZWNrIGlmIHdlJ3JlIHJ1bm5pbmcgb24gbm9kZSAoYW5kIHRocm93IGFuIGVycm9yIGlmIHNvKVxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGF1ZGlvQ3R4ID0gbnVsbDtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuXHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbiAgaWYgKHdpbmRvdy5BdWRpb0NvbnRleHQpIHtcclxuICAgIGF1ZGlvQ3R4ID0gbmV3IHdpbmRvdy5BdWRpb0NvbnRleHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy9UT0RPOiB0aHJvdyBlcnJvciwgcHJvYmFibHkgc3Vycm91bmQgd2l0aCB0cnkvY2F0Y2hcclxuICB9XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgYXVkaW9DdHg6IGF1ZGlvQ3R4XHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIGEgd2Vid29ya2VyIHRoYXQgcHJvdmlkZXMgYSB0aW1lclxyXG4gKiB0aGF0IGZpcmVzIHRoZSBzY2hlZHVsZXIgZm9yIHRoZSBzZXF1ZW5jZXIuXHJcbiAqIFRoaXMgaXMgYmVjYXVzZSB0aW1pbmcgaGVyZSBpcyBtdWNoIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRpbWVyID0gbnVsbDtcclxudmFyIGludGVydmFsID0gMTAwO1xyXG5cclxudmFyIHdvcmtlciA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAnc3RhcnQnKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhID09PSAnc3RvcCcpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4gICAgICBpbnRlcnZhbCA9IGUuZGF0YS5pbnRlcnZhbDtcclxuICAgICAgaWYgKHRpbWVyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtlcjtcclxuXHJcbi8qZXNsaW50LWRpc2FibGUgKi9cclxuLy8gc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbi8vICAgaWYgKGUuZGF0YSA9PT0gJ3N0YXJ0Jykge1xyXG4vLyAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtwb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuLy8gICB9IGVsc2UgaWYgKGUuZGF0YSA9PT0gJ3N0b3AnKSB7XHJcbi8vICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuLy8gICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4vLyAgICAgaW50ZXJ2YWwgPSBlLmRhdGEuaW50ZXJ2YWw7XHJcbi8vICAgICBpZiAodGltZXIpIHtcclxuLy8gICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbi8vICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7cG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIHNlbGYuY2xvc2UoKTtcclxuLy8gfTtcclxuIl19
