(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//intermix = require('./core.js');
var intermix = _dereq_('./core.js') || {};
intermix.EventBus = _dereq_('./EventBus.js');
intermix.SoundWave = _dereq_('./SoundWave.js');
intermix.Sound = _dereq_('./Sound.js');
intermix.Sequencer = _dereq_('./Sequencer.js');
intermix.Part = _dereq_('./Part.js');

intermix.events = _dereq_('./events.js');
intermix.eventBus = new intermix.EventBus();

module.exports = intermix;

},{"./EventBus.js":3,"./Part.js":4,"./Sequencer.js":5,"./Sound.js":6,"./SoundWave.js":7,"./core.js":8,"./events.js":9}],2:[function(_dereq_,module,exports){
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
 * This is an event bus that can be used to connect
 * intermix (and other) components.
 * It has the usual message events that you can
 * subscribe/unsubscribe to like in Backbone, jquery etc.
 * The more interesting part is a relay
 * system that can be used to share control data between
 * relay attendees.
 * An attendee has to add itself to a relay to become
 * a relay endpoint. Now, all other bus attendees can
 * read out its controllers and send/receive data to/from it.
 * The event bus has two buildin relays 'instrument' and 'fx',
 * others can be added.
 * Sounds complex? Here are some examples:
 * @example <caption>Registering to a relay<caption>
 * var myNewInstrument = function(eventBus) {
 *
 *   this.ctrlSpec = {
 *     'title': String,
 *     'volume': [0, 127],
 *     'pan': [-63, 64],
 *   };
 *
 *   this.uid = eventBus.addRelayEndpoint('instrument', ctrlSpec, this);
 *   ...
 * @example <caption>Sending data to the relay is easy</caption>
 *   ...
 *   eventBus.fireEvent({'volume': 23}, uid);
 *   ...
 * @example <caption>To receive events you have to implement 'handleRelayData'</caption>
 *   ...
 *   this.handleRelayData = function(data) {
 *     // do something with the data
 *   };
 * };
 * @constructor
 * @return {Void}
 */
var EventBus = function() {

  this.lookup = {};
  this.relays = {
    'controller': {},
    'instrument': {},
    'fx': {},
  };

  this.messages = {
    'onRelayAdd': [],
    'onRelayRemove': []
  };

};

/**
 * Adds an endpoint (sequencer, instrument, etc) to a
 * relay and returns a unique id that serves as a
 * key to identify this endpoint from now on.
 * @param  {String} relay   The relay to register to
 * @param  {Object} data    Custom controller definition, can be an empty object if the endpoint doesn't use custom controllers.
 * @param  {Object} context The endpoint object itself (this)
 * @return {String}         A binary-like string ([0-f]*) that serves as a uid
 */
EventBus.prototype.addRelayEndpoint = function(relay, data, context) {
  var uid = this.getUID();

  if (typeof this.relays[relay] !== 'undefined' &&
  this.isPlainObject(data) &&
  typeof context !== 'undefined') {
    this.relays[relay][uid] = {
      'context': context,
      'data': data,
      'relay': relay,
      'subscribers': []
    };
    this.lookup[uid] = this.relays[relay][uid];
    this.sendMessage('onRelayAdd', relay, uid);

    return uid;
  } else {
    throw new TypeError('One or more unvalid arguments');
  }

};

/**
 * Deletes an endpoint (sequencer, instrument, etc) from a relay.
 * @param  {String} relay The relay to be removed from
 * @param  {String} uid   Unique identifier of the endpoint
 * @return {Void}
 */
EventBus.prototype.removeRelayEndpoint = function(relay, uid) {
  if (this.relays[relay].hasOwnProperty(uid)) {
    delete this.relays[relay][uid];
    delete this.lookup[uid];
  } else {
    throw new Error('uid not found in relay ' + relay);
  }
};

/**
 * Get an object of controller definitions of a specific relay endpoint.
 * @param  {String} uid Unique idenifier of the endpoint
 * @return {Object}     Controller definitions
 */
EventBus.prototype.getEndpointSpec = function(uid) {
  return this.lookup[uid].data;
};

/**
 * Get all endpoint specifications for a specific relay.
 * @param  {String} relay The relay of interest
 * @return {Object}       Dictionary of endpoint ids and controller definitions
 */
EventBus.prototype.getAllRelayEndpointSpecs = function(relay) {
  if (typeof this.relays[relay] !== 'undefined') {
    var specs = {};
    for (var uid in this.relays[relay]) {
      specs[uid] = this.relays[relay][uid].data;
    }
    return specs;
  } else {
    throw new TypeError('Relay: ' + relay + ' not found');
  }
};

/**
 * Sends a message to all endpoints of a relay (e.g. all instruments)
 * @param  {String} relay Relay to send the message to
 * @param  {Object} msg   The message
 * @return {Void}
 */
EventBus.prototype.sendToRelay = function(relay, msg) {
  if (this.relays.hasOwnProperty(relay)) {
    for (var uid in this.relays[relay]) {
      this.sendToRelayEndpoint(uid, msg);
    }
  } else {
    throw new TypeError('Argument relay invalid or missing');
  }
};

/**
 * Sends a message to a specific endpoint of a relay.
 * @param  {String} uid Unique id of the relay endpoint
 * @param  {Object} msg The message
 * @return {Void}
 */
EventBus.prototype.sendToRelayEndpoint = function(uid, msg) {
  var endpoint = this.lookup[uid].context;
  endpoint.handleRelayData.call(endpoint, msg);
};

/**
 * Get a list with the names of all relays
 * @return {Array} List with relay names
 */
EventBus.prototype.getRelayNames = function() {
  var names = [];
  for (var name in this.relays) {
    names.push(name);
  }
  return names;
};

/**
 * Get a list with the names of all currently available message types
 * @return {Array} List with message types
 */
EventBus.prototype.getAllMessageTypes = function() {
  var types = [];
  for (var type in this.messages) {
    types.push(type);
  }
  return types;
};

/**
 * Subscribe to a message type
 * @param  {String}   msg     The message type to subscribe to
 * @param  {Function} fn      Callback function
 * @param  {Object}   context The subscriber context (this)
 * @return {Void}
 */
EventBus.prototype.subscribe = function(msg, fn, context) {
  if (typeof msg === 'string' &&
  typeof fn === 'function' &&
  typeof context !== 'undefined') {
    if (typeof this.messages[msg] === 'undefined') {
      this.messages[msg] = [];
    }
    this.messages[msg].push({ 'context': context, 'fn': fn });
  } else {
    throw new TypeError('One or more arguments of wrong type or missing');
  }
};

/**
 * Unsubscribe to a message type
 * @param  {String} msg     The message type to unsubscribe to
 * @param  {Object} context The (un)subscriber context (this)
 * @return {Void}
 */
EventBus.prototype.unsubscribe = function(msg, context) {
  if (typeof context !== 'undefined') {
    var message = this.messages[msg];
    message.forEach(function(subscriber, index) {
      if (subscriber.context === context) {
        message.splice(index, 1);
      }
    });
  } else {
    throw new TypeError('context is undefined');
  }
};

/**
 * Send a message to the bus
 * @param  {String} msg  The message type
 * @param  {Object|Array|String|Number|Boolean|ArrayBuffer} data A message of any format
 * @return {Void}
 */
EventBus.prototype.sendMessage = function(msg, data) {
  var subscribers = this.messages[msg];
  var length = subscribers.length;
  for (var i = 0; i < length; i++) {
    subscribers[i].fn.call(subscribers[i].context, data);
  }
};

/**
 * Creates 16 bytes random data represented as a string
 * @return {String} Random, binary-like UID
 */
EventBus.prototype.getUID = function() {
  var uid = '';
  var i = 32;
  var lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8',
                '9', 'a', 'b', 'c', 'd', 'e', 'f'];

  while (i--) {
    var nibble = Math.random() * 16 | 0;
    uid += lookup[nibble];
  }

  return uid;
};


/**
 * Tests if an object is a plain javascript object (object literal)
 * and not a constructor, instance, null or anything else.
 * as suggested by RobG:
 * http://stackoverflow.com/questions/5876332/how-can-i-differentiate-between-an-object-literal-other-javascript-objects
 * @param  {Object} obj Any javascript object
 * @return {Boolean}    True if plain js object, false if not
 */
EventBus.prototype.isPlainObject = function(obj) {
  if (typeof obj === 'object' && obj !== null) {
    var proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }
  return false;
};

module.exports = EventBus;

},{}],4:[function(_dereq_,module,exports){
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
 * @return {Object} The part object to make the function chainable.
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
 * Removes one event at a given position
 * @param  {Object} seqEvent  The event (note, controller, whatever)
 * @param  {Int}    position  Position in the pattern
 * @return {Object}           The part object to make the function chainable
 */
Part.prototype.removeEvent = function(seqEvent, position) {
  var pos = (position) * this.multiply;
  var index = this.pattern[pos].indexOf(seqEvent);
  if (index >= 0) {
    this.pattern[pos].splice(index, 1);
  }
  return this;
};

/**
 * Removes all events at a given position
 * @param  {Int}    position Position in the pattern
 * @return {Object}          The part object to make the function chainable
 */
Part.prototype.removeEvents = function(position) {
  var pos = (position) * this.multiply;
  this.pattern[pos] = [];
  return this;
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
  this.pattern.forEach(function(events, index) {
    if (events.length > 0) {
      events.forEach(function(evt) {
        if (evt.msg.type === 'note') {
          positions.push(index / this.multiply);
        }
      }, this);
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

},{}],5:[function(_dereq_,module,exports){
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
  this.stepList = [];         //list of steps that were triggered and are still ahead of time
  this.lastPlayedStep = 0;    //step in queue that was played (not triggered) recently (used for drawing).
  this.loop = false;          //play a section of the queue in a loop
  this.loopStart;             //first step of the loop
  this.loopEnd;               //last step of the loop
  this.isRunning = false;     //true if sequencer is running, otherwise false
  this.animationFrame;        //has to be overridden with a function. Will be called in the
                              //draw function with the lastPlayedStep int as parameter.
  this.uid = 0;             //unique id if connected to an event bus

  // set time per setTimePerStep
  this.timePerStep = this.setTimePerStep(this.bpm, this.resolution);

  // Initialize the scheduler-timer
  this.scheduleWorker = work(worker);

  this.registerToRelay('controller');

  this.scheduleWorker.onmessage = function(e) {
    if (e.data === 'tick') {
      self.scheduler();
    }
  };

  this.scheduleWorker.postMessage({'interval': this.interval});
};

Sequencer.prototype.registerToRelay = function(relay) {
  this.uid = window.intermix.eventBus.addRelayEndpoint(relay, {}, this);
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
  var timestamp = core.currentTime;
  var limit = timestamp + this.lookahead;
  // if invoked for the first time or previously stopped
  if (this.nextStepTime === 0) {
    this.nextStepTime = timestamp;
  }

  while (this.nextStepTime < limit) {
    this.addPartsToRunqueue();
    this.fireEvents();
    this.stepList.push(this.getMasterQueuePosition(this.nextStep, this.nextStepTime));
    this.nextStepTime += this.timePerStep;

    this.increaseQueuePointer();
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
 * Sends an event to a relay endpoint. If there is no event bus,
 * this function has to be overridden.
 * @private
 * @param  {Object} seqEvent  The event to process
 * @param  {float}  delay     time in seconds when the event should start
 * @return {Void}
 */
Sequencer.prototype.processSeqEvent = function(seqEvent, delay) {
  seqEvent.msg['delay'] = delay;
  window.intermix.eventBus.sendToRelayEndpoint(seqEvent.uid, seqEvent);
};

/**
 * Sets the pointer to the next step that should be played
 * in the master queue. If we're playing in loop mode,
 * jump back to loopstart when end of loop is reached.
 * @private
 * @return {Void}
 */
Sequencer.prototype.increaseQueuePointer = function() {
  if (this.loop && this.nextStep >= this.loopEnd) {
    this.nextStep = this.loopStart;
    this.runqueue = [];
  } else {
    this.nextStep++;
  }
};

/**
 * Jump to a specific point in the queue.
 * @param   {Int}   position  New position in the master queue
 * @return  {Void}
 */
Sequencer.prototype.setQueuePointer = function(position) {
  this.nextStep = position;
  this.runqueue = [];
};

/**
 * Resets the queue pointer (set to position 0).
 * @return {Void}
 */
Sequencer.prototype.resetQueuePointer = function() {
  this.setQueuePointer(0);
};

Sequencer.prototype.getMasterQueuePosition = function(step, timestamp) {
  return {
    'position': step,
    'time': timestamp
  };
};

/**
 * Starts the sequencer
 * @return {Void}
 */
Sequencer.prototype.start = function() {
  if (!this.isRunning) {
    if (this.stepList.length === 0) {
      this.stepList.push(this.getMasterQueuePosition(0, core.currentTime + 0.1));
    }
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
 * Scheduler that runs a drawing function on screen refresh.
 * It calls itself recursively but only if something
 * happend in the sequencer and as long as the sequencer is running.
 * The function Sequencer.animationFrame() has to be
 * overridden by the application with stuff to be drawn on the screen.
 * @private
 * @return {Void}
 */
Sequencer.prototype.draw = function() {
  console.log(this.stepList.length);
  if (this.isRunning) {
    if (this.stepList[0].time <= core.currentTime) {
      this.updateFrame(this.stepList[0].position);
      this.stepList.shift();
    }
    window.requestAnimationFrame(this.draw.bind(this));
  }
};

/*eslint-disable */
/**
 * Runs between screen refresh. Has to be overridden by the
 * app to render to the screen.
 * @param  {Int}  lastPlayedStep  The 64th step that was played recently
 * @return {Void}
 */
Sequencer.prototype.updateFrame = function(lastPlayedStep) {};
/*eslint-enable */

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
    return this;
  } else {
    throw new TypeError('Given parameter doesn\'t seem to be a part object');
  }
};

/**
 * Removes a part object from the master queue
 * @param  {Object} part     Part instance to be removed
 * @param  {Int}    position Position in the master queue
 * @return {Void}
 */
Sequencer.prototype.removePart = function(part, position) {
  if (part.length && part.pattern) {
    if (this.queue[position] instanceof Array &&
      this.queue[position].length > 0) {
      var index = this.queue[position].indexOf(part);
      if (index >= 0) {
        this.queue[position].splice(index, 1);
      }
    }
    return this;
  } else {
    throw new TypeError('Given parameter doesn\'t seem to be a part object');
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

},{"./core.js":8,"./scheduleWorker.js":10,"webworkify":2}],6:[function(_dereq_,module,exports){
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

  this.eventBus = null;
  this.uid = 0;             //unique id if connected to an event bus
  this.controls = {
    'volume': [0, 127],
    'pan': [-63, 64],
    'note': {
      'value': [0, 127],
      'delay': Number,
      'duration': Number,
      'detune': [-1200, 1200]
    }
  };
  this.eventLookup = {
    note: this.noteMsgHandler,
    volume: this.volumeMsgHandler,
    pan: this.panMsgHandler
  };

  if (typeof soundWave !== 'undefined') {
    this.sw = soundWave;
    this.soundLength = this.loopEnd = this.sw.wave.duration;
    this.setupAudioChain();
  } else {
    throw new TypeError('Error initialising Sound object: parameter wrong or missing.');
  }

  this.registerToRelay('instrument');

  // if (typeof eventBus !== 'undefined') {
  //   this.eventBus = eventBus;
  //   this.registerToRelay('instrument');
  // }
};

Sound.prototype.registerToRelay = function(relay) {
  this.uid = window.intermix.eventBus.addRelayEndpoint(relay, this.controls, this);
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
Sound.prototype.start = function(playLooped, delay, pbRate, duration) {
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

    if (typeof pbRate !== 'undefined') {
      bs.playbackRate.value = bs.tmpPlaybackRate = pbRate;
    } else {
      bs.playbackRate.value = bs.tmpPlaybackRate = this.playbackRate;
    }

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

Sound.prototype.handleRelayData = function(evt) {
  var msg = evt.msg;
  this.eventLookup[msg.type].call(this, msg);
};

Sound.prototype.volumeMsgHandler = function(msg) {
  if (msg.value >= 0 && msg.value <= 127) {
    this.gainNode.gain.value = msg.value / 127;
  }
};

Sound.prototype.panMsgHandler = function(msg) {
  if (msg.value >= -63 && msg.value <= 64) {
    this.pannerNode.pan.value = msg.value / 64;
  }
};

Sound.prototype.noteMsgHandler = function(msg) {
  if (msg.value >= 0 && msg.value <= 127) {
    var pbRate = this.getSemiTonePlaybackRate(msg.value);
    // this.start(this.loop, note.delay, pbRate, note.duration);
    this.start(this.loop, msg.delay, pbRate, msg.duration);
  }
};

/**
 * Processes an event fired by the sequencer.
 * This is no longer in use and will be removed at some point.
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
 * Set the playback rate for all nodes in percentage
 * (1 = 100%, 2 = 200%)
 * @param  {float}  value   Rate in percentage
 * @return {Void}
 */
Sound.prototype.setGlobalPlaybackRate = function(value) {
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
 * Sets the note frequency/playback rate for a note
 * @param  {Integer}  note value between 0 and 127
 * @return {Float}    PlaybackRate for the given note
 */
Sound.prototype.getSemiTonePlaybackRate = function(note) {
  return (note - 60) / 12 + 1;
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

module.exports = Sound;

},{"./core.js":8}],7:[function(_dereq_,module,exports){
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


/**
 * Specifies which internal buffer to expose to the public.
 * @param  {Integer} waveSource Number of the buffer (0=buffer, 1-n=fragment)
 * @return {Void}
 */
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

},{"./core.js":8}],8:[function(_dereq_,module,exports){
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

},{}],9:[function(_dereq_,module,exports){
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

},{}],10:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL0V2ZW50QnVzLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9zcmMvUGFydC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NlcXVlbmNlci5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9zcmMvU291bmRXYXZlLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9zcmMvY29yZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2V2ZW50cy5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL3NjaGVkdWxlV29ya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vaW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIGludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbmludGVybWl4LkV2ZW50QnVzID0gcmVxdWlyZSgnLi9FdmVudEJ1cy5qcycpO1xyXG5pbnRlcm1peC5Tb3VuZFdhdmUgPSByZXF1aXJlKCcuL1NvdW5kV2F2ZS5qcycpO1xyXG5pbnRlcm1peC5Tb3VuZCA9IHJlcXVpcmUoJy4vU291bmQuanMnKTtcclxuaW50ZXJtaXguU2VxdWVuY2VyID0gcmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKTtcclxuaW50ZXJtaXguUGFydCA9IHJlcXVpcmUoJy4vUGFydC5qcycpO1xyXG5cclxuaW50ZXJtaXguZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcclxuaW50ZXJtaXguZXZlbnRCdXMgPSBuZXcgaW50ZXJtaXguRXZlbnRCdXMoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW50ZXJtaXg7XHJcbiIsInZhciBidW5kbGVGbiA9IGFyZ3VtZW50c1szXTtcbnZhciBzb3VyY2VzID0gYXJndW1lbnRzWzRdO1xudmFyIGNhY2hlID0gYXJndW1lbnRzWzVdO1xuXG52YXIgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIgd2tleTtcbiAgICB2YXIgY2FjaGVLZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIHZhciBleHAgPSBjYWNoZVtrZXldLmV4cG9ydHM7XG4gICAgICAgIC8vIFVzaW5nIGJhYmVsIGFzIGEgdHJhbnNwaWxlciB0byB1c2UgZXNtb2R1bGUsIHRoZSBleHBvcnQgd2lsbCBhbHdheXNcbiAgICAgICAgLy8gYmUgYW4gb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgZXhwb3J0IGFzIGEgcHJvcGVydHkgb2YgaXQuIFRvIGVuc3VyZVxuICAgICAgICAvLyB0aGUgZXhpc3RpbmcgYXBpIGFuZCBiYWJlbCBlc21vZHVsZSBleHBvcnRzIGFyZSBib3RoIHN1cHBvcnRlZCB3ZVxuICAgICAgICAvLyBjaGVjayBmb3IgYm90aFxuICAgICAgICBpZiAoZXhwID09PSBmbiB8fCBleHAuZGVmYXVsdCA9PT0gZm4pIHtcbiAgICAgICAgICAgIHdrZXkgPSBrZXk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghd2tleSkge1xuICAgICAgICB3a2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgICAgIHZhciB3Y2FjaGUgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gY2FjaGVLZXlzW2ldO1xuICAgICAgICAgICAgd2NhY2hlW2tleV0gPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlc1t3a2V5XSA9IFtcbiAgICAgICAgICAgIEZ1bmN0aW9uKFsncmVxdWlyZScsJ21vZHVsZScsJ2V4cG9ydHMnXSwgJygnICsgZm4gKyAnKShzZWxmKScpLFxuICAgICAgICAgICAgd2NhY2hlXG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBza2V5ID0gTWF0aC5mbG9vcihNYXRoLnBvdygxNiwgOCkgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG5cbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sIChcbiAgICAgICAgICAgIC8vIHRyeSB0byBjYWxsIGRlZmF1bHQgaWYgZGVmaW5lZCB0byBhbHNvIHN1cHBvcnQgYmFiZWwgZXNtb2R1bGVcbiAgICAgICAgICAgIC8vIGV4cG9ydHNcbiAgICAgICAgICAgICd2YXIgZiA9IHJlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpOycgK1xuICAgICAgICAgICAgJyhmLmRlZmF1bHQgPyBmLmRlZmF1bHQgOiBmKShzZWxmKTsnXG4gICAgICAgICkpLFxuICAgICAgICBzY2FjaGVcbiAgICBdO1xuXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICA7XG5cbiAgICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgICAgbmV3IEJsb2IoW3NyY10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSlcbiAgICApKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogVGhpcyBpcyBhbiBldmVudCBidXMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25uZWN0XHJcbiAqIGludGVybWl4IChhbmQgb3RoZXIpIGNvbXBvbmVudHMuXHJcbiAqIEl0IGhhcyB0aGUgdXN1YWwgbWVzc2FnZSBldmVudHMgdGhhdCB5b3UgY2FuXHJcbiAqIHN1YnNjcmliZS91bnN1YnNjcmliZSB0byBsaWtlIGluIEJhY2tib25lLCBqcXVlcnkgZXRjLlxyXG4gKiBUaGUgbW9yZSBpbnRlcmVzdGluZyBwYXJ0IGlzIGEgcmVsYXlcclxuICogc3lzdGVtIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2hhcmUgY29udHJvbCBkYXRhIGJldHdlZW5cclxuICogcmVsYXkgYXR0ZW5kZWVzLlxyXG4gKiBBbiBhdHRlbmRlZSBoYXMgdG8gYWRkIGl0c2VsZiB0byBhIHJlbGF5IHRvIGJlY29tZVxyXG4gKiBhIHJlbGF5IGVuZHBvaW50LiBOb3csIGFsbCBvdGhlciBidXMgYXR0ZW5kZWVzIGNhblxyXG4gKiByZWFkIG91dCBpdHMgY29udHJvbGxlcnMgYW5kIHNlbmQvcmVjZWl2ZSBkYXRhIHRvL2Zyb20gaXQuXHJcbiAqIFRoZSBldmVudCBidXMgaGFzIHR3byBidWlsZGluIHJlbGF5cyAnaW5zdHJ1bWVudCcgYW5kICdmeCcsXHJcbiAqIG90aGVycyBjYW4gYmUgYWRkZWQuXHJcbiAqIFNvdW5kcyBjb21wbGV4PyBIZXJlIGFyZSBzb21lIGV4YW1wbGVzOlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5SZWdpc3RlcmluZyB0byBhIHJlbGF5PGNhcHRpb24+XHJcbiAqIHZhciBteU5ld0luc3RydW1lbnQgPSBmdW5jdGlvbihldmVudEJ1cykge1xyXG4gKlxyXG4gKiAgIHRoaXMuY3RybFNwZWMgPSB7XHJcbiAqICAgICAndGl0bGUnOiBTdHJpbmcsXHJcbiAqICAgICAndm9sdW1lJzogWzAsIDEyN10sXHJcbiAqICAgICAncGFuJzogWy02MywgNjRdLFxyXG4gKiAgIH07XHJcbiAqXHJcbiAqICAgdGhpcy51aWQgPSBldmVudEJ1cy5hZGRSZWxheUVuZHBvaW50KCdpbnN0cnVtZW50JywgY3RybFNwZWMsIHRoaXMpO1xyXG4gKiAgIC4uLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5TZW5kaW5nIGRhdGEgdG8gdGhlIHJlbGF5IGlzIGVhc3k8L2NhcHRpb24+XHJcbiAqICAgLi4uXHJcbiAqICAgZXZlbnRCdXMuZmlyZUV2ZW50KHsndm9sdW1lJzogMjN9LCB1aWQpO1xyXG4gKiAgIC4uLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5UbyByZWNlaXZlIGV2ZW50cyB5b3UgaGF2ZSB0byBpbXBsZW1lbnQgJ2hhbmRsZVJlbGF5RGF0YSc8L2NhcHRpb24+XHJcbiAqICAgLi4uXHJcbiAqICAgdGhpcy5oYW5kbGVSZWxheURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAqICAgICAvLyBkbyBzb21ldGhpbmcgd2l0aCB0aGUgZGF0YVxyXG4gKiAgIH07XHJcbiAqIH07XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxudmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gIHRoaXMubG9va3VwID0ge307XHJcbiAgdGhpcy5yZWxheXMgPSB7XHJcbiAgICAnY29udHJvbGxlcic6IHt9LFxyXG4gICAgJ2luc3RydW1lbnQnOiB7fSxcclxuICAgICdmeCc6IHt9LFxyXG4gIH07XHJcblxyXG4gIHRoaXMubWVzc2FnZXMgPSB7XHJcbiAgICAnb25SZWxheUFkZCc6IFtdLFxyXG4gICAgJ29uUmVsYXlSZW1vdmUnOiBbXVxyXG4gIH07XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYW4gZW5kcG9pbnQgKHNlcXVlbmNlciwgaW5zdHJ1bWVudCwgZXRjKSB0byBhXHJcbiAqIHJlbGF5IGFuZCByZXR1cm5zIGEgdW5pcXVlIGlkIHRoYXQgc2VydmVzIGFzIGFcclxuICoga2V5IHRvIGlkZW50aWZ5IHRoaXMgZW5kcG9pbnQgZnJvbSBub3cgb24uXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gcmVsYXkgICBUaGUgcmVsYXkgdG8gcmVnaXN0ZXIgdG9cclxuICogQHBhcmFtICB7T2JqZWN0fSBkYXRhICAgIEN1c3RvbSBjb250cm9sbGVyIGRlZmluaXRpb24sIGNhbiBiZSBhbiBlbXB0eSBvYmplY3QgaWYgdGhlIGVuZHBvaW50IGRvZXNuJ3QgdXNlIGN1c3RvbSBjb250cm9sbGVycy5cclxuICogQHBhcmFtICB7T2JqZWN0fSBjb250ZXh0IFRoZSBlbmRwb2ludCBvYmplY3QgaXRzZWxmICh0aGlzKVxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgICAgQSBiaW5hcnktbGlrZSBzdHJpbmcgKFswLWZdKikgdGhhdCBzZXJ2ZXMgYXMgYSB1aWRcclxuICovXHJcbkV2ZW50QnVzLnByb3RvdHlwZS5hZGRSZWxheUVuZHBvaW50ID0gZnVuY3Rpb24ocmVsYXksIGRhdGEsIGNvbnRleHQpIHtcclxuICB2YXIgdWlkID0gdGhpcy5nZXRVSUQoKTtcclxuXHJcbiAgaWYgKHR5cGVvZiB0aGlzLnJlbGF5c1tyZWxheV0gIT09ICd1bmRlZmluZWQnICYmXHJcbiAgdGhpcy5pc1BsYWluT2JqZWN0KGRhdGEpICYmXHJcbiAgdHlwZW9mIGNvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB0aGlzLnJlbGF5c1tyZWxheV1bdWlkXSA9IHtcclxuICAgICAgJ2NvbnRleHQnOiBjb250ZXh0LFxyXG4gICAgICAnZGF0YSc6IGRhdGEsXHJcbiAgICAgICdyZWxheSc6IHJlbGF5LFxyXG4gICAgICAnc3Vic2NyaWJlcnMnOiBbXVxyXG4gICAgfTtcclxuICAgIHRoaXMubG9va3VwW3VpZF0gPSB0aGlzLnJlbGF5c1tyZWxheV1bdWlkXTtcclxuICAgIHRoaXMuc2VuZE1lc3NhZ2UoJ29uUmVsYXlBZGQnLCByZWxheSwgdWlkKTtcclxuXHJcbiAgICByZXR1cm4gdWlkO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPbmUgb3IgbW9yZSB1bnZhbGlkIGFyZ3VtZW50cycpO1xyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKipcclxuICogRGVsZXRlcyBhbiBlbmRwb2ludCAoc2VxdWVuY2VyLCBpbnN0cnVtZW50LCBldGMpIGZyb20gYSByZWxheS5cclxuICogQHBhcmFtICB7U3RyaW5nfSByZWxheSBUaGUgcmVsYXkgdG8gYmUgcmVtb3ZlZCBmcm9tXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gdWlkICAgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGVuZHBvaW50XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5FdmVudEJ1cy5wcm90b3R5cGUucmVtb3ZlUmVsYXlFbmRwb2ludCA9IGZ1bmN0aW9uKHJlbGF5LCB1aWQpIHtcclxuICBpZiAodGhpcy5yZWxheXNbcmVsYXldLmhhc093blByb3BlcnR5KHVpZCkpIHtcclxuICAgIGRlbGV0ZSB0aGlzLnJlbGF5c1tyZWxheV1bdWlkXTtcclxuICAgIGRlbGV0ZSB0aGlzLmxvb2t1cFt1aWRdO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VpZCBub3QgZm91bmQgaW4gcmVsYXkgJyArIHJlbGF5KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFuIG9iamVjdCBvZiBjb250cm9sbGVyIGRlZmluaXRpb25zIG9mIGEgc3BlY2lmaWMgcmVsYXkgZW5kcG9pbnQuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gdWlkIFVuaXF1ZSBpZGVuaWZpZXIgb2YgdGhlIGVuZHBvaW50XHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgIENvbnRyb2xsZXIgZGVmaW5pdGlvbnNcclxuICovXHJcbkV2ZW50QnVzLnByb3RvdHlwZS5nZXRFbmRwb2ludFNwZWMgPSBmdW5jdGlvbih1aWQpIHtcclxuICByZXR1cm4gdGhpcy5sb29rdXBbdWlkXS5kYXRhO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhbGwgZW5kcG9pbnQgc3BlY2lmaWNhdGlvbnMgZm9yIGEgc3BlY2lmaWMgcmVsYXkuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gcmVsYXkgVGhlIHJlbGF5IG9mIGludGVyZXN0XHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgRGljdGlvbmFyeSBvZiBlbmRwb2ludCBpZHMgYW5kIGNvbnRyb2xsZXIgZGVmaW5pdGlvbnNcclxuICovXHJcbkV2ZW50QnVzLnByb3RvdHlwZS5nZXRBbGxSZWxheUVuZHBvaW50U3BlY3MgPSBmdW5jdGlvbihyZWxheSkge1xyXG4gIGlmICh0eXBlb2YgdGhpcy5yZWxheXNbcmVsYXldICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgdmFyIHNwZWNzID0ge307XHJcbiAgICBmb3IgKHZhciB1aWQgaW4gdGhpcy5yZWxheXNbcmVsYXldKSB7XHJcbiAgICAgIHNwZWNzW3VpZF0gPSB0aGlzLnJlbGF5c1tyZWxheV1bdWlkXS5kYXRhO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNwZWNzO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWxheTogJyArIHJlbGF5ICsgJyBub3QgZm91bmQnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBtZXNzYWdlIHRvIGFsbCBlbmRwb2ludHMgb2YgYSByZWxheSAoZS5nLiBhbGwgaW5zdHJ1bWVudHMpXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gcmVsYXkgUmVsYXkgdG8gc2VuZCB0aGUgbWVzc2FnZSB0b1xyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG1zZyAgIFRoZSBtZXNzYWdlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5FdmVudEJ1cy5wcm90b3R5cGUuc2VuZFRvUmVsYXkgPSBmdW5jdGlvbihyZWxheSwgbXNnKSB7XHJcbiAgaWYgKHRoaXMucmVsYXlzLmhhc093blByb3BlcnR5KHJlbGF5KSkge1xyXG4gICAgZm9yICh2YXIgdWlkIGluIHRoaXMucmVsYXlzW3JlbGF5XSkge1xyXG4gICAgICB0aGlzLnNlbmRUb1JlbGF5RW5kcG9pbnQodWlkLCBtc2cpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCByZWxheSBpbnZhbGlkIG9yIG1pc3NpbmcnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBtZXNzYWdlIHRvIGEgc3BlY2lmaWMgZW5kcG9pbnQgb2YgYSByZWxheS5cclxuICogQHBhcmFtICB7U3RyaW5nfSB1aWQgVW5pcXVlIGlkIG9mIHRoZSByZWxheSBlbmRwb2ludFxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG1zZyBUaGUgbWVzc2FnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuRXZlbnRCdXMucHJvdG90eXBlLnNlbmRUb1JlbGF5RW5kcG9pbnQgPSBmdW5jdGlvbih1aWQsIG1zZykge1xyXG4gIHZhciBlbmRwb2ludCA9IHRoaXMubG9va3VwW3VpZF0uY29udGV4dDtcclxuICBlbmRwb2ludC5oYW5kbGVSZWxheURhdGEuY2FsbChlbmRwb2ludCwgbXNnKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBsaXN0IHdpdGggdGhlIG5hbWVzIG9mIGFsbCByZWxheXNcclxuICogQHJldHVybiB7QXJyYXl9IExpc3Qgd2l0aCByZWxheSBuYW1lc1xyXG4gKi9cclxuRXZlbnRCdXMucHJvdG90eXBlLmdldFJlbGF5TmFtZXMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbmFtZXMgPSBbXTtcclxuICBmb3IgKHZhciBuYW1lIGluIHRoaXMucmVsYXlzKSB7XHJcbiAgICBuYW1lcy5wdXNoKG5hbWUpO1xyXG4gIH1cclxuICByZXR1cm4gbmFtZXM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGEgbGlzdCB3aXRoIHRoZSBuYW1lcyBvZiBhbGwgY3VycmVudGx5IGF2YWlsYWJsZSBtZXNzYWdlIHR5cGVzXHJcbiAqIEByZXR1cm4ge0FycmF5fSBMaXN0IHdpdGggbWVzc2FnZSB0eXBlc1xyXG4gKi9cclxuRXZlbnRCdXMucHJvdG90eXBlLmdldEFsbE1lc3NhZ2VUeXBlcyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciB0eXBlcyA9IFtdO1xyXG4gIGZvciAodmFyIHR5cGUgaW4gdGhpcy5tZXNzYWdlcykge1xyXG4gICAgdHlwZXMucHVzaCh0eXBlKTtcclxuICB9XHJcbiAgcmV0dXJuIHR5cGVzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN1YnNjcmliZSB0byBhIG1lc3NhZ2UgdHlwZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgbXNnICAgICBUaGUgbWVzc2FnZSB0eXBlIHRvIHN1YnNjcmliZSB0b1xyXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gICAgICBDYWxsYmFjayBmdW5jdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgY29udGV4dCBUaGUgc3Vic2NyaWJlciBjb250ZXh0ICh0aGlzKVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuRXZlbnRCdXMucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKG1zZywgZm4sIGNvbnRleHQpIHtcclxuICBpZiAodHlwZW9mIG1zZyA9PT0gJ3N0cmluZycgJiZcclxuICB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgJiZcclxuICB0eXBlb2YgY29udGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5tZXNzYWdlc1ttc2ddID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICB0aGlzLm1lc3NhZ2VzW21zZ10gPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMubWVzc2FnZXNbbXNnXS5wdXNoKHsgJ2NvbnRleHQnOiBjb250ZXh0LCAnZm4nOiBmbiB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT25lIG9yIG1vcmUgYXJndW1lbnRzIG9mIHdyb25nIHR5cGUgb3IgbWlzc2luZycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBVbnN1YnNjcmliZSB0byBhIG1lc3NhZ2UgdHlwZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG1zZyAgICAgVGhlIG1lc3NhZ2UgdHlwZSB0byB1bnN1YnNjcmliZSB0b1xyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGNvbnRleHQgVGhlICh1bilzdWJzY3JpYmVyIGNvbnRleHQgKHRoaXMpXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5FdmVudEJ1cy5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbihtc2csIGNvbnRleHQpIHtcclxuICBpZiAodHlwZW9mIGNvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IHRoaXMubWVzc2FnZXNbbXNnXTtcclxuICAgIG1lc3NhZ2UuZm9yRWFjaChmdW5jdGlvbihzdWJzY3JpYmVyLCBpbmRleCkge1xyXG4gICAgICBpZiAoc3Vic2NyaWJlci5jb250ZXh0ID09PSBjb250ZXh0KSB7XHJcbiAgICAgICAgbWVzc2FnZS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignY29udGV4dCBpcyB1bmRlZmluZWQnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZCBhIG1lc3NhZ2UgdG8gdGhlIGJ1c1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG1zZyAgVGhlIG1lc3NhZ2UgdHlwZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R8QXJyYXl8U3RyaW5nfE51bWJlcnxCb29sZWFufEFycmF5QnVmZmVyfSBkYXRhIEEgbWVzc2FnZSBvZiBhbnkgZm9ybWF0XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5FdmVudEJ1cy5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtc2csIGRhdGEpIHtcclxuICB2YXIgc3Vic2NyaWJlcnMgPSB0aGlzLm1lc3NhZ2VzW21zZ107XHJcbiAgdmFyIGxlbmd0aCA9IHN1YnNjcmliZXJzLmxlbmd0aDtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICBzdWJzY3JpYmVyc1tpXS5mbi5jYWxsKHN1YnNjcmliZXJzW2ldLmNvbnRleHQsIGRhdGEpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIDE2IGJ5dGVzIHJhbmRvbSBkYXRhIHJlcHJlc2VudGVkIGFzIGEgc3RyaW5nXHJcbiAqIEByZXR1cm4ge1N0cmluZ30gUmFuZG9tLCBiaW5hcnktbGlrZSBVSURcclxuICovXHJcbkV2ZW50QnVzLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgdWlkID0gJyc7XHJcbiAgdmFyIGkgPSAzMjtcclxuICB2YXIgbG9va3VwID0gWycwJywgJzEnLCAnMicsICczJywgJzQnLCAnNScsICc2JywgJzcnLCAnOCcsXHJcbiAgICAgICAgICAgICAgICAnOScsICdhJywgJ2InLCAnYycsICdkJywgJ2UnLCAnZiddO1xyXG5cclxuICB3aGlsZSAoaS0tKSB7XHJcbiAgICB2YXIgbmliYmxlID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcclxuICAgIHVpZCArPSBsb29rdXBbbmliYmxlXTtcclxuICB9XHJcblxyXG4gIHJldHVybiB1aWQ7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIGFuIG9iamVjdCBpcyBhIHBsYWluIGphdmFzY3JpcHQgb2JqZWN0IChvYmplY3QgbGl0ZXJhbClcclxuICogYW5kIG5vdCBhIGNvbnN0cnVjdG9yLCBpbnN0YW5jZSwgbnVsbCBvciBhbnl0aGluZyBlbHNlLlxyXG4gKiBhcyBzdWdnZXN0ZWQgYnkgUm9iRzpcclxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81ODc2MzMyL2hvdy1jYW4taS1kaWZmZXJlbnRpYXRlLWJldHdlZW4tYW4tb2JqZWN0LWxpdGVyYWwtb3RoZXItamF2YXNjcmlwdC1vYmplY3RzXHJcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqIEFueSBqYXZhc2NyaXB0IG9iamVjdFxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICBUcnVlIGlmIHBsYWluIGpzIG9iamVjdCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5FdmVudEJ1cy5wcm90b3R5cGUuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xyXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBvYmogIT09IG51bGwpIHtcclxuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xyXG4gICAgcmV0dXJuIHByb3RvID09PSBPYmplY3QucHJvdG90eXBlIHx8IHByb3RvID09PSBudWxsO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50QnVzO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogUmVwcmVzZW50cyBhIHBhcnQgb2YgYSBzZXF1ZW5jZS4gSXQgY2FuIGJlXHJcbiAqIHVzZWQgaW4gbWFueSB3YXlzOlxyXG4gKiA8dWw+XHJcbiAqIDxsaT5BIHBhcnQgb2YgYSB0cmFjayBsaWtlIGluIHBpYW5vLXJvbGwgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDxsaT5BIHBhdHRlcm4gbGlrZSBpbiBzdGVwIHNlcXVlbmNlcnMsIGRydW0gY29tcHV0ZXJzIGFuZCB0cmFja2VyczwvbGk+XHJcbiAqIDxsaT5BIGxvb3AgbGlrZSBpbiBsaXZlIHNlcXVlbmNlcnM8L2xpPlxyXG4gKiA8L3VsPlxyXG4gKiBUZWNobmljYWxseSBpdCBjYW4gc3RvcmUgYW55IHR5cGUgb2YgZXZlbnQgeW91ciBzeXN0ZW0gaXMgY2FwYWJsZSBvZi5cclxuICogVGhpcyBtZWFucyBpdCBpcyBub3QgbGltaXRlZCB0byBhdWRpbywgbWlkaSwgb3NjIG9yIGRteCBidXQgY2FuIGhvbGRcclxuICogYW55IHR5cGUgb2YgamF2YXNjcmlwdCBvYmplY3QuIEEgcG9zc2libGUgdXNlY2FzZSB3b3VsZCBiZSB0byB0cmlnZ2VyXHJcbiAqIHNjcmVlbiBldmVudHMgd2l0aCB0aGUgZHJhdyBmdW5jdGlvbiBvZiB0aGUgc2VxdWVuY2VyIG9iamVjdC5cclxuICogQGV4YW1wbGVcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZU9iamVjdCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHZhciBwYXJ0ID0gbmV3IGludGVybWl4LlBhcnQoKTtcclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdhMycsIDEsIDAsIHNvdW5kKTtcclxuICogcGFydC5hZGRFdmVudChub3RlLCAwKTtcclxuICogcGFydC5hZGRFdmVudChub3RlLCA0KTtcclxuICogc2VxLmFkZFBhcnQocGFydCwgMCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGxlbmd0aCAgICAgICBMZW5ndGggb2YgdGhlIHBhcnQgaW4gNjR0aCBub3RlcyAoZGVmYXVsdDogNjQpXHJcbiAqL1xyXG52YXIgUGFydCA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG5cclxuICB0aGlzLnJlc29sdXRpb24gPSAxNjsgLy8gKHJlc29sdXRpb24gKiBtdWx0aXBseSkgc2hvdWxkIGFsd2FzeSBiZSA2NFxyXG4gIHRoaXMubXVsdGlwbHkgPSA0OyAgICAvLyByZXNvbHV0aW9uIG11bHRpcGxpZXJcclxuICB0aGlzLmxlbmd0aCA9IDY0OyAgICAgLy8gbGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIGluIDY0dGggbm90ZXNcclxuICB0aGlzLm5hbWUgPSAnUGFydCc7ICAgLy8gbmFtZSBvZiB0aGlzIHBhcnRcclxuICB0aGlzLnBhdHRlcm4gPSBbXTsgICAgLy8gdGhlIGFjdHVhbCBwYXR0ZXJuIHdpdGggbm90ZXMgZXRjLlxyXG5cclxuICBpZiAobGVuZ3RoKSB7XHJcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICB9XHJcblxyXG4gIHRoaXMucGF0dGVybiA9IHRoaXMuaW5pdFBhdHRlcm4odGhpcy5sZW5ndGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgYW4gZW1wdHkgcGF0dGVybiBmb3IgdGhlIHBhcnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICBMZW5ndGggb2YgdGhlIHBhdHRlcm4gbWVzdXJlZCBpbiBiYXJzICg0IGJlYXRzID0gMSBiYXIpXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5pbml0UGF0dGVybiA9IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gIHZhciBwYXR0ZXJuID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAobGVuZ3RoKTsgaSsrKSB7XHJcbiAgICBwYXR0ZXJuW2ldID0gW107XHJcbiAgfVxyXG4gIHJldHVybiBwYXR0ZXJuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYW4gZXZlbnQgdG8gdGhlIHBhdHRlcm4gYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBwYXJ0IG9iamVjdCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5hZGRFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIGlmIChwb3NpdGlvbiA8PSB0aGlzLnJlc29sdXRpb24pIHtcclxuICAgIHZhciBwb3MgPSAocG9zaXRpb24pICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvc2l0aW9uIG91dCBvZiBwYXR0ZXJuIGJvdW5kcy4nKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBvbmUgZXZlbnQgYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgKG5vdGUsIGNvbnRyb2xsZXIsIHdoYXRldmVyKVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICBUaGUgcGFydCBvYmplY3QgdG8gbWFrZSB0aGUgZnVuY3Rpb24gY2hhaW5hYmxlXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIHZhciBwb3MgPSAocG9zaXRpb24pICogdGhpcy5tdWx0aXBseTtcclxuICB2YXIgaW5kZXggPSB0aGlzLnBhdHRlcm5bcG9zXS5pbmRleE9mKHNlcUV2ZW50KTtcclxuICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgdGhpcy5wYXR0ZXJuW3Bvc10uc3BsaWNlKGluZGV4LCAxKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgZXZlbnRzIGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiBQb3NpdGlvbiBpbiB0aGUgcGF0dGVyblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgIFRoZSBwYXJ0IG9iamVjdCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGVcclxuICovXHJcblBhcnQucHJvdG90eXBlLnJlbW92ZUV2ZW50cyA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgdmFyIHBvcyA9IChwb3NpdGlvbikgKiB0aGlzLm11bHRpcGx5O1xyXG4gIHRoaXMucGF0dGVybltwb3NdID0gW107XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtJbnR9ICAgIExlbmd0aCBvZiB0aGUgcGF0dGVyblxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGF0dGVybi5sZW5ndGg7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NpdGlvbnMgdGhhdCBjb250YWluIGF0IGxlYXN0IG9uZSBldmVudC5cclxuICogQ2FuIGJlIGhhbmR5IHRvIGRyYXcgZXZlbnRzIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPmZyb20ge0B0dXRvcmlhbCBTdGVwc2VxdWVuY2VyfTwvY2FwdGlvbj5cclxuICogYmRTdGVwcyA9IGJkUGFydC5nZXROb3RlUG9zaXRpb25zKCk7XHJcbiAqIGJkU3RlcHMuZm9yRWFjaChmdW5jdGlvbihwb3MpIHtcclxuICogICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmQnICsgcG9zKS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmVkJztcclxuICogfSk7XHJcbiAqIEByZXR1cm4ge0FycmF5fSAgTGlzdCB3aXRoIGFsbCBub24tZW1wdHkgcGF0dGVybiBlbnRyaWVzXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5nZXROb3RlUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xyXG4gIHRoaXMucGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50cywgaW5kZXgpIHtcclxuICAgIGlmIChldmVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBldmVudHMuZm9yRWFjaChmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBpZiAoZXZ0Lm1zZy50eXBlID09PSAnbm90ZScpIHtcclxuICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKGluZGV4IC8gdGhpcy5tdWx0aXBseSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxuICByZXR1cm4gcG9zaXRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSB0b3Avc3RhcnQuXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPblRvcCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gZXh0ZW5zaW9uLmNvbmNhdCh0aGlzLnBhdHRlcm4pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgYSBwYXJ0IGF0IHRoZSBlbmRcclxuICogQHBhcmFtICB7ZmxvYXR9ICBleHRMZW5ndGggTGVuZ3RoIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblBhcnQucHJvdG90eXBlLmV4dGVuZE9uRW5kID0gZnVuY3Rpb24oZXh0TGVuZ3RoKSB7XHJcbiAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuaW5pdFBhdHRlcm4oZXh0TGVuZ3RoKTtcclxuICB0aGlzLnBhdHRlcm4gPSB0aGlzLnBhdHRlcm4uY29uY2F0KGV4dGVuc2lvbik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB3b3JrID0gcmVxdWlyZSgnd2Vid29ya2lmeScpOyAgIC8vcHJlcGFyZXMgdGhlIHdvcmtlciBmb3IgYnJvd3NlcmlmeVxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgd29ya2VyID0gcmVxdWlyZSgnLi9zY2hlZHVsZVdvcmtlci5qcycpO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBtYWluIGNsYXNzIG9mIHRoZSBzZXF1ZW5jZXIuIEl0IGRvZXMgdGhlIHF1ZXVpbmcgb2ZcclxuICogcGFydHMgYW5kIGV2ZW50cyBhbmQgcnVucyB0aGUgc2NoZWR1bGVycyB0aGF0IGZpcmUgZXZlbnRzXHJcbiAqIGFuZCBkcmF3cyB0byB0aGUgc2NyZWVuLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgcGFydCA9IG5ldyBpbnRlcm1peC5QYXJ0KCk7XHJcbiAqIHZhciBzZXEgPSBuZXcgaW50ZXJtaXguU2VxdWVuY2VyKCk7XHJcbiAqIHBhcnQuYWRkRXZlbnQoc29tZU5vdGUsIDApO1xyXG4gKiBzZXEuYWRkUGFydChwYXJ0LCAwKTtcclxuICogc2VxLnN0YXJ0KCk7XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIFNlcXVlbmNlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJwbSA9IDEyMDsgICAgICAgICAgICAgLy9iZWF0cyBwZXIgbWludXRlXHJcbiAgdGhpcy5yZXNvbHV0aW9uID0gNjQ7ICAgICAgIC8vc2hvcnRlc3QgcG9zc2libGUgbm90ZS4gWW91IG5vcm1hbGx5IGRvbid0IHdhbnQgdG8gdG91Y2ggdGhpcy5cclxuICB0aGlzLmludGVydmFsID0gMTAwOyAgICAgICAgLy90aGUgaW50ZXJ2YWwgaW4gbWlsaXNlY29uZHMgdGhlIHNjaGVkdWxlciBnZXRzIGludm9rZWQuXHJcbiAgdGhpcy5sb29rYWhlYWQgPSAwLjM7ICAgICAgIC8vdGltZSBpbiBzZWNvbmRzIHRoZSBzY2hlZHVsZXIgbG9va3MgYWhlYWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGxvbmdlciB0aGFuIGludGVydmFsLlxyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgICAvL0xpc3Qgd2l0aCBhbGwgcGFydHMgb2YgdGhlIHNjb3JlXHJcbiAgdGhpcy5ydW5xdWV1ZSA9IFtdOyAgICAgICAgIC8vbGlzdCB3aXRoIHBhcnRzIHRoYXQgYXJlIHBsYXlpbmcgb3Igd2lsbCBiZSBwbGF5ZWQgc2hvcnRseVxyXG5cclxuICB0aGlzLnRpbWVQZXJTdGVwOyAgICAgICAgICAgLy9wZXJpb2Qgb2YgdGltZSBiZXR3ZWVuIHR3byBzdGVwc1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDsgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB3aGVuIHRoZSBuZXh0IHN0ZXAgd2lsbCBiZSB0cmlnZ2VyZWRcclxuICB0aGlzLm5leHRTdGVwID0gMDsgICAgICAgICAgLy9wb3NpdGlvbiBpbiB0aGUgcXVldWUgdGhhdCB3aWxsIGdldCB0cmlnZ2VyZWQgbmV4dFxyXG4gIHRoaXMuc3RlcExpc3QgPSBbXTsgICAgICAgICAvL2xpc3Qgb2Ygc3RlcHMgdGhhdCB3ZXJlIHRyaWdnZXJlZCBhbmQgYXJlIHN0aWxsIGFoZWFkIG9mIHRpbWVcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gMDsgICAgLy9zdGVwIGluIHF1ZXVlIHRoYXQgd2FzIHBsYXllZCAobm90IHRyaWdnZXJlZCkgcmVjZW50bHkgKHVzZWQgZm9yIGRyYXdpbmcpLlxyXG4gIHRoaXMubG9vcCA9IGZhbHNlOyAgICAgICAgICAvL3BsYXkgYSBzZWN0aW9uIG9mIHRoZSBxdWV1ZSBpbiBhIGxvb3BcclxuICB0aGlzLmxvb3BTdGFydDsgICAgICAgICAgICAgLy9maXJzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5sb29wRW5kOyAgICAgICAgICAgICAgIC8vbGFzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTsgICAgIC8vdHJ1ZSBpZiBzZXF1ZW5jZXIgaXMgcnVubmluZywgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgdGhpcy5hbmltYXRpb25GcmFtZTsgICAgICAgIC8vaGFzIHRvIGJlIG92ZXJyaWRkZW4gd2l0aCBhIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBpbiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9kcmF3IGZ1bmN0aW9uIHdpdGggdGhlIGxhc3RQbGF5ZWRTdGVwIGludCBhcyBwYXJhbWV0ZXIuXHJcbiAgdGhpcy51aWQgPSAwOyAgICAgICAgICAgICAvL3VuaXF1ZSBpZCBpZiBjb25uZWN0ZWQgdG8gYW4gZXZlbnQgYnVzXHJcblxyXG4gIC8vIHNldCB0aW1lIHBlciBzZXRUaW1lUGVyU3RlcFxyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKHRoaXMuYnBtLCB0aGlzLnJlc29sdXRpb24pO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBzY2hlZHVsZXItdGltZXJcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyID0gd29yayh3b3JrZXIpO1xyXG5cclxuICB0aGlzLnJlZ2lzdGVyVG9SZWxheSgnY29udHJvbGxlcicpO1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICd0aWNrJykge1xyXG4gICAgICBzZWxmLnNjaGVkdWxlcigpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoeydpbnRlcnZhbCc6IHRoaXMuaW50ZXJ2YWx9KTtcclxufTtcclxuXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVnaXN0ZXJUb1JlbGF5ID0gZnVuY3Rpb24ocmVsYXkpIHtcclxuICB0aGlzLnVpZCA9IHdpbmRvdy5pbnRlcm1peC5ldmVudEJ1cy5hZGRSZWxheUVuZHBvaW50KHJlbGF5LCB7fSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgZXZlbnRzIGZyb20gdGhlIG1hc3RlciBxdWV1ZSBhbmQgZmlyZXMgdGhlbS5cclxuICogSXQgZ2V0cyBjYWxsZWQgYXQgYSBjb25zdGFudCByYXRlLCBsb29rcyBhaGVhZCBpblxyXG4gKiB0aGUgcXVldWUgYW5kIGZpcmVzIGFsbCBldmVudHMgaW4gdGhlIG5lYXIgZnV0dXJlXHJcbiAqIHdpdGggYSBkZWxheSBjb21wdXRlZCBmcm9tIHRoZSBjdXJyZW50IGJwbSB2YWx1ZS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHRpbWVzdGFtcCA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgdmFyIGxpbWl0ID0gdGltZXN0YW1wICsgdGhpcy5sb29rYWhlYWQ7XHJcbiAgLy8gaWYgaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUgb3IgcHJldmlvdXNseSBzdG9wcGVkXHJcbiAgaWYgKHRoaXMubmV4dFN0ZXBUaW1lID09PSAwKSB7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSA9IHRpbWVzdGFtcDtcclxuICB9XHJcblxyXG4gIHdoaWxlICh0aGlzLm5leHRTdGVwVGltZSA8IGxpbWl0KSB7XHJcbiAgICB0aGlzLmFkZFBhcnRzVG9SdW5xdWV1ZSgpO1xyXG4gICAgdGhpcy5maXJlRXZlbnRzKCk7XHJcbiAgICB0aGlzLnN0ZXBMaXN0LnB1c2godGhpcy5nZXRNYXN0ZXJRdWV1ZVBvc2l0aW9uKHRoaXMubmV4dFN0ZXAsIHRoaXMubmV4dFN0ZXBUaW1lKSk7XHJcbiAgICB0aGlzLm5leHRTdGVwVGltZSArPSB0aGlzLnRpbWVQZXJTdGVwO1xyXG5cclxuICAgIHRoaXMuaW5jcmVhc2VRdWV1ZVBvaW50ZXIoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogTG9va3MgaW4gdGhlIG1hc3RlciBxdWV1ZSBmb3IgcGFydHMgYW5kIGFkZHNcclxuICogY29waWVzIG9mIHRoZW0gdG8gdGhlIHJ1bnF1ZXVlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5hZGRQYXJ0c1RvUnVucXVldWUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodHlwZW9mIHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5sZW5ndGggPT09IDEpIHtcclxuICAgICAgdmFyIHBhcnQgPSB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdWzBdO1xyXG4gICAgICBwYXJ0LnBvaW50ZXIgPSAwO1xyXG4gICAgICB0aGlzLnJ1bnF1ZXVlLnB1c2gocGFydCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnF1ZXVlW3RoaXMubmV4dFN0ZXBdLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xyXG4gICAgICAgIHBhcnQucG9pbnRlciA9IDA7XHJcbiAgICAgICAgdGhpcy5ydW5xdWV1ZS5wdXNoKHBhcnQpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRGVsZXRlcyBwYXJ0cyBmcm9tIHJ1bnF1ZXVlLiBJdCBpcyBpbXBvcnRhbnQsIHRoYXQgdGhlIGluZGljZXNcclxuICogb2YgdGhlIHBhcnRzIGFyZSBzb3J0ZWQgZnJvbSBtYXggdG8gbWluLiBPdGhlcndpc2UgdGhlIGZvckVhY2hcclxuICogbG9vcCB3b24ndCB3b3JrLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gaW5kaWNlcyAgSW5kaWNlcyBvZiB0aGUgcGFydHMgaW4gdGhlIHJ1bnF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmRlbGV0ZVBhcnRzRnJvbVJ1bnF1ZXVlID0gZnVuY3Rpb24oaW5kaWNlcykge1xyXG4gIGlmIChpbmRpY2VzLmxlbmd0aCA+IDApIHtcclxuICAgIGluZGljZXMuZm9yRWFjaChmdW5jdGlvbihpZCkge1xyXG4gICAgICBkZWxldGUgdGhpcy5ydW5xdWV1ZVtpZF0ucG9pbnRlcjtcclxuICAgICAgdGhpcy5ydW5xdWV1ZS5zcGxpY2UoaWQsIDEpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpcmVzIGFsbCBldmVudHMgZm9yIHRoZSB1cGNvbW1pbmcgc3RlcC5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZmlyZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBtYXJrRm9yRGVsZXRlID0gW107XHJcbiAgdGhpcy5ydW5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGluZGV4KSB7XHJcbiAgICBpZiAocGFydC5wb2ludGVyID09PSBwYXJ0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgbWFya0ZvckRlbGV0ZS51bnNoaWZ0KGluZGV4KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciBzZXFFdmVudHMgPSBwYXJ0LnBhdHRlcm5bcGFydC5wb2ludGVyXTtcclxuICAgICAgaWYgKHNlcUV2ZW50cyAmJiBzZXFFdmVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIHNlcUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgICAgICAgICB0aGlzLnByb2Nlc3NTZXFFdmVudChzZXFFdmVudCwgdGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9IGVsc2UgaWYgKHNlcUV2ZW50cyAmJiBzZXFFdmVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnRzWzBdLCB0aGlzLm5leHRTdGVwVGltZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHBhcnQucG9pbnRlcisrO1xyXG4gIH0sIHRoaXMpO1xyXG4gIHRoaXMuZGVsZXRlUGFydHNGcm9tUnVucXVldWUobWFya0ZvckRlbGV0ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgYW4gZXZlbnQgdG8gYSByZWxheSBlbmRwb2ludC4gSWYgdGhlcmUgaXMgbm8gZXZlbnQgYnVzLFxyXG4gKiB0aGlzIGZ1bmN0aW9uIGhhcyB0byBiZSBvdmVycmlkZGVuLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgdG8gcHJvY2Vzc1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGRlbGF5ICAgICB0aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgZXZlbnQgc2hvdWxkIHN0YXJ0XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBkZWxheSkge1xyXG4gIHNlcUV2ZW50Lm1zZ1snZGVsYXknXSA9IGRlbGF5O1xyXG4gIHdpbmRvdy5pbnRlcm1peC5ldmVudEJ1cy5zZW5kVG9SZWxheUVuZHBvaW50KHNlcUV2ZW50LnVpZCwgc2VxRXZlbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHBvaW50ZXIgdG8gdGhlIG5leHQgc3RlcCB0aGF0IHNob3VsZCBiZSBwbGF5ZWRcclxuICogaW4gdGhlIG1hc3RlciBxdWV1ZS4gSWYgd2UncmUgcGxheWluZyBpbiBsb29wIG1vZGUsXHJcbiAqIGp1bXAgYmFjayB0byBsb29wc3RhcnQgd2hlbiBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5pbmNyZWFzZVF1ZXVlUG9pbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLmxvb3AgJiYgdGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgIHRoaXMubmV4dFN0ZXAgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgIHRoaXMucnVucXVldWUgPSBbXTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5uZXh0U3RlcCsrO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBKdW1wIHRvIGEgc3BlY2lmaWMgcG9pbnQgaW4gdGhlIHF1ZXVlLlxyXG4gKiBAcGFyYW0gICB7SW50fSAgIHBvc2l0aW9uICBOZXcgcG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICB0aGlzLm5leHRTdGVwID0gcG9zaXRpb247XHJcbiAgdGhpcy5ydW5xdWV1ZSA9IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgcXVldWUgcG9pbnRlciAoc2V0IHRvIHBvc2l0aW9uIDApLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5yZXNldFF1ZXVlUG9pbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuc2V0UXVldWVQb2ludGVyKDApO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5nZXRNYXN0ZXJRdWV1ZVBvc2l0aW9uID0gZnVuY3Rpb24oc3RlcCwgdGltZXN0YW1wKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICdwb3NpdGlvbic6IHN0ZXAsXHJcbiAgICAndGltZSc6IHRpbWVzdGFtcFxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIHRoZSBzZXF1ZW5jZXJcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoIXRoaXMuaXNSdW5uaW5nKSB7XHJcbiAgICBpZiAodGhpcy5zdGVwTGlzdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgdGhpcy5zdGVwTGlzdC5wdXNoKHRoaXMuZ2V0TWFzdGVyUXVldWVQb3NpdGlvbigwLCBjb3JlLmN1cnJlbnRUaW1lICsgMC4xKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gICAgdGhpcy5pc1J1bm5pbmcgPSB0cnVlO1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgKGhhbHRzIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uKVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gIHRoaXMubmV4dFN0ZXBUaW1lID0gMDtcclxuICB0aGlzLmlzUnVubmluZyA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHRoZSBzZXF1ZW5jZXIgYW5kIHN1c3BlbmRzIHRoZSBBdWRpb0NvbnRleHQgdG9cclxuICogZ2xvYmFsbHkgaGFsdCBhbGwgYXVkaW8gc3RyZWFtcy4gSXQganVzdCBoYWx0cyBpZlxyXG4gKiBpZiBzZXF1ZW5jZXIgYW5kIEF1ZGlvQ29udGV4dCBib3RoIGFyZSBpbiBydW5uaW5nIHN0YXRlLlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGhhbHRlZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKGNvcmUuc3RhdGUgPT09ICdydW5uaW5nJyAmJiB0aGlzLmlzUnVubmluZykge1xyXG4gICAgdGhpcy5zdG9wKCk7XHJcbiAgICBjb3JlLnN1c3BlbmQoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VtZXMgdGhlIEF1ZGlvQ29udGV4dCBhbmQgc3RhcnRzIHRoZSBzZXF1ZW5jZXIgYXQgaXRzXHJcbiAqIGN1cnJlbnQgcG9zaXRpb24uIEl0IGp1c3Qgc3RhcnRzIGlmIHNlcXVlbmNlciBhbmQgQXVkaW9Db250ZXh0XHJcbiAqIGJvdGggYXJlIHN0b3BwZWQuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgcmVzdW1lZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmIChjb3JlLnN0YXRlID09PSAnc3VzcGVuZGVkJyAmJiAhdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc3RhcnQoKTtcclxuICAgIGNvcmUucmVzdW1lKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY2hlZHVsZXIgdGhhdCBydW5zIGEgZHJhd2luZyBmdW5jdGlvbiBvbiBzY3JlZW4gcmVmcmVzaC5cclxuICogSXQgY2FsbHMgaXRzZWxmIHJlY3Vyc2l2ZWx5IGJ1dCBvbmx5IGlmIHNvbWV0aGluZ1xyXG4gKiBoYXBwZW5kIGluIHRoZSBzZXF1ZW5jZXIgYW5kIGFzIGxvbmcgYXMgdGhlIHNlcXVlbmNlciBpcyBydW5uaW5nLlxyXG4gKiBUaGUgZnVuY3Rpb24gU2VxdWVuY2VyLmFuaW1hdGlvbkZyYW1lKCkgaGFzIHRvIGJlXHJcbiAqIG92ZXJyaWRkZW4gYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggc3R1ZmYgdG8gYmUgZHJhd24gb24gdGhlIHNjcmVlbi5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnNvbGUubG9nKHRoaXMuc3RlcExpc3QubGVuZ3RoKTtcclxuICBpZiAodGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIGlmICh0aGlzLnN0ZXBMaXN0WzBdLnRpbWUgPD0gY29yZS5jdXJyZW50VGltZSkge1xyXG4gICAgICB0aGlzLnVwZGF0ZUZyYW1lKHRoaXMuc3RlcExpc3RbMF0ucG9zaXRpb24pO1xyXG4gICAgICB0aGlzLnN0ZXBMaXN0LnNoaWZ0KCk7XHJcbiAgICB9XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG4vKmVzbGludC1kaXNhYmxlICovXHJcbi8qKlxyXG4gKiBSdW5zIGJldHdlZW4gc2NyZWVuIHJlZnJlc2guIEhhcyB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZVxyXG4gKiBhcHAgdG8gcmVuZGVyIHRvIHRoZSBzY3JlZW4uXHJcbiAqIEBwYXJhbSAge0ludH0gIGxhc3RQbGF5ZWRTdGVwICBUaGUgNjR0aCBzdGVwIHRoYXQgd2FzIHBsYXllZCByZWNlbnRseVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS51cGRhdGVGcmFtZSA9IGZ1bmN0aW9uKGxhc3RQbGF5ZWRTdGVwKSB7fTtcclxuLyplc2xpbnQtZW5hYmxlICovXHJcblxyXG4vKipcclxuICogQWRkcyBhIHBhcnQgdG8gdGhlIG1hc3RlciBxdWV1ZS5cclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICAgQW4gaW5zdGFuY2Ugb2YgUGFydFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uICBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmFkZFBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmIChwYXJ0Lmxlbmd0aCAmJiBwYXJ0LnBhdHRlcm4pIHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVtwb3NpdGlvbl0pIHtcclxuICAgICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0gPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnB1c2gocGFydCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignR2l2ZW4gcGFyYW1ldGVyIGRvZXNuXFwndCBzZWVtIHRvIGJlIGEgcGFydCBvYmplY3QnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHBhcnQgb2JqZWN0IGZyb20gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcnQgICAgIFBhcnQgaW5zdGFuY2UgdG8gYmUgcmVtb3ZlZFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHBvc2l0aW9uIFBvc2l0aW9uIGluIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUucmVtb3ZlUGFydCA9IGZ1bmN0aW9uKHBhcnQsIHBvc2l0aW9uKSB7XHJcbiAgaWYgKHBhcnQubGVuZ3RoICYmIHBhcnQucGF0dGVybikge1xyXG4gICAgaWYgKHRoaXMucXVldWVbcG9zaXRpb25dIGluc3RhbmNlb2YgQXJyYXkgJiZcclxuICAgICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0ubGVuZ3RoID4gMCkge1xyXG4gICAgICB2YXIgaW5kZXggPSB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5pbmRleE9mKHBhcnQpO1xyXG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICAgIHRoaXMucXVldWVbcG9zaXRpb25dLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgIH1cclxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignR2l2ZW4gcGFyYW1ldGVyIGRvZXNuXFwndCBzZWVtIHRvIGJlIGEgcGFydCBvYmplY3QnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgIGJwbSBiZWF0cyBwZXIgbWludXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldEJwbSA9IGZ1bmN0aW9uKGJwbSkge1xyXG4gIHRoaXMuYnBtID0gYnBtO1xyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKGJwbSwgdGhpcy5yZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlcyB0aGUgdGltZSBpbiBzZWNvbmRzIGFzIGZsb2F0IHZhbHVlXHJcbiAqIGJldHdlZW4gb25lIHNob3J0ZXN0IHBvc3NzaWJsZSBub3RlXHJcbiAqICg2NHRoIGJ5IGRlZmF1bHQpIGFuZCB0aGUgbmV4dC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBicG0gICAgICAgIGJlYXRzIHBlciBtaW51dGVcclxuICogQHBhcmFtICB7SW50fSAgICByZXNvbHV0aW9uIHNob3J0ZXN0IHBvc3NpYmxlIG5vdGUgdmFsdWVcclxuICogQHJldHVybiB7ZmxvYXR9ICAgICAgICAgICAgIHRpbWUgaW4gc2Vjb25kc1xyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zZXRUaW1lUGVyU3RlcCA9IGZ1bmN0aW9uKGJwbSwgcmVzb2x1dGlvbikge1xyXG4gIHJldHVybiAoNjAgKiA0KSAvIChicG0gKiByZXNvbHV0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIFBsYXkgYSBzb3VuZCB0aGF0IGNhbiBiZSBsb29wZWQuIFBhdXNlL1N0YXJ0IHdvcmtzIHNhbXBsZS1hY2N1cmF0ZVxyXG4gKiBhdCBhbnkgcmF0ZS4gSGl0IHRoZSBzdGFydCBidXR0b24gbXVsdGlwbGUgdGltZXMgdG8gaGF2ZSBtdWx0aXBsZVxyXG4gKiBzb3VuZHMgcGxheWVkLiBBbGwgcGFyYW1ldGVycyBhcmUgYWRqdXN0YWJsZSBpbiByZWFsdGltZS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnYXVkaW9maWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQuc3RhcnQoKTtcclxuICogQHR1dG9yaWFsIFNvdW5kXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNvdW5kV2F2ZSBTb3VuZFdhdmUgb2JqZWN0IGluY2x1ZGluZyB0aGUgYnVmZmVyIHdpdGggYXVkaW8gZGF0YSB0byBiZSBwbGF5ZWRcclxuICovXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKHNvdW5kV2F2ZSkge1xyXG5cclxuICB0aGlzLnN3ID0gbnVsbDsgICAgICAgICAgIC8vcG9pbnRlciB0byB0aGUgc291bmRXYXZlIG9iamVjdFxyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXRzID0gW107ICAgLy9ob2xkcyBzdGFydCBvZmZzZXRzIGlmIHBhdXNlZFxyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDsgICAgICAgLy93aGVuIHRoZSBzb3VuZCBzdGFydHMgdG8gcGxheVxyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gMTtcclxuICB0aGlzLmRldHVuZSA9IDA7XHJcblxyXG4gIHRoaXMuZXZlbnRCdXMgPSBudWxsO1xyXG4gIHRoaXMudWlkID0gMDsgICAgICAgICAgICAgLy91bmlxdWUgaWQgaWYgY29ubmVjdGVkIHRvIGFuIGV2ZW50IGJ1c1xyXG4gIHRoaXMuY29udHJvbHMgPSB7XHJcbiAgICAndm9sdW1lJzogWzAsIDEyN10sXHJcbiAgICAncGFuJzogWy02MywgNjRdLFxyXG4gICAgJ25vdGUnOiB7XHJcbiAgICAgICd2YWx1ZSc6IFswLCAxMjddLFxyXG4gICAgICAnZGVsYXknOiBOdW1iZXIsXHJcbiAgICAgICdkdXJhdGlvbic6IE51bWJlcixcclxuICAgICAgJ2RldHVuZSc6IFstMTIwMCwgMTIwMF1cclxuICAgIH1cclxuICB9O1xyXG4gIHRoaXMuZXZlbnRMb29rdXAgPSB7XHJcbiAgICBub3RlOiB0aGlzLm5vdGVNc2dIYW5kbGVyLFxyXG4gICAgdm9sdW1lOiB0aGlzLnZvbHVtZU1zZ0hhbmRsZXIsXHJcbiAgICBwYW46IHRoaXMucGFuTXNnSGFuZGxlclxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2Ygc291bmRXYXZlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgdGhpcy5zdyA9IHNvdW5kV2F2ZTtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSB0aGlzLnN3LndhdmUuZHVyYXRpb247XHJcbiAgICB0aGlzLnNldHVwQXVkaW9DaGFpbigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgd3Jvbmcgb3IgbWlzc2luZy4nKTtcclxuICB9XHJcblxyXG4gIHRoaXMucmVnaXN0ZXJUb1JlbGF5KCdpbnN0cnVtZW50Jyk7XHJcblxyXG4gIC8vIGlmICh0eXBlb2YgZXZlbnRCdXMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgLy8gICB0aGlzLmV2ZW50QnVzID0gZXZlbnRCdXM7XHJcbiAgLy8gICB0aGlzLnJlZ2lzdGVyVG9SZWxheSgnaW5zdHJ1bWVudCcpO1xyXG4gIC8vIH1cclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5yZWdpc3RlclRvUmVsYXkgPSBmdW5jdGlvbihyZWxheSkge1xyXG4gIHRoaXMudWlkID0gd2luZG93LmludGVybWl4LmV2ZW50QnVzLmFkZFJlbGF5RW5kcG9pbnQocmVsYXksIHRoaXMuY29udHJvbHMsIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBnYWluIGFuZCBzdGVyZW8tcGFubmVyIG5vZGUsIGNvbm5lY3RzIHRoZW1cclxuICogKGdhaW4gLT4gcGFubmVyKSBhbmQgc2V0cyBnYWluIHRvIDEgKG1heCB2YWx1ZSkuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IGNvcmUuY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IGNvcmUuY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QoY29yZS5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgQnVmZmVyU291cmNlTm9kZVxyXG4gKiB0aGF0IGNhbiBiZSBwbGF5ZWQgb25jZSBhbmQgdGhlbiBkZXN0cm95cyBpdHNlbGYuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge0J1ZmZlclNvdXJjZU5vZGV9IFRoZSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSBjb3JlLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLnN3LndhdmU7XHJcbiAgYnVmZmVyU291cmNlLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XHJcbiAgYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZShidWZmZXJTb3VyY2UpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGJ1ZmZlclNvdXJjZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXN0cm95ZXMgYSBnaXZlbiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgYW5kIGRlbGV0ZXMgaXRcclxuICogZnJvbSB0aGUgc291cmNlTm9kZSBxdWV1ZS4gVGhpcyBpcyB1c2VkIGluIHRoZSBvbmVuZGVkXHJcbiAqIGNhbGxiYWNrIG9mIGFsbCBCdWZmZXJTb3VyY2VOb2RlcyB0byBhdm9pZCBkZWFkIHJlZmVyZW5jZXMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge2JzTm9kZX0gYnNOb2RlIHRoZSBidWZmZXJTb3VyY2UgdG8gYmUgZGVzdHJveWVkLlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbihic05vZGUpIHtcclxuICBic05vZGUuZGlzY29ubmVjdCgpO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgaWYgKG5vZGUgPT09IGJzTm9kZSkge1xyXG4gICAgICB0aGlzLnF1ZXVlLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgc291bmQgKEF1ZGlvQnVmZmVyU291cmNlTm9kZSkgYW5kIHN0b3JlcyBhIHJlZmVyZW5jZXNcclxuICogaW4gYSBxdWV1ZS4gVGhpcyBlbmFibGVzIHlvdSB0byBwbGF5IG11bHRpcGxlIHNvdW5kcyBhdCBvbmNlXHJcbiAqIGFuZCBldmVuIHN0b3AgdGhlbSBhbGwgYXQgYSBnaXZlbiB0aW1lLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwbGF5TG9vcGVkIFdoZXRoZXIgdGhlIHNvdW5kIHNob3VsZCBiZSBsb29wZWQgb3Igbm90XHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGRlbGF5ICAgICAgVGltZSBpbiBzZWNvbmRzIHRoZSBzb3VuZCBwYXVzZXMgYmVmb3JlIHRoZSBzdHJlYW0gc3RhcnRzXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgIGR1cmF0aW9uICAgVGltZSBwcmVyaW9kIGFmdGVyIHRoZSBzdHJlYW0gc2hvdWxkIGVuZFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ocGxheUxvb3BlZCwgZGVsYXksIHBiUmF0ZSwgZHVyYXRpb24pIHtcclxuICBpZiAodGhpcy5pc1BhdXNlZCAmJiB0aGlzLnF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciBzdGFydFRpbWUgPSAwO1xyXG5cclxuICAgIGlmIChkZWxheSkge1xyXG4gICAgICBzdGFydFRpbWUgPSBkZWxheTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0YXJ0VGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgICB9XHJcbiAgICB2YXIgYnMgPSB0aGlzLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICAgIGlmIChwbGF5TG9vcGVkKSB7XHJcbiAgICAgIGJzLmxvb3AgPSBwbGF5TG9vcGVkO1xyXG4gICAgICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgICAgYnMubG9vcEVuZCA9IHRoaXMubG9vcEVuZDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHBiUmF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gYnMudG1wUGxheWJhY2tSYXRlID0gcGJSYXRlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnMucGxheWJhY2tSYXRlLnZhbHVlID0gYnMudG1wUGxheWJhY2tSYXRlID0gdGhpcy5wbGF5YmFja1JhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgYnMuZGV0dW5lLnZhbHVlID0gdGhpcy5kZXR1bmU7XHJcbiAgICBicy5zdGFydFRpbWUgPSBzdGFydFRpbWU7ICAgLy8gZXh0ZW5kIG5vZGUgd2l0aCBhIHN0YXJ0dGltZSBwcm9wZXJ0eVxyXG5cclxuICAgIHRoaXMucXVldWUucHVzaChicyk7XHJcbiAgICBpZiAoZHVyYXRpb24pIHtcclxuICAgICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0LCBkdXJhdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyBhbGwgYXVkaW8gc3RyZWFtLCBldmVuIHRoZSBvbmVzIHRoYXQgYXJlIGp1c3Qgc2NoZWR1bGVkLlxyXG4gKiBJdCBhbHNvIGNsZWFucyB0aGUgcXVldWUgc28gdGhhdCB0aGUgc291bmQgb2JqZWN0IGlzIHJlYWR5IGZvciBhbm90aGVyIHJvdW5kLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5zdG9wKCk7XHJcbiAgICBub2RlLmRpc2Nvbm5lY3QoKTtcclxuICB9KTtcclxuICB0aGlzLnF1ZXVlID0gW107ICAvL3JlbGVhc2UgYWxsIHJlZmVyZW5jZXNcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyBhbGwgYXVkaW8gc3RyZWFtcyBvZiB0aGlzIHNvdW5kIHRlbXBvcmFyaWx5LlxyXG4gKiBUaGlzIGN1cnJlbnRseSBqdXN0IHdvcmtzIGluIENocm9tZSA0OSsgb25seS5cclxuICogSWYgeW91IHdhbnQgYSBnbG9iYWwsIGFjY3VyYXRlIHBhdXNlIGZ1bmN0aW9uXHJcbiAqIHVzZSBzdXNwZW5kL3Jlc3VtZSBmcm9tIHRoZSBjb3JlIG1vZHVsZS5cclxuICogQHJldHVybiAge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoIXRoaXMuaXNQYXVzZWQpIHtcclxuICAgIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgIG5vZGUudG1wUGxheWJhY2tSYXRlID0gbm9kZS5wbGF5YmFja1JhdGUudmFsdWU7XHJcbiAgICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gMC4wO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzdW1lcyBhbGwgc3RyZWFtcyBpZiB0aGV5IHdlcmUgcGF1c2VkLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IG5vZGUudG1wUGxheWJhY2tSYXRlO1xyXG4gICAgZGVsZXRlIG5vZGUudG1wUGxheWJhY2tSYXRlO1xyXG4gIH0pO1xyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5oYW5kbGVSZWxheURhdGEgPSBmdW5jdGlvbihldnQpIHtcclxuICB2YXIgbXNnID0gZXZ0Lm1zZztcclxuICB0aGlzLmV2ZW50TG9va3VwW21zZy50eXBlXS5jYWxsKHRoaXMsIG1zZyk7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUudm9sdW1lTXNnSGFuZGxlciA9IGZ1bmN0aW9uKG1zZykge1xyXG4gIGlmIChtc2cudmFsdWUgPj0gMCAmJiBtc2cudmFsdWUgPD0gMTI3KSB7XHJcbiAgICB0aGlzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSBtc2cudmFsdWUgLyAxMjc7XHJcbiAgfVxyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnBhbk1zZ0hhbmRsZXIgPSBmdW5jdGlvbihtc2cpIHtcclxuICBpZiAobXNnLnZhbHVlID49IC02MyAmJiBtc2cudmFsdWUgPD0gNjQpIHtcclxuICAgIHRoaXMucGFubmVyTm9kZS5wYW4udmFsdWUgPSBtc2cudmFsdWUgLyA2NDtcclxuICB9XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUubm90ZU1zZ0hhbmRsZXIgPSBmdW5jdGlvbihtc2cpIHtcclxuICBpZiAobXNnLnZhbHVlID49IDAgJiYgbXNnLnZhbHVlIDw9IDEyNykge1xyXG4gICAgdmFyIHBiUmF0ZSA9IHRoaXMuZ2V0U2VtaVRvbmVQbGF5YmFja1JhdGUobXNnLnZhbHVlKTtcclxuICAgIC8vIHRoaXMuc3RhcnQodGhpcy5sb29wLCBub3RlLmRlbGF5LCBwYlJhdGUsIG5vdGUuZHVyYXRpb24pO1xyXG4gICAgdGhpcy5zdGFydCh0aGlzLmxvb3AsIG1zZy5kZWxheSwgcGJSYXRlLCBtc2cuZHVyYXRpb24pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9jZXNzZXMgYW4gZXZlbnQgZmlyZWQgYnkgdGhlIHNlcXVlbmNlci5cclxuICogVGhpcyBpcyBubyBsb25nZXIgaW4gdXNlIGFuZCB3aWxsIGJlIHJlbW92ZWQgYXQgc29tZSBwb2ludC5cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCBBIHNlcXVlbmNlciBldmVudFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgLy90aGlzLnNldFRvbmUoc2VxRXZlbnQucHJvcHMudG9uZSk7XHJcbiAgaWYgKHNlcUV2ZW50LnByb3BzLmR1cmF0aW9uKSB7XHJcbiAgICB0aGlzLnN0YXJ0KGZhbHNlLFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kZWxheSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZHVyYXRpb24pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLnN0YXJ0KGZhbHNlLFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kZWxheSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHN0YXJ0cG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIHN0YXJ0IGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wU3RhcnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcFN0YXJ0ID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgZW5kcG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIGVuZCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcEVuZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wRW5kID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcEVuZCA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbGVhc2VzIHRoZSBsb29wIG9mIGFsbCBydW5uaW5nIG5vZGVzLFxyXG4gKiBOb2RlcyB3aWxsIHJ1biB1bnRpbCBlbmQgYW5kIHN0b3AuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVsZWFzZUxvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wID0gZmFsc2U7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoZSBzdGFydCBhbmQgZW5kcG9pbnQgdG8gc3RhcnQgZW5kIGVuZHBvaW50IG9mIHRoZSBBdWRpb0J1ZmZlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlc2V0TG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgcGxheWJhY2sgcmF0ZSBmb3IgYWxsIG5vZGVzIGluIHBlcmNlbnRhZ2VcclxuICogKDEgPSAxMDAlLCAyID0gMjAwJSlcclxuICogQHBhcmFtICB7ZmxvYXR9ICB2YWx1ZSAgIFJhdGUgaW4gcGVyY2VudGFnZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldEdsb2JhbFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5wbGF5YmFja1JhdGUgPSB2YWx1ZTtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFRoZSBwbGF5YmFjayByYXRlIGluIHBlcmNlbnRhZ2UgKDEuMjUgPSAxMjUlKVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBsYXliYWNrUmF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBub3RlIGZyZXF1ZW5jeS9wbGF5YmFjayByYXRlIGZvciBhIG5vdGVcclxuICogQHBhcmFtICB7SW50ZWdlcn0gIG5vdGUgdmFsdWUgYmV0d2VlbiAwIGFuZCAxMjdcclxuICogQHJldHVybiB7RmxvYXR9ICAgIFBsYXliYWNrUmF0ZSBmb3IgdGhlIGdpdmVuIG5vdGVcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRTZW1pVG9uZVBsYXliYWNrUmF0ZSA9IGZ1bmN0aW9uKG5vdGUpIHtcclxuICByZXR1cm4gKG5vdGUgLSA2MCkgLyAxMiArIDE7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsYXN0IHBsYXllZCBzZW1pdG9uZS4gVGhpcyBkb2Vzbid0IGhhcyB0byBiZSBhblxyXG4gKiBpbnRlZ2VyIGJldHdlZW4gLS8rMTIgYXMgdGhlIHNvdW5kIGNhbiBiZSBkZXR1bmVkIHdpdGhcclxuICogbW9yZSBwcmVjaXNpb24uXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgU2VtaXRvbmUgYmV0d2VlbiAtLysxMlxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldFRvbmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmUgLyAxMDA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0dW5lIHRoZSBzb3VuZCBvc2NpbGxhdGlvbiBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICB2YWx1ZSAgZGV0dW5lIGluIGNlbnRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0RGV0dW5lID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAodmFsdWUgPj0gLTEyMDAgJiYgdmFsdWUgPD0gMTIwMCkge1xyXG4gICAgdGhpcy5kZXR1bmUgPSB2YWx1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdEZXR1bmUgcGFyYW1ldGVyIGlzICcgKyB2YWx1ZSArICcuIE11c3QgYmUgYmV0d2VlbiArLy0xMjAwLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgdGhlIGN1cnJlbnQgZGV0dW5lIGluIGNlbnRzICgrLy0gMTIwMClcclxuICogQHJldHVybiB7SW50ZWdlcn0gIERldHVuZSBpbiBjZW50c1xyXG4gKi9cclxuU291bmQucHJvdG90eXBlLmdldERldHVuZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmRldHVuZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIENyZWF0ZXMgYSB3cmFwcGVyIGluIHdoaWNoIGFuIGF1ZGlvIGJ1ZmZlciBsaXZlcy5cclxuICogQSBTb3VuZFdhdmUgb2JqZWN0IGp1c3QgaG9sZHMgYXVkaW8gZGF0YSBhbmQgZG9lcyBub3RoaW5nIGVsc2UuXHJcbiAqIElmIHlvdSB3YW50IHRvIHBsYXkgdGhlIHNvdW5kLCB5b3UgaGF2ZSB0byBhZGRpdGlvbmFsbHkgY3JlYXRlIGFcclxuICogPGEgaHJlZj1cIlNvdW5kLmh0bWxcIj5Tb3VuZDwvYT4gb2JqZWN0LlxyXG4gKiBJdCBjYW4gaGFuZGxlIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICogKCoud2F2LCAqLm1wMykgYXMgZGF0YSBzb3VyY2VzLlxyXG4gKiA8L3A+PHA+XHJcbiAqIE11bHRpcGxlIHNvdXJjZXMgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byBvbmUgYXVkaW8gYnVmZmVyLlxyXG4gKiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBjcmVhdGluZyBtdWx0aXBsZSBTb3VuZFdhdmUgb2JqZWN0cy5cclxuICogSXQncyBsaWtlIGEgd2F2ZXRhYmxlOiBBbGwgc3RhcnQvZW5kIHBvc2l0aW9ucyB3aWxsIGJlIHNhdmVkIHNvXHJcbiAqIHlvdSBjYW4gdHJpZ2dlciB0aGUgb3JpZ2luYWwgc2FtcGxlcyB3aXRob3V0IHVzaW5nIG11bHRpcGxlIGJ1ZmZlcnMuXHJcbiAqIFBvc3NpYmxlIHVzYWdlcyBhcmUgbXVsdGlzYW1wbGVkIHNvdW5kcywgbG9vcHMgb3Igd2F2ZXNlcXVlbmNlcyAoa2luZCBvZikuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+UGxheSBhIHNvdW5kIGZyb20gYW4gYXVkaW8gZmlsZTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdmaWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q29uY2F0ZW5hdGUgbXVsdGlwbGUgc291cmNlIGZpbGVzIGludG8gb25lIGJ1ZmZlcjxicj5cclxuICogaW4gdGhlIGdpdmVuIG9yZGVyIGFuZCBwbGF5IHRoZW0gKFRoaXMgaXMgYnJva2VuIGluIHYwLjEuIERvbid0IHVzZSBpdCEpOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoWydmaWxlMS53YXYsZmlsZTIud2F2LGZpbGUzLndhdiddKTtcclxuICogdmFyIHNvdW5kID0gbmV3IGludGVybWl4LlNvdW5kKHNvdW5kV2F2ZSk7XHJcbiAqIHNvdW5kLnBsYXk7XHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlxyXG4gKiBVc2luZyBBcnJheUJ1ZmZlcnMgaW5zdGVhZCBvZiBmaWxlbmFtZXMgd2lsbCBjb21lIGluIGhhbmR5IGlmIHlvdSB3YW50PGJyPlxyXG4gKiB0byBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIFhIUiBvciB1c2UgYSBwcmVsb2FkZXIgKGhlcmU6IHByZWxvYWQuanMpOlxyXG4gKiA8L2NhcHRpb24+XHJcbiAqIHZhciBxdWV1ZSA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKTtcclxuICogcXVldWUub24oJ2NvbXBsZXRlJywgaGFuZGxlQ29tcGxldGUpO1xyXG4gKiBxdWV1ZS5sb2FkTWFuaWZlc3QoW1xyXG4gKiAgICAge2lkOiAnc3JjMScsIHNyYzonZmlsZTEud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9LFxyXG4gKiAgICAge2lkOiAnc3JjMicsIHNyYzonZmlsZTIud2F2JywgdHlwZTpjcmVhdGVqcy5BYnN0cmFjdExvYWRlci5CSU5BUll9XHJcbiAqIF0pO1xyXG4gKlxyXG4gKiBmdW5jdGlvbiBoYW5kbGVDb21wbGV0ZSgpIHtcclxuICogICAgIHZhciBiaW5EYXRhMSA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMScpO1xyXG4gKiAgICAgdmFyIGJpbkRhdGEyID0gcXVldWUuZ2V0UmVzdWx0KCdzcmMyJyk7XHJcbiAqICAgICB2YXIgd2F2ZTEgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGExKTtcclxuICogICAgIHZhciB3YXZlMiA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoYmluRGF0YTIpO1xyXG4gKiAgICAgdmFyIGNvbmNhdFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKFtiaW5EYXRhMSwgYmluRGF0YTJdKTtcclxuICogfTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAgeyhPYmplY3R8T2JqZWN0W118c3RyaW5nKX0gYXVkaW9TcmMgICBPbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgb3IgZmlsZW5hbWVzXHJcbiAqL1xyXG52YXIgU291bmRXYXZlID0gZnVuY3Rpb24oYXVkaW9TcmMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy5hYyA9IGNvcmU7ICAgICAgIC8vY3VycmVudGx5IGp1c3QgdXNlZCBmb3IgdGVzdHNcclxuICB0aGlzLmJ1ZmZlciA9IGNvcmUuY3JlYXRlQnVmZmVyKDEsIDEsIGNvcmUuc2FtcGxlUmF0ZSk7ICAgLy9BdWRpb0J1ZmZlclxyXG4gIHRoaXMuZnJhZ21lbnRzID0gW107ICAvL0F1ZGlvQnVmZmVycyBmcm9tIG11bHRpcGxlIFBDTSBzb3VyY2VzXHJcbiAgdGhpcy53YXZlID0gdGhpcy5idWZmZXI7ICAvL0ludGVyZmFjZSB0byB0aGUgaW50ZXJuYWwgYnVmZmVyc1xyXG4gIHRoaXMubWV0YURhdGEgPSBbXTsgICAvL3N0YXJ0LS9lbmRwb2ludHMgYW5kIGxlbmd0aCBvZiBzaW5nbGUgd2F2ZXNcclxuXHJcbiAgaWYgKHR5cGVvZiBhdWRpb1NyYyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vb25lIGZpbGUgdG8gbG9hZC9kZWNvZGVcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuZGVjb2RlQXVkaW9EYXRhKHJlc3BvbnNlKTtcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgICAgICBzZWxmLnVzZVdhdmUoMCk7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuYnVmZmVyO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoYXVkaW9TcmMgaW5zdGFuY2VvZiBBcnJheSAmJiB0eXBlb2YgYXVkaW9TcmNbMF0gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vbXVsdGlwbGUgZmlsZXMgdG8gbG9hZC9kZWNvZGUgYW5kIGNhbmNhdGluYXRlXHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5sb2FkTXVsdGlwbGVGaWxlcyhhdWRpb1NyYykudGhlbihmdW5jdGlvbihkZWNvZGVkKSB7XHJcbiAgICAgICAgc2VsZi5idWZmZXIgPSBkZWNvZGVkO1xyXG4gICAgICAgIHNlbGYudXNlV2F2ZSgwKTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIHRocm93IGVycjtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9vbmUgQXJyYXlCdWZmZXIgdG8gZGVjb2RlXHJcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gZGVjb2RlZDtcclxuICAgICAgICBzZWxmLnVzZVdhdmUoMCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9tdWx0aXBsZSBBcnJheUJ1ZmZlcnMgdG8gZGVjb2RlIGFuZCBjb25jYXRlbmF0ZVxyXG4gICAgICB0aGlzLmRlY29kZUF1ZGlvU291cmNlcyhhdWRpb1NyYykudGhlbihmdW5jdGlvbihhdWRpb0J1ZmZlcnMpIHtcclxuICAgICAgICBzZWxmLmZyYWdtZW50cyA9IGF1ZGlvQnVmZmVycztcclxuICAgICAgICByZXR1cm4gc2VsZi5qb2luQXVkaW9CdWZmZXJzKGF1ZGlvQnVmZmVycyk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgICAgc2VsZi5idWZmZXIgPSBhdWRpb0J1ZmZlcjtcclxuICAgICAgICBzZWxmLnVzZVdhdmUoMCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIHdpbmRvdy5BdWRpb0J1ZmZlcikge1xyXG4gICAgICB0aGlzLmJ1ZmZlciA9IGF1ZGlvU3JjO1xyXG4gICAgICB0aGlzLnVzZVdhdmUoMCk7XHJcbiAgICB9IGVsc2UgaWYgKGF1ZGlvU3JjIGluc3RhbmNlb2YgQXJyYXkgJiYgYXVkaW9TcmNbMF0gaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIpIHtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmpvaW5BdWRpb0J1ZmZlcnMoYXVkaW9TcmMpLnRoZW4oZnVuY3Rpb24oYXVkaW9CdWZmZXIpIHtcclxuICAgICAgICBzZWxmLmJ1ZmZlciA9IGF1ZGlvQnVmZmVyO1xyXG4gICAgICAgIHNlbGYudXNlV2F2ZSgwKTtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgU291bmRXYXZlIG9iamVjdDogVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9zdGFydCB0aGUgb2JqZWN0IHdpdGggZW1wdHkgYnVmZmVyLiBVc2VmdWxsIGZvciB0ZXN0aW5nIGFuZCBhZHZhbmNlZCB1c2FnZS5cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gYXJyYXkgb2YgZmlsZW5hbWVzIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzXHJcbiAqIHRvIGFuIEF1ZGlvQnVmZmVyIGluY2x1ZGluZyB0aGUgUENNIGRhdGEgb2YgYWxsIGZpbGVzIG9uIHN1Y2Nlc3MuXHJcbiAqIFJldHVybnMgYW4gZXJyb3Igb24gZmFpbHVyZS5cclxuICogQHBhcmFtICB7QXJyYXl9ICAgIGZpbGVuYW1lcyBBcnJheSB3aXRoIGZpbGVuYW1lcyB0byBiZSBsb2FkZWRcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICBSZXNvbHZlcyB0byBBdWRpb0J1ZmZlciBvciB0aHJvd3MgZXJyb3IuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmxvYWRNdWx0aXBsZUZpbGVzID0gZnVuY3Rpb24odXJscykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICB2YXIgZmlsZW5hbWVzID0gdGhpcy5zdHJpcEZpbGVuYW1lcyh1cmxzKTtcclxuXHJcbiAgcmV0dXJuIHRoaXMubG9hZEZpbGVzKHVybHMpLnRoZW4oZnVuY3Rpb24oYmluQnVmZmVycykge1xyXG4gICAgcmV0dXJuIHNlbGYuZGVjb2RlQXVkaW9Tb3VyY2VzKGJpbkJ1ZmZlcnMpO1xyXG4gIH0pXHJcbiAgLnRoZW4oZnVuY3Rpb24oYXVkaW9CdWZmZXJzKSB7XHJcbiAgICB2YXIgcHJvbWlzZXMgPSBbXTtcclxuICAgIHNlbGYuZnJhZ21lbnRzID0gYXVkaW9CdWZmZXJzO1xyXG4gICAgcHJvbWlzZXMucHVzaChzZWxmLmpvaW5BdWRpb0J1ZmZlcnMoYXVkaW9CdWZmZXJzKSxcclxuICAgICAgc2VsZi5zdG9yZU1ldGFEYXRhKGF1ZGlvQnVmZmVycywgZmlsZW5hbWVzKSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gIH0pXHJcbiAgLnRoZW4oZnVuY3Rpb24oYnVmZmVyQW5kTWV0YSkge1xyXG4gICAgc2VsZi5tZXRhRGF0YSA9IGJ1ZmZlckFuZE1ldGFbMV07XHJcbiAgICByZXR1cm4gYnVmZmVyQW5kTWV0YVswXTtcclxuICB9KVxyXG4gIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgIHRocm93IGVycjtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBvbmUgb3IgbW9yZSBBcnJheUJ1ZmZlcnMgYW5kIHJldHVybnMgYW4gZXF1YWwgbnVtYmVyIG9mIEF1ZGlvQnVmZmVycy5cclxuICogQHBhcmFtICB7QXJyYXl9ICAgIGJ1ZmZlcnMgQXJyYXkgd2l0aCBBcnJheUJ1ZmZlcnNcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgUmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2YgQXVkaW9CdWZmZXJzIG9yIGVycm9yXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvU291cmNlcyA9IGZ1bmN0aW9uKGJ1ZmZlcnMpIHtcclxuICB2YXIgcHJvbWlzZXMgPSBbXTtcclxuICBidWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyKSB7XHJcbiAgICBwcm9taXNlcy5wdXNoKHRoaXMuZGVjb2RlQXVkaW9EYXRhKGJ1ZmZlcikpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIEFycmF5QnVmZmVyIHdpdGggYmluYXJ5IGF1ZGlvIGRhdGEgYW5kXHJcbiAqIHR1cm5zIGl0IGludG8gYW4gYXVkaW8gYnVmZmVyIG9iamVjdC5cclxuICogSnVzdCBhIHdyYXBwZXIgZm9yIHRoZSB3ZWItYXVkaW8tYXBpIGRlY29kZUF1ZGlvRGF0YSBmdW5jdGlvbi5cclxuICogSXQgdXNlcyB0aGUgbmV3IHByb21pc2Ugc3ludGF4IHNvIGl0IHByb2JhYmx5IHdvbid0IHdvcmsgaW4gYWxsIGJyb3dzZXJzIGJ5IG5vdy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9ICByYXdBdWRpb1NyYyBBdWRpbyBkYXRhIGluIHJhdyBiaW5hcnkgZm9ybWF0XHJcbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgICAgUmVzb2x2ZXMgdG8gQXVkaW9CdWZmZXIgb3IgZXJyb3JcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24ocmF3QXVkaW9TcmMpIHtcclxuICByZXR1cm4gY29yZS5kZWNvZGVBdWRpb0RhdGEocmF3QXVkaW9TcmMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEpvaW5zIGFuIGFyYml0cmFyeSBudW1iZXIgb2YgQXJyYXlCdWZmZXJzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgYnVmZmVycyBBcnJheSBvZiBBdWRpb0J1ZmZlcnNcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgV2F2ZWZvcm0gdGhhdCBpbmNsdWRlcyBhbGwgZ2l2ZW4gYnVmZmVycy5cclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuam9pbkF1ZGlvQnVmZmVycyA9IGZ1bmN0aW9uKGJ1ZmZlcnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGlucHV0LCBqb2luZWRCdWZmZXI7XHJcblxyXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpKSB7XHJcbiAgICAgIGpvaW5lZEJ1ZmZlciA9IGJ1ZmZlcnNbMF07XHJcbiAgICAgIGlucHV0ID0gYnVmZmVycy5zbGljZSgxKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBpcyBub3Qgb2YgdHlwZSBBcnJheScpKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnB1dC5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlcikge1xyXG4gICAgICBpZiAoYnVmZmVyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyICYmXHJcbiAgICAgICAgam9pbmVkQnVmZmVyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyKSB7XHJcbiAgICAgICAgam9pbmVkQnVmZmVyID0gdGhpcy5hcHBlbmRBdWRpb0J1ZmZlcihqb2luZWRCdWZmZXIsIGJ1ZmZlcik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ09uZSBvciBtb3JlIGJ1ZmZlcnMgYXJlIG5vdCBvZiB0eXBlIEF1ZGlvQnVmZmVyLicpKTtcclxuICAgICAgfVxyXG4gICAgfSwgc2VsZik7XHJcbiAgICByZXNvbHZlKGpvaW5lZEJ1ZmZlcik7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQXBwZW5kcyB0d28gYXVkaW8gYnVmZmVycy4gQm90aCBidWZmZXJzIHNob3VsZCBoYXZlIHRoZSBzYW1lIGFtb3VudFxyXG4gKiBvZiBjaGFubmVscy4gSWYgbm90LCBjaGFubmVscyB3aWxsIGJlIGRyb3BwZWQuIEZvciBleGFtcGxlLCBpZiB5b3VcclxuICogYXBwZW5kIGEgc3RlcmVvIGFuZCBhIG1vbm8gYnVmZmVyLCB0aGUgb3V0cHV0IHdpbGwgYmUgbW9ubyBhbmQgb25seVxyXG4gKiBvbmUgb2YgdGhlIGNoYW5uZWxzIG9mIHRoZSBzdGVyZW8gc2FtcGxlIHdpbGwgYmUgdXNlZCAobm8gbWVyZ2luZyBvZiBjaGFubmVscykuXHJcbiAqIFN1Z2dlc3RlZCBieSBDaHJpcyBXaWxzb246PGJyPlxyXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTQzNjUyL3dlYi1hdWRpby1hcGktYXBwZW5kLWNvbmNhdGVuYXRlLWRpZmZlcmVudC1hdWRpb2J1ZmZlcnMtYW5kLXBsYXktdGhlbS1hcy1vbmUtc29uXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBidWZmZXIxIFRoZSBmaXJzdCBhdWRpbyBidWZmZXJcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjIgVGhlIHNlY29uZCBhdWRpbyBidWZmZXJcclxuICogQHJldHVybiB7QXVkaW9CdWZmZXJ9ICAgICAgICAgYnVmZmVyMSArIGJ1ZmZlcjJcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuYXBwZW5kQXVkaW9CdWZmZXIgPSBmdW5jdGlvbihidWZmZXIxLCBidWZmZXIyKSB7XHJcbiAgaWYgKGJ1ZmZlcjEgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIgJiZcclxuICBidWZmZXIyIGluc3RhbmNlb2Ygd2luZG93LkF1ZGlvQnVmZmVyKSB7XHJcbiAgICB2YXIgbnVtYmVyT2ZDaGFubmVscyA9IE1hdGgubWluKGJ1ZmZlcjEubnVtYmVyT2ZDaGFubmVscywgYnVmZmVyMi5udW1iZXJPZkNoYW5uZWxzKTtcclxuICAgIHZhciBuZXdCdWZmZXIgPSBjb3JlLmNyZWF0ZUJ1ZmZlcihudW1iZXJPZkNoYW5uZWxzLFxyXG4gICAgICAoYnVmZmVyMS5sZW5ndGggKyBidWZmZXIyLmxlbmd0aCksXHJcbiAgICAgIGJ1ZmZlcjEuc2FtcGxlUmF0ZSk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mQ2hhbm5lbHM7IGkrKykge1xyXG4gICAgICB2YXIgY2hhbm5lbCA9IG5ld0J1ZmZlci5nZXRDaGFubmVsRGF0YShpKTtcclxuICAgICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjEuZ2V0Q2hhbm5lbERhdGEoaSksIDApO1xyXG4gICAgICBjaGFubmVsLnNldCggYnVmZmVyMi5nZXRDaGFubmVsRGF0YShpKSwgYnVmZmVyMS5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld0J1ZmZlcjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT25lIG9yIGJvdGggYnVmZmVycyBhcmUgbm90IG9mIHR5cGUgQXVkaW9CdWZmZXIuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0b3JlcyBtZXRhRGF0YSBvYmplY3RzIGluIHRoZSBtZXRhRGF0YSBhcnJheS5cclxuICogQHBhcmFtICB7QXJyYXl9IGF1ZGlvQnVmZmVycyBBcnJheSBvZiBBdWRpb0J1ZmZlcnNcclxuICogQHBhcmFtICB7QXJyYXl9IG5hbWVzICAgICAgICBBcnJheSBvZiBuYW1lc1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgIFJlc29sdmVzIHRvIGEgbWV0YURhdGEgYXJyYXkgb3IgZXJyb3IuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnN0b3JlTWV0YURhdGEgPSBmdW5jdGlvbihhdWRpb0J1ZmZlcnMsIG5hbWVzKSB7XHJcbiAgdmFyIGZuYW1lcyA9IFtdO1xyXG4gIHZhciBtZXRhRGF0YSA9IFtdO1xyXG4gIHZhciBzdGFydCA9IDA7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICBpZiAodHlwZW9mIG5hbWVzID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICBhdWRpb0J1ZmZlcnMuZm9yRWFjaChmdW5jdGlvbihidWZmZXIsIGluZGV4KSB7XHJcbiAgICAgICAgZm5hbWVzLnB1c2goJ2ZyYWdtZW50JyArIGluZGV4KTtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKG5hbWVzLmxlbmd0aCA9PT0gYXVkaW9CdWZmZXJzLmxlbmd0aCkge1xyXG4gICAgICBmbmFtZXMgPSBuYW1lcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ2F1ZGlvQnVmZmVycyBhbmQgbmFtZXMgc2hvdWxkIGJlIG9mIHNhbWUgbGVuZ3RoJykpO1xyXG4gICAgfVxyXG4gICAgYXVkaW9CdWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyLCBpbmRleCkge1xyXG4gICAgICBtZXRhRGF0YS5wdXNoKHRoaXMuZ2V0TWV0YURhdGEoYnVmZmVyLCBuYW1lc1tpbmRleF0sIHN0YXJ0KSk7XHJcbiAgICAgIHN0YXJ0ICs9IGJ1ZmZlci5sZW5ndGg7XHJcbiAgICB9LCBzZWxmKTtcclxuICAgIHJlc29sdmUobWV0YURhdGEpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0cmlwcyBmaWxlbmFtZXMgZnJvbSBhbiBhcnJheSBvZiB1cmxzIGFuZCByZXR1cm5zIGl0IGluIGFuIGFycmF5LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gdXJscyBBcnJheSBvZiB1cmxzXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgIEFycmF5IG9mIGZpbGVuYW1lc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5zdHJpcEZpbGVuYW1lcyA9IGZ1bmN0aW9uKHVybHMpIHtcclxuICByZXR1cm4gdXJscy5tYXAoZnVuY3Rpb24odXJsKSB7XHJcbiAgICByZXR1cm4gdXJsLnNwbGl0KCcvJykucG9wKCk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGRpY3Rpb25hcnkgd2l0aCBzdGFydC9zdG9wIHBvaW50cyBhbmQgbGVuZ3RoIGluIHNhbXBsZS1mcmFtZXNcclxuICogb2YgYSBidWZmZXIgZnJhZ21lbnQuLlxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyICAgICAgQnVmZmVyIHdpdGggdGhlIGFwcGVuZGFibGUgcGNtIGZyYWdtZW50XHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICBuYW1lICAgICAgICBOYW1lIG9mIHRoZSBmcmFnbWVudFxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgICAgICAgc3RhcnQgICAgICAgU3RhcnRwb2ludCBvZiB0aGUgZnJhZ21lbnRcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIERpY3Rpb25hcnkgd2l0aCBtZXRhIGRhdGEgb3IgZXJyb3IgbXNnXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmdldE1ldGFEYXRhID0gZnVuY3Rpb24oYnVmZmVyLCBuYW1lLCBzdGFydCkge1xyXG4gIGlmIChidWZmZXIgaW5zdGFuY2VvZiB3aW5kb3cuQXVkaW9CdWZmZXIgJiYgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICBzdGFydCA9IDA7XHJcbiAgICB9XHJcbiAgICB2YXIgYnVmTGVuZ3RoID0gYnVmZmVyLmxlbmd0aDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICduYW1lJzogbmFtZSxcclxuICAgICAgJ3N0YXJ0Jzogc3RhcnQsXHJcbiAgICAgICdlbmQnOiBzdGFydCArIGJ1Zkxlbmd0aCAtIDEsXHJcbiAgICAgICdsZW5ndGgnOiBidWZMZW5ndGhcclxuICAgIH07XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBzaG91bGQgYmUgb2YgdHlwZSBBdWRpb0J1ZmZlciBhbmQgU3RyaW5nJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIGEgKGF1ZGlvKSBmaWxlIGFuZCByZXR1cm5zIGl0cyBkYXRhIGFzIEFycmF5QnVmZmVyXHJcbiAqIHdoZW4gdGhlIHByb21pc2UgZnVsZmlsbHMuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICB1cmwgICAgICAgICAgICBUaGUgZmlsZSB0byBiZSBsb2FkZWRcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICAgICAgIEEgcHJvbWlzZSByZXByZXNlbnRpbmcgdGhlIHhociByZXNwb25zZVxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkRmlsZSA9IGZ1bmN0aW9uKHVybCkge1xyXG4gIHJldHVybiB3aW5kb3cuZmV0Y2godXJsKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmFycmF5QnVmZmVyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXJ2ZXIgZXJyb3IuIENvdWxkblxcJ3QgbG9hZCBmaWxlOiAnICsgdXJsKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgbXVsdGlwbGUgKGF1ZGlvKSBmaWxlcyBhbmQgcmV0dXJucyBhbiBhcnJheVxyXG4gKiB3aXRoIHRoZSBkYXRhIGZyb20gdGhlIGZpbGVzIGluIHRoZSBnaXZlbiBvcmRlci5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgTGlzdCB3aXRoIGZpbGVuYW1lc1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICBBcnJheSBvZiBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGVzID0gZnVuY3Rpb24oZmlsZW5hbWVzKSB7XHJcbiAgdmFyIHByb21pc2VzID0gW107XHJcbiAgZmlsZW5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xyXG4gICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvYWRGaWxlKG5hbWUpKTtcclxuICB9LCB0aGlzKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogR2V0IGFuIEF1ZGlvQnVmZmVyIHdpdGggYSBmcmFnbWVudCBvZiB0aGUgQXVkaW9CdWZmZXJcclxuICogb2YgdGhpcyBvYmplY3QuXHJcbiAqIEBwYXJhbSAge0ludH0gICAgc3RhcnQgICBTdGFydHBvaW50IG9mIHRoZSBmcmFnbWVudCBpbiBzYW1wbGVzXHJcbiAqIEBwYXJhbSAge0ludH0gICAgZW5kICAgICBFbmRwb2ludCBvZiB0aGUgZnJhZ21lbnQgaW4gc2FtcGxlc1xyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgQXVkaW9CdWZmZXIgaW5jbHVkaW5nIHRoZSBmcmFnbWVudFxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5nZXRCdWZmZXJGcmFnbWVudCA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcclxuICBpZiAodGhpcy5idWZmZXIubGVuZ3RoID09PSAxKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0F1ZGlvIGJ1ZmZlciBlbXB0eS4gTm90aGluZyB0byBjb3B5LicpO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyO1xyXG4gIH0gZWxzZSBpZiAoc3RhcnQgPCAwKSB7XHJcbiAgICBzdGFydCA9IDA7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGVuZCA9PT0gJ3VuZGVmaW5lZCcgfHwgZW5kID4gdGhpcy5idWZmZXIubGVuZ3RoKSB7XHJcbiAgICBlbmQgPSB0aGlzLmJ1ZmZlci5sZW5ndGg7XHJcbiAgfVxyXG5cclxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FyZ3VtZW50cyBvdXQgb2YgYm91bmRzLicpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGNobkNvdW50ID0gdGhpcy5idWZmZXIubnVtYmVyT2ZDaGFubmVscztcclxuICB2YXIgZnJhbWVDb3VudCA9IGVuZCAtIHN0YXJ0O1xyXG4gIHZhciBuZXdCdWZmZXIgPSBjb3JlLmNyZWF0ZUJ1ZmZlcihjaG5Db3VudCwgZnJhbWVDb3VudCwgY29yZS5zYW1wbGVSYXRlKTtcclxuXHJcbiAgZm9yICh2YXIgY2huID0gMDsgY2huIDwgY2huQ291bnQ7IGNobisrKSB7XHJcbiAgICB2YXIgbmV3Q2hhbm5lbCA9IG5ld0J1ZmZlci5nZXRDaGFubmVsRGF0YShjaG4pO1xyXG4gICAgdmFyIG9sZENoYW5uZWwgPSB0aGlzLmJ1ZmZlci5nZXRDaGFubmVsRGF0YShjaG4pO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnJhbWVDb3VudDsgaSsrKSB7XHJcbiAgICAgIG5ld0NoYW5uZWxbaV0gPSBvbGRDaGFubmVsW3N0YXJ0ICsgaV07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3QnVmZmVyO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBTcGVjaWZpZXMgd2hpY2ggaW50ZXJuYWwgYnVmZmVyIHRvIGV4cG9zZSB0byB0aGUgcHVibGljLlxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSB3YXZlU291cmNlIE51bWJlciBvZiB0aGUgYnVmZmVyICgwPWJ1ZmZlciwgMS1uPWZyYWdtZW50KVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS51c2VXYXZlID0gZnVuY3Rpb24od2F2ZVNvdXJjZSkge1xyXG4gIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHdhdmVTb3VyY2UpKSB7XHJcbiAgICBpZiAod2F2ZVNvdXJjZSA9PT0gMCkge1xyXG4gICAgICB0aGlzLndhdmUgPSB0aGlzLmJ1ZmZlcjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMud2F2ZSA9IHRoaXMuZnJhZ21lbnRzW3dhdmVTb3VyY2UgLSAxXTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbm90IG9mIHR5cGUgSW50ZWdlcicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0IEFycmF5QnVmZmVycyB0aGUgc2FtZSBvcmRlciwgbGlrZSB0aGUgZmlsZW5hbWVcclxuICogcGFyYW1ldGVycy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgIEFycmF5IHdpdGggZmlsZW5hbWVzXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgYmluQnVmZmVycyBBcnJheSB3aXRoIEFycmF5QnVmZmVyXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBBcnJheSB3aXRoIHNvcnRlZCBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc29ydEJpbkJ1ZmZlcnMgPSBmdW5jdGlvbihmaWxlbmFtZXMsIGJpbkJ1ZmZlcnMpIHtcclxuICAvLyBmdXRpbGU/P1xyXG4gIHJldHVybiBmaWxlbmFtZXMubWFwKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICByZXR1cm4gYmluQnVmZmVyc1tlbF07XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kV2F2ZTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgdGhlIGZvdW5kYXRpb24gb2YgdGhlIEludGVybWl4IGxpYnJhcnkuXHJcbiAqIEl0IHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQgc28gaXQgY2FuIGJlIGVhc2lseSBjb25zdW1lZFxyXG4gKiBmcm9tIGFsbCBjbGFzc2VzIG9mIHRoZSBsaWJyYXJ5LlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtBdWRpb0NvbnRleHR9IFRoZSBBdWRpb0NvbnRleHQgb2JqZWN0XHJcbiAqXHJcbiAqIEB0b2RvIFNob3VsZCB3ZSBkbyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3Igb2xkZXIgYXBpLXZlcnNpb25zP1xyXG4gKiBAdG9kbyBDaGVjayBmb3IgbW9iaWxlL2lPUyBjb21wYXRpYmlsaXR5LlxyXG4gKiBAdG9kbyBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGVcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+U3VzcGVuZCBhbmQgcmVzdW1lIHRoZSBhdWRpbyBjb250ZXh0IHRvXHJcbiAqIGNyZWF0ZSBhIHBhdXNlIGJ1dHRvbi4gVGhpcyBzaG91bGQgYmUgdXNlZCB3aXRoIGNyZWF0ZUF1ZGlvV29ya2VyXHJcbiAqIGFzIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIHdoZW4gc3VzcGVuZCBpcyBjYWxsZWQgb24gYW4gb2ZmbGluZSBhdWRpbyBjb250ZXh0LlxyXG4gKiBZb3UgY2FuIGFsc28gcGF1c2Ugc2luZ2xlIHNvdW5kcyB3aXRoIDxpPlNvdW5kLnBhdXNlKCk8L2k+LlxyXG4gKiBQbGVhc2UgcmVhZCA8YSBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZGUvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dC9zdXNwZW5kXCI+dGhlIGRldmVsb3BlciBkb2NzIGF0IE1ETjwvYT5cclxuICogdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgdGhpcy48L2NhcHRpb24+XHJcbiAqIHN1c3Jlc0J0bi5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAqICAgaWYoSW50ZXJtaXguc3RhdGUgPT09ICdydW5uaW5nJykge1xyXG4gKiAgICAgSW50ZXJtaXguc3VzcGVuZCgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdSZXN1bWUgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9IGVsc2UgaWYgKEludGVybWl4LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xyXG4gKiAgICAgSW50ZXJtaXgucmVzdW1lKCkudGhlbihmdW5jdGlvbigpIHtcclxuICogICAgICAgc3VzcmVzQnRuLnRleHRDb250ZW50ID0gJ1N1c3BlbmQgY29udGV4dCc7XHJcbiAqICAgICB9KTtcclxuICogICB9XHJcbiAqIH1cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG52YXIgaXNNb2JpbGUgPSB7XHJcbiAgJ0FuZHJvaWQnOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcclxuICB9LFxyXG4gICdpT1MnOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBob25lfGlQYWR8aVBvZC9pKTtcclxuICB9LFxyXG4gICdCbGFja0JlcnJ5JzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSk7XHJcbiAgfSxcclxuICAnT3BlcmEnOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvT3BlcmEgTWluaS9pKTtcclxuICB9LFxyXG4gIFdpbmRvd3M6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9JRU1vYmlsZS9pKSB8fFxyXG4gICAgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1dQRGVza3RvcC9pKTtcclxuICB9LFxyXG4gIGFueTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKGlzTW9iaWxlLkFuZHJvaWQoKSB8fFxyXG4gICAgaXNNb2JpbGUuaU9TKCkgfHxcclxuICAgIGlzTW9iaWxlLkJsYWNrQmVycnkoKSB8fFxyXG4gICAgaXNNb2JpbGUuT3BlcmEoKSB8fFxyXG4gICAgaXNNb2JpbGUuV2luZG93cygpKTtcclxuICB9XHJcbn07XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh0eXBlb2Ygd2luZG93LkF1ZGlvQ29udGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGF1ZGlvQ3R4ID0gbmV3IHdpbmRvdy5BdWRpb0NvbnRleHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZG5cXCd0IGluaXRpYWxpemUgdGhlIGF1ZGlvIGNvbnRleHQuJyk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXVkaW9DdHg7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIG5vdCBhYm91dCBqYXZhc2NyaXB0IGV2ZW50cyEgSXQncyBqdXN0XHJcbiAqIGEgZGVmaW5pdGlvbiBvZiB0aGUgZXZlbnRzIHRoYXQgdGhlIHNlcXVlbmNlciBjYW4gaGFuZGxlIHBsdXNcclxuICogc29tZSBmdW5jdGlvbnMgdG8gY3JlYXRlIHZhbGlkIGV2ZW50cy5cclxuICogVGhlIGNsYXNzIGRlZmluZXMgd2hpY2ggc3Vic3lzdGVtIGlzIGludm9rZWQgdG8gcHJvY2VzcyB0aGUgZXZlbnQuXHJcbiAqIEV2ZXJ5IGNsYXNzIGNhbiBoYXZlIHNldmVyYWwgdHlwZXMgYW5kIGEgdHlwZSBjb25zaXN0cyBvZiBvbmUgb3JcclxuICogbW9yZSBwcm9wZXJ0aWVzLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYSBub3RlIGV2ZW50IGZvciBhbiBhdWRpbyBvYmplY3Q8L2NhcHRpb24+XHJcbiAqIHZhciBub3RlID0gaW50ZXJtaXguZXZlbnRzLmNyZWF0ZUF1ZGlvTm90ZSgnYzMnLCA2NSwgMTI4LCBhU291bmRPYmplY3QpO1xyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgcHJvcGVydGllcyBpbiBvbmUgaGFuZHkgYXJyYXkuXHJcbiAqIEB0eXBlIHtBcnJheX1cclxuICovXHJcbnZhciBldlByb3AgPSBbXHJcbiAgJ2luc3RydW1lbnQnLCAvLyB0aGUgZXZlbnQgcmVjZWl2ZXJcclxuICAndG9uZScsICAgICAgIC8vIEludCBiZXR3ZWVuIDAgYW5kIDEyNyBiZWdpbm5pbmcgYXQgYzBcclxuICAnZHVyYXRpb24nLCAgIC8vIEludCByZXByZXNlbnRpbmcgYSBudW1iZXIgb2YgNjR0aCBub3Rlc1xyXG4gICd2ZWxvY2l0eScsICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAgJ3BpdGNoJyxcclxuICAndm9sdW1lJyxcclxuICAncGFuJ1xyXG5dO1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCB0eXBlcyBhbmQgdGhlIHByb3BlcnRpZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIFR5cGUgYXJlIHZhbGlkIHdpdGggb25lLCBzZXZlcmFsIG9yIGFsbCBvZiBpdHMgcHJvcGVydGllcy5cclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbnZhciBldlR5cGUgPSB7XHJcbiAgJ25vdGUnOiBbIGV2UHJvcFswXSwgZXZQcm9wWzFdLCBldlByb3BbMl0sIGV2UHJvcFszXSBdLFxyXG4gICdjb250cm9sJzogWyBldlByb3BbNF0sIGV2UHJvcFs1XSwgZXZQcm9wWzZdIF1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbGwgdmFsaWQgZXZlbnQgY2xhc3NlcyBhbmQgdGhlIHR5cGVzIGFzc290aWF0ZWQgd2l0aCB0aGVtLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2Q2xhc3MgPSB7XHJcbiAgJ2F1ZGlvJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ3N5bnRoJzogW2V2VHlwZS5ub3RlLCBldlR5cGUuY29udHJvbF0sXHJcbiAgJ2Z4JzogW10sXHJcbiAgJ21pZGknOiBbXSxcclxuICAnb3NjJzogW11cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIGNsYXNzIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlQ2xhc3MgRXZlbnQgY2xhc3NcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgY2xhc3MgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZUNsYXNzID0gZnVuY3Rpb24oZUNsYXNzKSB7XHJcbiAgaWYgKGV2Q2xhc3MuaGFzT3duUHJvcGVydHkoZUNsYXNzKSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSB0eXBlIG9mIGEgc2VxdWVuY2VyIGV2ZW50XHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICBlVHlwZSBFdmVudCB0eXBlXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICB0cnVlIGlmIHR5cGUgZXhpc3RzLCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVR5cGUgPSBmdW5jdGlvbihlVHlwZSkge1xyXG4gIGlmIChldlR5cGUuaGFzT3duUHJvcGVydHkoZVR5cGUpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYW4gaW5zdHJ1bWVudCBpcyBhbiBvYmplY3QuXHJcbiAqIFRoaXMgaXMgYSBwb29ybHkgd2VhayB0ZXN0IGJ1dCB0aGF0J3NcclxuICogYWxsIHdlIGNhbiBkbyBoZXJlLlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGluc3RyIEFuIGluc3RydW1lbnQgb2JqZWN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgdHJ1ZSBpZiBpdCdzIGFuIG9iamVjdCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudCA9IGZ1bmN0aW9uKGluc3RyKSB7XHJcbiAgaWYgKHR5cGVvZiBpbnN0ciA9PT0gJ29iamVjdCcpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBpZiBhIHRvbmUgb3IgdmVsb2NpdHkgdmFsdWUgaXNcclxuICogYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDEyNy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7SW50fSAgdmFsdWUgICBUaGUgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyBhIHRvbmVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICBUcnVlIGlmIGl0cyBhIHZhbGlkIHRvbmUsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcFRvbmVWZWxvID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDEyNykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgZHVyYXRpb24gaXMgYSBwb3NpdGl2ZSBpbnRlZ2VyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIE51bWJlciByZXByZXNlbnRpbmcgbXVsdGlwbGUgNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgZHVyYXRpb24sIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcER1cmF0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICBpZiAoIWlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSAmJiB2YWx1ZSA+PSAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgYW4gb2JqZWN0IG9mIGV2ZW50IHByb3BlcnRpZXMuXHJcbiAqIEl0IGNoZWNrcyB0aGUgcHJvcGVydGllcyBhcmUgdmFsaWQgZm9yIHRoZSBnaXZlbiB0eXBlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IGVQcm9wcyAgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICAgRXZlbnQgdHlwZSB0byB2YWxpZGF0ZSBhZ2FpbnN0XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICB0cnVlIGlmIGFsbCBwcm9wcyBhcmUgdmFsaWQsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlUHJvcHMgPSBmdW5jdGlvbihlUHJvcHMsIGVUeXBlKSB7XHJcbiAgdmFyIHR5cGUgPSBldlR5cGVbZVR5cGVdO1xyXG4gIGZvciAodmFyIGtleSBpbiBlUHJvcHMpICB7XHJcbiAgICBpZiAoZXZQcm9wLmluZGV4T2Yoa2V5KSA9PT0gLTEgJiZcclxuICAgIHR5cGUuaW5kZXhPZihrZXkpID09PSAtMSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGEgc3RyaW5nIG9mIHRoZSBmb3JtIGMzIG9yIGQjNCBhbmRcclxuICogcmV0dXJucyB0aGUgY29ycmVzcG9uZGluZyBudW1iZXIuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gdG9uZSBTdHJpbmcgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKiBAcmV0dXJuIHtJbnR9ICAgICAgICAgTnVtYmVyIHJlcHJlc2VudGluZyBhIG5vdGVcclxuICovXHJcbnZhciBjb252ZXJ0VG9uZSA9IGZ1bmN0aW9uKHRvbmUpIHtcclxuICB2YXIgbm90ZXMgPSBbJ2MnLCAnYyMnLCAnZCcsICdkIycsICdlJywgJ2YnLCAnZiMnLCAnZycsICdnIycsICdhJywgJ2EjJywgJ2InXTtcclxuICB2YXIgc3RyID0gdG9uZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICBpZiAoc3RyLm1hdGNoKC9eW2EtaF0jP1swLTldJC8pKSB7XHJcbiAgICB2YXIgbm90ZSA9IHN0ci5zdWJzdHJpbmcoMCwgc3RyLmxlbmd0aCAtIDEpO1xyXG4gICAgdmFyIG9jdCA9IHN0ci5zbGljZSgtMSk7XHJcblxyXG4gICAgaWYgKG5vdGUgPT09ICdoJykge1xyXG4gICAgICBub3RlID0gJ2InO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5vdGVzLmluZGV4T2Yobm90ZSkgKyBvY3QgKiAxMjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnZhbGlkIHN0cmluZy4gSGFzIHRvIGJlIGxpa2UgW2EtaF08Iz5bMC05XScpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgc2VxdWVuY2VyIGV2ZW50LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVUeXBlICBFdmVudCB0eXBlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzIE9iamVjdCB3aXRoIGV2ZW50IHByb3BlcnRpZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgU2VxdWVuY2VyIGV2ZW50XHJcbiAqL1xyXG52YXIgY3JlYXRlRXZlbnQgPSBmdW5jdGlvbihlQ2xhc3MsIGVUeXBlLCBlUHJvcHMpIHtcclxuICBpZiAodmFsaWRhdGVDbGFzcyhlQ2xhc3MpICYmXHJcbiAgICB2YWxpZGF0ZVR5cGUoZVR5cGUpICYmXHJcbiAgICB2YWxpZGF0ZVByb3BzKGVQcm9wcywgZVR5cGUpKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAnY2xhc3MnOiBlQ2xhc3MsXHJcbiAgICAgICd0eXBlJzogZVR5cGUsXHJcbiAgICAgICdwcm9wcyc6IGVQcm9wc1xyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY3JlYXRlIHNlcXVlbmNlciBldmVudC4gV3JvbmcgcGFyYW1ldGVycycpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuIGF1ZGlvIG5vdGUgZXZlbnRcclxuICogQHBhcmFtICB7SW50fFN0cmluZ30gdG9uZSAgICAgVG9uZSBiZXR3ZWVuIDAgYW5kIDEyNyBvciBzdHJpbmcgKGMzLCBkIzQpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgICAgIHZlbG9jaXR5IFZlbG9jaXR5IGJldHdlZW4gMCBhbmQgMTI3XHJcbiAqIEBwYXJhbSAge0ludH0gICAgICAgIGR1cmF0aW9uIER1cmF0aW9uIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgQWxsIHByb3BlcnRpZXMgaW4gb25lIG9iamVjdFxyXG4gKi9cclxudmFyIGNyZWF0ZUF1ZGlvTm90ZSA9IGZ1bmN0aW9uKHRvbmUsIHZlbG9jaXR5LCBkdXJhdGlvbiwgaW5zdHIpIHtcclxuICB2YXIgcHJvcHMgPSB7fTtcclxuICBpZiAodHlwZW9mIHRvbmUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICB0b25lID0gY29udmVydFRvbmUodG9uZSk7XHJcbiAgfVxyXG4gIGlmICh0b25lICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHRvbmUpKSB7XHJcbiAgICBwcm9wcy50b25lID0gdG9uZTtcclxuICB9XHJcbiAgaWYgKHZlbG9jaXR5ICYmIHZhbGlkYXRlUHJvcFRvbmVWZWxvKHZlbG9jaXR5KSkge1xyXG4gICAgcHJvcHMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcclxuICB9XHJcbiAgaWYgKGR1cmF0aW9uICYmIHZhbGlkYXRlUHJvcER1cmF0aW9uKGR1cmF0aW9uKSkge1xyXG4gICAgcHJvcHMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICB9XHJcbiAgaWYgKGluc3RyICYmIHZhbGlkYXRlUHJvcEluc3RydW1lbnQoaW5zdHIpKSB7XHJcbiAgICBwcm9wcy5pbnN0cnVtZW50ID0gaW5zdHI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQSBzZXF1ZW5jZXIgZXZlbnQgbXVzdCBoYXZlIGFuIGluc3RydW1lbnQgYXMgcHJvcGVydHknKTtcclxuICB9XHJcbiAgcmV0dXJuIGNyZWF0ZUV2ZW50KCdhdWRpbycsICdub3RlJywgcHJvcHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgY2xhc3M6IGV2Q2xhc3MsXHJcbiAgdHlwZTogZXZUeXBlLFxyXG4gIHByb3BlcnR5OiBldlByb3AsXHJcbiAgY3JlYXRlQXVkaW9Ob3RlOiBjcmVhdGVBdWRpb05vdGVcclxufTtcclxuIiwiLyoqXHJcbiAqIFRoaXMgaXMgYSB3ZWJ3b3JrZXIgdGhhdCBwcm92aWRlcyBhIHRpbWVyXHJcbiAqIHRoYXQgZmlyZXMgdGhlIHNjaGVkdWxlciBmb3IgdGhlIHNlcXVlbmNlci5cclxuICogVGhpcyBpcyBiZWNhdXNlIHRpbWluZyBoZXJlIGlzICBtb3JlIHN0YWJsZVxyXG4gKiB0aGFuIGluIHRoZSBtYWluIHRocmVhZC5cclxuICogVGhlIHN5bnRheCBpcyBhZGFwdGVkIHRvIHRoZSBjb21tb25qcyBtb2R1bGUgcGF0dGVybi5cclxuICogQGV4YW1wbGUgPGNhcHRpb24+SXQgaXMganVzdCBmb3IgbGlicmFyeSBpbnRlcm5hbFxyXG4gKiB1c2FnZS4gU2VlIFNlcXVlbmNlci5qcyBmb3IgZGV0YWlscy48L2NhcHRpb24+XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSh7ICdpbnRlcnZhbCc6IDIwMCB9KTtcclxuICogd29ya2VyLnBvc3RNZXNzYWdlKCdzdGFydCcpO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0b3AnKTtcclxuICogd29ya2VyLnRlcm1pbmF0ZSgpOyAgLy93ZWJ3b3JrZXIgaW50ZXJuYWwgZnVuY3Rpb24sIGp1c3QgZm9yIGNvbXBsZXRlbmVzc1xyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRpbWVyID0gbnVsbDtcclxudmFyIGludGVydmFsID0gMTAwO1xyXG5cclxudmFyIHdvcmtlciA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAnc3RhcnQnKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7c2VsZi5wb3N0TWVzc2FnZSgndGljaycpO30sIGludGVydmFsKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhID09PSAnc3RvcCcpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICB9IGVsc2UgaWYgKGUuZGF0YS5pbnRlcnZhbCkge1xyXG4gICAgICBpbnRlcnZhbCA9IGUuZGF0YS5pbnRlcnZhbDtcclxuICAgICAgaWYgKHRpbWVyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtlcjtcclxuIl19
