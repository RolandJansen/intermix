'use strict';

var Intermix = require('../../src/core.js');
describe('The intermix core', function() {

  beforeEach(function() {
    //intermix = new Intermix();
    //var zwo = 2;
  });

  afterEach(function() {
    //intermix = null;
  });

  it('should initialize the audio context object', function() {
    expect(Intermix.audioCtx).toBeDefined();
  });
});
