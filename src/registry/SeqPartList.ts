import { getRandomString } from "../helper";
import SeqPart from "../seqpart/SeqPart";
import { IPartLookup } from "./interfaces";

export default class SeqPartList {

    private partLookupTable: IPartLookup = {};

    public getUidList(): string[] {
        const uidList: string[] = [];
        let uid: string;
        for (uid in this.partLookupTable) {
            if (this.partLookupTable.hasOwnProperty(uid)) {
                uidList.push(uid);
            }
        }
        return uidList;
    }

    public getPart(key: string): SeqPart {
        if (this.partLookupTable.hasOwnProperty(key)) {
            return this.partLookupTable[key];
        }
        return new SeqPart();
    }

    public add(part: SeqPart) {
        let key = getRandomString(4);
        while (!this.isPartKeyUnique(key)) {
            key = getRandomString(4);
        }
        part.uid = key;
        this.partLookupTable[key] = part;
        return key;
    }

    public remove(partKey: string) {
        if (this.partLookupTable.hasOwnProperty(partKey)) {
            delete this.partLookupTable[partKey];
        }
    }

    private isPartKeyUnique(partKey: string): boolean {
        if (this.partLookupTable.hasOwnProperty(partKey)) {
            return false;
        }
        return true;
    }
}
