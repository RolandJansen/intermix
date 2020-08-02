Type can be one of the following:

Basic Types:

| Type Tag | Type    | Javascript Type |
| ---      | ---     | ---             |
| i        | Integer | number          |
| f        | Float   | number          |
| s        | String  | string          |
| b        | Blob    | ArrayBuffer     |

Additional Types

| Type Tag | Type      | Javascript Type |
| ---      | ---       | ---             |
| t        | timetag   | number          |
| T        | True      | 1 (number)      |
| F        | False     | 0 (number)      |
| N        | Nil       | -               |
| P        | Procedure | function        |

## System

**Prefix:** /intermix/system

Messages that get processed by the intermix core. They're normally just used intermally so app/plugin developers don't have to deal with them.

| OSC Address   | Value Name   | Type | Range | Since | Comment |
| ---           | ---          | ---  | ---   | ---   | ---     |
| /addPlugin    | addPlugin    | s    | none  | 0.5.0 | Adds a plugin-reference to the store. Payload is the item ID. |
| /removePlugin | removePlugin | s    | none  | 0.5.0 | Removes a plugin-reference from the store. Payload is the item ID. |
| /addPart      | addPart      | s    | none  | 0.5.0 | Adds a part-reference to the store. Payload is the item ID. |
| /removePart   | removePart   | s    | none  | 0.5.0 | Removes a part-reference to the store. Payload is the item ID. |

## Common Messages for Instruments

**Plugin Type:** Instrument

**Prefix:** /intermix/plugin/<UID>

Common tasks. Every instrument plugin will have these messages attached when added to the registry.

| OSC Address  | Value Name | Type  | Range | Since | Comment |
| ---          | ---        | ---   | ---   | ---   | ---     |
| /note        | note       | siiff | none  | 0.5.0 | name, note-value, velocity, duration, starttime |
| /volume      | volume     | sff   | none  | 0.5.0 | name, loudness-value, starttime |
| /savePreset  | savePreset | s     | none  | 0.6.0 | saves all properties defined in 'actionDefs' to a preset |
| /loadPreset  | loadPreset | s     | none  | 0.6.0 | loads a preset and changes plugin settings accordingly |
| /presetSlotNumber | presetSlotNumber | i | none | 0.6.0 | sets the preset slot that presets can be loaded from or saved to |
| /presetSlotName | presetSlotName | s | none | 0.6.0 | sets the name of a preset to the current slot |

## Sequencer

**Plugin Type:** Controller

**Prefix:** /intermix/plugin/<UID>

| OSC Address     | Value Name       | Type | Range   | Since | Comment |
| ---             | ---              | ---  | ---     | ---   | ---     |
| /start          | running          | T    | none    | 0.5.0 | starts sequencing |
| /stop           | running          | F    | none    | 0.5.0 | stops sequencing |
| /position       | position         | i    | none    | 0.6.0 | jump to a specific step in the score |
| /reset          | running, pointer | N    | none    | 0.5.0 | stops sequencing and sets the score pointer to 0 |
| /bpm            | bpm              | f    | [0;240] | 0.5.0 | sets tempo in BeatsPerMinute |
| /loopStart      | loopStart        | i    | none    | 0.5.0 | sets the loop startpoint in steps |
| /loopEnd        | loopEnd          | i    | none    | 0.5.0 | sets the loop endpoint in steps |
| /loopActivate   | loopActive       | T    | none    | 0.5.0 | sets the loop active |
| /loopInactivate | loopActive       | F    | none    | 0.5.0 | sets the loop inactive |
| /activeStep     | activeStep  | i    | none    | 0.5.0 | Chooses the step where the next operation will take place |
| /addPart        | addedPart        | s    | none    | 0.5.0 | Adds a part reference to the active step |
| /removePart     | removedPart      | s    | none    | 0.5.0 | Removes a part reference from the active step |

## SeqPart

SeqParts are not plugins but behave similarly.

**Prefix:** /intermix/seqpart/<UID>

| OSC Address   | Value Name  | Type       | Range   | Since | Comment |
| ---           | ---         | ---        | ---     | ---   | ---     |
| /activateStep | activeStep  | i          | none    | 0.5.0 | Chooses the step where the next operation will take place |
| /addNote      | note        | Note       | none    | 0.5.0 | Adds a note to the pattern |
| /addCtrl      | addedCtrl   | Controller | none    | 0.5.0 | Adds a controller to the pattern |
| /removeNote   | removedNote | Note       | none    | 0.5.0 | Removes a note from the pattern |
| /removeCtrl   | removedCtrl | Controller | none    | 0.5.0 | Removes a controller from the pattern |

You can bundle _/activateStep_ with any of the other actions.

## Synth

**Plugin Type:** Instrument

**Prefix:** /intermix/plugin/<UID>

| OSC Address | Value Name | Type | Range | Since | Comment |
| ---         | ---        | ---  | ---   | ---   | ---     |
| /envAttack  | envAttack  | f    | [0;1] | 0.5.0 | Filter Envelope Attack |
| /envDecay   | envDecay   | f    | [0;1] | 0.5.0 | Filter Envelope Decay |

## Sampler

**Plugin Type:** Instrument

**Prefix:** /intermix/plugin/<UID>

| OSC Address | Value Name | Type | Range | Since | Comment |
| ---         | ---        | ---  | ---   | ---   | ---     |
| /stop       |
