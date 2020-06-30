# Intermix

![](https://github.com/RolandJansen/intermix.js/workflows/build\/test/badge.svg)
[![Code Climate](https://codeclimate.com/github/RolandJansen/intermix.js/badges/gpa.svg)](https://codeclimate.com/github/RolandJansen/intermix.js)
[![Test Coverage](https://codeclimate.com/github/RolandJansen/intermix.js/badges/coverage.svg)](https://codeclimate.com/github/RolandJansen/intermix.js/coverage)

---

## Warning

This software is in an early stage and the API is still under development. The current release (0.5.0) is just a milestone and not ment to be used in production environments. External plugin support will be added in v0.7.0.

---

## About

Intermix is a framework that can be used to create browser-based audio applications with a different approach than most other audio libraries. Its focus is not on high level abstractions of the Web Audio API. Instead it provides an architecture for plugins that can be used in any context that uses intermix.

With Redux as its foundation, intermix is also a predictable state container: No side effects, nothing unexpected - actions performed in Intermix are completely predictable.

## Install

`npm install intermix`

or if you prefer yarn

`yarn add intermix`

## Usage

Load intermix into your module with ES2015 module syntax
```javascript
import * as intermix from "intermix";
```

or with CommonJS module require
```javascript
const intermix = require("intermix");
```

now you can start building an audio app. For example instantiate a sequencer and a synth
```javascript
const sequencerUID = intermix.addPlugin('Sequencer');
const synthUID = intermix.addPlugin('Synth');
```

you can build a sequencer-part and add it to the score
```javascript
// Sequencer parts are containers that hold notes and other events.
// They have a length of 1 full note, divided into 16 steps by default.
const seqPartUID = intermix.addSeqPart();

// action creators are functions that send actions to a plugin
const seqActionCreators = intermix.getActionCreators(sequencerUID);

// The following binds the part to the synth plugin and adds it to the score.
// Now all events in the part will be routed to the synth
seqActionCreators.addToScore([seqPartUID, synthUID]);
```

There's much more you can do with intermix. The API doc in the project wiki is a good starting point and there will be more infos on the webpage soon.

## Concept

Most of the API is message based. Intermix messages are an amalgam of [OSC](https://en.wikipedia.org/wiki/Open_Sound_Control) messages and [Redux](https://redux.js.org/) actions:

```javascript
{
    address: "/intermix/plugin/i2342/envAttack",
    type: "envAttack",
    typeTag: ",sff",
    value: ["Envelope Attack", 0.42, 0.0],
}
```

The action above is of type "envAttack". It would be send to a plugin with the ID "i2342". The attack value is 0.42 and it will be executed at second 0 (which means right now).

The _typeTag_ says that the value is a tuple of type `[string, float, float]`. Controller actions normally start with a string that holds a name followed by the actual value and the time in seconds when the action should be executed. The execution time is vital in a browser because there's no _realtime_ like in an os-native app. Executing actions in the sequencer means to schedule them to be executed in the near future.

For an app developer there's no need to build these actions manually as intermix provides action creators for all managed plugins. These functions create and dispatch actions for you.

A plugin developer can write action definitions that are consumed by intermix to build the internal logic at runtime:

```javascript
{
    address: "/intermix/plugin/#{UID}/envAttack",
    typeTag: ",sff",
    description: "Envelope Attack with name, value and start time",
}
```


## Features

* Architecture for browser-based audio plugins
* Predictable State Container for all managed plugins
* Message based, easily extendible OSC-like API
* Build-in sequencer with rock solid timing
* Simple build-in synth- and sampler plugins


## Dependencies

* [Redux](https://redux.js.org/)

Note: Redux is often used together with the React UI framework but this is totally up to you. Intermix can be combined with any UI technology you like.

## Browser Compatibility

| Chrome | Firefox | Edge     | Internet Explorer | Opera    | Safari   |
|--------|---------|----------|-------------------|----------|----------|
| 83+    | 77+ (*) | untested | untested          | untested | untested |

\* Sample accurate pause/resume of sounds not tested (didn't work in previous versions).

## License
Licensed under the [GNU Lesser General Public License V3](https://www.gnu.org/licenses/lgpl-3.0.en.html)
