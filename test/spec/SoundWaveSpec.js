'use strict';

var atob = require('atob');
var proxyquire =  require('proxyquire'); //fake require in the module under test

/**
 * This function creates an empty promise and returns
 * a closure with the promise and references to its
 * resolve/reject functions. Resolve values can
 * be injected into the promise later.
 */
var getFakePromise = function() {
  var resolveRef, rejectRef;

  var promise = new Promise(function(resolve, reject) {
    resolveRef = resolve;
    rejectRef = reject;
  });

  return {
    'promise': promise,
    'resolve': resolveRef,
    'reject': rejectRef
  };
};

describe('SoundWave', function() {
  var testData, ac, sr, SoundWave, mono, stereo, longStereo, err;

  beforeEach(function() {

    var WebAudioTestAPI = require('web-audio-test-api');
    // All 'new' features of the api have to be enabled here
    WebAudioTestAPI.setState({
      'AudioContext#decodeAudioData': 'promise'
    });
    ac = new WebAudioTestAPI.AudioContext();
    sr = ac.sampleRate;

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

    mono = ac.createBuffer(1, sr, sr);
    stereo = ac.createBuffer(2, sr, sr);
    longStereo = ac.createBuffer(2, sr * 2, sr);
    err = new Error('It\'s over!');
  });

  afterEach(function() {
    if (typeof global.window === 'object' &&
    typeof global.window.document === 'undefined') {
      delete global.window;
    }
    ac = sr = SoundWave = mono = stereo = longStereo = err = null;
  });

  it('ensure that we\'re testing against the WebAudioTestAPI', function() {
    var soundWave = new SoundWave(testData.buffer1.data);
    expect(global.AudioContext.WEB_AUDIO_TEST_API_VERSION).toBeDefined(); //is the api mock there?
    expect(soundWave.ac.$name).toBeDefined();                             //are we testing against it?
  });

  describe('instance', function() {
    var fakePromise, soundWave;

    beforeEach(function() {
      fakePromise = getFakePromise();
    });

    afterEach(function() {
      fakePromise = soundWave = null;
    });

    describe('when given a filename', function() {
      var arg = 'file.mp3';

      beforeEach(function() {
        SoundWave.prototype.loadFile = jasmine.createSpy('loadFile').and.returnValue(fakePromise.promise);
        SoundWave.prototype.decodeAudioData = jasmine.createSpy('decodeAudioData').and.returnValue(true);
        soundWave = new SoundWave(arg);
      });

      it('loads and decodes the file', function(done) {
        fakePromise.resolve(mono);
        fakePromise.promise.then(function(result) {
          expect(soundWave.loadFile).toHaveBeenCalledWith(arg);
          expect(result).toEqual(mono);
          done();
        });
      });
    });

    describe('when given an array of filenames', function() {
      var arg = [ 'f1', 'f2', 'f3' ];

      beforeEach(function() {
        SoundWave.prototype.loadMultipleFiles = jasmine.createSpy('loadMultipleFiles').and.returnValue(fakePromise.promise);
        soundWave = new SoundWave(arg);
      });

      it('loads and decodes them into a single buffer', function(done) {
        fakePromise.resolve(mono);
        fakePromise.promise.then(function(result) {
          expect(soundWave.loadMultipleFiles).toHaveBeenCalledWith(arg);
          expect(result).toEqual(mono);
          done();
        });
      });
    });

    describe('when given an ArrayBuffer', function() {

      beforeEach(function() {
        SoundWave.prototype.decodeAudioData = jasmine.createSpy('decodeAudioData').and.returnValue(fakePromise.promise);
        soundWave = new SoundWave(testData.buffer1.data);
      });

      it('decodes an ArrayBuffer', function(done) {
        fakePromise.resolve(mono);
        fakePromise.promise.then(function(result) {
          expect(soundWave.decodeAudioData).toHaveBeenCalledWith(testData.buffer1.data);
          expect(result).toEqual(mono);
          done();
        });
      });
    });

    describe('when given multiple ArrayBuffers', function() {
      var arg;

      beforeEach(function() {
        arg = [ testData.buffer1.data, testData.buffer2.data ];
        this.jab = getFakePromise();
        SoundWave.prototype.joinAudioBuffers = jasmine.createSpy('joinAudioBuffers').and.returnValue(this.jab.promise);
        SoundWave.prototype.decodeAudioSources = jasmine.createSpy('decodeAudioSources').and.returnValue(fakePromise.promise);
        soundWave = new SoundWave(arg);
        fakePromise.resolve([ mono, mono ]);
        this.jab.resolve(mono);
      });

      it('calls .decodeAudioSources()', function(done) {
        this.jab.promise.then(function() {
          expect(soundWave.decodeAudioSources).toHaveBeenCalledWith(arg);
          done();
        });
      });

      it('calls .joinAudioBuffers()', function(done) {
        this.jab.promise.then(function() {
          expect(soundWave.joinAudioBuffers).toHaveBeenCalledWith([ mono, mono ]);
          done();
        });
      });

      it('decodes them into a single buffer', function(done) {
        this.jab.promise.then(function(result) {
          expect(result).toEqual(mono);
          done();
        });
      });

    });

    describe('when given an AudioBuffer', function() {

      beforeEach(function() {
        this.soundWave = new SoundWave(mono);
      });

      it('stores it in its buffer', function() {
        expect(this.soundWave.buffer).toEqual(mono);
      });

    });

    describe('when given multiple AudioBuffers', function() {

      beforeEach(function() {
        this.jab = getFakePromise();
        SoundWave.prototype.joinAudioBuffers = jasmine.createSpy('joinAudioBuffers').and.returnValue(this.jab.promise);
        this.soundWave = new SoundWave([ mono, stereo ]);
        this.jab.resolve(mono);
      });

      it('calls .joinAudioBuffers', function() {
        expect(this.soundWave.joinAudioBuffers).toHaveBeenCalledWith([ mono, stereo ]);
      });

      it('sets the buffer', function(done) {
        var self = this;
        this.jab.promise.then(function() {
          expect(self.soundWave.buffer).toEqual(mono);
          done();
        });
      });
    });

    describe('when given no arguments', function() {

      it('does nothing', function() {
        var bareBuffer = ac.createBuffer(1, 0, sr);
        var soundWave = new SoundWave();
        expect(soundWave).toBeDefined();
        expect(soundWave.buffer).toEqual(bareBuffer);
      });

    });

    describe('when given an unknown parameter type', function() {

      it('throws an error', function() {
        expect(function() { new SoundWave({'type': 'anObject'}); })
          .toThrowError('Cannot create SoundWave object: Unsupported data format');
      });

    });

  });

  describe('.loadMultipleFiles', function() {
    var self, lf, das, jab, smd;
    var fnames = ['f1', 'f2'];

    beforeEach(function() {
      lf = getFakePromise();
      das = getFakePromise();
      jab = getFakePromise();
      smd = getFakePromise();

      this.soundWave = new SoundWave();
      this.soundWave.loadFiles = jasmine.createSpy('loadFiles').and.returnValue(lf.promise);
      this.soundWave.decodeAudioSources = jasmine.createSpy('decodeAudioSources').and.returnValue(das.promise);
      this.soundWave.joinAudioBuffers = jasmine.createSpy('joinAudioBuffers').and.returnValue(jab.promise);
      this.soundWave.storeMetaData = jasmine.createSpy('storeMetaData').and.returnValue(smd.promise);
      this.prm = this.soundWave.loadMultipleFiles(fnames);
    });

    afterEach(function() {
      self = lf = das = jab = null;
    });

    it('returns a promise', function() {
      expect(this.prm).toEqual(jasmine.any(Promise));
    });

    describe('on success', function() {

      beforeEach(function() {
        self = this;
        this.lfReturn = [ testData.buffer1.data, testData.buffer2.data ];
        this.dasReturn = [ mono, stereo ];
        this.jabReturn = stereo;
        this.smdReturn = { 'metaObj1': {}, 'metaObj2': {} };
        lf.resolve(this.lfReturn);
        das.resolve(this.dasReturn);
        jab.resolve(this.jabReturn);
        smd.resolve(this.smdReturn);
      });

      it('calls .loadFiles()', function() {
        expect(this.soundWave.loadFiles).toHaveBeenCalledWith(fnames);
      });

      it('calls .decodeAudioSources()', function(done) {
        this.prm.then(function() {
          expect(self.soundWave.decodeAudioSources).toHaveBeenCalledWith(self.lfReturn);
          done();
        });
      });

      it('calls .joinAudioBuffers()', function(done) {
        this.prm.then(function() {
          expect(self.soundWave.joinAudioBuffers).toHaveBeenCalledWith(self.dasReturn);
          done();
        });
      });

      it('calls .storeMetaData()', function(done) {
        this.prm.then(function() {
          expect(self.soundWave.storeMetaData).toHaveBeenCalledWith(self.dasReturn, fnames);
          done();
        });
      });

      it('resolves to an AudioBuffer', function(done) {
        this.prm.then(function(result) {
          expect(result).toEqual(jasmine.any(window.AudioBuffer));
          done();
        });
      });

      it('stores meta data in .metaData[]', function(done) {
        this.prm.then(function() {
          expect(self.soundWave.metaData).toEqual(self.smdReturn);
          done();
        });
      });

    });

    describe('on failure', function() {

      beforeEach(function() {
        das.reject(err);
        lf.resolve(true);
        jab.resolve(true);
      });

      it('resolves to an error', function(done) {
        this.prm.then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });

    });
  });

  describe('.decodeAudioSources', function() {
    var arg;

    beforeEach(function() {
      arg = [
        testData.buffer1.data,
        testData.buffer2.data,
        testData.buffer3.data
      ];
      this.dad = getFakePromise();
      this.soundWave = new SoundWave();
      this.soundWave.decodeAudioData = jasmine.createSpy('decodeAudioData').and.returnValue(this.dad.promise);
      this.prm = this.soundWave.decodeAudioSources(arg);
    });

    afterEach(function() {
      arg = null;
    });

    it('returns a promise', function() {
      expect(this.prm).toEqual(jasmine.any(Promise));
    });

    describe('on success', function() {

      it('calls .decodeAudioData() for every ArrayBuffer', function() {
        expect(this.soundWave.decodeAudioData).toHaveBeenCalledTimes(arg.length);
      });

      it('resolves to an array of AudioBuffers', function(done) {
        this.dad.resolve(stereo);
        this.prm.then(function(result) {
          expect(result).toEqual([ stereo, stereo, stereo ]);
          done();
        });
      });
    });

    describe('on failure', function() {

      it('resolves to an error', function(done) {
        this.dad.reject(err);
        this.prm.then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });
    });

  });

  describe('.decodeAudioData', function() {

    beforeEach(function() {
      this.soundWave = new SoundWave();
      spyOn(ac, 'decodeAudioData').and.callThrough();
      this.prm = this.soundWave.decodeAudioData(testData.buffer1.data);
    });

    it('returns a promise', function() {
      expect(this.prm).toEqual(jasmine.any(Promise));
    });

    it('wraps AudioContext.decodeAudioData', function() {
      expect(ac.decodeAudioData).toHaveBeenCalledTimes(1);
    });

    describe('on success', function() {

      it('resolves its promise with an AudioBuffer', function(done) {
        this.prm.then(function(decoded) {
          expect(decoded).toEqual(jasmine.any(window.AudioBuffer));
          done();
        });
      });
    });

    describe('on failure', function() {
      // The promise implementation of decodeAudioData()
      // of the web-audio-test-api seems to not resolve
      // properly on error (throws immediately and doesn't
      // return a promise). That's why we are faking the fake here.
      // It probably doesn't match the real behaviour
      // of the web audio api.

      beforeEach(function() {
        this.dad = getFakePromise();
        ac.decodeAudioData = jasmine.createSpy('decodeAudioData').and.returnValue(this.dad.promise);
        this.rejected = this.soundWave.decodeAudioData('not an ArrayBuffer');
        this.dad.reject(err);
      });

      it('resolves its promise with an error', function(done) {
        this.rejected.then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });
    });

  });

  describe('.joinAudioBuffers', function() {

    beforeEach(function() {
      this.soundWave = new SoundWave();
      this.soundWave.appendAudioBuffer = jasmine.createSpy('appendAudioBuffer').and.returnValue(stereo);
      this.prm = this.soundWave.joinAudioBuffers([ stereo, stereo ]);
    });

    it('returns a promise', function() {
      expect(this.prm).toEqual(jasmine.any(Promise));
    });

    it('calls appendAudioBuffer() on every input buffer (-1)', function() {
      // appendAudioBuffer needs two arguments so it will be called just once
      expect(this.soundWave.appendAudioBuffer).toHaveBeenCalledTimes(1);
    });

    describe('on successfull join', function() {

      it('resolves to an AudioBuffer', function(done) {
        var len = stereo.length;  // length of spy return value
        this.prm.then(function(buffer) {
          expect(buffer.length).toEqual(len);
          done();
        });
      });

    });

    describe('on unsuccessful join', function() {
      it('when argument is not an array resolves to a type error', function(done) {
        this.soundWave.joinAudioBuffers('sdf').then(null, function(err) {
          expect(err).toEqual(jasmine.any(TypeError));
          done();
        });
      });

      it('when buffers are not of type AudioBuffer resolves to a type error', function(done) {
        this.soundWave.joinAudioBuffers(['a', 'b', 'c']).then(null, function(err) {
          expect(err).toEqual(jasmine.any(TypeError));
          done();
        });
      });

      it('when appendAudioBuffer() throws an error, catches and resolves to it', function(done) {
        var err = new Error('One or both buffers are not of type AudioBuffer.');
        this.soundWave.appendAudioBuffer = function() {
          throw err;
        };
        this.soundWave.joinAudioBuffers([ mono, stereo, longStereo ])
        .then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });

    });
  });

  describe('.appendAudioBuffer', function() {

    beforeEach(function() {
      this.soundWave = new SoundWave();
      this.joined1 = this.soundWave.appendAudioBuffer(stereo, longStereo);
      this.joined2 = this.soundWave.appendAudioBuffer(mono, stereo);

    });

    describe('on success', function() {

      it('returns an AudioBuffer', function() {
        expect(this.joined1).toEqual(jasmine.any(window.AudioBuffer));
      });

      it('appends two AudioBuffers', function() {
        expect(this.joined1.length).toEqual(stereo.length + longStereo.length);
      });

      it('if number of channels are equal, uses all of them', function() {
        expect(this.joined1.numberOfChannels).toEqual(2);
      });

      it('if number of channels differ, drops channels', function() {
        expect(this.joined2.numberOfChannels).toEqual(1);
      });

      it('if number of channels differ, appends them correctly', function() {
        expect(this.joined2.length).toEqual(mono.length + stereo.length);
      });

    });

    describe('on failure', function() {

      it('throws if one or both buffers are not of type AudioBuffer', function() {
        var sw = this.soundWave;
        expect( function() { sw.appendAudioBuffer(); })
        .toThrowError('One or both buffers are not of type AudioBuffer.');
      });

    });

  });

  describe('.storeMetaData', function() {

    beforeEach(function() {
      this.names = [ 'file1', 'file2', 'file3' ];
      this.buffers = [ mono, stereo, longStereo ];

      this.soundWave = new SoundWave();
      this.promise = this.soundWave.storeMetaData(this.buffers, this.names);
    });

    it('returns a promise', function() {
      expect(this.promise).toEqual(jasmine.any(Promise));
    });

    describe('on success', function() {

      it('resolves to an array', function(done) {
        this.promise.then(function(result) {
          expect(result).toEqual(jasmine.any(Array));
          done();
        });
      });

      it('resolves to an array of length 3', function(done) {
        this.promise.then(function(result) {
          expect(result.length).toEqual(3);
          done();
        });
      });

      it('saves metaData in the right order', function(done) {
        var self = this;
        this.promise.then(function(result) {
          result.forEach(function(meta, index) {
            expect(meta.name).toMatch(this.names[index]);
            expect(meta.length).toEqual(this.buffers[index].length);
          }, self);
          done();
        });
      });

    });

    describe('on failure', function() {

      beforeEach(function() {
        this.buffers.pop();
        this.rejected = this.soundWave.storeMetaData();
      });

      it('resolves to error if audioBuffers and names are not of same length', function(done) {
        this.rejected.then(null, function(result) {
          expect(result).toEqual(jasmine.any(Error));
          done();
        });
      });

    });
  });

  describe('.stripFilenames', function() {
    var urls = [
      '/this/is/url/one/file1',
      'this/is/number/two/file2',
      'file3',
      'http://www.something.com/file4'
    ];
    var files = [ 'file1', 'file2', 'file3', 'file4' ];

    beforeEach(function() {
      var soundWave = new SoundWave();
      this.result = soundWave.stripFilenames(urls);
    });

    it('strips the filenames from urls', function() {
      expect(this.result).toEqual(files);
    });

  });

  describe('.getMetaData', function() {
    var name = 'Karl-Heinz';

    beforeEach(function() {
      this.soundWave = new SoundWave();
      this.soundWave.buffer = longStereo;
    });

    describe('on success', function() {
      var start = 23;

      beforeEach(function() {
        this.metaData = this.soundWave.getMetaData(stereo, name, start);
      });

      it('returns an object', function() {
        expect(this.metaData).toEqual(jasmine.any(Object));
      });

      it('sets the startpoint of the buffer fragment', function() {
        expect(this.metaData.start).toEqual(start);
      });

      it('sets start to 0 if not specified', function() {
        var meta = this.soundWave.getMetaData(stereo, name);
        expect(meta.start).toEqual(0);
      });

      it('computes the endpoint of the buffer fragment', function() {
        expect(this.metaData.end).toEqual(start + stereo.length - 1);
      });

      it('computes the length of the buffer fragment', function() {
        expect(this.metaData.length).toEqual(stereo.length);
      });

      it('sets the name of the buffer fragment', function() {
        expect(this.metaData.name).toMatch(name);
      });

    });

    describe('on failure', function() {

      it('throws a type error if "buffer" is not an AudioBuffer', function() {
        var self = this;
        expect(function() {
          self.soundWave.getMetaData(23, name);
        }).toThrowError(TypeError);
      });

      it('throws a type error if "name" is not a String', function() {
        var self = this;
        expect(function() {
          self.soundWave.getMetaData(stereo, 23);
        }).toThrowError(TypeError);
      });

    });
  });

  describe('.loadFile', function() {

    beforeEach(function() {
      this.url = '/path/to/file.wav';
      this.fetchPromise =  getFakePromise();
      spyOn(window, 'fetch').and.returnValue(this.fetchPromise.promise);
      this.soundWave = new SoundWave();
      this.filePromise = this.soundWave.loadFile(this.url);
    });

    it('fetches from the server', function() {
      expect(window.fetch).toHaveBeenCalledWith(this.url);
    });

    it('returns a promise', function() {
      expect(this.filePromise).toEqual(jasmine.any(Promise));
    });

    describe('on successful fetch', function() {

      beforeEach(function() {
        var response = new window.Response(testData.buffer1.data);
        this.fetchPromise.resolve(response);
      });

      it('resolves its promise with an ArrayBuffer', function(done) {
        this.filePromise.then(function(value) {
          expect(value).toEqual(testData.buffer1.data);
          done();
        });
      });

    });

    describe('on unsuccessful fetch', function() {
      var err = new Error('It\'s over!');

      beforeEach(function() {
        this.fetchPromise.reject(err);
      });

      it('resolves its promise with an error', function(done) {
        this.filePromise.then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });
    });

    describe('on server error', function() {
      var err = new Error('Server error. Couldn\'t load file: /path/to/file.wav');

      beforeEach(function() {
        var badResponse = {
          'ok': false,
          'arrayBuffer': function() { return null; }
        };
        this.fetchPromise.resolve(badResponse);
      });

      it('resolves its promise with an error', function(done) {
        this.filePromise.then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });
    });

  });

  describe('.loadFiles', function() {
    var urls = [
      '/test/url/file1',
      '/test/url/file2',
      '/test/url/file3'
    ];

    beforeEach(function() {
      this.td = testData.buffer1.data;
      this.fetchPromise = getFakePromise();
      this.soundWave = new SoundWave();
      this.soundWave.loadFile = jasmine.createSpy('loadFile')
      .and.returnValue(this.fetchPromise.promise);
    });

    it('returns a promise', function() {
      var prm = this.soundWave.loadFiles(urls);
      expect(prm).toEqual(jasmine.any(Promise));
    });

    it('calls the file loader once for every url', function() {
      this.soundWave.loadFiles(urls);
      expect(this.soundWave.loadFile).toHaveBeenCalledTimes(3);
    });

    describe('on successful loading', function() {
      var filesPromise;

      beforeEach(function() {
        this.fetchPromise.resolve(this.td);
        filesPromise = this.soundWave.loadFiles(urls);
      });

      it('resolves its promise with an array of ArrayBuffers', function(done) {
        var self = this;
        filesPromise.then(function(result) {
          expect(result).toEqual([ self.td, self.td, self.td ]);
          done();
        });
      });
    });

    describe('on unsuccessful loading (one or more requests)', function() {
      var filesPromise;
      var err = new Error('It\'s over!');

      beforeEach(function() {
        this.fetchPromise.reject(err);
        filesPromise = this.soundWave.loadFiles(['a', 'b', 'c']);
      });

      it('resolves its promise with an error', function(done) {
        filesPromise.then(null, function(result) {
          expect(result).toEqual(err);
          done();
        });
      });
    });

  });

  describe('.getBufferFragment', function() {

    beforeEach(function() {
      this.soundWave = new SoundWave();
      this.soundWave.buffer = stereo;
    });

    describe('on success', function() {

      beforeEach(function() {
        this.newBuffer = this.soundWave.getBufferFragment(22000, 24000);
      });

      it('returns a new AudioBuffer', function() {
        expect(this.newBuffer).toEqual(jasmine.any(window.AudioBuffer));
      });

      it('returns a stereo AudioBuffer', function() {
        expect(this.newBuffer.numberOfChannels).toEqual(2);
      });

      it('returns an ab of length 2000', function() {
        expect(this.newBuffer.length).toEqual(2000);
      });

      it('without arguments returns the whole buffer', function() {
        var ab = this.soundWave.getBufferFragment();
        expect(ab).toEqual(this.soundWave.buffer);
      });

      it('with a negative start value, assumes start=0', function() {
        var ab = this.soundWave.getBufferFragment(-5, 20);
        expect(ab.length).toEqual(20);
      });

      it('without an end argument, assumes end=buffer.length', function() {
        var ab = this.soundWave.getBufferFragment(22000);
        expect(ab.length).toEqual(22100);
      });

      it('with end argument greater than buffer.length assumes end=buffer.length', function() {
        var ab = this.soundWave.getBufferFragment(22000, 85000);
        expect(ab.length).toEqual(22100);
      });

      // this does not test if the actual data was copied successfully

    });

    describe('on failure', function() {

      it('throws when soundWave.buffer is empty', function() {
        var sw = new SoundWave();
        expect(function() {
          sw.getBufferFragment();
        })
        .toThrow();
      });

      it('throws when start is greater than buffer.length', function() {
        var self = this;
        expect(function() {
          self.soundWave.getBufferFragment(44200);
        })
        .toThrow();
      });

      it('throws when start is greater than end', function() {
        var self = this;
        expect(function() {
          self.soundWave.getBufferFragment(5, -5);
        })
        .toThrow();
      });

    });

  });

  describe('.useWave', function() {

    beforeEach(function() {
      this.soundWave = new SoundWave();
      this.soundWave.wave = null;
      this.soundWave.fragments = [ 'a', 'b' ];
    });

    it('if called with 0, sets wave to buffer', function() {
      this.soundWave.useWave(0);
      expect(this.soundWave.wave).toEqual(this.soundWave.buffer);
    });

    it('if called with 1, sets wave to first fragment', function() {
      this.soundWave.useWave(1);
      expect(this.soundWave.wave).toEqual(this.soundWave.fragments[0]);
    });

    it('if called with arg != integer, throws a type error', function() {
      var self = this;
      expect(function() {
        self.soundWave.useWave('sdf');
      })
      .toThrowError(TypeError);
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
