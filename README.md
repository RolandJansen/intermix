[![Code Climate](https://codeclimate.com/github/RolandJansen/intermix.js/badges/gpa.svg)](https://codeclimate.com/github/RolandJansen/intermix.js)

Intermix is a javascript library that can be used to build browser-based music applications with a focus on sequencing. It doesn't aim to be a fully fledged audio library. All its audio functionality was designed to fit together well with the sequencer.

It uses some of the latest stuff in web technology so it currently runs perfectly in Chrome 49+ only. Firefox works but sample accurate pause/resume of sounds is not supported. Please note that Intermix is in a very early stage. It doesn't have a robust event dispatcher yet and some other things are still considered experimental.

Here's an example of a basic sequencer that triggers a sound on every beat.

First we have to load a sound:

    var wave = new intermix.SoundWave('file.wav');
    var sound = new intermix.Sound(wave);

> Intermix uses two objects for that. A SoundWave just holds the PCM data and the Sound object plays the actual sound. This comes in handy if you want to play different sounds of the same waveform.

Then we build the sequencer:

    var seq = new intermix.Sequencer();
    var part = new intermix.Part();
    part.addEvent(sound, 0);
    part.addEvent(sound, 4);
    part.addEvent(sound, 8);
    part.addEvent(sound, 12);

    seq.addPart(part, 0);
    seq.loop = true;
    seq.start();

> This creates a sequencer with one part of one bar length that will be played in a loop. The default resolution of parts is a 16th note so we add sound events on position 0, 4, 8 and 12.

You can also draw something in sync on the screen:

    seq.updateFrame = function(lastPlayedStep) {
      var step = Math.round(lastPlayedStep / 4);
      var el = document.querySelector('.ping');
      el.style.backgroundColor = (step % 4) === 0 ? 'red' : 'white';
    };

> The sequencer has a callback function called updateFrame(). Its parameter is by default the last played 64th note. It gets called everytime before the screen refreshes (normally 60fpm). In the function above a dom element with a class named "ping" gets a red background everytime a sound gets triggered or a white one if not.
