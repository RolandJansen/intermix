# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.3.0] - 2016-05-27
### Fixed
- Minified build broken.
- Sound: Note values ignored in note events.

### Added
- EventBus class with relays for controllers, instruments and fx.
- Distribution Test Suite for testing packages previous to release.
- Stepsequencer Demo: adjustable note values for bass track
- CHANGELOG.md

## [0.2.0] - 2016-05-14
### Fixed
- SoundWave: audio buffer undefined while file is loading.

### Added
- SoundWave: multiple files/buffers can be loaded into one SoundWave object.
- Sequencer: sample-accurate pause/resume (experimental).
- SoundWave Demo App.
- Stepsequencer Demo: reset button.
- Project Description in README.md.

## 0.1.0 - 2016-04-08
### Added
- SoundWave class
- Sound class
- Sequencer class
- Part class
- core Module
- event Module
- main Module Entrypoint
- schedule-worker Module
- Sound Demo App
- Stepsequencer Demo App

[0.3.0]: https://github.com/RolandJansen/intermix.js/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/RolandJansen/intermix.js/compare/v0.1.0...v0.2.0
