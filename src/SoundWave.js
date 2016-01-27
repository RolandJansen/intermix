'use strict';

var im = require('./core.js');

im.SoundWave = function(binaryData, collection) {

  this.bufferSource = null;

  if (binaryData) {
    //create an audio buffer with audioCtx.decodeAudioData
  } else {
    //throw error
  }

  if (collection) {
    //put buffer into soundbank
  }
  console.log('SoundWave');

  //todo:
  //put the buffer into a collection called soundbank
  //create methods to play, stop and loop the sound.
};

im.SoundWave.prototype.play = function(loop) {
  console.log(loop);
  //create audiobuffersource, attach to destination
  //when playing is stopped, destroy buffersource and routing
};

im.SoundWave.prototype.stop = function() {
  //stop playing the buffersource, destroy everything
};

module.exports = im.SoundWave;
