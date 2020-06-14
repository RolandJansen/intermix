import AbstractRegistry from "./AbstractRegistry";
import RegistryItemList from "./RegistryItemList";
import { IPlugin, IControllerPlugin, IAction } from "./interfaces";
import { store } from "../store/store";
import { bindActionCreators } from "redux";
import commonActionDefs from "./commonActionDefs";

/**
 * The registry for plugins of all kind.
 */
export default class PluginRegistry extends AbstractRegistry {
    public itemList: RegistryItemList<IPlugin>;

    public constructor(private ac: AudioContext) {
        super();
        this.itemList = new RegistryItemList<IPlugin>();
    }

    /**
     * Creates a new plugin from a given class, generates
     * action creators and returns the new plugin instance.
     * @param pluginClass The class from which the plugin will be derived
     */
    public add<P extends IPlugin>(pluginClass: new (itemId: string, ac: AudioContext) => P): P {
        const itemId = this.getUniqueItemKey();
        const newItem = new pluginClass(itemId, this.ac);
        this.itemList.add(newItem);

        // add commonActionDefs to the plugin if its an instrument
        if (newItem.metaData.type === "instrument") {
            newItem.actionDefs = [...newItem.actionDefs, ...commonActionDefs];
        }

        // build action creators
        const actionCreators = this.getActionCreators(newItem.actionDefs, itemId);
        newItem.unboundActionCreators = actionCreators;

        // bind action creators to dispatch
        newItem.actionCreators = bindActionCreators(actionCreators, store.dispatch);

        this.setupControllerPlugin(newItem);

        // plugins have audio outputs
        this.wireAudioOutputs(newItem);

        return newItem;
    }

    /**
     * Unsubscribe an item from the store and
     * remove it from its registry.
     * @param itemId The unique id of the item to be removed
     */
    public remove(itemId: string): void {
        const oldItem: IPlugin = this.itemList.getItem(itemId);

        // trigger the items unsubscribe method (decouple from dispatch)
        oldItem.unsubscribe();

        // remove from item list
        this.itemList.remove(itemId);
    }

    private setupControllerPlugin(newItem: IPlugin): void {
        if (this.isInstanceOfIControllerPlugin(newItem)) {
            // if the plugin is a controller, it needs a sendAction method
            this.bindSendActionMethod(newItem);
            // and it needs access to the global state
            this.mapStoreToPlugin(newItem);
        }
    }

    // type guard for IControllerPlugin
    private isInstanceOfIControllerPlugin(obj: any): obj is IControllerPlugin {
        return "sendAction" in obj;
    }

    /**
     * If the plugin is a controller, bind the sendAction method
     * to the dispatcher so it emmits actions when called.
     * @todo actions should be of type IOscAction
     */
    private bindSendActionMethod(newItem: IControllerPlugin): void {
        const actionRelay = this.getActionRelay();
        newItem.sendAction = (action: IAction): IAction => store.dispatch(actionRelay(action));
    }

    private mapStoreToPlugin(newItem: IControllerPlugin): void {
        newItem.getGlobalState = store.getState;
    }

    /**
     * Simply returns a data relay function:
     * It takes an action and returns it without any computation.
     *
     * This is for plugins of type IControllerPlugin to
     * fire actions without knowing anything about their consumers.
     * Will be wrapped in a dispatch and serves as a generic action creator.
     */
    private getActionRelay(): (action: IAction) => IAction {
        return (action: IAction): IAction => {
            return action;
        };
    }

    /**
     * There is no complex audio routing at the moment
     * so we just connect the 1st audio output of the
     * plugin with the audio destination.
     * @param pInstance The plugin to be wired
     */
    private wireAudioOutputs(pInstance: IPlugin): void {
        const outputs = pInstance.outputs;
        if (outputs.length !== 0) {
            outputs[0].connect(this.ac.destination);
        }
    }
}
