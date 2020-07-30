import { IRegistryItem } from "./interfaces";

interface IRegistryItemLookup<itemType> {
    [hashValue: string]: itemType;
}

export default class RegistryItemList<T extends IRegistryItem> {
    private itemLookupTable: IRegistryItemLookup<T> = {};

    public get length(): number {
        return Object.keys(this.itemLookupTable).length;
    }

    public getUidList(): string[] {
        const uidList: string[] = [];
        let uid: string;
        for (uid in this.itemLookupTable) {
            if (this.itemLookupTable.hasOwnProperty(uid)) {
                uidList.push(uid);
            }
        }
        return uidList;
    }

    public getItem(itemKey: string): T | undefined {
        if (this.itemLookupTable.hasOwnProperty(itemKey)) {
            return this.itemLookupTable[itemKey];
        }
        return undefined;
    }

    public add(item: T): string {
        this.itemLookupTable[item.uid] = item;
        return item.uid;
    }

    public remove(itemKey: string): void {
        if (this.itemLookupTable.hasOwnProperty(itemKey)) {
            delete this.itemLookupTable[itemKey];
        }
    }
}
