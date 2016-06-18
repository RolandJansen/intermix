'use strict';

var proxyquire = require('proxyquire');

describe('A Helper', function() {

  beforeEach(function() {
    // proxyquire enshures reloading of events.js
    this.helper = proxyquire('../../src/Helper.js', {});
  });

  describe('.getNoteFrequencies', function() {

    beforeEach(function() {
      this.freq = this.helper.getNoteFrequencies();
    });

    it('returns an array of length 128', function() {
      expect(this.helper.frequencyLookup.length).toEqual(128);
    });

    it('returns an array with frequencies of all midi notes', function() {
      expect(this.helper.frequencyLookup[69]).toEqual(440);
      expect(this.helper.frequencyLookup[57]).toEqual(220);
      expect(this.helper.frequencyLookup[81]).toEqual(880);
    });

  });

  describe('.createNoteEvent', function() {

    beforeEach(function() {
      this.uid = '2305230523052342';
      this.value = 60;
      this.velocity = 1;
      this.steps = 4;
      this.msg = {
        type: 'note',
        value: this.value,
        velocity: this.velocity,
        steps: this.steps
      };
      this.evt = { uid: this.uid, msg: this.msg };
    });

    describe('on success', function() {

      it('returns a valid note event when given a midi note number', function() {
        var evt = this.helper.createNoteEvent(this.uid, this.value, this.velocity, this.steps);
        expect(evt).toEqual(this.evt);
      });

      it('returns a valid note event when given a tone string', function() {
        var evt = this.helper.createNoteEvent(this.uid, 'c4', this.velocity, this.steps);
        expect(evt).toEqual(this.evt);
      });

    });

    describe('on failure', function() {

      it('throws a TypeError if uid is of wrong type', function() {
        var self = this;
        expect(function() {
          self.helper.createNoteEvent(23, 'c4', 1);
        }).toThrowError(TypeError);
      });

      it('throws a TypeError if tone is of wrong type', function() {
        var self = this;
        expect(function() {
          self.helper.createNoteEvent(self.uid, {}, 1);
        }).toThrowError(TypeError);
      });

      it('throws if velocity is out of bounds', function() {
        var self = this;
        expect(function() {
          self.helper.createNoteEvent(self.uid, 'c4', 2);
        }).toThrow();
      });

      it('throws a type error if velocity is NaN', function() {
        var self = this;
        expect(function() {
          self.helper.createNoteEvent(self.uid, 'c4', 'foo');
        }).toThrowError(TypeError);
      });

      it('throws a type error if velocity is not defined', function() {
        var self = this;
        expect(function() {
          self.helper.createNoteEvent(self.uid, 'c4');
        }).toThrowError(TypeError);
      });

      it('throws a type error if steps is defined but not a number', function() {
        var self = this;
        expect(function() {
          self.helper.createNoteEvent(self.uid, 'c4', 1, 'foo');
        }).toThrowError(TypeError);
      });

    });

  });

  describe('.createVolumeEvent', function() {

    beforeEach(function() {
      this.uid = '2305230523052342';
      this.value = 60;
      this.msg = { type: 'volume', value: this.value };
      this.evt = { uid: this.uid, msg: this.msg };
    });

    it('on success returns a valid volume event when given a volume of [0, 127]', function() {
      var evt = this.helper.createVolumeEvent(this.uid, this.value);
      expect(evt).toEqual(this.evt);
    });

    describe('on failure', function() {

      it('throws a TypeError if uid is of wrong type', function() {
        var self = this;
        expect(function() {
          self.helper.createVolumeEvent(23, self.value);
        }).toThrowError(TypeError);
      });

      it('throws a TypeError if volume is of wrong type', function() {
        var self = this;
        expect(function() {
          self.helper.createVolumeEvent(self.uid, 'foo');
        }).toThrowError(TypeError);
      });

      it('throws a TypeError if volume is undefined', function() {
        var self = this;
        expect(function() {
          self.helper.createVolumeEvent(self.uid);
        }).toThrowError(TypeError);
      });

      it('throws an Error if volume is out of bounds', function() {
        var self = this;
        expect(function() {
          self.helper.createVolumeEvent(self.uid, -1);
        }).toThrow();
      });

    });

  });

  describe('.validateEvent', function() {

    beforeEach(function() {
      this.uid = '2305230523052342';
      this.type = 'note';
      this.value = 23;
      this.msg = { type: this.type, value: this.value };
      this.evt = { uid: this.uid, msg: this.msg };
    });

    it('returns true when all mandatory values are correct', function() {
      expect(this.helper.validateEvent(this.evt)).toBeTruthy();
    });

    describe('returns false when', function() {

      it('uid is not of type string', function() {
        this.evt.uid = 23;
        expect(this.helper.validateEvent(this.evt)).toBeFalsy();
      });

      it('msg is not a plain js object', function() {
        this.evt.msg = 23;
        expect(this.helper.validateEvent(this.evt)).toBeFalsy();
      });

      it('type is not of type string', function() {
        this.evt.msg.type = 23;
        expect(this.helper.validateEvent(this.evt)).toBeFalsy();
      });

      it('value is undefined', function() {
        delete this.evt.msg.value;
        expect(this.helper.validateEvent(this.evt)).toBeFalsy();
      });

    });

  });

  describe('.getNoteFrequency', function() {

    it('returns the frequency of a midi note number', function() {
      expect(this.helper.getNoteFrequency(69)).toEqual(440);
    });

    it('returns the frequency of a note given as string', function() {
      expect(this.helper.getNoteFrequency('a4')).toEqual(440);
    });

  });

  describe('.getNoteNumber', function() {

    it('returns a midi note number if arg is a full tone', function() {
      expect(this.helper.getNoteNumber('c4')).toEqual(60);
    });

    it('returns a midi note number if arg is a half tone', function() {
      expect(this.helper.getNoteNumber('g#2')).toEqual(44);
    });

    it('returns a midi note number if arg is upper case', function() {
      expect(this.helper.getNoteNumber('C4')).toEqual(60);
    });

    it('converts a "h" to a "b"', function() {
      expect(this.helper.getNoteNumber('h5')).toEqual(83);
    });

    it('throws an error with a false string argument (not c1 or d#1)', function() {
      var self = this;
      expect(function() { self.helper.getNoteNumber('brzz'); })
      .toThrowError('Unvalid string. Has to be like [a-h]<#>[0-9]');
    });

    it('throws a type error if argument is not of type string', function() {
      var self = this;
      expect(function() { self.helper.getNoteNumber(23); })
      .toThrowError(TypeError);
    });

  });

  describe('.isPlainObject', function() {

    describe('returns true if', function() {

      it('argument is an empty object', function() {
        expect(this.helper.isPlainObject({})).toBeTruthy();
      });

      it('argument is a plain object', function() {
        var obj = { 'a': true, 'b': 'foo', 'c': 23 };
        expect(this.helper.isPlainObject(obj)).toBeTruthy();
      });

      it('argument is a nested object', function() {
        var obj = { 'a': { 'b': { 'c': true } } };
        expect(this.helper.isPlainObject(obj)).toBeTruthy();
      });

    });

    describe('returns false if', function() {

      it('argument is a constructor', function() {
        var obj = function() { var a = 23; this.b = function() { return a; }; };
        expect(this.helper.isPlainObject(obj)).toBeFalsy();
      });

      it('argument is an instance', function() {
        var Constr = function() { var a = 23; this.b = function() { return a; }; };
        var obj = new Constr();
        expect(this.helper.isPlainObject(obj)).toBeFalsy();
      });

      it('argument is an array', function() {
        var obj = [];
        expect(this.helper.isPlainObject(obj)).toBeFalsy();
      });

      it('argument is null', function() {
        expect(this.helper.isPlainObject(null)).toBeFalsy();
      });

      it('argument is undefined', function() {
        expect(this.helper.isPlainObject()).toBeFalsy();
      });

    });

  });

});
