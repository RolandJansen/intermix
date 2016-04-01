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
  var sequencer;

  beforeEach(function() {
    sequencer = new Sequencer();
  });

  afterEach(function() {
    sequencer = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(sequencer.ac.$name).toBeDefined();                             //are we testing against it?
  });

  it('should be defined', function() {
    expect(sequencer).toBeDefined();
  });

});
