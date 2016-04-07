'use strict';

var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire'); //fake require in the module under test

// All 'new' features of the api have to be enabled here
WebAudioTestAPI.setState({});

describe('A Sequencer', function() {
  var ac, Sequencer, sequencer, pattern1, pattern2, part1, part2, seqEvent, instrument;

  function createArray(length) {
    var arr = [];
    for (var i = 0; i < length; i++) {
      arr[i] = i + 1;
    }
    return arr;
  }

  beforeEach(function() {
    ac = new WebAudioTestAPI.AudioContext();
    Sequencer = proxyquire('../../src/Sequencer.js', {
      'core': ac,
      '@noCallThru': true
    });
    instrument = jasmine.createSpyObj('instrument', [ 'processSeqEvent' ]);
    pattern1 = [];
    pattern2 = [];
    for (var i = 0; i <= 3; i++) {
      pattern1[i] = createArray(4);
      pattern2[i] = createArray(3);
    }
    part1 = { 'pattern': pattern1, 'length': 64 };
    part2 = { 'pattern': pattern2, 'length': 64 };
    seqEvent = {
      'class': 'audio',
      'props': { 'instrument': instrument }
    };
    window.requestAnimationFrame = jasmine.createSpy('requestAnimationFrame');
    sequencer = new Sequencer();
    // couldn't get this to work with proxyquire, so:
    sequencer.scheduleWorker = jasmine.createSpyObj('scheduleWorker', [ 'postMessage', 'onmessage' ]);
  });

  afterEach(function() {
    ac = Sequencer = sequencer = pattern1 = pattern2 = part1 = part2 = seqEvent, instrument = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(sequencer.ac.$name).toBeDefined();                             //are we testing against it?
  });

  it('should be defined', function() {
    expect(sequencer).toBeDefined();
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
    expect(instrument.processSeqEvent).toHaveBeenCalledWith(seqEvent);
  });

  it('should process an event with delay', function() {
    sequencer.processSeqEvent(seqEvent, 0.2342);
    expect(seqEvent.props.delay).toEqual(0.2342);
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

  it('should set the pointer to a given position', function() {
    sequencer.setQueuePointer(42);
    expect(sequencer.nextStep).toEqual(42);
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

  it('should add a part to the master queue', function() {
    sequencer.addPart(part1, 5);
    expect(sequencer.queue[5][0]).toBe(part1);
    expect(function() { sequencer.addPart('brzz', 6); }).toThrowError('Given parameter doesn\' seem to be a part object');
  });

  it('should remove a part from the master queue', function() {
    sequencer.addPart(part1, 5);
    expect(sequencer.queue[5][0]).toBe(part1);
    sequencer.removePart(part1, 5);
    expect(sequencer.queue[5][0]).toBeUndefined();
    expect(function() { sequencer.removePart(part1, 5); }).toThrowError('Part not found at position 5.');
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
