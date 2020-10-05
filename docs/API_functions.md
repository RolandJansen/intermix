
## Functions

### addPlugin

▸ **addPlugin**(`pluginClassName`: string): string

Tries to find a class (prototype) with the name of a given string (reflection),
then tries to cast it to a valid plugin class.
If both worked, a plugin instance will be created, registered etc.
and the item-id will be returned

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`pluginClassName` | string | The name of the class from which a plugin instance should be created  |

**Returns:** string

___

### addPluginClass

▸ **addPluginClass**(`PluginClass`: IPluginConstructor): void

#### Parameters:

Name | Type |
------ | ------ |
`PluginClass` | IPluginConstructor |

**Returns:** void

___

### addSeqPart

▸ **addSeqPart**(`lengthInStepsPerBar?`: undefined \| number): string

#### Parameters:

Name | Type |
------ | ------ |
`lengthInStepsPerBar?` | undefined \| number |

**Returns:** string

___

### connectPlugins

▸ **connectPlugins**(`connection`: [AudioEndpoint, AudioEndpoint]): void

Connects two audio endpoints and dispatches the new state.
If the id of the input plugin is not valid, it connects to the soundcard input.
If the id of the output plugin is not valid, it cancels the operation.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`connection` | [AudioEndpoint, AudioEndpoint] | Audio endpoints to be connected  |

**Returns:** void

___

### dispatch

▸ **dispatch**(`action`: Action): void

#### Parameters:

Name | Type |
------ | ------ |
`action` | Action |

**Returns:** void

___

### getActionCreators

▸ **getActionCreators**(`itemId`: string): ActionCreatorsMapObject

#### Parameters:

Name | Type |
------ | ------ |
`itemId` | string |

**Returns:** ActionCreatorsMapObject

___

### getAudioContext

▸ **getAudioContext**(): AudioContext

**Returns:** AudioContext

___

### getPluginClassNames

▸ **getPluginClassNames**(): string[]

**Returns:** string[]

___

### getState

▸ **getState**(): IState

**Returns:** IState

___

### getUnboundActionCreators

▸ **getUnboundActionCreators**(`itemId`: string): ActionCreatorsMapObject

#### Parameters:

Name | Type |
------ | ------ |
`itemId` | string |

**Returns:** ActionCreatorsMapObject

___

### removePlugin

▸ **removePlugin**(`itemId`: string): void

#### Parameters:

Name | Type |
------ | ------ |
`itemId` | string |

**Returns:** void

___

### removePluginClass

▸ **removePluginClass**(`className`: string): boolean

#### Parameters:

Name | Type |
------ | ------ |
`className` | string |

**Returns:** boolean

___

### removeSeqPart

▸ **removeSeqPart**(`itemId`: string): void

#### Parameters:

Name | Type |
------ | ------ |
`itemId` | string |

**Returns:** void

___

### resumeAudioContext

▸ **resumeAudioContext**(): void

**Returns:** void

## Object literals

### pluginClasses

▪ `Const` **pluginClasses**: object

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`Delay` | IPluginConstructor | IPluginConstructor |
`Sampler` | IPluginConstructor | IPluginConstructor |
`Sequencer` | IPluginConstructor | IPluginConstructor |
`Synth` | IPluginConstructor | IPluginConstructor |
