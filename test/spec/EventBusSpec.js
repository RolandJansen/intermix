'use strict';

var EventBus = require('../../src/EventBus.js');

describe('EventBus', function() {

  describe('subscribers object', function() {

    beforeEach(function() {
      this.eb = new EventBus();
    });

    it('has a property "instrument" that is a plain object', function() {
      expect(this.eb.isPlainObject(this.eb.relays.instrument)).toBeTruthy();
    });

    it('has a property "fx" that is a plain object', function() {
      expect(this.eb.isPlainObject(this.eb.relays.fx)).toBeTruthy();
    });

  });

  describe('.addRelayEndpoint', function() {
    var dataDef = {
      'note': [0, 127],
      'volume': [0, 127],
      'pan': [-63, 64],
      'title': String
    };

    beforeEach(function() {
      this.eb = new EventBus();
    });

    describe('on success', function() {

      beforeEach(function() {
        // this.eb.subscribe('onRelayAdd', this.onRelayAddHandler, this);
        this.eb.fireEvent = jasmine.createSpy('fireEvent');
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

      it('extends the def object with its uid', function() {
        var def = this.eb.relays.instrument[this.uid];
        expect(def.hasOwnProperty('uid')).toBeTruthy();
        expect(def.uid.length).toEqual(32);
      });

      it('extends the def object with the context', function() {
        var def = this.eb.relays.instrument[this.uid];
        expect(def.hasOwnProperty('context')).toBeTruthy();
        expect(def.context).toEqual(this);
      });

      it('fires an "onRelayAdd" event', function() {
        expect(this.eb.fireEvent).toHaveBeenCalledWith('onRelayAdd', 'instrument', this.uid);
      });

    });

    describe('on failure', function() {

      it('throws a TypeError if type is unknown', function() {
        var self = this;
        expect(function() {
          self.eb.addRelayEndpoint('foo', dataDef, self);
        }).toThrowError('Unvalid relay type: foo');
      });

      it('throws a TypeError if data is not a plain object', function() {
        var self = this;
        expect(function() {
          self.eb.addRelayEndpoint('instrument', 'foo', self);
        }).toThrowError('Argument "data" is not a plain object');
      });

      it('throws an error if context is missing', function() {
        var self = this;
        expect(function() {
          self.eb.addRelayEndpoint('instrument', {});
        }).toThrowError('Missing argument "context"');
      });

    });

  });

  describe('.removeRelayEndpoint', function() {

    beforeEach(function() {

    });

  });

  describe('.notifyAttendees', function() {

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

  describe('.isPlainObject', function() {

    beforeEach(function() {
      this.eb = new EventBus();
    });

    it('returns true if argument is an empty object', function() {
      expect(this.eb.isPlainObject({})).toBeTruthy();
    });

    it('returns true if argument is a plain object', function() {
      var obj = { 'a': true, 'b': 'foo', 'c': 23 };
      expect(this.eb.isPlainObject(obj)).toBeTruthy();
    });

    it('returns true if argument is a nested object', function() {
      var obj = { 'a': { 'b': { 'c': true } } };
      expect(this.eb.isPlainObject(obj)).toBeTruthy();
    });

    it('returns false if argument is a constructor', function() {
      var obj = function() { var a = 23; this.b = function() { return a; }; };
      expect(this.eb.isPlainObject(obj)).toBeFalsy();
    });

    it('returns false if argument is an instance', function() {
      var Constr = function() { var a = 23; this.b = function() { return a; }; };
      var obj = new Constr();
      expect(this.eb.isPlainObject(obj)).toBeFalsy();
    });

    it('returns false if argument is an array', function() {
      var obj = [];
      expect(this.eb.isPlainObject(obj)).toBeFalsy();
    });

    it('returns false if argument is null', function() {
      expect(this.eb.isPlainObject(null)).toBeFalsy();
    });

    it('returns false if argument is undefined', function() {
      expect(this.eb.isPlainObject()).toBeFalsy();
    });

  });

});
