'use strict';

var EventBus = require('../../src/EventBus.js');
var helper = require('../../src/Helper.js');

describe('EventBus', function() {
  var dataDef = {
    'note': [0, 127],
    'volume': [0, 127],
    'pan': [-63, 64],
    'title': String
  };

  describe('relays object', function() {

    beforeEach(function() {
      this.eb = new EventBus();
    });

    it('has a property "controller" of type plain object', function() {
      expect(helper.isPlainObject(this.eb.relays.controller)).toBeTruthy();
    });

    it('has a property "instrument" of type plain object', function() {
      expect(helper.isPlainObject(this.eb.relays.instrument)).toBeTruthy();
    });

    it('has a property "fx" of type plain object', function() {
      expect(helper.isPlainObject(this.eb.relays.fx)).toBeTruthy();
    });

  });

  describe('messages object', function() {

    beforeEach(function() {
      this.eb = new EventBus();
    });

    it('has a property "onRelayAdd" of type Array', function() {
      expect(this.eb.messages.onRelayAdd).toEqual(jasmine.any(Array));
    });

    it('has a property "onRelayRemove" of type Array', function() {
      expect(this.eb.messages.onRelayRemove).toEqual(jasmine.any(Array));
    });

  });

  describe('.addRelayEndpoint', function() {

    beforeEach(function() {
      this.eb = new EventBus();
    });

    describe('on success', function() {

      beforeEach(function() {
        // this.eb.subscribe('onRelayAdd', this.onRelayAddHandler, this);
        this.eb.sendMessage = jasmine.createSpy('fireEvent');
        this.uid = this.eb.addRelayEndpoint('instrument', dataDef, this);
      });

      it('returns a unique id for this endpoint', function() {
        expect(this.uid).toEqual(jasmine.any(String));
        expect(this.uid.length).toEqual(32);
      });

      it('adds the data definition to the specified relay', function() {
        var def = this.eb.relays.instrument[this.uid];
        expect(def.data).toEqual(dataDef);
      });

      it('extends the def object with the context', function() {
        var def = this.eb.relays.instrument[this.uid];
        expect(def.hasOwnProperty('context')).toBeTruthy();
        expect(def.context).toEqual(this);
      });

      it('extends the def object with the name to its relay', function() {
        var def = this.eb.relays.instrument[this.uid];
        expect(def.relay).toEqual('instrument');
      });

      it('adds a reference to the relay endpoint to a lookup table', function() {
        expect(this.eb.lookup[this.uid]).toEqual(this.eb.relays.instrument[this.uid]);
      });

      it('fires an "onRelayAdd" event', function() {
        expect(this.eb.sendMessage).toHaveBeenCalledWith('onRelayAdd', 'instrument', this.uid);
      });

    });

    describe('on failure', function() {

      it('throws a TypeError if type is unknown', function() {
        var self = this;
        expect(function() {
          self.eb.addRelayEndpoint('foo', dataDef, self);
        }).toThrowError(TypeError);
      });

      it('throws a TypeError if data is not a plain object', function() {
        var self = this;
        expect(function() {
          self.eb.addRelayEndpoint('instrument', 'foo', self);
        }).toThrowError(TypeError);
      });

      it('throws an error if context is missing', function() {
        var self = this;
        expect(function() {
          self.eb.addRelayEndpoint('instrument', {});
        }).toThrowError(TypeError);
      });

    });

  });

  describe('.removeRelayEndpoint', function() {

    beforeEach(function() {
      this.eb = new EventBus();
      this.uid = this.eb.addRelayEndpoint('instrument', dataDef, this);
    });

    describe('on success', function() {

      beforeEach(function() {
        this.eb.removeRelayEndpoint('instrument', this.uid);
      });

      it('removes the endpoint from relay', function() {
        expect(Object.keys(this.eb.relays.instrument).length).toEqual(0);
      });

      it('removes the endpoint from the lookup table', function() {
        expect(Object.keys(this.eb.lookup).length).toEqual(0);
      });

    });

    describe('on failure', function() {

      it('if uid is missing or wrong, throws error', function() {
        var self = this;
        expect(function() {
          self.eb.removeRelayEndpoint('instrument');
        }).toThrowError('uid not found in relay instrument');
      });

      it('if relay is missing or wrong, throws a TypeError', function() {
        var self = this;
        expect(function() {
          self.eb.removeRelayEndpoint();
        }).toThrowError(TypeError);
      });

    });

  });

  describe('.getEndpointSpec', function() {

    beforeEach(function() {
      this.eb = new EventBus();
      this.uid = this.eb.addRelayEndpoint('instrument', dataDef, this);
    });

    it('on success returns an endpoint specification', function() {
      var spec = this.eb.getEndpointSpec(this.uid);
      expect(spec).toEqual(dataDef);
    });

    it('on failure throws a TypeError', function() {
      var self = this;
      expect(function() {
        self.eb.getEndpointSpec();
      }).toThrowError(TypeError);
    });

  });

  describe('.getAllRelayEndpointSpecs', function() {
    var def2 = { 'volume': [0, 127] };

    beforeEach(function() {
      this.eb = new EventBus();
      this.uid1 = this.eb.addRelayEndpoint('instrument', dataDef, this);
      this.uid2 = this.eb.addRelayEndpoint('instrument', def2, this);
    });

    it('on success returns an array with all endpoint specs', function() {
      var specs = this.eb.getAllRelayEndpointSpecs('instrument');
      expect(Object.keys(specs).length).toEqual(2);
      expect(specs[this.uid1]).toEqual(dataDef);
      expect(specs[this.uid2]).toEqual(def2);
    });

    it('on failure returns a TypeError', function() {
      var self = this;
      expect(function() {
        self.eb.getAllRelayEndpointSpecs();
      }).toThrowError(TypeError);
    });

  });

  describe('.sendToRelay', function() {
    var msg = { 'volume': 12 };

    beforeEach(function() {
      this.handleRelayData = jasmine.createSpy('handleRelayData');
      this.eb = new EventBus();
      this.uid1 = this.eb.addRelayEndpoint('instrument', dataDef, this);
      this.uid2 = this.eb.addRelayEndpoint('instrument', dataDef, this);
    });

    it('on success sends a message to all relay endpoints', function() {
      this.eb.sendToRelay('instrument', msg);
      expect(this.handleRelayData).toHaveBeenCalledTimes(2);
      expect(this.handleRelayData).toHaveBeenCalledWith(msg);
    });

    it('throws a TypeError with unvalid relay', function() {
      var self = this;
      expect(function() {
        self.eb.sendToRelay('foo', msg);
      }).toThrowError(TypeError);
    });

    it('fails silently without a msg', function() {
      var self = this;
      expect(function() {
        self.eb.sendToRelay('instrument');
      }).not.toThrow();
    });

  });

  describe('.sendToRelayEndpoint', function() {
    var msg = { 'volume': 12 };

    beforeEach(function() {
      this.handleRelayData = jasmine.createSpy('handleRelayData');
      this.eb = new EventBus();
      this.uid1 = this.eb.addRelayEndpoint('instrument', dataDef, this);
      this.uid2 = this.eb.addRelayEndpoint('instrument', dataDef, this);
    });

    it('on success sends a message to a specific endpoint', function() {
      this.eb.sendToRelayEndpoint(this.uid1, msg);
      expect(this.handleRelayData).toHaveBeenCalledTimes(1);
    });

    it('throws a TypeError with unvalid uid', function() {
      var self = this;
      expect(function() {
        self.eb.sendToRelayEndpoint('foo', msg);
      }).toThrowError(TypeError);
    });

    it('fails silently without a message', function() {
      var self = this;
      expect(function() {
        self.eb.sendToRelayEndpoint(self.uid1);
      }).not.toThrow();
    });

  });

  describe('.getRelayNames', function() {

    beforeEach(function() {
      this.eb = new EventBus();
      this.names = this.eb.getRelayNames();
    });

    it('returns an array with all relay names', function() {
      expect(this.names.length).toEqual(Object.keys(this.eb.relays).length);
      expect(this.names).toContain('instrument');
      expect(this.names).toContain('fx');
    });

  });

  describe('.subscribe', function() {

    beforeEach(function() {
      this.eb = new EventBus();
    });

    describe('on success', function() {

      beforeEach(function() {
        this.callback = jasmine.createSpy('callback');
        this.eb.subscribe('onRelayAdd', this.callback, this);
      });

      it('adds a subscriber object to the array of this message', function() {
        var subscriber = this.eb.messages.onRelayAdd[0];
        expect(subscriber).toEqual({ 'context': this, 'fn': this.callback });
      });

    });

    describe('on failure', function() {
      var self;

      beforeEach(function() {
        self = this;
        this.callback = jasmine.createSpy('callback');
      });

      it('if context is missing, throws TypeError', function() {
        expect(function() {
          self.subscribe('onRelayAdd', self.callback);
        }).toThrowError(TypeError);
      });

      it('if fn is not a function, throws TypeError', function() {
        expect(function() {
          self.subscribe('onRelayAdd', 'foo', this);
        }).toThrowError(TypeError);
      });

      it('if msg is not a string, throws TypeError', function() {
        expect(function() {
          self.subscribe({}, self.callback, this);
        }).toThrowError(TypeError);
      });

    });
  });

  describe('.unsubscribe', function() {

    beforeEach(function() {
      this.eb = new EventBus();
      this.callback = jasmine.createSpy('callback');
      this.eb.subscribe('onRelayAdd', this.callback, this);
    });

    describe('on success', function() {

      it('removes an object from a message array', function() {
        this.eb.unsubscribe('onRelayAdd', this);
        expect(this.eb.messages.onRelayAdd.length).toEqual(0);
      });
    });

    describe('on failure', function() {

      it('throws a TypeError if context is undefined', function() {
        expect(function() {
          this.eb.unsubscribe('onRelayAdd');
        }).toThrowError(TypeError);
      });

      it('fails silently if context is not found in msg array', function() {
        this.eb.unsubscribe('onRelayAdd', 'sdf');
        expect(this.eb.messages.onRelayAdd.length).toEqual(1);
      });

      it('throws a TypeError if msg is not a property of eb.messages', function() {
        expect(function() {
          this.eb.unsubscribe('sdf', this);
        }).toThrowError(TypeError);
      });

    });

  });

  describe('.sendMessage', function() {
    var fakeThis = { 'a': 1, 'b': 2 };
    var anotherThis = { 'c': 3, 'd': 4 };

    beforeEach(function() {
      this.callback = jasmine.createSpy('callback');
      this.eb = new EventBus();
      this.eb.subscribe('onRelayAdd', this.callback, this);
      this.eb.subscribe('onRelayAdd', this.callback, fakeThis);
      this.eb.subscribe('onRelayAdd', this.callback, anotherThis);
    });

    describe('on success', function() {

      beforeEach(function() {
        this.eb.sendMessage('onRelayAdd', 'a message');
      });

      it('calls the callback of all subscribers', function() {
        expect(this.callback).toHaveBeenCalledTimes(3);
      });

      it('calls the callbacks with the given message', function() {
        expect(this.callback).toHaveBeenCalledWith('a message');
      });

    });

    describe('on failure', function() {

      it('if msg arg is not valid throws a TypeError', function() {
        expect(function() {
          this.eb.sendMessage('foo', 'a message');
        }).toThrowError(TypeError);
      });

      it('if no argument give, calls the callbacks with "undefined"', function() {
        this.eb.sendMessage('onRelayAdd');
        expect(this.callback).toHaveBeenCalledWith(undefined);
      });

    });

  });

  describe('.getAllMessageTypes', function() {

    beforeEach(function() {
      this.eb = new EventBus();
      this.types = this.eb.getAllMessageTypes();
    });

    it('returns all property names of the messages array', function() {
      expect(this.types.length).toEqual(2);
      expect(this.types).toContain('onRelayAdd');
      expect(this.types).toContain('onRelayRemove');
    });

  });

  describe('.getUID', function() {

    beforeEach(function() {
      this.eb = new EventBus();
      this.uid = this.eb.getUID();
    });

    it('returns a string of length 32', function() {
      expect(this.uid.length).toEqual(32);
    });

    it('returns a string that represents 32 nibbles', function() {
      var chars = this.uid.split('');
      var charsAreNibbles = false;
      var i = 0;

      while (i < chars.length) {
        var nibble = Number.parseInt(chars[i], 16);
        if (nibble >= 0 && nibble < 16) {
          charsAreNibbles = true;
          i++;
        } else {
          charsAreNibbles = false;
          i = chars.length;
        }
      }
      expect(charsAreNibbles).toBeTruthy();
    });

    it('returns a random string', function() {
      var ids = [];
      // create 500 uid strings
      for (var i = 0; i < 500; i++) {
        ids.push(this.eb.getUID());
      }
      // and delete doubles
      var unique = ids.filter(function(value, index) {
        return ids.indexOf(value) === index;
      });
      expect(unique.length).toEqual(ids.length);
    });

  });

});
