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
var SimpleSynth = function() {

  // Create a new biquad filter
  this.filter = intermix.createBiquadFilter();
  // Initial envelope attack value in seconds
  this.attack = 0.1;
  // Initial envelope decay value in seconds
  this.decay = 0.1;
  // Define any number of controllable events
  // and name them at will. Events consist
  // of an array with min/max/default values.
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
SimpleSynth.prototype.initFilter = function() {
  this.filter.type = 'lowpass';
  this.filter.Q.value = 15;
  this.filter.frequency.value = 1000;
};

// Connects the filter to main out
SimpleSynth.prototype.connect = function() {
  this.filter.connect(intermix.destination);
};

// Schedules an envelope run
SimpleSynth.prototype.startEnvelope = function(delay) {
  var parameter = this.filter.frequency;
  parameter.cancelScheduledValues(delay)
  parameter.setValueAtTime(12000, delay);
  parameter.linearRampToValueAtTime(22050, delay + this.attack);
  parameter.linearRampToValueAtTime(1000, delay + this.decay);
};

// Creates a sawtooth oscillator object and returns it.
// An oscillation destroys itself after a note is played.
SimpleSynth.prototype.getOsc = function(freq) {
  var osc = intermix.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  osc.connect(this.filter);
  return osc;
};

// Plays a note
SimpleSynth.prototype.start = function(noteMsg) {
  var freq = intermix.helper.getNoteFrequency(noteMsg.value);
  var osc = this.getOsc(freq);
  osc.start(noteMsg.delay);
  osc.stop(noteMsg.delay + noteMsg.duration);
  this.startEnvelope(noteMsg.delay);
};

// This function has to be implemented by every plugin.
// It gets called by the eventbus if a message arrives.
// Here we use an array
SimpleSynth.prototype.handleRelayData = function(evt) {
  var msg = evt.msg;
  this.handleEvents[msg.type].call(this, msg);
};

// Handles note events
SimpleSynth.prototype.handleNote = function(msg) {
  var tone = msg.value;
  if (tone >= 0 && tone <= 127) {
    this.start(msg);
  }
};

// Handles attack-time-change events
SimpleSynth.prototype.handleAttack = function(msg) {
  this.attack = msg.value;
};

// Handles decay-time-change events
SimpleSynth.prototype.handleDecay = function(msg) {
  this.decay = msg.value;
};
