'use strict';

var testObj = require('../../src/x.js');
describe('A something', function() {
  var x;

  beforeEach(function() {
    x = 1;
  });

  afterEach(function() {
    x = null;
  });

  it('should do something', function() {
    expect(x).toBeDefined();
  });

});
