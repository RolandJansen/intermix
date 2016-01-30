(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//Intermix = require('./core.js');
var Intermix = {};
Intermix.SoundWave = _dereq_('./SoundWave.js');
Intermix.Sound = _dereq_('./Sound.js');

module.exports = Intermix;

},{"./Sound.js":2,"./SoundWave.js":3}],2:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');

var Sound = function(soundWave) {

  this.audioCtx = null;
  this.buffer = null;
  this.bufferSource = null;
  this.loop = false;
  this.gainNode = null;
  this.pannerNode = null;

  if (core.ac) {
    this.audioCtx = core.ac;
  }

  if (soundWave) {
    this.buffer = soundWave;
    this.setupAudioChain();
  } else {
    //TODO: throw error
    console.log('audiochain not ready');
  }
};

Sound.prototype.setupAudioChain = function() {
  this.gainNode = this.audioCtx.createGain();
  this.pannerNode = this.audioCtx.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(this.audioCtx.destination);
  this.gainNode.gain.value = 1;
  // test
  //
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
  }
  console.log('BufferSourceNode destroyed');
};

// Sound.prototype.resetBufferSource = function() {
//   this.destroyBufferSource();
//   this.createBufferSource();
// };

Sound.prototype.play = function(loop) {
  if (loop) {
    this.loop = loop;
  }
  this.createBufferSource();
  this.bufferSource.loop = this.loop;
  console.log(this.bufferSource);
  this.bufferSource.start();
  console.log('Sound started with loop = ' + loop);
};

Sound.prototype.stop = function() {
  if (this.bufferSource !== null) {
    this.bufferSource.stop();
    if (this.loop) {
      this.destroyBufferSource();
    }
  } else {
    //fail silently
  }
};

module.exports = Sound;

},{"./core.js":4}],3:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');

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

},{"./core.js":4}],4:[function(_dereq_,module,exports){
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
  ac: audioCtx
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9zcmMvU291bmQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZFdhdmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9jb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy9JbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG52YXIgSW50ZXJtaXggPSB7fTtcclxuSW50ZXJtaXguU291bmRXYXZlID0gcmVxdWlyZSgnLi9Tb3VuZFdhdmUuanMnKTtcclxuSW50ZXJtaXguU291bmQgPSByZXF1aXJlKCcuL1NvdW5kLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEludGVybWl4O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgY29yZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xyXG5cclxudmFyIFNvdW5kID0gZnVuY3Rpb24oc291bmRXYXZlKSB7XHJcblxyXG4gIHRoaXMuYXVkaW9DdHggPSBudWxsO1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZSA9IG51bGw7XHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgaWYgKGNvcmUuYWMpIHtcclxuICAgIHRoaXMuYXVkaW9DdHggPSBjb3JlLmFjO1xyXG4gIH1cclxuXHJcbiAgaWYgKHNvdW5kV2F2ZSkge1xyXG4gICAgdGhpcy5idWZmZXIgPSBzb3VuZFdhdmU7XHJcbiAgICB0aGlzLnNldHVwQXVkaW9DaGFpbigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL1RPRE86IHRocm93IGVycm9yXHJcbiAgICBjb25zb2xlLmxvZygnYXVkaW9jaGFpbiBub3QgcmVhZHknKTtcclxuICB9XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IHRoaXMuYXVkaW9DdHguY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QodGhpcy5hdWRpb0N0eC5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxuICAvLyB0ZXN0XHJcbiAgLy9cclxuICBjb25zb2xlLmxvZygnYXVkaW9jaGFpbiByZWFkeScpO1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICBjb25zb2xlLmxvZygnYnVmZmVyIGlzOiAnICsgdGhpcy5idWZmZXIpO1xyXG4gIHRoaXMuYnVmZmVyU291cmNlID0gdGhpcy5hdWRpb0N0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICB0aGlzLmJ1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gIHRoaXMuYnVmZmVyU291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHNlbGYuZGVzdHJveUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgY29uc29sZS5sb2coJ29uZW5kZWQgZmlyZWQnKTtcclxuICB9O1xyXG59O1xyXG5cclxuU291bmQucHJvdG90eXBlLmRlc3Ryb3lCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodGhpcy5idWZmZXJTb3VyY2UgIT09IG51bGwpIHtcclxuICAgIHRoaXMuYnVmZmVyU291cmNlLmRpc2Nvbm5lY3QoKTtcclxuICAgIHRoaXMuYnVmZmVyU291cmNlID0gbnVsbDtcclxuICB9XHJcbiAgY29uc29sZS5sb2coJ0J1ZmZlclNvdXJjZU5vZGUgZGVzdHJveWVkJyk7XHJcbn07XHJcblxyXG4vLyBTb3VuZC5wcm90b3R5cGUucmVzZXRCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbigpIHtcclxuLy8gICB0aGlzLmRlc3Ryb3lCdWZmZXJTb3VyY2UoKTtcclxuLy8gICB0aGlzLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4vLyB9O1xyXG5cclxuU291bmQucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbihsb29wKSB7XHJcbiAgaWYgKGxvb3ApIHtcclxuICAgIHRoaXMubG9vcCA9IGxvb3A7XHJcbiAgfVxyXG4gIHRoaXMuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2UubG9vcCA9IHRoaXMubG9vcDtcclxuICBjb25zb2xlLmxvZyh0aGlzLmJ1ZmZlclNvdXJjZSk7XHJcbiAgdGhpcy5idWZmZXJTb3VyY2Uuc3RhcnQoKTtcclxuICBjb25zb2xlLmxvZygnU291bmQgc3RhcnRlZCB3aXRoIGxvb3AgPSAnICsgbG9vcCk7XHJcbn07XHJcblxyXG5Tb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLmJ1ZmZlclNvdXJjZSAhPT0gbnVsbCkge1xyXG4gICAgdGhpcy5idWZmZXJTb3VyY2Uuc3RvcCgpO1xyXG4gICAgaWYgKHRoaXMubG9vcCkge1xyXG4gICAgICB0aGlzLmRlc3Ryb3lCdWZmZXJTb3VyY2UoKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9mYWlsIHNpbGVudGx5XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxuXHJcbnZhciBTb3VuZFdhdmUgPSBmdW5jdGlvbihiaW5hcnlEYXRhLCBjb2xsZWN0aW9uKSB7XHJcblxyXG4gIHRoaXMuYXVkaW9DdHggPSBudWxsO1xyXG4gIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuXHJcblxyXG4gIGlmIChjb3JlLmFjKSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4ID0gY29yZS5hYztcclxuICAgIGNvbnNvbGUubG9nKHRoaXMuYXVkaW9DdHgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zb2xlLmxvZygnTm8gQXVkaW9Db250ZXh0IGZvdW5kJyk7XHJcbiAgfVxyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmIChiaW5hcnlEYXRhKSB7XHJcbiAgICB0aGlzLmF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnlEYXRhKS50aGVuKGZ1bmN0aW9uKGRlY29kZWQpIHtcclxuICAgICAgc2VsZi5idWZmZXIgPSBkZWNvZGVkO1xyXG4gICAgICBjb25zb2xlLmxvZygnYnVmZmVyIGNyZWF0ZWQnKTtcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL1RPRE86IHRocm93IGVycm9yXHJcbiAgfVxyXG5cclxuICBpZiAoY29sbGVjdGlvbikge1xyXG4gICAgLy9UT0RPOiBwdXQgYnVmZmVyIGludG8gc291bmRiYW5rXHJcbiAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmRXYXZlO1xyXG4iLCIvKipcclxuICogVGhpcyBzaW1wbHkgY3JlYXRlcyB0aGUgYXVkaW8gY29udGV4dCBvYmplY3RzXHJcbiAqIGFuZCBleHBvcnRzIGl0LlxyXG4gKlxyXG4gKiBUT0RPOiAtIFNob3VsZCB3ZSBkbyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3Igb2xkZXIgYXBpLXZlcnNpb25zP1xyXG4gKiAgICAgICAtIENoZWNrIGZvciBtb2JpbGUvaU9TIGNvbXBhdGliaWxpdHkuXHJcbiAqICAgICAgIC0gQ2hlY2sgaWYgd2UncmUgcnVubmluZyBvbiBub2RlIChhbmQgdGhyb3cgYW4gZXJyb3IgaWYgc28pXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYXVkaW9DdHggPSBudWxsO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG5cclxuICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xyXG5cclxuICBpZiAod2luZG93LkF1ZGlvQ29udGV4dCkge1xyXG4gICAgYXVkaW9DdHggPSBuZXcgd2luZG93LkF1ZGlvQ29udGV4dCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL1RPRE86IHRocm93IGVycm9yLCBwcm9iYWJseSBzdXJyb3VuZCB3aXRoIHRyeS9jYXRjaFxyXG4gIH1cclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBhYzogYXVkaW9DdHhcclxufTtcclxuIl19
