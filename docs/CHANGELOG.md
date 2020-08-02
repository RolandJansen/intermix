# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.6.0] - 2020-08-03

### Added
- Plugin Preset Management: All properties defined in the plugins Action Definitions can be saved and restored.
- Action Definitions are added to the plugin state.
- Integration Test for common Action Definitions (action defs that all plugins have by default).

### Changed
- Plugin ID placeholder renamed from _{UID}_ to _\\&lt;UID&gt;_ since curly braces have a meaning in OSC semantics
- Sequencer Actions _pointer_ and _JUMP_TO_POSITION_ are now unified in a new _position_ action.

### Fixed
- [Webpage](https://rolandjansen.github.io/intermix/) - all known bugs fixes and framework (Docusaurus) upgraded.

## [0.5.0] - 2020-07-01

### Added
- New API based on OSC-like messages
- Redux middleware for parsing OSC-like messages
- Custom reducer composition
- Sequencer parts (SeqPart) state is managed in the Redux store
- Demo: HTML Stepsequencer based on NexusUI
- All instrument plugins have a volume action by default
- Abstract class for controller plugins
- Prettier
- ESLint (switched back)

### Changed
- License switched: Apache License v2.0 -> LGPL v3
- New release plan for shorter dev cycles
- Sequencer refactoring
- Score refactoring (new, memory efficient datastructure)
- SeqPart refactoring
- Runqueue completely rewritten (new datastructure and pointer management)
- New registry architecture (master-registry, item-registries)
- Redux store normalized

### Removed
- Bower support
- TSLint
- Old HTML Demos
- Old registry

## [0.4.0] - 2019-12-12

### Added
- Webpack
- Typescript
- TSLint
- Redux
- Github CI actions
- Benchmark tests
- Registry that generates Redux action-creators, state and reducers at runtime

### Changed
- Project Code migrated from Javascript (ES5) to Typescript
- Tests migrated from Jasmine to Jest
- Sequencer: New algorithm for frame animation that runs
  at least 6 times faster (@120bpm without stall/resume).
  In reality, speed improvement should be even higher.
- Sequencer: Minor speed optimizations.
- README.md improved.
- CHANGELOG.md improved.
- Refactoring of nearly everything

### Removed
- Old Dispatcher
- SoundWave class
- ESLint
- Travis CI jobs

## [0.3.0] - 2016-05-27
### Fixed
- Minified build broken.
- Sound: Note values ignored in note events.

### Added
- EventBus class with relays for controllers, instruments and fx.
- Distribution Test Suite for testing packages previous to release.
- Stepsequencer demo: adjustable note values for bass track
- CHANGELOG.md

## [0.2.0] - 2016-05-14
### Fixed
- SoundWave: audio buffer undefined while file is loading.

### Added
- SoundWave: multiple files/buffers can be loaded into one SoundWave object.
- Sequencer: sample-accurate pause/resume (experimental).
- SoundWave demo.
- Stepsequencer demo: reset button.
- Project Description in README.md.

## [0.1.0] - 2016-04-08
### Added
- SoundWave class
- Sound class
- Sequencer class
- Part class
- core module
- event module
- schedule-worker module
- main module (entrypoint)
- Sound demo
- Stepsequencer demo

[Unreleased]: https://github.com/RolandJansen/intermix.js/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/RolandJansen/intermix.js/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/RolandJansen/intermix.js/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/RolandJansen/intermix.js/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/RolandJansen/intermix.js/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/RolandJansen/intermix.js/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/RolandJansen/intermix.js/compare/ae47095652376e5c541b674bc064bddb64e7162b...5d4c9e61b8d74a285e1404588d50bed970e7713c
