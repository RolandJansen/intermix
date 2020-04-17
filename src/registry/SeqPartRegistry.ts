import { bindActionCreators, ReducersMapObject } from "redux";
import SeqPart from "../seqpart/SeqPart";
import SeqPartActionDefs from "../seqpart/SeqPartActionDefs";
import { store } from "../store/store";
import AbstractRegistry from "./AbstractRegistry";
import { IState } from "./interfaces";
import RegistryItemList from "./RegistryItemList";

export default class SeqPartRegistry extends AbstractRegistry {

    protected itemList: RegistryItemList<SeqPart>;

    public constructor() {
        super();
        this.itemList = new RegistryItemList<SeqPart>();
    }

    public add(lengthInStepsPerBar?: number): string {
        // create the new part
        let newPart: SeqPart;
        if (lengthInStepsPerBar) {
            newPart = new SeqPart(lengthInStepsPerBar);
        } else {
            newPart = new SeqPart();
        }

        // add to partList
        const uid = this.itemList.add(newPart);

        // build action creators
        const actionCreators = this.getActionCreators(SeqPartActionDefs, uid);
        newPart.unboundActionCreators = actionCreators;

        // bind action creators to dispatch
        newPart.actionCreators = bindActionCreators(actionCreators, store.dispatch);

        // make it observe the store
        newPart.unsubscribe = this.observeStore(
            store,
            newPart,
        );

        return uid;
    }

    public remove(uid: string) {
        const oldPart: SeqPart = this.itemList.getItem(uid);

        // trigger the parts unsubscribe method (decouple from dispatch)
        oldPart.unsubscribe();

        // remove from partList
        this.itemList.remove(uid);
    }

    public getAllSubReducers(): ReducersMapObject {
        const subReducers: ReducersMapObject = {};
        const allSeqPartUids = this.itemList.getUidList();

        allSeqPartUids.forEach((uid: string) => {
            const initState: IState = this.getInitialState(SeqPartActionDefs, uid);
            subReducers[uid] = this.getSubReducer(SeqPartActionDefs, initState);
        });

        return subReducers;
    }

}
