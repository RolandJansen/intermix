'use strict';

var work = require('webworkify');

describe('A scheduleWorker', function() {
  // Two things about testing webworkers:
  // 1. Tests will FAIL on node because webworkers are browser-only
  // 2. The only way to test this is async. You can probably mock
  //    the clock and inject fake setInterval into the worker with
  //    proxyquire. Calls to jasmine.clock().tick() will never reach
  //    the worker because it's disjoint from the main execution.
  var worker, timerCallback;

  beforeEach(function(done) {
    worker = work(require('../../src/scheduleWorker.js'));
    timerCallback = jasmine.createSpy('timerCallback');
    worker.onmessage = function(e) {
      timerCallback(e);
    };
    done();
  }, 1000);

  afterEach(function(done) {
    worker.postMessage('stop');
    worker = null;
    timerCallback = null;
    done();
  }, 1000);

  it('should be defined', function() {
    expect(worker).toBeDefined();
  });

  it('should run with a default of 100ms interval when started', function(done) {
    worker.postMessage('start');
    setTimeout(function() {
      expect(timerCallback.calls.count()).toEqual(2);
      done();
    }, 290);
  });

  it('should run with a custom interval', function(done) {
    worker.postMessage({ 'interval': 200 });
    worker.postMessage('start');
    setTimeout(function() {
      expect(timerCallback.calls.count()).toEqual(2);
      done();
    }, 490);
  });

  it('should get stopped with a stop message', function(done) {
    worker.postMessage('start');
    worker.postMessage('stop');
    setTimeout(function() {
      expect(timerCallback.calls.count()).toEqual(0);
      done();
    }, 190);
  });
});
