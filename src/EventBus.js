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
    'sequencer': {},
    'instrument': {},
    'fx': {}
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
