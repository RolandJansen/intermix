'use strict';

var Intermix = require('../../src/core.js');
describe('The intermix core', function() {

  var intermix = null;

  beforeEach(function() {
    intermix = new Intermix();
  });

  afterEach(function() {
    intermix = null;
  });

  it('should initialize the audio context object', function() {
    expect(intermix.audioCtx).toBeDefined();
  });
});
