'use strict';

//intermix = require('./core.js');
var intermix = require('./core.js') || {};
intermix.events = require('./events.js');
intermix.SoundWave = require('./SoundWave.js');
intermix.Sound = require('./Sound.js');
intermix.Sequencer = require('./Sequencer.js');
intermix.Part = require('./Part.js');

module.exports = intermix;
