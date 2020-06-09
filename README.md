# Intermix

![](https://github.com/RolandJansen/intermix.js/workflows/build\/test/badge.svg)
[![Code Climate](https://codeclimate.com/github/RolandJansen/intermix.js/badges/gpa.svg)](https://codeclimate.com/github/RolandJansen/intermix.js)
[![Test Coverage](https://codeclimate.com/github/RolandJansen/intermix.js/badges/coverage.svg)](https://codeclimate.com/github/RolandJansen/intermix.js/coverage)

## Warning

This software is in an early stage and the API is still under development. The current release (0.5.0) is just a milestone and not ment to be used in production environments. External plugin support will be added in v0.6.0.

---

Intermix is a library that can be used to create browser-based audio applications with a different approach than most other audio libraries. Its focus is not on high level abstractions of the Web Audio API. Instead it provides an architecture for plugins that can be used in any context that uses intermix.

With [Redux](https://redux.js.org/) as its foundation, intermix is also a predictable state container: No side effects, nothing unexpected - actions performed in Intermix are completely predictable.

Most of the API is message based. Intermix messages are an amalgam of [OSC](https://en.wikipedia.org/wiki/Open_Sound_Control) messages and Redux actions:

```
{
    address: "/intermix/plugin/h3LXf/envAttack",
    type: "envAttack",
    typeTag: ",sff",
    value: ["Envelope Attack", 0.42, 5.23],
}
```

The action above is of type "envAttack". It would be send to a plugin with the ID "h3LXf". The attack value is 0.42 and it will be executed by the plugin at second 5.23.

The _typeTag_ says that the value is a tuple of type `[string, float, float]`. Controller actions normally start with a string that holds a name followed by the actual value and the time in seconds when the action should be executed. The execution time is vital in a browser because there's no _realtime_ like in an os-native app. Executing actions in the sequencer means to send them to be executed in the near future.

For an app developer there's no need to build these actions manually as intermix provides action creators for all managed plugins. These functions create and dispatch actions for you.

A plugin developer can write action definitions that are consumed by intermix to build the internal logic at runtime:

```
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

## Browser Compatibility
| Chrome | Firefox | Edge     | Internet Explorer | Opera    | Safari   |
|--------|---------|----------|-------------------|----------|----------|
| 49+    | 46+ (*) | untested | untested          | untested | untested |

\* Sample accurate pause/resume of sounds not supported.

## License
Licensed under the [Apache Public License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
