'use strict';

var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire'); //fake require in the module under test
var ac = new WebAudioTestAPI.AudioContext();

// All 'new' features of the api have to be enabled here
WebAudioTestAPI.setState({
  'AudioContext#createStereoPanner': 'enabled',
});

// Inject the mocked audioContext into the module under test,
// @noCallThru prevents calls to the real api if something is
// not found on the stub.
var Sound = proxyquire('../../src/Sound.js', { 'core': ac, '@noCallThru': true});

describe('A Sound', function() {
  var sound, wave;

  beforeEach(function() {
    wave = {
      buffer: ac.createBuffer(2, 22050, 44100)  //create a buffer of 0.5s length
    };
    sound = new Sound(wave);
    // remember that ac != sound.ac
    sound.ac.$processTo('00:00.000');
  });

  afterEach(function() {
    sound, wave = null;
  });

  it('should ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined();
  });

  it('should be defined when instanciated', function() {
    expect(sound).toBeDefined();
  });

  it('should have a gain node after initialising', function() {
    expect(sound.gainNode).toBeDefined();
    expect(sound.gainNode.gain.value).toBe(1);
  });

  it('should have a stereo-panner node after initialising', function() {
    expect(sound.pannerNode).toBeDefined();
    expect(sound.pannerNode.pan.value).toBe(0);
  });

  it('should create and setup a BufferSourceNode', function() {
    var bsn = sound.createBufferSource();
    expect(bsn).toBeDefined();
    expect(bsn.numberOfInputs).toBe(0);
  });

  it('should add a BufferSourceNode to the queue when started', function() {
    sound.start(0, false);
    expect(sound.queue.length).toBe(1);
  });

  it('should delete a BufferSourceNode from the queue when stopped', function() {
    sound.start(0, false);
    expect(sound.queue.length).toBe(1);
    sound.stop();
    expect(sound.queue.length).toBe(0);
  });

  it('should start a BufferSourceNode at a given time', function() {
    sound.start(0.100, false);
    expect(sound.queue[0].$stateAtTime('00:00.000')).toBe('SCHEDULED');
    expect(sound.queue[0].$stateAtTime('00:00.099')).toBe('SCHEDULED');
    expect(sound.queue[0].$stateAtTime('00:00.100')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:00.599')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:00.600')).toBe('FINISHED');
  });

  it('should stop a BufferSourceNode immediateley', function() {
    sound.start(0, false);
    expect(sound.queue[0].$stateAtTime('00:00.000')).toBe('PLAYING');
    ac.$processTo('00:00.100');
    expect(sound.queue[0].$stateAtTime('00:00.100')).toBe('PLAYING');
    sound.stop();
    expect(sound.queue[0]).not.toBeDefined();
  });

  it('should stop a BufferSourceNode even if it\'s just scheduled.', function() {
    sound.start(2, false);
    expect(sound.queue[0].$stateAtTime('00:00.100')).toBe('SCHEDULED');
    sound.stop();
    expect(sound.queue[0]).not.toBeDefined();
  });

  it('should store the stop time of the BufferSourceNode when paused', function() {
    sound.start(0, false);
    sound.ac.$processTo('00:00.100');
    sound.pause();
    expect(sound.startOffset).toBe(0.1);
  });

  xit('should start the BufferSourceNode with the offset where it was paused', function() {
    sound.start(0, false);
    sound.ac.$processTo('00:00.100');
    sound.pause();
    expect(sound.queue[0]).not.toBeDefined(); // node should be destroyed after 'pausing'
    // this seems to be not directly testable with the web-audio-test-api
    // sound.ac.$processTo('00:01.000');
    // sound.start(0, false);
    // expect(sound.queue[0].$stateAtTime('00:01.400')).toBe('FINISHED');
  });

  xit('should stop the sound after a given duration', function() {
    // this doesn't work either
    // sound.start(0, false, 0.1);
    // expect(sound.queue[0].$stateAtTime('00:00.200')).toBe('PLAYING');
    // expect(sound.queue[0].$stateAtTime('00:00.501')).toBe('FINISHED');
  });

  it('should be played looped', function() {
    sound.start(0, true);
    expect(sound.queue[0].$stateAtTime('00:00.500')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:01.000')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:03.000')).toBe('PLAYING');
    sound.stop();
  });

  it('should set the offset correctly when a looped sound is paused', function() {
    sound.start(0, true);
    sound.ac.$processTo('00:00.600');
    sound.pause();
    expect(sound.startOffset).toBeCloseTo(0.0999, 3);  //should be 0.1 but floats have rounding errors
  });

  xit('should set the offset correctly when a loop doesn\'t start at 0 and the sound is paused', function() {
    //not possible at the moment
  });

  it('should set the loop start point', function() {
    sound.setLoopStart(0.1);
    sound.start(0, true);
    expect(sound.queue[0].loopStart).toBe(0.1);
  });

  it('should set the loop end point', function() {
    sound.setLoopEnd(0.3);
    sound.start(0, true);
    expect(sound.queue[0].loopEnd).toBe(0.3);
  });

  it('should reset the loop start/end to start/end of the sound', function() {
    sound.setLoopStart(0.1);
    sound.setLoopEnd(0.3);
    expect(sound.loopStart).toBe(0.1);
    expect(sound.loopEnd).toBe(0.3);
    sound.resetLoop();
    expect(sound.loopStart).toBe(0);
    expect(sound.loopEnd).toBe(0.5);
  });

  it('should set the frequency (playback rate) of the sound', function() {
    sound.setPlaybackRate(1.25);
    sound.start(0, false);
    expect(sound.queue[0].playbackRate.value).toBe(1.25);
  });

  it('should set the tone between two octaves', function() {
    sound.setTone(5);
    sound.start(0, false);
    expect(sound.queue[0].detune.value).toBe(500);
  });

  it('should detune the sound in cents within a range of +/- 1200 (two octaves)', function() {
    sound.setDetune(-500);
    sound.start(0, false);
    expect(sound.queue[0].detune.value).toBe(-500);
  });
});
