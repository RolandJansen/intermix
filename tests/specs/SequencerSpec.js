'use strict';

var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire'); //fake require in the module under test
var ac = new WebAudioTestAPI.AudioContext();

// All 'new' features of the api have to be enabled here
WebAudioTestAPI.setState({});

// Inject the mocked audioContext into the module under test,
// @noCallThru prevents calls to the real api if something is
// not found on the stub.
var Sequencer = proxyquire('../../src/Sequencer.js', { 'core': ac, '@noCallThru': true});

describe('A Sequencer', function() {
  var sequencer, part;

  function createArray(length) {
    var arr = [];
    for (var i = 0; i < length; i++) {
      arr[i] = i + 1;
    }
    return arr;
  }

  beforeEach(function() {
    part = {
      length: 1,
      name: 'part',
      pattern: []
    };
    sequencer = new Sequencer();
  });

  afterEach(function() {
    sequencer = part = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(sequencer.ac.$name).toBeDefined();                             //are we testing against it?
  });

  it('should be defined', function() {
    expect(sequencer).toBeDefined();
  });

  it('should add a part to the master queue', function() {
    sequencer.addPart(part, 5);
    expect(sequencer.queue[5][0]).toBe(part);
    expect(function() { sequencer.addPart('brzz', 6); }).toThrowError('Given parameter doesn\' seem to be a part object');
  });

  it('should remove a part from the master queue', function() {
    sequencer.addPart(part, 5);
    expect(sequencer.queue[5][0]).toBe(part);
    sequencer.removePart(part, 5);
    expect(sequencer.queue[5][0]).toBeUndefined();
    expect(function() { sequencer.removePart(part, 5); }).toThrowError('Part not found at position 5.');
  });

  it('should compute the time between two shortest possible notes', function() {
    var t1 = sequencer.setTimePerStep(120, 64);
    var t2 = sequencer.setTimePerStep(160, 24);
    expect(t1).toEqual(0.03125);
    expect(t2).toEqual(0.0625);
  });

  it('should copy an array by value', function() {
    var src = createArray(32);
    var dest = sequencer.copyArray(src);
    dest[5] = 'brzz';
    expect(dest.length).toEqual(32);
    expect(dest[5]).toMatch('brzz');
    expect(src[5]).toEqual(6);
  });

});
