'use strict';

var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire'); //fake require in the module under test

// All 'new' features of the api have to be enabled here
WebAudioTestAPI.setState({
  'AudioContext#createStereoPanner': 'enabled',
});

describe('A Sound', function() {
  var Sound, sound, ac, wave;

  beforeEach(function() {
    ac = new WebAudioTestAPI.AudioContext();

    Sound = proxyquire('../../src/Sound.js', { 'core': ac, '@noCallThru': true});
    wave = {
      buffer: ac.createBuffer(2, 22050, 44100)  //create a buffer of 0.5s length
    };
    sound = new Sound(wave);
    // remember that ac != sound.ac
    sound.ac.$processTo('00:00.000');
  });

  afterEach(function() {
    Sound, sound, ac, wave = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(sound.ac.$name).toBeDefined();                                 //are we testing against it?
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
    sound.start();
    expect(sound.queue.length).toBe(1);
  });

  it('should delete a BufferSourceNode from the queue when stopped', function() {
    sound.start();
    expect(sound.queue.length).toBe(1);
    sound.stop();
    expect(sound.queue.length).toBe(0);
  });

  it('should start a BufferSourceNode at a given time', function() {
    sound.start(false, 0.100);
    expect(sound.queue[0].$stateAtTime('00:00.000')).toBe('SCHEDULED');
    expect(sound.queue[0].$stateAtTime('00:00.099')).toBe('SCHEDULED');
    expect(sound.queue[0].$stateAtTime('00:00.100')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:00.599')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:00.600')).toBe('FINISHED');
  });

  it('should stop a BufferSourceNode immediateley', function() {
    sound.start();
    expect(sound.queue[0].$stateAtTime('00:00.000')).toBe('PLAYING');
    sound.ac.$processTo('00:00.100');
    expect(sound.queue[0].$stateAtTime('00:00.100')).toBe('PLAYING');
    sound.stop();
    expect(sound.queue[0]).not.toBeDefined();
  });

  it('should stop a BufferSourceNode even if it\'s just scheduled.', function() {
    sound.start(false, 2);
    expect(sound.queue[0].$stateAtTime('00:00.100')).toBe('SCHEDULED');
    sound.stop();
    expect(sound.queue[0]).not.toBeDefined();
  });

  it('should stop the streams of all nodes when paused', function() {
    sound.start();
    sound.playbackRate = 1.25;
    sound.start();
    var pbRate1 = sound.queue[0].playbackRate.value;
    var pbRate2 = sound.queue[1].playbackRate.value;
    sound.pause();
    expect(sound.queue[0].playbackRate.value).toEqual(0);
    expect(sound.queue[1].playbackRate.value).toEqual(0);
    expect(sound.queue[0].tmpPlaybackRate).toEqual(pbRate1);
    expect(sound.queue[1].tmpPlaybackRate).toEqual(pbRate2);
  });

  it('should resume the streams of all nodes when resumed', function() {
    sound.start();
    sound.playbackRate = 1.25;
    sound.start();
    sound.pause();
    var pbRate1 = sound.queue[0].tmpPlaybackRate;
    var pbRate2 = sound.queue[1].tmpPlaybackRate;
    sound.resume();
    expect(sound.queue[0].playbackRate.value).toEqual(pbRate1);
    expect(sound.queue[1].playbackRate.value).toEqual(pbRate2);
  });

  it('should process a sequencer event', function() {
    var se = {
      'class': 'audio',
      'type': 'note',
      'props': {
        'instrument': 'foo',
        'tone': 12,
        'velocity': 65,
      }
    };
    sound.processSeqEvent(se);
    expect(sound.queue.length).toEqual(1);
  });

  xit('should stop the sound after a given duration', function() {
    // this doesn't work
    // sound.start(0, false, 0.1);
    // expect(sound.queue[0].$stateAtTime('00:00.200')).toBe('PLAYING');
    // expect(sound.queue[0].$stateAtTime('00:00.501')).toBe('FINISHED');
  });

  it('should be played looped', function() {
    sound.start(true);
    expect(sound.queue[0].$stateAtTime('00:00.500')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:01.000')).toBe('PLAYING');
    expect(sound.queue[0].$stateAtTime('00:03.000')).toBe('PLAYING');
    sound.stop();
  });

  it('should set the loop start point before a node starts', function() {
    sound.setLoopStart(0.1);
    sound.start(true);
    expect(sound.queue[0].loopStart).toEqual(0.1);
  });

  it('sound set the loop start point while nodes are running', function() {
    sound.start(true);
    sound.start(true);
    sound.setLoopStart(0.2);
    expect(sound.queue[0].loopStart).toEqual(0.2);
    expect(sound.queue[1].loopStart).toEqual(0.2);
  });

  it('should set the loop end point before a node starts', function() {
    sound.setLoopEnd(0.3);
    sound.start(true);
    expect(sound.queue[0].loopEnd).toEqual(0.3);
  });

  it('should set the loop end point while nodes are running', function() {
    sound.start(true);
    sound.start(true);
    sound.setLoopEnd(0.3);
    expect(sound.queue[0].loopEnd).toEqual(0.3);
    expect(sound.queue[1].loopEnd).toEqual(0.3);
  });

  it('should release the loop on running nodes', function() {
    sound.start(true);
    sound.start(true);
    sound.releaseLoop();
    expect(sound.queue[0].loop).toBeFalsy();
    expect(sound.queue[1].loop).toBeFalsy();
  });

  it('should reset the loop start/end to start/end of the sound', function() {
    sound.setLoopStart(0.1);
    sound.setLoopEnd(0.3);
    expect(sound.loopStart).toEqual(0.1);
    expect(sound.loopEnd).toEqual(0.3);
    sound.resetLoop();
    expect(sound.loopStart).toEqual(0);
    expect(sound.loopEnd).toEqual(0.5);
  });

  it('should set the playback rate (freq) of the sound', function() {
    sound.setPlaybackRate(1.25);
    sound.start(false);
    expect(sound.queue[0].playbackRate.value).toEqual(1.25);
  });

  it('should set the playback rate while nodes are running', function() {
    sound.start();
    sound.start();
    sound.setPlaybackRate(0.8);
    expect(sound.queue[0].playbackRate.value).toEqual(0.8);
    expect(sound.queue[1].playbackRate.value).toEqual(0.8);
  });

  it('should set the tone between two octaves', function() {
    sound.setTone(5);
    sound.start(0, false);
    expect(sound.queue[0].detune.value).toEqual(500);
  });

  it('should detune the sound in cents within a range of +/- 1200 (two octaves)', function() {
    sound.setDetune(-500);
    sound.start(0, false);
    expect(sound.queue[0].detune.value).toEqual(-500);
  });

});
