/**
 * An example plugin for intermix.js
 *
 * Technically, the intermix namespace (window.intermix) is
 * just an extended AudioContext instance.
 * This means that intermix provides not just the
 * library functions but also all properties and methods
 * of an AudioContext which makes it very easy to build
 * a synthesizer for example.
 *
 * For API docs of the AudioContext see
 * https://developer.mozilla.org/de/docs/Web/API/AudioContext
 */

/*eslint-disable */
var SimpleSynth = function() {

  this.filter = intermix.createBiquadFilter();
  this.attack = 0.1;
  this.decay = 0.1;
  this.events = {
    filterEnvAttack: [0, 0.2],
    filterEnvDecay: [0, 0.2],
  };
  this.handleEvents = {
    note: this.handleNote,
    filterEnvAttack: this.handleAttack,
    filterEnvDecay: this.handleDecay
  };

  this.uid = intermix.eventBus.addRelayEndpoint('instrument', this.events, this);

  this.initFilter();
  this.connect();
};

SimpleSynth.prototype.initFilter = function() {
  this.filter.type = 'lowpass';
  this.filter.Q.value = 15;
  this.filter.frequency.value = 1000;
};

SimpleSynth.prototype.connect = function() {
  this.filter.connect(intermix.destination);
};

SimpleSynth.prototype.getOsc = function(freq) {
  var osc = intermix.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  osc.connect(this.filter);
  return osc;
};

SimpleSynth.prototype.startEnvelope = function(delay) {
  var parameter = this.filter.frequency;
  parameter.cancelScheduledValues(delay)
  parameter.setValueAtTime(12000, delay);
  parameter.linearRampToValueAtTime(22050, delay + this.attack);
  parameter.linearRampToValueAtTime(1000, delay + this.decay);
};

SimpleSynth.prototype.start = function(noteMsg) {
  var freq = intermix.helper.getNoteFrequency(noteMsg.value);
  var osc = this.getOsc(freq);
  osc.start(noteMsg.delay);
  osc.stop(noteMsg.delay + noteMsg.duration);
  this.startEnvelope(noteMsg.delay);
};

SimpleSynth.prototype.handleRelayData = function(evt) {
  var msg = evt.msg;
  // console.log(msg);
  this.handleEvents[msg.type].call(this, msg);
};

SimpleSynth.prototype.handleNote = function(msg) {
  var tone = msg.value;
  if (tone >= 0 && tone <= 127) {
    this.start(msg);
  }
};

SimpleSynth.prototype.handleAttack = function(msg) {
  // console.log('attack: ' + msg.value);
  this.attack = msg.value;
};

SimpleSynth.prototype.handleDecay = function(msg) {
  // console.log('decay: ' + msg.value);
  this.decay = msg.value;
};
