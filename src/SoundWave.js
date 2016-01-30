'use strict';

var core = require('./core.js');

var SoundWave = function(binaryData, collection) {

  this.audioCtx = null;
  this.buffer = null;


  if (core.ac) {
    this.audioCtx = core.ac;
    console.log(this.audioCtx);
  } else {
    console.log('No AudioContext found');
  }

  var self = this;

  if (binaryData) {
    this.audioCtx.decodeAudioData(binaryData).then(function(decoded) {
      self.buffer = decoded;
      console.log('buffer created');
    });
  } else {
    //TODO: throw error
  }

  if (collection) {
    //TODO: put buffer into soundbank
  }

};

module.exports = SoundWave;
