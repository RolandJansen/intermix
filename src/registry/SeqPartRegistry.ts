import { bindActionCreators } from "redux";
import SeqPart from "../seqpart/SeqPart";
import { store } from "../store/store";
import AbstractRegistry from "./AbstractRegistry";
import RegistryItemList from "./RegistryItemList";

export default class SeqPartRegistry extends AbstractRegistry {

    protected itemList: RegistryItemList<SeqPart>;

    public constructor() {
        super();
        this.itemList = new RegistryItemList<SeqPart>();
    }

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

    public remove(itemId: string): void {
        const oldItem: SeqPart = this.itemList.getItem(itemId);

        // trigger the items unsubscribe method (decouple from dispatch)
        oldItem.unsubscribe();

        // remove from item list
        this.itemList.remove(itemId);
    }

}
