---
id: "API messages"
---

## Type Definitions

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

| OSC Address  | Value Name | Type  | Range | Since | Comment |
| ---          | ---        | ---   | ---   | ---   | ---     |
| /remove      | -          | s     | none  | 0.5.0 | Deletes an item from the store (payload is the item ID) |


## Common Messages for Instruments

**Plugin Type:** Instrument

**Prefix:** /intermix/plugin/{UID}

| OSC Address  | Value Name | Type  | Range | Since | Comment |
| ---          | ---        | ---   | ---   | ---   | ---     |
| /note        | note       | siiff | none  | 0.5.0 | A note value with velocity |
| /volume      | volume     | sff   | none  | 0.5.0 | loudness of all plugin voices |

## Sequencer

**Plugin Type:** Controller

**Prefix:** /intermix/plugin/{UID}

| OSC Address     | Value Name       | Type | Range   | Since | Comment |
| ---             | ---              | ---  | ---     | ---   | ---     |
| /start          | running          | T    | none    | 0.5.0 | starts sequencing |
| /stop           | running          | F    | none    | 0.5.0 | stops sequencing |
| /pointer        | pointer          | i    | none    | 0.5.0 | jump to a specific step in the score |
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

**Prefix:** /intermix/seqpart/{UID}

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

**Prefix:** /intermix/plugin/{UID}

| OSC Address | Value Name | Type | Range | Since | Comment |
| ---         | ---        | ---  | ---   | ---   | ---     |
| /envAttack  | envAttack  | f    | [0;1] | 0.5.0 | Filter Envelope Attack |
| /envDecay   | envDecay   | f    | [0;1] | 0.5.0 | Filter Envelope Decay |

## Sampler

**Plugin Type:** Instrument

**Prefix:** /intermix/plugin/{UID}

| OSC Address | Value Name | Type | Range | Since | Comment |
| ---         | ---        | ---  | ---   | ---   | ---     |
| /stop       |
