'use strict';

var WebAudioTestAPI = require('web-audio-test-api');

// All 'new' features of the api have to be enabled here
WebAudioTestAPI.setState({
  'AudioContext#suspend': 'enabled',
  'AudioContext#resume': 'enabled'
});

describe('Sequencer', function() {
  var ac, Sequencer, sequencer, pattern1
    , pattern2, part1, part2, seqEvent, instrument, eventBus;

  function createArray(length) {
    var arr = [];
    for (var i = 0; i < length; i++) {
      arr[i] = i + 1;
    }
    return arr;
  }

  beforeEach(function() {
    var proxyquire = require('proxyquire');
    ac = new WebAudioTestAPI.AudioContext();
    // mock window object globally if running on node
    if (typeof window === 'undefined') {
      global.window = {
        requestAnimationFrame: jasmine.createSpy('requestAnimationFrame'),
        AudioContext: jasmine.createSpy('AudioContext')
      };

      Sequencer = proxyquire('../../src/Sequencer.js', {
        'webworkify': function(worker) { return worker; },
        './core.js': ac,
        './scheduleWorker.js': jasmine.createSpyObj('scheduleWorker', [ 'postMessage', 'onmessage' ]),
        '@noCallThru': true
      });
    } else {
      // var proxyquire = require('proxyquire');
      window.requestAnimationFrame = jasmine.createSpy('requestAnimationFrame');
      Sequencer = proxyquire('../../src/Sequencer.js', {
        'webworkify': function(worker) { return worker; },
        './core.js': ac,
        './scheduleWorker.js': jasmine.createSpyObj('scheduleWorker', [ 'postMessage', 'onmessage' ])
      });
    }

    pattern1 = [];
    pattern2 = [];
    for (var i = 0; i <= 3; i++) {
      pattern1[i] = createArray(4);
      pattern2[i] = createArray(3);
    }
    part1 = { 'pattern': pattern1, 'length': 64 };
    part2 = { 'pattern': pattern2, 'length': 64 };
    seqEvent = {
      'uid': '1a',
      'note': { 'value': 60, 'velocity': 1 }
    };

    eventBus = jasmine.createSpyObj('eventBus',
      ['addRelayEndpoint', 'sendToRelayEndpoint']);

    sequencer = new Sequencer(eventBus);
  });

  afterEach(function() {
    if (typeof global.window.document !== 'undefined') {
      delete global.window;
    }
    ac = Sequencer = sequencer = pattern1 =
      pattern2 = part1 = part2 = seqEvent = instrument = eventBus = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    // expect(sequencer.ac.$name).toBeDefined();                             //are we testing against it?
  });

  it('should be defined', function() {
    expect(sequencer).toBeDefined();
  });

  it('if eventBus arg, should register to the controller relay', function() {
    // should be more nicely rewritten as a 'registerToRelay' test
    expect(eventBus.addRelayEndpoint).toHaveBeenCalledWith('controller', {}, sequencer);
  });

  describe('scheduler', function() {

    beforeEach(function() {
      sequencer.addPartsToRunqueue = jasmine.createSpy('addPartsToRunqueue');
      sequencer.fireEvents = jasmine.createSpy('fireEvents');
      sequencer.setQueuePointer = jasmine.createSpy('setQueuePointer');
    });

    afterEach(function() {
      sequencer.ac.$processTo('00:00.000');
    });

    it('should run until the lookahead limit is reached', function() {
      sequencer.ac.$processTo('00:01.000');
      sequencer.scheduler();
      expect(sequencer.addPartsToRunqueue).toHaveBeenCalledTimes(10);
      expect(sequencer.fireEvents).toHaveBeenCalledTimes(10);
      expect(sequencer.setQueuePointer).toHaveBeenCalledTimes(10);
      expect(sequencer.nextStepTime).toBeGreaterThan(1.3);
      expect(sequencer.nextStepTime).toBeLessThan(1.4);
    });
  });

  it('should copy parts from the master queue to the runqueue', function() {
    sequencer.addPart(part1, 3);
    sequencer.addPart(part2, 3);
    sequencer.nextStep = 3;
    sequencer.addPartsToRunqueue();
    expect(sequencer.runqueue).toContain(part1);
    expect(sequencer.runqueue).toContain(part2);
  });

  it('should add a pointer to the part when copied to the runqueue', function() {
    sequencer.addPart(part1, 3);
    sequencer.addPart(part2, 3);
    sequencer.nextStep = 3;
    sequencer.addPartsToRunqueue();
    expect(sequencer.runqueue[0].pointer).toEqual(0);
    expect(sequencer.runqueue[1].pointer).toEqual(0);
  });

  it('should fire events from the runqueue', function() {
    sequencer.processSeqEvent = jasmine.createSpy('processSeqEvent');
    part1.pointer = part2.pointer = 0;
    sequencer.runqueue.push(part1, part2);
    sequencer.fireEvents();
    expect(sequencer.processSeqEvent).toHaveBeenCalledTimes(7);
    expect(sequencer.processSeqEvent.calls.allArgs())
      .toEqual([[1, 0], [2, 0], [3, 0], [4, 0], [1, 0], [2, 0], [3, 0]]);
  });

  it('should delete parts from runqueue', function() {
    part1.pointer = part2.pointer = 64;
    sequencer.runqueue.push(part1, part2);
    sequencer.deletePartsFromRunqueue([1, 0]);
    expect(sequencer.runqueue.length).toEqual(0);
  });

  it('should delete the pointer from removed parts', function() {
    part1.pointer = part2.pointer = 64;
    sequencer.runqueue.push(part1, part2);
    sequencer.deletePartsFromRunqueue([1, 0]);
    expect(part1.pointer).not.toBeDefined();
    expect(part2.pointer).not.toBeDefined();
  });

  it('should process an event', function() {
    sequencer.processSeqEvent(seqEvent);
    expect(eventBus.sendToRelayEndpoint).toHaveBeenCalledWith(seqEvent.uid, seqEvent);
  });

  it('should process an event with delay', function() {
    sequencer.processSeqEvent(seqEvent, 0.2342);
    expect(seqEvent.delay).toEqual(0.2342);
  });

  it('should set the queue pointer one step forward', function() {
    sequencer.setQueuePointer();
    expect(sequencer.nextStep).toEqual(1);
    sequencer.setQueuePointer();
    expect(sequencer.nextStep).toEqual(2);
  });

  it('should set the pointer back to start when end of loop is reached', function() {
    sequencer.loopStart = 5;
    sequencer.loopEnd = 23;
    sequencer.loop = true;
    sequencer.nextStep = 22;
    sequencer.setQueuePointer();
    expect(sequencer.nextStep).toEqual(23);
    sequencer.setQueuePointer();
    expect(sequencer.nextStep).toEqual(5);
  });

  it('should clean the runqueue when end of loop is reached', function() {
    sequencer.runqueue.push(part1, part2);
    sequencer.loopStart = 5;
    sequencer.loopEnd = 23;
    sequencer.loop = true;
    sequencer.nextStep = 24;
    sequencer.setQueuePointer();
    expect(sequencer.runqueue.length).toEqual(0);
  });

  it('should set the pointer to a given position', function() {
    sequencer.setQueuePointer(42);
    expect(sequencer.nextStep).toEqual(42);
  });

  it('should clean the runqueue when the pointer jumps', function() {
    sequencer.runqueue.push(part1, part2);
    sequencer.setQueuePointer(5);
    expect(sequencer.runqueue.length).toEqual(0);
  });

  it('should reset the queue pointer', function() {
    sequencer.runqueue.push(part1, part2);
    sequencer.setQueuePointer(23);
    sequencer.resetQueuePointer();
    expect(sequencer.nextStep).toEqual(0);
    expect(sequencer.runqueue.length).toEqual(0);
  });

  it('should start', function() {
    sequencer.start();
    expect(sequencer.isRunning).toBeTruthy();
    expect(sequencer.scheduleWorker.postMessage).toHaveBeenCalledWith('start');
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should stop', function() {
    sequencer.stop();
    expect(sequencer.isRunning).toBeFalsy();
    expect(sequencer.nextStepTime).toBe(0);
    expect(sequencer.scheduleWorker.postMessage).toHaveBeenCalledWith('stop');
  });

  it('should pause', function() {
    sequencer.start();
    sequencer.pause();
    expect(sequencer.ac.state).toMatch('suspended');
    expect(sequencer.isRunning).toBeFalsy();
  });

  it('should not pause if sequencer\'s not running', function() {
    sequencer.pause();
    expect(sequencer.ac.state).toMatch('running');
  });

  it('should not pause if AudioContext already suspenden', function() {
    sequencer.ac.suspend();
    var paused = sequencer.pause();
    expect(paused).toBeFalsy();
  });

  it('should resume when paused', function() {
    sequencer.ac.suspend();
    expect(sequencer.ac.state).toMatch('suspended');
    sequencer.resume();
    expect(sequencer.ac.state).toMatch('running');
  });

  it('should not resume if sequencer\'s running already', function() {
    sequencer.start();
    var resumed = sequencer.resume();
    expect(resumed).toBeFalsy();
  });

  it('should not resume if AudioContext is not suspended', function() {
    var resumed = sequencer.resume();
    expect(resumed).toBeFalsy();
  });

  describe('.addPart', function() {

    it('is chainable', function() {
      var ctx = sequencer.addPart(part1, 4);
      expect(ctx).toEqual(sequencer);
    });

    it('adds a part to the master queue', function() {
      sequencer.addPart(part1, 5);
      expect(sequencer.queue[5][0]).toBe(part1);
    });

    it('throws if parameter is not a part object', function() {
      expect(function() { sequencer.addPart('brzz', 6); }).toThrowError(TypeError);
    });

  });

  describe('.removePart', function() {

    beforeEach(function() {
      sequencer.addPart(part1, 5);
    });

    it('is chainable', function() {
      var ctx = sequencer.removePart(part1, 5);
      expect(ctx).toEqual(sequencer);
    });

    it('removes a part from the master queue', function() {
      sequencer.removePart(part1, 5);
      expect(sequencer.queue[5][0]).toBeUndefined();
    });

    it('throws if parameter is not a part object', function() {
      expect(function() { sequencer.removePart({}, 5); }).toThrowError(TypeError);
    });

    it('fails silently if part not found on given position', function() {
      expect(function() { sequencer.removePart(part1, 6); }).not.toThrow();
    });

  });

  it('should set the bpm value', function() {
    sequencer.setBpm(160);
    expect(sequencer.bpm).toEqual(160);
    expect(sequencer.timePerStep).toEqual(0.0234375);
  });

  it('should compute the time between two shortest possible notes', function() {
    var t1 = sequencer.setTimePerStep(120, 64);
    var t2 = sequencer.setTimePerStep(160, 24);
    expect(t1).toEqual(0.03125);
    expect(t2).toEqual(0.0625);
  });

  it('should copy an array by value', function() {
    var src = createArray(32);
    var dest = sequencer.copyArray(src);
    dest[5] = 'brzz';
    expect(dest.length).toEqual(32);
    expect(dest[5]).toMatch('brzz');
    expect(src[5]).toEqual(6);
  });

});
