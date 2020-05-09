import AbstractRegistry from "./AbstractRegistry";
import RegistryItemList from "./RegistryItemList";
import { IPlugin, IControllerPlugin, IAction } from "./interfaces";
import { store } from "../store/store";
import { bindActionCreators } from "redux";
import { commonActionDefs } from "./commonActionDefs";

export default class PluginRegistry extends AbstractRegistry {

    public itemList: RegistryItemList<IPlugin>;

    public constructor(private ac: AudioContext) {
        super();
        this.itemList = new RegistryItemList<IPlugin>();
    }

    public add<P extends IPlugin>(pluginClass: new (ac: AudioContext) => P): P {
        const newItem = new pluginClass(this.ac);

        // add to item list
        const itemId = this.itemList.add(newItem);

        // add commonActionDefs to the plugin if its an instrument
        if (newItem.metaData.type === "instrument") {
            newItem.actionDefs = [...newItem.actionDefs, ...commonActionDefs];
        }

        // build action creators
        const actionCreators = this.getActionCreators(newItem.actionDefs, itemId);
        newItem.unboundActionCreators = actionCreators;

        // bind action creators to dispatch
        newItem.actionCreators = bindActionCreators(actionCreators, store.dispatch);

        // if the plugin is a controller, it needs a sendAction method
        this.bindSendActionMethod(newItem);

        // plugins have audio outputs
        this.wireAudioOutputs(newItem);

        return newItem;
    }

    public remove(itemId: string): void {
        const oldItem: IPlugin = this.itemList.getItem(itemId);

        // trigger the items unsubscribe method (decouple from dispatch)
        oldItem.unsubscribe();

        // remove from item list
        this.itemList.remove(itemId);
    }

    /**
     * If the plugin is a controller, bind the sendAction method
     * to the dispatcher so it emmits actions when called.
     */
    private bindSendActionMethod(pInstance: IPlugin): void {
        if (this.isInstanceOfIControllerPlugin(pInstance)) {
            const actionRelay = this.getActionRelay();
            pInstance.sendAction = (action: IAction): IAction => store.dispatch(actionRelay(action));
        }
    }

    // type guard for IControllerPlugin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private isInstanceOfIControllerPlugin(obj: any): obj is IControllerPlugin {
        return "sendAction" in obj;
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
