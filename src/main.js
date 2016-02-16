'use strict';

//Intermix = require('./core.js');
var Intermix = require('./core.js') || {};
Intermix.SoundWave = require('./SoundWave.js');
Intermix.Sound = require('./Sound.js');
Intermix.Sequencer = require('./Sequencer.js');
Intermix.Part = require('./Part.js');

module.exports = Intermix;
