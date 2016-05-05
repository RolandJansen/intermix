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
        'AudioBuffer': global.AudioBuffer,
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

  describe('.decodeAudioData', function() {
    var soundWave, decodePromise;

    beforeEach(function() {
      soundWave = new SoundWave();
      spyOn(ac, 'decodeAudioData').and.callThrough();
      decodePromise = soundWave.decodeAudioData(testData.buffer1.data);
    });

    afterEach(function() {
      soundWave = decodePromise = null;
    });

    it('wraps AudioContext.decodeAudioData', function() {
      expect(ac.decodeAudioData).toHaveBeenCalled();
    });

    it('returns a promise', function() {
      expect(decodePromise).toEqual(jasmine.any(Promise));
    });

    describe('on successfull decoding', function() {

      it('resolves its promise with an AudioBuffer', function(done) {
        decodePromise.then(function(decoded) {
          expect(decoded).toEqual(jasmine.any(window.AudioBuffer));
          done();
        });
      });
    });

    //do we need an unsuccessful test here? Or should we
    //test rawAudioData in the function?

  });

  describe('.joinAudioBuffers', function() {

    beforeEach(function() {
      var sr = ac.sampleRate;
      this.monoBuffer = ac.createBuffer(1, sr, sr);
      this.stereoBuffer = ac.createBuffer(2, sr, sr);
      this.longStereoBuffer = ac.createBuffer(2, sr * 2, sr);

      this.soundWave = new SoundWave();
    });

    it('returns a promise', function() {
      var prm = this.soundWave.joinAudioBuffers([
        this.stereoBuffer,
        this.longStereoBuffer
      ]);
      expect(prm).toEqual(jasmine.any(Promise));
    });
  });

  describe('.getMetaData', function() {

    beforeEach(function() {
      var sr = ac.sampleRate;
      var ab = ac.createBuffer(2, sr * 2, sr);
      var soundWave = new SoundWave();
      this.metaData = soundWave.getMetaData(ab, ab);
      this.errorData = soundWave.getMetaData(ab, 23);
    });

    it('returns an object', function() {
      expect(this.metaData).toEqual(jasmine.any(Object));
      expect(this.errorData).toEqual(jasmine.any(Object));
    });

    it('computes the startpoint of the buffer fragment', function() {
      expect(this.metaData.start).toEqual(88200);
    });

    it('computes the endpoint of the buffer fragment', function() {
      expect(this.metaData.end).toEqual(176399);
    });

    it('writes the length of the buffer fragment', function() {
      expect(this.metaData.length).toEqual(88200);
    });

    it('sets an error message on failure', function() {
      expect(this.errorData.errorMsg).toBeDefined();
    });
  });

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
