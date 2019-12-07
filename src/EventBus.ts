import Helper from "./Helper";
import { IPlugin } from "./IEventBus";
import { IEventMessage, IIntermixEvent } from "./IHelper";
/**
 * This is an event bus that can be used to connect
 * intermix (and other) components.
 * It has the usual message events that you can
 * subscribe/unsubscribe to like in Backbone, jquery etc.
 * The more interesting part is a relay
 * system that can be used to share control data between
 * relay attendees.
 * An attendee has to add itself to a relay to become
 * an endpoint. Now, all other bus attendees can
 * read out its controllers and send/receive data to/from it.
 * The event bus has two buildin relays 'instrument' and 'fx',
 * others can be added.
 * Sounds complex? Here are some examples:
 * @example <caption>Registering to a relay<caption>
 * var myNewInstrument = function(eventBus) {
 *
 *   this.ctrlSpec = {
 *     'title': String,
 *     'volume': [0, 127],
 *     'pan': [-63, 64],
 *   };
 *
 *   this.uid = eventBus.addRelayEndpoint('instrument', ctrlSpec, this);
 *   ...
 * @example <caption>Sending data to the relay is easy</caption>
 *   ...
 *   eventBus.fireEvent({'volume': 23}, uid);
 *   ...
 * @example <caption>To receive events you have to implement 'handleRelayData'</caption>
 *   ...
 *   this.handleRelayData = function(data) {
 *     // do something with the data
 *   };
 * };
 * @constructor
 * @return {Void}
 */

interface IPluginDef {
  readonly uid: string;   // Unique id of this plugin instance
  name: string;           // Name of the plugin
  group: string;          // Plugin group that this plugin is connected to
  props: object[];        // "API" of the plugin (list of properties (like volume, cutoff, etc))
  msgTypes: string[];     // Message types that this plugin is allowed to send
  self: IPlugin;           // reference to the plugin itself (normally "this")
}

/**
 * Dictionary that holds logical groups of plugins
 * (instruments, fx, etc).
 */
interface IPluginGroups {
  [groupName: string]: IPluginDef[];
}

/**
 * A lookup table to find plugins from their uid.
 */
interface IPluginLookup {
  [uid: string]: IPluginDef;
}

export default class EventBus {

  /**
   * Plugin groups are logical groups of signal processors.
   * A synthesizer can be added to "instruments" while
   * a sequencer could be a member of "controllers".
   */
  private pluginGroups: IPluginGroups;

  /**
   * Dictionary with references to all endpoints in all relays.
   */
  private pluginLookup: IPluginLookup;

  /**
   * List of available event types.
   */
  private messageTypes: string[];

  private helper: Helper;

  constructor() {
    this.helper = new Helper();
    this.pluginLookup = {};
    this.pluginGroups = {
      controllers: [],
      instruments: [],
      fx: [],
      mixer: [],
    };
    this.messageTypes = [
      "onGroupAdd", "onGroupRemove",
      "onPluginAdd", "onPluginRemove",
    ];

  }

  /**
   * Send a message to the bus
   * @param  msgType  The message type
   * @param  data     A non specified message containing any kind of data
   */
  public sendMessage(uid: string, msgType: string, payload: IEventMessage, group?: string) {
    let verifiedMT = "";
    let evt: IIntermixEvent;

    this.messageTypes.forEach((element) => {
      if (element === msgType) {
        verifiedMT = msgType;
      }
    });

    if (verifiedMT.length !== 0) {
      evt = this.helper.getGenericEvent(uid, msgType, payload);
      if (group && this.pluginGroups.hasOwnProperty(group)) {
        return this.sendMessageToGroup(evt, group);
      }
      return this.sendMessageToAll(evt);
    }
    return false;
  }

  /**
   * Get a list with the names of all pluginGroups
   * @return {Array} List with relay names
   */
  public getPluginGroupNames(): string[] {
    const names = [];
    let name = "";
    for (name in this.pluginGroups) {
      if (this.pluginGroups.hasOwnProperty(name)) {
        names.push(name);
      }
    }
    return names;
  }

  /**
   * Adds another group to the plugin groups, eg. "3dprocessors" or sth.
   * @param group Name of the group that should be added
   */
  public addPluginGroup(group: string): boolean {
    if (!this.pluginGroups.hasOwnProperty(group)) {
      this.pluginGroups[group] = [];
      return true;
    }
    return false;
  }

  /**
   * Removes a plugin group. This just happens if the group
   * exists and doesn't have any members.
   * @param group Name of the group that should be removed
   */
  public removePluginGroup(group: string): boolean {
    if (this.pluginGroups.hasOwnProperty(group)) {
      for (const key in this.pluginGroups[group]) {
        if (this.pluginGroups[group].hasOwnProperty(key)) {
          return false;
        }
      }
      delete(this.pluginGroups[group]);
      return true;
    }
    return false;
  }

  /**
   * Adds an endpoint (sequencer, instrument, etc) to a
   * relay and returns a unique id that serves as a
   * key to identify this endpoint from now on.
   * @param  group   The plugin group to register to (like "instruments" or "fx")
   * @param  name    Name of the plugin
   * @param  plugin  Reference to the plugin object itself (this)
   * @return         A binary-like string ([0-f]*) that serves as a uid
   */
  public addPlugin(group: string, name: string, plugin: IPlugin) {
    let uid = this.getUID();
    let pluginDef: IPluginDef;

    // if uid already assigned: try another and check again
    while (this.pluginLookup.hasOwnProperty(uid)) {
      uid = this.getUID();
    }

    if (this.pluginGroups.hasOwnProperty(group) &&
    plugin.hasOwnProperty("onParamChange") &&
    plugin.hasOwnProperty("changeParam")) {
      pluginDef = {
        uid,
        name,
        props: [],
        msgTypes: [],
        group,
        self: plugin,
      };
      this.pluginGroups[group].push(pluginDef);
      this.pluginLookup[uid] = pluginDef;
      this.sendMessage("all", "onPluginAdd", { value: uid });
      return uid;
    }
  }

  /**
   * Deletes an endpoint (sequencer, instrument, etc) from a relay.
   * @param uid The plugins unique identifier
   */
  public removePlugin(uid: string) {
    if (this.pluginLookup.hasOwnProperty(uid)) {
      const pluginDef = this.pluginLookup[uid];
      const group = pluginDef.group;
      this.pluginGroups[group].forEach((element, index) => {
        if (element.uid === uid) {
          this.pluginGroups[group].splice(index, 1);
          this.pluginLookup.delete(uid);
        }
      });
      delete this.relays[relay][uid];
      delete this.lookup[uid];
    } else {
      throw new Error("uid not found in relay " + relay);
    }
  };

  private sendMessageToGroup(evt: IIntermixEvent, group: string): boolean {
    if (this.pluginGroups.hasOwnProperty(group)) {
      const listeners = this.pluginGroups[group];
      listeners.forEach((listener: IPluginDef) => {
        listener.self.onParamChange(evt);
      });
      return true;
    }
    return false;
  }

  private sendMessageToAll(evt: IIntermixEvent): boolean {
    let uid: string;
    for (uid in this.pluginLookup) {
      if (this.pluginLookup.hasOwnProperty(uid)) {
        this.pluginLookup[uid].self.onParamChange(evt);
      } else {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates 16 bytes random data represented as a string
   * @return Random, hex-like string
   */
  private getUID(): string {
    let uid = "";
    let i = 32;
    const cypher = ["0", "1", "2", "3", "4", "5", "6", "7", "8",
                  "9", "a", "b", "c", "d", "e", "f"];

    while (i--) {
      // tslint:disable-next-line:no-bitwise
      const index = Math.random() * 16 | 0;
      uid += cypher[index];
    }

    return uid;
  }
}

/**
 * Get an object of controller definitions of a specific relay endpoint.
 * @param  {String} uid Unique idenifier of the endpoint
 * @return {Object}     Controller definitions
 */
EventBus.prototype.getEndpointSpec = function(uid) {
  return this.lookup[uid].data;
};

/**
 * Get all endpoint specifications for a specific relay.
 * @param  {String} relay The relay of interest
 * @return {Object}       Dictionary of endpoint ids and controller definitions
 */
EventBus.prototype.getAllRelayEndpointSpecs = function(relay) {
  if (typeof this.relays[relay] !== "undefined") {
    var specs = {};
    for (var uid in this.relays[relay]) {
      specs[uid] = this.relays[relay][uid].data;
    }
    return specs;
  } else {
    throw new TypeError("Relay: " + relay + " not found");
  }
};

/**
 * Sends a message to all endpoints of a relay (e.g. all instruments)
 * @param  {String} relay Relay to send the message to
 * @param  {Object} msg   The message
 * @return {Void}
 */
EventBus.prototype.sendToRelay = function(relay, msg) {
  if (this.relays.hasOwnProperty(relay)) {
    for (var uid in this.relays[relay]) {
      this.sendToRelayEndpoint(uid, msg);
    }
  } else {
    throw new TypeError("Argument relay invalid or missing");
  }
};

/**
 * Sends a message to a specific endpoint of a relay.
 * @param  {String} uid Unique id of the relay endpoint
 * @param  {Object} msg The message
 * @return {Void}
 */
EventBus.prototype.sendToRelayEndpoint = function(uid, msg) {
  var endpoint = this.lookup[uid].context;
  endpoint.handleRelayData.call(endpoint, msg);
};


/**
 * Get a list with the names of all currently available message types
 * @return {Array} List with message types
 */
EventBus.prototype.getAllMessageTypes = function() {
  var types = [];
  for (var type in this.messages) {
    types.push(type);
  }
  return types;
};

/**
 * Subscribe to a message type
 * @param  {String}   msg     The message type to subscribe to
 * @param  {Function} fn      Callback function
 * @param  {Object}   context The subscriber context (this)
 * @return {Void}
 */
EventBus.prototype.subscribe = function(msg, fn, context) {
  if (typeof msg === "string" &&
  typeof fn === "function" &&
  typeof context !== "undefined") {
    if (typeof this.messages[msg] === "undefined") {
      this.messages[msg] = [];
    }
    this.messages[msg].push({ "context": context, "fn": fn });
  } else {
    throw new TypeError("One or more arguments of wrong type or missing");
  }
};

/**
 * Unsubscribe to a message type
 * @param  {String} msg     The message type to unsubscribe to
 * @param  {Object} context The (un)subscriber context (this)
 * @return {Void}
 */
EventBus.prototype.unsubscribe = function(msg, context) {
  if (typeof context !== "undefined") {
    var message = this.messages[msg];
    message.forEach(function(subscriber, index) {
      if (subscriber.context === context) {
        message.splice(index, 1);
      }
    });
  } else {
    throw new TypeError("context is undefined");
  }
};
