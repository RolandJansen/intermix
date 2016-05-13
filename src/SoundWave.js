'use strict';

var core = require('./core.js');

/**
 * <p>
 * Creates a wrapper in which an audio buffer lives.
 * A SoundWave object just holds audio data and does nothing else.
 * If you want to play the sound, you have to additionally create a
 * <a href="Sound.html">Sound</a> object.
 * It can handle one or more ArrayBuffers or filenames
 * (*.wav, *.mp3) as data sources.
 * </p><p>
 * Multiple sources will be concatenated into one audio buffer.
 * This is not the same as creating multiple SoundWave objects.
 * It's like a wavetable: All start/end positions will be saved so
 * you can trigger the original samples without using multiple buffers.
 * Possible usages are multisampled sounds, loops or wavesequences (kind of).
 * </p>
 *
 * @example <caption>Play a sound from an audio file:</caption>
 * var soundWave = new intermix.SoundWave('file.wav');
 * var sound = new intermix.Sound(soundWave);
 * sound.play;
 * @example <caption>Concatenate multiple source files into one buffer<br>
 * in the given order and play them (This is broken in v0.1. Don't use it!):</caption>
 * var soundWave = new intermix.SoundWave(['file1.wav,file2.wav,file3.wav']);
 * var sound = new intermix.Sound(soundWave);
 * sound.play;
 * @example <caption>
 * Using ArrayBuffers instead of filenames will come in handy if you want<br>
 * to have full control over XHR or use a preloader (here: preload.js):
 * </caption>
 * var queue = new createjs.LoadQueue();
 * queue.on('complete', handleComplete);
 * queue.loadManifest([
 *     {id: 'src1', src:'file1.wav', type:createjs.AbstractLoader.BINARY},
 *     {id: 'src2', src:'file2.wav', type:createjs.AbstractLoader.BINARY}
 * ]);
 *
 * function handleComplete() {
 *     var binData1 = queue.getResult('src1');
 *     var binData2 = queue.getResult('src2');
 *     var wave1 = new intermix.SoundWave(binData1);
 *     var wave2 = new intermix.SoundWave(binData2);
 *     var concatWave = new intermix.SoundWave([binData1, binData2]);
 * };
 * @constructor
 * @param  {(Object|Object[]|string)} audioSrc   One or more ArrayBuffers or filenames
 */
var SoundWave = function(audioSrc) {
  var self = this;
  this.ac = core;       //currently just used for tests
  this.buffer = core.createBuffer(1, 1, core.sampleRate);   //AudioBuffer
  this.fragments = [];  //AudioBuffers from multiple PCM sources
  this.wave = this.buffer;  //Interface to the internal buffers
  this.metaData = [];   //start-/endpoints and length of single waves

  if (typeof audioSrc !== 'undefined') {
    if (typeof audioSrc === 'string') {
      //one file to load/decode
      this.buffer = this.loadFile(audioSrc).then(function(response) {
        return self.decodeAudioData(response);
      })
      .then(function(decoded) {
        self.buffer = decoded;
        self.useWave(0);
        return self.buffer;
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof Array && typeof audioSrc[0] === 'string') {
      //multiple files to load/decode and cancatinate
      this.buffer = this.loadMultipleFiles(audioSrc).then(function(decoded) {
        self.buffer = decoded;
        self.useWave(0);
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof ArrayBuffer) {
      //one ArrayBuffer to decode
      this.buffer = this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple ArrayBuffers to decode and concatenate
      this.decodeAudioSources(audioSrc).then(function(audioBuffers) {
        self.fragments = audioBuffers;
        return self.joinAudioBuffers(audioBuffers);
      })
      .then(function(audioBuffer) {
        self.buffer = audioBuffer;
      })
      .catch(function(err) {
        throw err;
      });
    } else if (audioSrc instanceof window.AudioBuffer) {
      this.buffer = audioSrc;
      this.useWave(0);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof window.AudioBuffer) {
      this.buffer = this.joinAudioBuffers(audioSrc).then(function(audioBuffer) {
        self.buffer = audioBuffer;
        self.useWave(0);
      });
    } else {
      throw new Error('Cannot create SoundWave object: Unsupported data format');
    }
  } else {
    //start the object with empty buffer. Usefull for testing and advanced usage.
  }
};

/**
 * Takes an array of filenames and returns a promise that resolves
 * to an AudioBuffer including the PCM data of all files on success.
 * Returns an error on failure.
 * @param  {Array}    filenames Array with filenames to be loaded
 * @return {Promise}            Resolves to AudioBuffer or throws error.
 */
SoundWave.prototype.loadMultipleFiles = function(urls) {
  var self = this;
  var filenames = this.stripFilenames(urls);

  return this.loadFiles(urls).then(function(binBuffers) {
    return self.decodeAudioSources(binBuffers);
  })
  .then(function(audioBuffers) {
    var promises = [];
    self.fragments = audioBuffers;
    promises.push(self.joinAudioBuffers(audioBuffers),
      self.storeMetaData(audioBuffers, filenames));
    return Promise.all(promises);
  })
  .then(function(bufferAndMeta) {
    self.metaData = bufferAndMeta[1];
    return bufferAndMeta[0];
  })
  .catch(function(err) {
    throw err;
  });
};

/**
 * Takes one or more ArrayBuffers and returns an equal number of AudioBuffers.
 * @param  {Array}    buffers Array with ArrayBuffers
 * @return {Promise}          Resolves to an array of AudioBuffers or error
 */
SoundWave.prototype.decodeAudioSources = function(buffers) {
  var promises = [];
  buffers.forEach(function(buffer) {
    promises.push(this.decodeAudioData(buffer));
  }, this);

  return Promise.all(promises);
};

/**
 * Takes an ArrayBuffer with binary audio data and
 * turns it into an audio buffer object.
 * Just a wrapper for the web-audio-api decodeAudioData function.
 * It uses the new promise syntax so it probably won't work in all browsers by now.
 * @private
 * @param  {ArrayBuffer}  rawAudioSrc Audio data in raw binary format
 * @return {Promise}                  Resolves to AudioBuffer or error
 */
SoundWave.prototype.decodeAudioData = function(rawAudioSrc) {
  return core.decodeAudioData(rawAudioSrc);
};

/**
 * Joins an arbitrary number of ArrayBuffers.
 * @private
 * @param  {Array}       buffers Array of AudioBuffers
 * @return {AudioBuffer}         Waveform that includes all given buffers.
 */
SoundWave.prototype.joinAudioBuffers = function(buffers) {
  var self = this;
  var input, joinedBuffer;

  return new Promise(function(resolve, reject) {
    if (Array.isArray(buffers)) {
      joinedBuffer = buffers[0];
      input = buffers.slice(1);
    } else {
      reject(new TypeError('Argument is not of type Array'));
    }

    input.forEach(function(buffer) {
      if (buffer instanceof window.AudioBuffer &&
        joinedBuffer instanceof window.AudioBuffer) {
        joinedBuffer = this.appendAudioBuffer(joinedBuffer, buffer);
      } else {
        reject(new TypeError('One or more buffers are not of type AudioBuffer.'));
      }
    }, self);
    resolve(joinedBuffer);
  });
};

/**
 * Appends two audio buffers. Both buffers should have the same amount
 * of channels. If not, channels will be dropped. For example, if you
 * append a stereo and a mono buffer, the output will be mono and only
 * one of the channels of the stereo sample will be used (no merging of channels).
 * Suggested by Chris Wilson:<br>
 * http://stackoverflow.com/questions/14143652/web-audio-api-append-concatenate-different-audiobuffers-and-play-them-as-one-son
 * @private
 * @param  {AudioBuffer} buffer1 The first audio buffer
 * @param  {AudioBuffer} buffer2 The second audio buffer
 * @return {AudioBuffer}         buffer1 + buffer2
 */
SoundWave.prototype.appendAudioBuffer = function(buffer1, buffer2) {
  if (buffer1 instanceof window.AudioBuffer &&
  buffer2 instanceof window.AudioBuffer) {
    var numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
    var newBuffer = core.createBuffer(numberOfChannels,
      (buffer1.length + buffer2.length),
      buffer1.sampleRate);
    for (var i = 0; i < numberOfChannels; i++) {
      var channel = newBuffer.getChannelData(i);
      channel.set( buffer1.getChannelData(i), 0);
      channel.set( buffer2.getChannelData(i), buffer1.length);
    }
    return newBuffer;
  } else {
    throw new TypeError('One or both buffers are not of type AudioBuffer.');
  }
};

/**
 * Stores metaData objects in the metaData array.
 * @param  {Array} audioBuffers Array of AudioBuffers
 * @param  {Array} names        Array of names
 * @return {Promise}            Resolves to a metaData array or error.
 */
SoundWave.prototype.storeMetaData = function(audioBuffers, names) {
  var fnames = [];
  var metaData = [];
  var start = 0;
  var self = this;

  return new Promise(function(resolve, reject) {
    if (typeof names === 'undefined') {
      audioBuffers.forEach(function(buffer, index) {
        fnames.push('fragment' + index);
      });
    } else if (names.length === audioBuffers.length) {
      fnames = names;
    } else {
      reject(new Error('audioBuffers and names should be of same length'));
    }
    audioBuffers.forEach(function(buffer, index) {
      metaData.push(this.getMetaData(buffer, names[index], start));
      start += buffer.length;
    }, self);
    resolve(metaData);
  });
};

/**
 * Strips filenames from an array of urls and returns it in an array.
 * @private
 * @param  {Array} urls Array of urls
 * @return {Array}      Array of filenames
 */
SoundWave.prototype.stripFilenames = function(urls) {
  return urls.map(function(url) {
    return url.split('/').pop();
  });
};

/**
 * Creates a dictionary with start/stop points and length in sample-frames
 * of a buffer fragment..
 * @param  {AudioBuffer} buffer      Buffer with the appendable pcm fragment
 * @param  {String}      name        Name of the fragment
 * @param  {Int}         start       Startpoint of the fragment
 * @return {Object}                  Dictionary with meta data or error msg
 */
SoundWave.prototype.getMetaData = function(buffer, name, start) {
  if (buffer instanceof window.AudioBuffer && typeof name === 'string') {
    if (typeof start === 'undefined') {
      start = 0;
    }
    var bufLength = buffer.length;
    return {
      'name': name,
      'start': start,
      'end': start + bufLength - 1,
      'length': bufLength
    };
  } else {
    throw new TypeError('Arguments should be of type AudioBuffer and String');
  }
};

/**
 * Loads a (audio) file and returns its data as ArrayBuffer
 * when the promise fulfills.
 * @private
 * @param  {string}   url            The file to be loaded
 * @return {Promise}                 A promise representing the xhr response
 */
SoundWave.prototype.loadFile = function(url) {
  return window.fetch(url)
    .then(function(response) {
      if (response.ok) {
        return response.arrayBuffer();
      } else {
        throw new Error('Server error. Couldn\'t load file: ' + url);
      }
    });
};

/**
 * Loads multiple (audio) files and returns an array
 * with the data from the files in the given order.
 * @private
 * @param  {Array}  filenames List with filenames
 * @return {Array}            Array of ArrayBuffers
 */
SoundWave.prototype.loadFiles = function(filenames) {
  var promises = [];
  filenames.forEach(function(name) {
    promises.push(this.loadFile(name));
  }, this);

  return Promise.all(promises);
};


/**
 * Get an AudioBuffer with a fragment of the AudioBuffer
 * of this object.
 * @param  {Int}    start   Startpoint of the fragment in samples
 * @param  {Int}    end     Endpoint of the fragment in samples
 * @return {AudioBuffer}    AudioBuffer including the fragment
 */
SoundWave.prototype.getBufferFragment = function(start, end) {
  if (this.buffer.length === 1) {
    throw new Error('Audio buffer empty. Nothing to copy.');
  } else if (typeof start === 'undefined') {
    return this.buffer;
  } else if (start < 0) {
    start = 0;
  }

  if (typeof end === 'undefined' || end > this.buffer.length) {
    end = this.buffer.length;
  }

  if (start >= end) {
    throw new Error('Arguments out of bounds.');
  }

  var chnCount = this.buffer.numberOfChannels;
  var frameCount = end - start;
  var newBuffer = core.createBuffer(chnCount, frameCount, core.sampleRate);

  for (var chn = 0; chn < chnCount; chn++) {
    var newChannel = newBuffer.getChannelData(chn);
    var oldChannel = this.buffer.getChannelData(chn);

    for (var i = 0; i < frameCount; i++) {
      newChannel[i] = oldChannel[start + i];
    }
  }

  return newBuffer;
};

SoundWave.prototype.useWave = function(waveSource) {
  if (Number.isInteger(waveSource)) {
    if (waveSource === 0) {
      this.wave = this.buffer;
    } else {
      this.wave = this.fragments[waveSource - 1];
    }
  } else {
    throw new TypeError('Argument not of type Integer');
  }
};

/**
 * Sort ArrayBuffers the same order, like the filename
 * parameters.
 * @private
 * @param  {Array}  filenames  Array with filenames
 * @param  {Array}  binBuffers Array with ArrayBuffer
 * @return {Array}             Array with sorted ArrayBuffers
 */
SoundWave.prototype.sortBinBuffers = function(filenames, binBuffers) {
  // futile??
  return filenames.map(function(el) {
    return binBuffers[el];
  });
};

module.exports = SoundWave;
