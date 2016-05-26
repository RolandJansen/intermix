var imix = require('intermix');

var Test = function() {
  // console.log(intermix.SoundWave);

  this.wave = new imix.SoundWave('JX3-BS05.WAV');
  this.sound = new imix.Sound(this.wave);

};

Test.prototype.start = function() {
  this.sound.start();
};

module.exports = Test
