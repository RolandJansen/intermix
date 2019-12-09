# Intermix

![](https://github.com/RolandJansen/intermix.js/workflows/build\/test/badge.svg)
[![Code Climate](https://codeclimate.com/github/RolandJansen/intermix.js/badges/gpa.svg)](https://codeclimate.com/github/RolandJansen/intermix.js)
[![Test Coverage](https://codeclimate.com/github/RolandJansen/intermix.js/badges/coverage.svg)](https://codeclimate.com/github/RolandJansen/intermix.js/coverage)

Intermix is a library that can be used to create browser-based music applications with a focus on sequencing. The main advantage is the plugin system that makes it easy to build and use audio plugins that run on every app that uses Intermix.

With [Redux](https://redux.js.org/) as its foundation, Intermix has an event router with predictable state. When plugins are added or removed, state and reducers will change accordingly at runtime.

Intermix comes with a sequencer with rock solid timing and simple synth- and sampler-plugins.

## Warning

This software is in a very early stage and the API is under constant development. The current release (0.4.0) is just a milestone and not ment to be used in other projects.

## Dependencies

* [Redux](https://redux.js.org/)

## Browser Compatibility
| Chrome | Firefox | Edge     | Internet Explorer | Opera    | Safari   |
|--------|---------|----------|-------------------|----------|----------|
| 49+    | 46+ (*) | untested | untested          | untested | untested |

\* Sample accurate pause/resume of sounds not supported.

## License
Copyright (C) 2019 Roland Jansen

Licensed under the [Apache Public License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
