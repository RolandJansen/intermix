'use strict';

//jasmine library for mocking ajax requests
//see http://jasmine.github.io/2.4/ajax.html
require('jasmine-ajax');
var SoundWave = require('../../src/SoundWave.js');
var testData = require('../soundwave_test_data.js');

describe('SoundWave', function() {

  describe('An ArrayBuffer', function() {
    var soundWave;

    beforeEach(function(done) {
      soundWave = new SoundWave();
      soundWave.decodeAudioData(testData.buffer1.data, done);
    });

    it('should be decoded into an AudioBuffer.', function() {
      expect(soundWave.buffer.length).toEqual(testData.buffer1.decodedLength);
    });
  });

  describe('Two AudioBuffers', function() {
    var soundWave, buffer1, buffer2;

    beforeEach(function(done) {
      soundWave = new SoundWave();
      soundWave.audioCtx.decodeAudioData(testData.buffer1.data).then(function(decoded) {
        buffer1 = decoded;
      });
      soundWave.audioCtx.decodeAudioData(testData.buffer2.data).then(function(decoded) {
        buffer2 = decoded;
        done();
      });
    });

    afterEach(function() {
      soundWave = null;
    });

    it('should be appended into one.', function() {
      var appended = soundWave.appendAudioBuffer(buffer1, buffer2);
      var length = testData.buffer1.decodedLength + testData.buffer2.decodedLength;
      expect(appended.length).toEqual(length);
    });
  });

  describe('An XHR loader', function() {
    var soundWave;

    beforeEach(function() {
      jasmine.Ajax.install();
      soundWave = new SoundWave();
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
      soundWave = null;
    });

    it('should send a file request to the server.', function() {
      var doneFn = jasmine.createSpy('success');
      soundWave.loadFile('/fake/url/file1.wav', doneFn);
      expect(jasmine.Ajax.requests.mostRecent().url).toBe('/fake/url/file1.wav');
      expect(doneFn).not.toHaveBeenCalled();
    });

    it('should receive a response from the server.', function() {
      var doneFn = jasmine.createSpy('success');
      soundWave.loadFile('/fake/url/file1.wav', doneFn);
      jasmine.Ajax.requests.mostRecent().respondWith(testData.response1);
      expect(doneFn).toHaveBeenCalledWith(testData.response1.responseText);
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
