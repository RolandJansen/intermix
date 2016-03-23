'use strict';

require('web-audio-test-api');
var core = require('../../src/core.js');
describe('The intermix core', function() {

  it('should initialize the audio context', function() {
    expect(core).toBeDefined();
  });

  it('should have an audio output', function() {
    expect(core.destination).toBeDefined();
  });

  it('should terminate the audiochain if desired', function() {
    core.close();
    expect(core.destination).toBe(null);
  });
});
