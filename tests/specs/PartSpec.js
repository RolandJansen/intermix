'use strict';

var Part = require('../../src/Part.js');

describe('A part', function() {
  var part;
  var evt1 = { 'text': 'This is an event' };
  var evt2 = { 'text': 'Another event' };

  beforeEach(function() {
    part = new Part();
  });

  afterEach(function() {
    part = null;
  });

  it('should be defined', function() {
    expect(part).toBeDefined();
  });

  it('should get initialized by default with one bar pattern-length', function() {
    expect(part.getLength()).toEqual(64);
  });

  it('should get initialized with a given pattern-length', function() {
    var otherPart = new Part(3.5);
    expect(otherPart.getLength()).toEqual(224);
  });

  it('should add an event at a given position', function() {
    part.addEvent(evt1, 5);
    expect(part.pattern[16][0]).toBe(evt1);
  });

  it('should throw an error if position is not within the pattern', function() {
    expect(function() { part.addEvent(17); }).toThrowError('Position out of pattern bounds.');
  });

  it('should remove an event from a given position', function() {
    part.addEvent(evt1, 5);
    part.addEvent(evt2, 5);
    part.removeEvent(evt1, 5);
    expect(part.pattern[16][0]).toBe(evt2);
  });

  it('should extend the pattern on top', function() {
    part.addEvent(evt1, 1);
    part.extendOnTop(0.5);
    expect(part.getLength()).toEqual(96);
    expect(part.pattern[32][0]).toBe(evt1);
  });

  it('should extend the pattern on end', function() {
    part.addEvent(evt1, 1);
    part.extendOnEnd(0.5);
    expect(part.getLength()).toEqual(96);
    expect(part.pattern[0][0]).toBe(evt1);
  });

});
