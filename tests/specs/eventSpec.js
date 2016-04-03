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

  it('should create an audio note event', function() {
    var test = {
      'class': 'audio',
      'type': 'note',
      'props': {
        'tone': 12,
        'velocity': 65,
        'duration': 128
      }
    }
    var an = events.createAudioNote(12, 65, 128);
    expect(an).toEqual(test);
  });

  it('should fail silently if a note property is out of bounds', function() {
    var test = {
      'class': 'audio',
      'type': 'note',
      'props': {}
    }
    var an = events.createAudioNote(129, 'foo', -1);
    expect(an).toEqual(test);
  });

});
