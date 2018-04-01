'use strict';

//intermix = require('./core.js');
var intermix = import('./core.ts') || {};
// intermix.EventBus = require('./EventBus.js');
// intermix.SoundWave = require('./SoundWave.js');
// intermix.Sound = require('./Sound.js');
// intermix.Sequencer = require('./Sequencer.js');
// intermix.Part = require('./Part.js');

// intermix.helper = require('./Helper.js');
// intermix.eventBus = new intermix.EventBus();

module.exports = intermix;
