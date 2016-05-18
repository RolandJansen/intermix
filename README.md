[![Build Status](https://travis-ci.org/RolandJansen/intermix.js.svg?branch=master)](https://travis-ci.org/RolandJansen/intermix.js)
[![Code Climate](https://codeclimate.com/github/RolandJansen/intermix.js/badges/gpa.svg)](https://codeclimate.com/github/RolandJansen/intermix.js)
[![Test Coverage](https://codeclimate.com/github/RolandJansen/intermix.js/badges/coverage.svg)](https://codeclimate.com/github/RolandJansen/intermix.js/coverage)

Intermix is a javascript library that can be used to build browser-based music applications with a focus on sequencing. It doesn't aim to be a fully fledged audio library. All its audio functionality is designed to fit together well with the sequencer.

It uses some of the latest stuff in web technology so it currently runs perfectly in Chrome 49+ only. Firefox works but sample accurate pause/resume of sounds is not supported. Please note that Intermix is in a very early stage. It doesn't have a robust event dispatcher yet and most things are considered experimental.

Here's an example of a basic sequencer that triggers a sound on every beat.

First load a sound:

    var wave = new intermix.SoundWave('file.wav');
    var sound = new intermix.Sound(wave);

> Intermix uses two objects for that. A SoundWave just holds the PCM data and a Sound plays the actual sound. This comes in handy if you want to play a waveform in different contexts.

Then build the sequencer:

    var seq = new intermix.Sequencer();
    var part = new intermix.Part();
    part.addEvent(sound, 0);
    part.addEvent(sound, 4);
    part.addEvent(sound, 8);
    part.addEvent(sound, 12);

    seq.addPart(part, 0);
    seq.loop = true;
    seq.start();

> This creates a sequencer with one part of one bar length that will be played in a loop. The default resolution of Part is a 16th note. To play a sound on every 4th note we add soundevents at position 0, 4, 8 and 12.

You can also draw something on the screen in sync:

    seq.updateFrame = function(lastPlayedStep) {
      var step = Math.round(lastPlayedStep / 4);
      var el = document.querySelector('.ping');
      el.style.backgroundColor = (step % 4) === 0 ? 'red' : 'white';
    };

> The sequencer has a callback function named updateFrame(). Its parameter is the last played 64th note by default. It gets called every time before the screen refreshes (usually 60 times a second). In the example above a dom element with a class named "ping" gets a red background on every 4th note and a white one otherwise. This should be used with caution because expensive things like dom operations can easily lead to performance drops.
