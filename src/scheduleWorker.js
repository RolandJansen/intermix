/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is much smoother
 * than in the main thread.
 */
'use strict';

var timer = null;
var interval = 100;

/*eslint-disable */
self.onmessage = function(e) {
  if (e.data === 'start') {
    timer = setInterval(function() {postMessage('tick');}, interval);
  } else if (e.data === 'stop') {
    clearInterval(timer);
  } else if (e.data.interval) {
    interval = e.data.interval;
    if (timer) {
      clearInterval(timer);
      timer = setInterval(function() {postMessage('tick');}, interval);
    }
  }
};

postMessage('A-Ok');
