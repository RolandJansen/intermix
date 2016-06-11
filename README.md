# Intermix

[![Build Status](https://travis-ci.org/RolandJansen/intermix.js.svg?branch=master)](https://travis-ci.org/RolandJansen/intermix.js)
[![Code Climate](https://codeclimate.com/github/RolandJansen/intermix.js/badges/gpa.svg)](https://codeclimate.com/github/RolandJansen/intermix.js)
[![Test Coverage](https://codeclimate.com/github/RolandJansen/intermix.js/badges/coverage.svg)](https://codeclimate.com/github/RolandJansen/intermix.js/coverage)

Intermix is a javascript library that can be used to build browser-based music applications with a focus on sequencing. It doesn't aim to be a fully fledged audio library. All its audio functionality is designed to fit together well with the sequencer.

It has a powerful event bus with relays for instruments, fx and controllers that makes routing of events easy. Relay endpoints can deposit data about their custom events that can be looked up by other bus attendees. A sequencer e.g. (or a controller in general) is able to control any parameter of an instrument without having to know anything about its functionality. This means you can write a synthesizer any way you want as long as you expose its event API to the bus.

Intermix is in a very early stage and the API may change from one release to another. The only browser that is known for fully supporting Intermix is Chrome 49+. See [browser Compatibility](browser-compatibility).

## Installation
### npm

```sh
npm install intermix
```

Usage in a module:

```javascript
var intermix = require('intermix');
```

### Bower

```sh
bower install intermix
```

then add it via script tag to your HTML head:

```html
<script type="text/javascript" src="bower_components/intermix/dist/intermix.js"></script>
```

### Other
You can also [download the latest release](https://github.com/RolandJansen/intermix.js/releases), and include the normal
 or minified build from the dist folder like with Bower.

Intermix supports the AMD pattern, so with require.js you can do somthing like this:

```javascript
requirejs.config({
  paths: { "intermix": "intermix/dist/intermix" }
});

requirejs(['intermix'], function(intermix) {
  ...
});
```

## Usage

Here's an example of a basic sequencer that triggers a sound on every beat.

First we should add a sound:

```javascript
var wave = new intermix.SoundWave('file.wav');
var sound = new intermix.Sound(wave);
```

> Intermix uses two objects for that. A SoundWave just holds the PCM data and a Sound plays the actual sound. This comes in handy if you want to play a waveform in different contexts.

Then build the sequencer:

```javascript
var seq = new intermix.Sequencer();
```

>This creates a barebone sequencer.

Create a note event ...

```javascript
var note = intermix.helper.createNoteEvent(sound.uid, 'c4', 1);
```

> The arguments to createNoteEvent() are: The unique ID of the receiver,
the tone (string or midi note number) and the velocity between 0 and 1.

... and add it at different points to a part:

```javascript
var part = new intermix.Part();
part.addEvent(note, 0).addEvent(note, 4).addEvent(note, 8).addEvent(note, 12);
```

> The default resolution of Part is a 16th note. To play a sound on every
4th note we add the event at position 0, 4, 8 and 12.

Finally, add the part to the sequencer and start playing in a loop:

```javascript
seq.addPart(part, 0);
seq.loop = true;
seq.start();
```

You can also draw something on the screen in sync:

```javascript
var el = document.querySelector('.ping');
seq.updateFrame = function(lastPlayedStep) {
  var step = Math.round(lastPlayedStep / 4);
  el.style.backgroundColor = (step % 4) === 0 ? 'red' : 'white';
};
```

> The sequencer has a callback function named updateFrame(). Its parameter is the last played 64th note by default. It gets called in between two screen refreshes if the sequencer has moved forward. In the example above a dom element with a class named "ping" gets a red background on every 4th note and a white one otherwise. This should be used with caution because expensive things like dom operations can easily lead to performance drops.

## Dependencies
No dependencies to other libraries, just Javascript and Web Audio API.

## <a name="browser-compatibility">Browser Compatibility
| Chrome | Firefox | Edge     | Internet Explorer | Opera    | Safari   |
|--------|---------|----------|-------------------|----------|----------|
| 49+    | 46+ (*) | untested | untested          | untested | untested |

* Sample accurate pause/resume of sounds not supported.

## License
Copyright (C) 2016 Roland Jansen

Licensed under the [Apache Public License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
