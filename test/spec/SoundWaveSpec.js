'use strict';

var atob = require('atob');
var proxyquire =  require('proxyquire'); //fake require in the module under test

describe('SoundWave', function() {
  var testData, ac, SoundWave;

  beforeEach(function() {

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
        'fetch': function(value) { return value; },
        'Response': function(value) {
          return {
            'ok': true,
            'arrayBuffer': function() { return value; }
          };
        }
      };
    }

    testData = require('../soundwave-test-data');
    SoundWave = proxyquire('../../src/SoundWave.js', {
      './core.js': ac,
      '@noCallThru': true
    });

  });

  afterEach(function() {
    if (typeof global.window === 'object' &&
    typeof global.window.document === 'undefined') {
      delete global.window;
    }
    ac = SoundWave = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    var soundWave = new SoundWave(testData.buffer1.data);
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(soundWave.ac.$name).toBeDefined();                             //are we testing against it?
  });

  describe('instance', function() {
    var fakePromise = Promise.resolve(true);

    beforeEach(function() {
      spyOn(SoundWave.prototype, 'loadFile').and.returnValue(fakePromise);
      spyOn(SoundWave.prototype, 'loadFiles').and.returnValue(fakePromise);
      spyOn(SoundWave.prototype, 'decodeAudioData');
      spyOn(SoundWave.prototype, 'concatBinariesToAudioBuffer');
    });

    it('can be created with a filename', function() {
      var arg = 'file.mp3';
      var soundWave = new SoundWave(arg);
      expect(soundWave.loadFile).toHaveBeenCalledWith(arg);
    });

    it('can be created with multiple filenames', function() {
      var arg = [ 'file1.wav', 'file2.wav' ];
      var soundWave = new SoundWave(arg);
      expect(soundWave.loadFiles).toHaveBeenCalledWith(arg);
    });

    it('can be created with an ArrayBuffer', function() {
      var soundWave = new SoundWave(testData.buffer1.data);
      expect(soundWave.decodeAudioData).toHaveBeenCalledTimes(1);
      expect(soundWave.decodeAudioData).toHaveBeenCalledWith(testData.buffer1.data);
    });

    it('can be created with multiple ArrayBuffers', function() {
      var arg = [ testData.buffer1.data, testData.buffer2.data ];
      var soundWave = new SoundWave(arg);
      expect(soundWave.concatBinariesToAudioBuffer).toHaveBeenCalledWith(arg);
    });

    it('can be created without an argument', function() {
      var soundWave = new SoundWave();
      expect(soundWave).toBeDefined();
    });

    it('can\'t be created with an unknown parameter type', function() {
      expect(function() { new SoundWave({'type': 'anObject'}); })
        .toThrowError('Cannot create SoundWave object: Unsupported data format');
    });
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
    mockPromises.executeForPromise(promise);

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

  describe('.loadFile', function() {
    var soundWave, filePromise, fetchPromise, promiseHelper;
    var url = '/path/to/file.wav';

    beforeEach(function() {
      fetchPromise = new Promise(function(resolve, reject) {
        promiseHelper = {
          resolve: resolve,
          reject: reject
        };
      });
      spyOn(window, 'fetch').and.returnValue(fetchPromise);
      soundWave = new SoundWave();
      // promiseHelper.resolve('sdf');
      filePromise = soundWave.loadFile(url);

    });

    afterEach(function() {
      soundWave = filePromise = fetchPromise = promiseHelper = null;
    });

    it('fetches from the server', function() {
      expect(window.fetch).toHaveBeenCalledWith(url);
    });

    it('returns a promise', function() {
      expect(filePromise).toEqual(jasmine.any(Promise));
    });

    describe('on successful fetch', function() {

      beforeEach(function() {
        var response = new window.Response(testData.buffer1.data);
        promiseHelper.resolve(response);
      });

      it('resolves its promise with an ArrayBuffer', function(done) {
        filePromise.then(function(value) {
          expect(value).toEqual(testData.buffer1.data);
          done();
        });
      });

    });

    describe('on unsuccessful fetch', function() {
      var errorObj = { 'msg': 'Loading failed'};

      beforeEach(function() {
        promiseHelper.reject(errorObj);
      });

      it('resolves its promise with an error', function() {
        filePromise.then(function(error) {
          expect(error).toEqual(errorObj);
        });
      });
    });

    describe('on server error', function() {
      var errorObj = new Error('Server error. Couldn\'t load file: /path/to/file.wav');
      var badResponse = {
        'ok': false,
        'arrayBuffer': function() { return null; }
      };

      beforeEach(function() {
        promiseHelper.resolve(badResponse);
      });

      it('resolves its promise with an error', function() {
        filePromise.then(function(value) {
          expect(value).toEqual(errorObj);
        });
      });
    });

  });

  describe('.loadFiles', function() {
    var soundWave, urls, fetchPromise, promiseHelper, td;

    beforeEach(function() {
      td = testData.buffer1.data;
      fetchPromise = new Promise(function(resolve, reject) {
        promiseHelper = {
          resolve: resolve,
          reject: reject
        };
      });

      urls = [
        '/test/url/file1',
        '/test/url/file2',
        '/test/url/file3'
      ];
      soundWave = new SoundWave();
      spyOn(soundWave, 'loadFile').and.returnValue(fetchPromise);
    });

    afterEach(function() {
      soundWave = urls = fetchPromise = promiseHelper = td = null;
    });

    it('calls the file loader once for every url', function() {
      soundWave.loadFiles(urls);
      expect(soundWave.loadFile).toHaveBeenCalledTimes(3);
    });

    it('returns a promise', function() {
      var prm = soundWave.loadFiles(urls);
      expect(prm).toEqual(jasmine.any(Promise));
    });

    describe('on successful loading', function() {
      var filesPromise;

      beforeEach(function() {
        promiseHelper.resolve(td);
        filesPromise = soundWave.loadFiles(urls);
      });

      it('resolves its promise with an array of ArrayBuffers', function(done) {
        filesPromise.then(function(value) {
          expect(value).toEqual([td, td, td]);
          done();
        });
      });
    });

    describe('on unsuccessful loading (one or more requests)', function() {
      var filesPromise;
      var errorObj = { 'msg': 'Loading failed' };

      beforeEach(function() {
        promiseHelper.reject(errorObj);
        filesPromise = soundWave.loadFiles(['/just/one/to/avoid/timeout']);
      });

      it('resolves its promise with an error', function(done) {
        filesPromise.then(function(error) {
          expect(error).toEqual(errorObj);
          done();
        });
      });
    });

  });

  // describe('XHR loader', function() {
  //   var server, soundWave;
  //
  //   beforeEach(function() {
  //     server = sinon.fakeServer.create();
  //
  //     if (typeof window.document === 'undefined') {
  //       // sinon attaches the fake XHR object to global.
  //       // On node.js we have to explicitly copy it to the window obj.
  //       window.XMLHttpRequest = global.XMLHttpRequest;
  //     }
  //     soundWave = new SoundWave();
  //   });
  //
  //   afterEach(function() {
  //     server.restore();
  //     if (typeof window.document === 'undefined') {
  //       // bring back the original XHR obj to window on node.js
  //       window.XMLHttpRequest = global.XMLHttpRequest;
  //     }
  //     soundWave = null;
  //   });
  //
  //   it('sends a GET request to the server.', function() {
  //     soundWave.loadFile('/fake/url/file1.wav', sinon.spy());
  //     expect(server.requests[0].url).toMatch('/fake/url/file1.wav');
  //   });
  //
  //   it('receives a response from the server.', function() {
  //     var callback = sinon.spy();
  //     soundWave.loadFile('/fake/url/file1.wav', callback);
  //     server.requests[0].respond(200,
  //       { 'Content-Type': 'audio/wav' },
  //       'Normally this would be an array buffer');
  //
  //     expect(callback.calledOnce).toBeTruthy();
  //   });
  //
  //   it('sends multiple requests to the server when given multiple filenames', function() {
  //     soundWave.loadFiles('file1.wav, file2.wav, file3.wav');
  //     expect(server.requests.length).toEqual(3);
  //   });
  //
  //   xit('receives multiple responses from the server', function() {
  //     // loadFiles() simply doesn't work and needs to be debugged/refactored
  //     var responses = soundWave.loadFiles('file1.wav, file2.wav, file3.wav');
  //     server.requests.forEach(function(req, index) {
  //       req.respond(200,
  //         { 'Content-Type': 'audio/wav' },
  //         'This is request' + index);
  //     });
  //     expect(responses.length).toEqual(3);
  //     // expect(responses[0]).toMatch('file1.wav');
  //   });
  //
  // });

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
