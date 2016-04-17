'use strict';

var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire'); //fake require in the module under test
var ac = new WebAudioTestAPI.AudioContext();

// All 'new' features of the api have to be enabled here
WebAudioTestAPI.setState({});

// Inject the mocked audioContext into the module under test,
// @noCallThru prevents calls to the real api if something is
// not found on the stub.
var Sound = proxyquire('../../src/Sound.js', { 'core': ac, '@noCallThru': true});

describe('A something', function() {
  var sound;

  beforeEach(function() {
    sound = new Sound();
  });

  afterEach(function() {
    sound = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(sequencer.ac.$name).toBeDefined();                             //are we testing against it?
  });

  it('should be defined', function() {
    expect(sound).toBeDefined();
  });

});
