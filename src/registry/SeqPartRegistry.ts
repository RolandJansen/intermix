import { bindActionCreators } from "redux";
import SeqPart from "../seqpart/SeqPart";
import { store } from "../store/store";
import AbstractRegistry from "./AbstractRegistry";
import RegistryItemList from "./RegistryItemList";

/**
 * The registry for sequencer parts.
 */
export default class SeqPartRegistry extends AbstractRegistry {
    public itemList: RegistryItemList<SeqPart>;

    public constructor() {
        super();
        this.itemList = new RegistryItemList<SeqPart>();
    }

    /**
     * Creates a new sequencer part, generates action creators
     * and returns the new seqPart instance.
     * @param lengthInStepsPerBar length of the sequencer part (optional)
     */
    public add(lengthInStepsPerBar?: number): SeqPart {
        // create the new part
        let newPart: SeqPart;
        if (lengthInStepsPerBar) {
            newPart = new SeqPart(lengthInStepsPerBar);
        } else {
            newPart = new SeqPart();
        }

        // add to item list
        const itemId = this.itemList.add(newPart);

        // build action creators
        const actionCreators = this.getActionCreators(newPart.actionDefs, itemId);
        newPart.unboundActionCreators = actionCreators;

        // bind action creators to dispatch
        newPart.actionCreators = bindActionCreators(actionCreators, store.dispatch);

        return newPart;
    }

    /**
     * Unsubscribe an item from the store and
     * remove it from its registry.
     * @param itemId The unique id of the item to be removed
     */
    public remove(itemId: string): void {
        const oldItem: SeqPart = this.itemList.getItem(itemId);

        // trigger the items unsubscribe method (decouple from dispatch)
        oldItem.unsubscribe();

        // remove from item list
        this.itemList.remove(itemId);
    }
}
