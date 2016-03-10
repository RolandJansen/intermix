'use strict';

var Intermix = require('../../src/core.js');
describe('The intermix core', function() {

  it('should initialize the audio context object', function() {
    expect(Intermix.audioCtx).toBeDefined();
  });
});
