'use strict';

var proxyquire =  require('proxyquire');

describe('An Event Object', function() {
  var events;

  beforeEach(function() {
    // proxyquire enshures reloading of events.js
    events = proxyquire('../../src/events.js', {});
  });

  afterEach(function() {
    events = null;
  });

  it('should be defined', function() {
    expect(events).toBeDefined();
  });

  it('should hold an object containing event classes', function() {
    expect(events.class.audio).toBeDefined();
    expect(events.class.synth).toBeDefined();
  });

  it('should hold an object containing event types', function() {
    expect(events.type.note).toBeDefined();
    expect(events.type.control).toBeDefined();
  });

  it('should hold an array containing event properties', function() {
    expect(events.property).toContain('tone');
    expect(events.property).toContain('duration');
    expect(events.property).toContain('velocity');
    expect(events.property).toContain('pitch');
    expect(events.property).toContain('volume');
    expect(events.property).toContain('pan');
  });

  describe('audio note event', function() {

    var instrument, testEvt;

    beforeEach(function() {
      instrument = { 'name': 'fake instrument' };
      testEvt = {
        'class': 'audio',
        'type': 'note',
        'props': {}
      };
    });

    afterEach(function() {
      instrument = testEvt = null;
    });

    it('should be created with right parameters', function() {
      testEvt.props = {
        'instrument': instrument,
        'tone': 12,
        'velocity': 65,
        'duration': 128
      };
      var an = events.createAudioNote(12, 65, 128, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should fail silently if tone is out of bounds', function() {
      testEvt.props = {
        'instrument': instrument,
        'velocity': 65,
        'duration': 128
      };
      var an = events.createAudioNote(129, 65, 128, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should fail silently if velocity is a string', function() {
      testEvt.props = {
        'instrument': instrument,
        'tone': 12,
        'duration': 128
      };
      var an = events.createAudioNote(12, 'foo', 128, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should fail silently if duration is negative', function() {
      testEvt.props = {
        'instrument': instrument,
        'tone': 12,
        'velocity': 65
      };
      var an = events.createAudioNote(12, 65, -1, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should throw an error if an instrument is missing', function() {
      expect(function() { events.createAudioNote(12, 65, 128); }).toThrowError('A sequencer event must have an instrument as property');
    });

    it('should be created with a string as tone', function() {
      testEvt.props = {
        'instrument': instrument,
        'tone': 12,
        'velocity': 65,
        'duration': 128
      };
      var an = events.createAudioNote('c1', 65, 128, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should be created with a string as semitone', function() {
      testEvt.props = {
        'instrument': instrument,
        'tone': 15,
        'velocity': 65,
        'duration': 128
      };
      var an = events.createAudioNote('d#1', 65, 128, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should be created with a h tone (converted to b)', function() {
      testEvt.props = {
        'instrument': instrument,
        'tone': 23,
        'velocity': 65,
        'duration': 128
      };
      var an = events.createAudioNote('h1', 65, 128, instrument);
      expect(an).toEqual(testEvt);
    });

    it('should throw an error with a false formatted string (not c1 or d#1)', function() {
      expect(function() { events.createAudioNote('brzz', 65, 128, instrument); })
        .toThrowError('Unvalid string. Has to be like [a-h]<#>[0-9]');
    });
  });

});
