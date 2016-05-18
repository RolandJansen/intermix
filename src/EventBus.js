'use strict';

var EventBus = function() {

  this.relays = {
    'instrument': {},
    'fx': {}
  };

  this.messages = {
    'onRelayAdd': [],
    'onRelayRemove': []
  };

};

EventBus.prototype.addRelayEndpoint = function(relay, data, context) {
  var uid = this.getUID();

  if (typeof this.relays[relay] === 'undefined') {
    throw new TypeError('Unvalid relay type: ' + relay);
  } else if (!this.isPlainObject(data)) {
    throw new TypeError('Argument "data" is not a plain object');
  } else if (typeof context === 'undefined') {
    throw new Error('Missing argument "context"');
  } else {
    this.relays[relay][uid] = {
      'uid': uid,
      'context': context,
      'data': data
    };
    this.fireEvent('onRelayAdd', relay, uid);

    return uid;
  }

};

EventBus.prototype.removeRelayEndpoint = function(relay, context) {

};

EventBus.prototype.subscribe = function() {

};

EventBus.prototype.fireEvent = function(msg, relay, uid) {

};

EventBus.prototype.notifyAttendees = function(relay, msg, uid) {
  if (typeof uid === 'string') {
    this.relays[relay]
  }
};

EventBus.prototype.getRoot = function() {

};

/**
 * Creates an 16 byte random number represented as a string
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

// as suggested by RobG: http://stackoverflow.com/questions/5876332/how-can-i-differentiate-between-an-object-literal-other-javascript-objects
EventBus.prototype.isPlainObject = function(obj) {
  if (typeof obj === 'object' && obj !== null) {
    var proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }
  return false;
};

module.exports = EventBus;
