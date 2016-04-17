'use strict';

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
global.XMLHttpRequest = XMLHttpRequest;

var atob = require('atob');
// see this post: https://blog.pivotal.io/labs/labs/testing-javascript-promises
var mockPromises = require('mock-promises');
var sinon = require('sinon');
// var WebAudioTestAPI = require('web-audio-test-api');
var proxyquire =  require('proxyquire'); //fake require in the module under test

// All 'new' features of the api have to be enabled here
// WebAudioTestAPI.setState({
//   'AudioContext#decodeAudioData': 'promise'
// });

describe('A SoundWave', function() {
  var testData, ac, SoundWave;

  beforeEach(function() {
    mockPromises.reset();
    global.Promise = mockPromises.getMockPromise(global.Promise);

    var WebAudioTestAPI = require('web-audio-test-api');
    // All 'new' features of the api have to be enabled here
    WebAudioTestAPI.setState({
      'AudioContext#decodeAudioData': 'promise'
    });
    ac = new WebAudioTestAPI.AudioContext();

    if (typeof window === 'undefined' ||
    typeof window.document === 'undefined') {
      global.window = {
        'atob': atob,
        'XMLHttpRequest': XMLHttpRequest
      };
      testData = require('../soundwave-test-data');
      SoundWave = proxyquire('../../src/SoundWave.js', {
        'core': ac,
        '@noCallThru': true
      });
    } else {
      testData = require('../soundwave-test-data.js');
      SoundWave = proxyquire('../../src/SoundWave.js', {
        'core': ac,
        '@noCallThru': true
      });
    }

  });

  afterEach(function() {
    if (!typeof global.window.document === 'undefined') {
      delete global.window;
    }
    ac = SoundWave = null;
    global.Promise = mockPromises.getOriginalPromise();
    mockPromises.uninstall();
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    var soundWave = new SoundWave(testData.buffer1.data);
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(soundWave.ac.$name).toBeDefined();                             //are we testing against it?
  });

  it('can be instantiated with an ArrayBuffer', function() {
    SoundWave.prototype.decodeAudioData = jasmine.createSpy('decodeAudioData');
    var soundWave = new SoundWave(testData.buffer1.data);
    expect(soundWave.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(soundWave.decodeAudioData).toHaveBeenCalledWith(testData.buffer1.data);
  });

  it('can be instantiated with multiple ArrayBuffers', function() {
    SoundWave.prototype.concatBinariesToAudioBuffer = jasmine.createSpy('concatBinariesToAudioBuffer');
    var soundWave = new SoundWave([testData.buffer1.data,
      testData.buffer2.data,
      testData.buffer3.data]);
    expect(soundWave.concatBinariesToAudioBuffer).toHaveBeenCalledTimes(1);
  });

  it('can be instantiated with a filename', function() {
    SoundWave.prototype.loadFile = jasmine.createSpy('loadFile');
    var soundWave = new SoundWave('file.mp3');
    expect(soundWave.loadFile).toHaveBeenCalledTimes(1);
  });

  it('can be instantiated with multiple filenames', function() {
    SoundWave.prototype.loadFiles = jasmine.createSpy('loadFiles');
    SoundWave.prototype.concatBinariesToAudioBuffer = jasmine.createSpy('concatBinariesToAudioBuffer');
    var soundWave = new SoundWave('file1.mp3, file2.mp3, file3.mp3');
    expect(soundWave.loadFiles).toHaveBeenCalledTimes(1);
    expect(soundWave.concatBinariesToAudioBuffer).toHaveBeenCalledTimes(1);
  });

  it('can be instatiated without an argument', function() {
    var soundWave = new SoundWave();
    expect(soundWave).toBeDefined();
  });

  it('can\'t be instantiated with an unknown parameter type', function() {
    expect(function() { new SoundWave({'type': 'anObject'}); })
      .toThrowError('Cannot create SoundWave object: Unsupported data format');
  });

  xit('can decode audio data from an ArrayBuffer', function() {
    var promise, promisedValue;
    var soundWave = new SoundWave();
    // console.log(mockPromises.contracts.all());
    promise = soundWave.decodeAudioData(testData.buffer1.data);
    // var isPromise = prom instanceof Promise;
    // promise = Promise.resolve('foo');
    // promise.then(function(value) {
      // promisedValue = value;
    // });
    console.log(mockPromises.contracts.all()[1]);
    mockPromises.executeForPromise(promise);
    console.log(mockPromises.contracts.all());
    console.log('executed?');

    // var syncProm = mockPromises.getMockPromise(prom);
    // console.log(syncProm);
    // console.log(mockPromises.valueForPromise(prom));
    // mockPromises.executeForPromise(syncProm);
    // expect(isPromise).toBeTruthy();
    // console.log(soundWave.buffer);
    // var isDecoded = decoded instanceof WebAudioTestAPI.AudioBuffer;
    // console.log(isDecoded);
      // expect(isDecoded).toBeTruthy();
  });

  // describe('An ArrayBuffer', function() {
  //   var ac, SoundWave, soundWave;
  //
  //   beforeEach(function() {
  //     ac = new WebAudioTestAPI.AudioContext();
  //     SoundWave = proxyquire('../../src/SoundWave.js', {
  //       'core': ac,
  //       '@noCallThru': true
  //     });
  //     soundWave = new SoundWave();
  //     soundWave.decodeAudioData(testData.buffer1.data);
  //   });
  //
  //   it('should be decoded into an AudioBuffer.', function() {
  //     expect(soundWave.buffer.length).toEqual(testData.buffer1.decodedLength);
  //   });
  // });
  //
  // describe('Two AudioBuffers', function() {
  //   var soundWave, buffer1, buffer2;
  //
  //   beforeEach(function(done) {
  //     soundWave = new SoundWave();
  //     core.decodeAudioData(testData.buffer1.data).then(function(decoded) {
  //       buffer1 = decoded;
  //     });
  //     core.decodeAudioData(testData.buffer2.data).then(function(decoded) {
  //       buffer2 = decoded;
  //       done();
  //     });
  //   });
  //
  //   afterEach(function() {
  //     soundWave = null;
  //   });
  //
  //   it('should be appended into one.', function() {
  //     var appended = soundWave.appendAudioBuffer(buffer1, buffer2);
  //     var length = testData.buffer1.decodedLength + testData.buffer2.decodedLength;
  //     expect(appended.length).toEqual(length);
  //   });
  // });
  //

  describe('XHR loader', function() {
    var server, soundWave;

    beforeEach(function() {
      server = sinon.fakeServer.create();

      if (typeof window.document === 'undefined') {
        // sinon attaches the fake XHR object to global.
        // On node.js we have to explicitly copy it to the window obj.
        window.XMLHttpRequest = global.XMLHttpRequest;
      }
      soundWave = new SoundWave();
    });

    afterEach(function() {
      server.restore();
      if (typeof window.document === 'undefined') {
        // bring back the original XHR obj to window on node.js
        window.XMLHttpRequest = global.XMLHttpRequest;
      }
      soundWave = null;
    });

    it('sends a GET request to the server.', function() {
      soundWave.loadFile('/fake/url/file1.wav', sinon.spy());
      expect(server.requests[0].url).toMatch('/fake/url/file1.wav');
    });

    it('receives a response from the server.', function() {
      var callback = sinon.spy();
      soundWave.loadFile('/fake/url/file1.wav', callback);
      server.requests[0].respond(200,
        { 'Content-Type': 'audio/wav' },
        'Normally this would be an array buffer');

      expect(callback.calledOnce).toBeTruthy();
    });

    it('sends multiple requests to the server when given multiple filenames', function() {
      soundWave.loadFiles('file1.wav, file2.wav, file3.wav');
      expect(server.requests.length).toEqual(3);
    });

    xit('receives multiple responses from the server', function() {
      // loadFiles() simply doesn't work and needs to be debugged/refactored
      var responses = soundWave.loadFiles('file1.wav, file2.wav, file3.wav');
      server.requests.forEach(function(req, index) {
        req.respond(200,
          { 'Content-Type': 'audio/wav' },
          'This is request' + index);
      });
      expect(responses.length).toEqual(3);
      // expect(responses[0]).toMatch('file1.wav');
    });

  });

  it('should sort an associative array by an array of strings', function() {
    var soundWave = new SoundWave();
    var filenames = ['file1', 'file2', 'file3'];
    var toBeSorted = {'file3': 3, 'file1': 1, 'file2': 2};

    var sorted = soundWave.sortBinBuffers(filenames, toBeSorted);
    expect(sorted[0]).toEqual(1);
    expect(sorted[1]).toEqual(2);
    expect(sorted[2]).toEqual(3);
  });

});
