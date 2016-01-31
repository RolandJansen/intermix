(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//Intermix = require('./core.js');
var Intermix = _dereq_('./core.js') || {};
Intermix.SoundWave = _dereq_('./SoundWave.js');
Intermix.Sound = _dereq_('./Sound.js');

module.exports = Intermix;

},{"./Sound.js":2,"./SoundWave.js":3,"./core.js":4}],2:[function(_dereq_,module,exports){
'use strict';

var Sound = function(audioCtx, soundBuffer) {

  this.audioCtx = null;
  this.buffer = null;
  this.bufferSource = null;
  this.loop = false;
  this.isPaused = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.startOffset = 0;
  this.startTime = 0;

  if (soundBuffer && audioCtx) {
    this.audioCtx = audioCtx;
    this.buffer = soundBuffer;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

Sound.prototype.setupAudioChain = function() {
  this.gainNode = this.audioCtx.createGain();
  this.pannerNode = this.audioCtx.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(this.audioCtx.destination);
  this.gainNode.gain.value = 1;
  console.log('audiochain ready');
};

Sound.prototype.createBufferSource = function() {
  var self = this;
  console.log('buffer is: ' + this.buffer);
  this.bufferSource = this.audioCtx.createBufferSource();
  this.bufferSource.buffer = this.buffer;
  this.bufferSource.connect(this.gainNode);
  this.bufferSource.onended = function() {
    self.destroyBufferSource();
    console.log('onended fired');
  };
};

Sound.prototype.destroyBufferSource = function() {
  if (this.bufferSource !== null) {
    this.bufferSource.disconnect();
    this.bufferSource = null;
    console.log('BufferSourceNode destroyed');
  }
};

Sound.prototype.play = function(loop) {
  if (typeof loop !== 'undefined') {
    this.loop = loop;
  }
  this.createBufferSource();
  this.bufferSource.loop = this.loop;

  if (this.startOffset === 0 || this.startOffset >= this.buffer.duration) {
    console.log('resetting starttime');
    this.startTime = this.audioCtx.currentTime;
  }

  this.bufferSource.start(this.startTime, this.startOffset);
  this.startOffset = 0;
};

Sound.prototype.stop = function(paused) {
  if (paused) {
    this.startOffset = this.audioCtx.currentTime - this.startTime;
    this.paused = false;
  } else {
    this.startOffset = 0;
  }
  if (this.bufferSource !== null) {
    this.bufferSource.stop();
  } else {
    //fail silently
  }
};

Sound.prototype.pause = function() {
  this.isPaused = true;
  this.stop(this.isPaused);
};

module.exports = Sound;

},{}],3:[function(_dereq_,module,exports){
'use strict';

var SoundWave = function(audioCtx, binaryData, collection) {

  this.audioCtx = null;
  this.buffer = null;


  if (audioCtx) {
    this.audioCtx = audioCtx;
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

},{}],4:[function(_dereq_,module,exports){
/**
 * This simply creates the audio context objects
 * and exports it.
 *
 * TODO: - Should we do backwards-compatibility for older api-versions?
 *       - Check for mobile/iOS compatibility.
 *       - Check if we're running on node (and throw an error if so)
 */
'use strict';

var audioCtx = null;

(function() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if (window.AudioContext) {
    audioCtx = new window.AudioContext();
  } else {
    //TODO: throw error, probably surround with try/catch
  }

})();

module.exports = {
  audioCtx: audioCtx
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9zcmMvU291bmQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZFdhdmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9jb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vSW50ZXJtaXggPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIEludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJykgfHwge307XHJcbkludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XHJcbkludGVybWl4LlNvdW5kID0gcmVxdWlyZSgnLi9Tb3VuZC5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcm1peDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oYXVkaW9DdHgsIHNvdW5kQnVmZmVyKSB7XHJcblxyXG4gIHRoaXMuYXVkaW9DdHggPSBudWxsO1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZSA9IG51bGw7XHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gIHRoaXMuZ2Fpbk5vZGUgPSBudWxsO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IG51bGw7XHJcblxyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgaWYgKHNvdW5kQnVmZmVyICYmIGF1ZGlvQ3R4KSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IHNvdW5kQnVmZmVyO1xyXG4gICAgdGhpcy5zZXR1cEF1ZGlvQ2hhaW4oKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBpbml0aWFsaXNpbmcgU291bmQgb2JqZWN0OiBwYXJhbWV0ZXIgbWlzc2luZy4nKTtcclxuICB9XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QodGhpcy5hdWRpb0N0eC5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxuICBjb25zb2xlLmxvZygnYXVkaW9jaGFpbiByZWFkeScpO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICBjb25zb2xlLmxvZygnYnVmZmVyIGlzOiAnICsgdGhpcy5idWZmZXIpO1xyXG4gIHRoaXMuYnVmZmVyU291cmNlID0gdGhpcy5hdWRpb0N0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIHRoaXMuYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICB9O1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodGhpcy5idWZmZXJTb3VyY2UgIT09IG51bGwpIHtcclxuICAgIHRoaXMuYnVmZmVyU291cmNlLmRpc2Nvbm5lY3QoKTtcclxuICAgIHRoaXMuYnVmZmVyU291cmNlID0gbnVsbDtcclxuICAgIGNvbnNvbGUubG9nKCdCdWZmZXJTb3VyY2VOb2RlIGRlc3Ryb3llZCcpO1xyXG4gIH1cclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24obG9vcCkge1xyXG4gIGlmICh0eXBlb2YgbG9vcCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHRoaXMubG9vcCA9IGxvb3A7XHJcbiAgfVxyXG4gIHRoaXMuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2UubG9vcCA9IHRoaXMubG9vcDtcclxuXHJcbiAgaWYgKHRoaXMuc3RhcnRPZmZzZXQgPT09IDAgfHwgdGhpcy5zdGFydE9mZnNldCA+PSB0aGlzLmJ1ZmZlci5kdXJhdGlvbikge1xyXG4gICAgY29uc29sZS5sb2coJ3Jlc2V0dGluZyBzdGFydHRpbWUnKTtcclxuICAgIHRoaXMuc3RhcnRUaW1lID0gdGhpcy5hdWRpb0N0eC5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIHRoaXMuYnVmZmVyU291cmNlLnN0YXJ0KHRoaXMuc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0KTtcclxuICB0aGlzLnN0YXJ0T2Zmc2V0ID0gMDtcclxufTtcclxuXHJcblNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24ocGF1c2VkKSB7XHJcbiAgaWYgKHBhdXNlZCkge1xyXG4gICAgdGhpcy5zdGFydE9mZnNldCA9IHRoaXMuYXVkaW9DdHguY3VycmVudFRpbWUgLSB0aGlzLnN0YXJ0VGltZTtcclxuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIH1cclxuICBpZiAodGhpcy5idWZmZXJTb3VyY2UgIT09IG51bGwpIHtcclxuICAgIHRoaXMuYnVmZmVyU291cmNlLnN0b3AoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy9mYWlsIHNpbGVudGx5XHJcbiAgfVxyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgdGhpcy5zdG9wKHRoaXMuaXNQYXVzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNvdW5kV2F2ZSA9IGZ1bmN0aW9uKGF1ZGlvQ3R4LCBiaW5hcnlEYXRhLCBjb2xsZWN0aW9uKSB7XHJcblxyXG4gIHRoaXMuYXVkaW9DdHggPSBudWxsO1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuXHJcblxyXG4gIGlmIChhdWRpb0N0eCkge1xyXG4gICAgdGhpcy5hdWRpb0N0eCA9IGF1ZGlvQ3R4O1xyXG4gICAgY29uc29sZS5sb2codGhpcy5hdWRpb0N0eCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKCdObyBBdWRpb0NvbnRleHQgZm91bmQnKTtcclxuICB9XHJcblxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKGJpbmFyeURhdGEpIHtcclxuICAgIHRoaXMuYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKGJpbmFyeURhdGEpLnRoZW4oZnVuY3Rpb24oZGVjb2RlZCkge1xyXG4gICAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdidWZmZXIgY3JlYXRlZCcpO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vVE9ETzogdGhyb3cgZXJyb3JcclxuICB9XHJcblxyXG4gIGlmIChjb2xsZWN0aW9uKSB7XHJcbiAgICAvL1RPRE86IHB1dCBidWZmZXIgaW50byBzb3VuZGJhbmtcclxuICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIHNpbXBseSBjcmVhdGVzIHRoZSBhdWRpbyBjb250ZXh0IG9iamVjdHNcclxuICogYW5kIGV4cG9ydHMgaXQuXHJcbiAqXHJcbiAqIFRPRE86IC0gU2hvdWxkIHdlIGRvIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBhcGktdmVyc2lvbnM/XHJcbiAqICAgICAgIC0gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogICAgICAgLSBDaGVjayBpZiB3ZSdyZSBydW5uaW5nIG9uIG5vZGUgKGFuZCB0aHJvdyBhbiBlcnJvciBpZiBzbylcclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhdWRpb0N0eCA9IG51bGw7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcblxyXG4gIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcblxyXG4gIGlmICh3aW5kb3cuQXVkaW9Db250ZXh0KSB7XHJcbiAgICBhdWRpb0N0eCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vVE9ETzogdGhyb3cgZXJyb3IsIHByb2JhYmx5IHN1cnJvdW5kIHdpdGggdHJ5L2NhdGNoXHJcbiAgfVxyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGF1ZGlvQ3R4OiBhdWRpb0N0eFxyXG59O1xyXG4iXX0=
