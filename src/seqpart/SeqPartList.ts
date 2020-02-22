import { getRandomString } from "../helper";
import { IPartLookup } from "../registry/interfaces";
import SeqPart from "./SeqPart";

export default class PartList {

    private partLookupTable: IPartLookup = {};

    public get partList(): IPartLookup {
        return this.partLookupTable;
    }

    public getPart(key: string): SeqPart {
        if (this.partLookupTable.hasOwnProperty(key)) {
            return this.partLookupTable[key];
        }
        return new SeqPart();
    }

    public addToPartList(part: SeqPart) {
        let key = getRandomString(4);
        while (!this.isPartKeyUnique(key)) {
            key = getRandomString(4);
        }
        this.partLookupTable[key] = part;
        return key;
    }

    public removeFromPartList(partKey: string) {
        if (this.partLookupTable.hasOwnProperty(partKey)) {
            delete this.partLookupTable[partKey];
        }
    }

    private isPartKeyUnique(partKey: string): boolean {
        let key: string;
        for (key in this.partLookupTable) {
            if (key === partKey) {
                return false;
            }
        }
        return true;
    }
}
