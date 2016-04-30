'use strict';

var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire');

describe('The intermix core', function() {
  var core;

  beforeEach(function() {
    // mock window object globally if running on node
    if (typeof window === 'undefined') {
      global.window = { 'AudioContext': WebAudioTestAPI.AudioContext };
    }
    // proxyquire enshures enshures reloading of core.js
    core = proxyquire('../../src/core.js', {});
  });

  afterEach(function() {
    core = null;
    // delete the mocked window object if running on node
    if (typeof global.window.document === 'undefined') {
      delete global.window;
    }
  });

  it('should initialize the audio context', function() {
    expect(core).toBeDefined();
  });

  it('should have an audio output', function() {
    // console.log(core.destination);
    expect(core.destination).toBeDefined();
  });
});
