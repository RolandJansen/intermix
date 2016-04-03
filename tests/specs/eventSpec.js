'use strict';

var events = require('../../src/events.js');

describe('An Event Object', function() {

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

  describe('An audio note event', function() {

    var instrument = { 'name': 'fake instrument' };

    it('should be created with right parameters', function() {
      var test = {
        'class': 'audio',
        'type': 'note',
        'props': {
          'instrument': instrument,
          'tone': 12,
          'velocity': 65,
          'duration': 128
        }
      };
      var an = events.createAudioNote(12, 65, 128, instrument);
      expect(an).toEqual(test);
    });

    it('should fail silently if tone is out of bounds', function() {
      var test = {
        'class': 'audio',
        'type': 'note',
        'props': {
          'instrument': instrument,
          'velocity': 65,
          'duration': 128
        }
      };
      var an = events.createAudioNote(129, 65, 128, instrument);
      expect(an).toEqual(test);
    });

    it('should fail silently if velocity is a string', function() {
      var test = {
        'class': 'audio',
        'type': 'note',
        'props': {
          'instrument': instrument,
          'tone': 12,
          'duration': 128
        }
      };
      var an = events.createAudioNote(12, 'foo', 128, instrument);
      expect(an).toEqual(test);
    });

    it('should fail silently if duration is negative', function() {
      var test = {
        'class': 'audio',
        'type': 'note',
        'props': {
          'instrument': instrument,
          'tone': 12,
          'velocity': 65
        }
      };
      var an = events.createAudioNote(12, 65, -1, instrument);
      expect(an).toEqual(test);
    });

    it('should throw an error if an instrument is missing', function() {
      expect(function() { events.createAudioNote(12, 65, 128); }).toThrowError('A sequencer event must have an instrument as property');
    });
  });

});
