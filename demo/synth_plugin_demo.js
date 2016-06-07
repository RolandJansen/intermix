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

  this.oscillator = intermix.createOscillator();
  this.filter = intermix.createBiquadFilter();
  this.amp = intermix.createGain();
  this.envelopes = {
    filter: {
      deltaT: [ 0.5, 0.5, 0.5, 0.5 ],
      sustain: 0.5
    },
    amp: {
      deltaT: [ 0.5, 0.5, 0.5, 0.5 ],
      sustain: 0.5
    },
  };
  this.events = {};
  this.handleEvents = {
    note: this.handleNote(),
    volume: this.handleVolume()
  };

  this.uid = intermix.eventBus.addRelayEndpoint('instrument', this.events, this);

  this.initOsc();
  this.initFilter();
  this.connect();

};

SimpleSynth.prototype.initOsc = function() {
  this.oscillator.type = 'square';
  this.oscillator.frequency.value = 3000;
};

SimpleSynth.prototype.initFilter = function() {
  this.filter.type = 'lowpass';
  this.filter.frequency.value = 1000;
};

SimpleSynth.prototype.connect = function() {
  this.oscillator.connect(this.filter);
  this.filter.connect(this.amp);
  this.amp.connect(intermix.destination);
};

SimpleSynth.prototype.startEnvelopes = function(delay) {
  this.startEnvelope('amp', delay);
  this.startEnvelope('filter', delay);
};

SimpleSynth.prototype.startEnvelope = function(type, delay) {
  var parameter;
  var deltaT = this.envelopes[type].deltaT;
  var sustain = this.envelopes[type].sustain;
  if (type === 'filter') {
    parameter = this.filter.frequency.value;
  } else {
    parameter = this.amp.gain.value;
  }
  parameter.linearRampToValueAtTime(1, delay + deltaT[0]);
  parameter.linearRampToValueAtTime(sustain, delay + deltaT[0] + deltaT[1]);
  parameter.setValueAtTime(sustain, delay + deltaT[0] + deltaT[1] + deltaT[2])
  parameter.linearRampToValueAtTime(sustain,
    delay + deltaT[0] + deltaT[1] + deltaT[2] + deltaT[3]);
};

SimpleSynth.prototype.handleRelayData = function(msg) {

};

SimpleSynth.prototype.handleNote = function(evt) {

};

SimpleSynth.prototype.handleVolume = function(evt)  {

};
