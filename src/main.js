'use strict';

//intermix = require('./core.js');
var intermix = require('./core.js') || {};
intermix.EventBus = require('./EventBus.js');
intermix.SoundWave = require('./SoundWave.js');
intermix.Sound = require('./Sound.js');
intermix.Sequencer = require('./Sequencer.js');
intermix.Part = require('./Part.js');

intermix.events = require('./events.js');
intermix.eventBus = new intermix.EventBus();

module.exports = intermix;
