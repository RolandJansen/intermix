/**
 * An example plugin for intermix.js
 *
 * Technically, the intermix namespace (window.intermix) is
 * just an extended AudioContext instance.
 * This means that intermix provides not just the
 * library functions but also all properties and methods
 * of the browsers AudioContext which makes it easy to build
 * synthesizers.
 *
 * For API docs of the AudioContext see
 * https://developer.mozilla.org/de/docs/Web/API/AudioContext
 */

/*eslint-disable */
var BasicSynth = function() {

  // Create a new biquad filter
  this.filter = intermix.createBiquadFilter();
  // Initial envelope attack value in seconds
  this.attack = 0.1;
  // Initial envelope decay value in seconds
  this.decay = 0.1;
  // Define any number of controllable events
  // and name them at will. Custom events should
  // be defined with a name and an array with
  // min/max/default values.
  // Here we just have attack/decay.
  this.events = {
    filterEnvAttack: [0, 0.2, 0.1],
    filterEnvDecay: [0, 0.2, 0.1],
  };
  // Define callback functions for the
  // previously defined events.
  this.handleEvents = {
    note: this.handleNote,
    filterEnvAttack: this.handleAttack,
    filterEnvDecay: this.handleDecay
  };

  // Register this plugin to the instrument relay
  // of the intermix event bus. It returns a unique id
  // which is of no use in this example.
  this.uid = intermix.eventBus.addRelayEndpoint('instrument', this.events, this);

  // Setup the audio chain (which consists of
  // just one filter) and connect it to the audio output
  this.initFilter();
  this.connect();
};

// Sets filtertype, quality and initial cutoff frequency
BasicSynth.prototype.initFilter = function() {
  this.filter.type = 'lowpass';
  this.filter.Q.value = 15;
  this.filter.frequency.value = 1000;
};

// Connects the filter to main out
BasicSynth.prototype.connect = function() {
  this.filter.connect(intermix.destination);
};

// Schedules an envelope run
BasicSynth.prototype.startEnvelope = function(delay) {
  var freq = this.filter.frequency;
  freq.cancelScheduledValues(delay)
  freq.setValueAtTime(12000, delay);
  freq.linearRampToValueAtTime(22050, delay + this.attack);
  freq.linearRampToValueAtTime(1000, delay + this.decay);
};

// Creates a sawtooth oscillator object and returns it.
// An oscillation destroys itself after a note is played.
BasicSynth.prototype.getNewOsc = function(freq) {
  var osc = intermix.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  osc.connect(this.filter);
  return osc;
};

// Plays a note
BasicSynth.prototype.start = function(noteMsg) {
  var freq = intermix.helper.getNoteFrequency(noteMsg.value);
  var osc = this.getNewOsc(freq);
  osc.start(noteMsg.delay);
  osc.stop(noteMsg.delay + noteMsg.duration);
  this.startEnvelope(noteMsg.delay);
};

// This function has to be implemented by every plugin.
// It gets called by the eventbus if a message arrives.
// Here we use a lookup table to avoid conditionals.
BasicSynth.prototype.handleRelayData = function(evt) {
  var msg = evt.msg;
  this.handleEvents[msg.type].call(this, msg);
};

// Handles note events
BasicSynth.prototype.handleNote = function(msg) {
  var tone = msg.value;
  if (tone >= 0 && tone <= 127) {
    this.start(msg);
  }
};

// Handles attack-time-change events
BasicSynth.prototype.handleAttack = function(msg) {
  this.attack = msg.value;
};

// Handles decay-time-change events
BasicSynth.prototype.handleDecay = function(msg) {
  this.decay = msg.value;
};
