'use strict';

require('web-audio-test-api');
var core = require('../../src/core.js');
var Sound = require('../../src/Sound.js');
describe('A Sound', function() {
  var sound, wave;

  beforeEach(function() {
    wave = {
      buffer: core.createBuffer(2, 22050, 44100)
    };
    sound = new Sound(wave);
  });

  afterEach(function() {
    sound, wave = null;
  });

  it('should be defined when instanciated', function() {
    expect(sound).toBeDefined();
  });

});
