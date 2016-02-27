/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is much more stable
 * than in the main thread.
 *
 * The syntax is adapted to the commonjs module pattern.
 */
'use strict';

var timer = null;
var interval = 100;

var worker = function(self) {
  self.addEventListener('message', function(e) {
    if (e.data === 'start') {
      timer = setInterval(function() {self.postMessage('tick');}, interval);
    } else if (e.data === 'stop') {
      clearInterval(timer);
    } else if (e.data.interval) {
      interval = e.data.interval;
      if (timer) {
        clearInterval(timer);
        timer = setInterval(function() {self.postMessage('tick');}, interval);
      }
    }
  });
};

module.exports = worker;

/*eslint-disable */
// self.onmessage = function(e) {
//   if (e.data === 'start') {
//     timer = setInterval(function() {postMessage('tick');}, interval);
//   } else if (e.data === 'stop') {
//     clearInterval(timer);
//   } else if (e.data.interval) {
//     interval = e.data.interval;
//     if (timer) {
//       clearInterval(timer);
//       timer = setInterval(function() {postMessage('tick');}, interval);
//     }
//   }
//
//   self.close();
// };
