import { getRandomString } from "../helper";

interface IRegistryItem {
    uid: string;
}

interface IRegistryItemLookup<itemType> {
    [hashValue: string]: itemType;
}

export default class RegistryItemList<T extends IRegistryItem> {

    private keyLength = 5;
    private itemLookupTable: IRegistryItemLookup<T> = {};

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

    public getItem(itemKey: string): T {
        if (this.itemLookupTable.hasOwnProperty(itemKey)) {
            return this.itemLookupTable[itemKey];
        }
        throw new Error(`No item with id ${itemKey} in stock.`);
    }

    public add(item: T) {
        let itemKey = getRandomString(this.keyLength);
        while (!this.isKeyUnique(itemKey)) {
            itemKey = getRandomString(this.keyLength);
        }
        item.uid = itemKey;
        this.itemLookupTable[itemKey] = item;
        return itemKey;
    }

    public remove(itemKey: string) {
        if (this.itemLookupTable.hasOwnProperty(itemKey)) {
            delete this.itemLookupTable[itemKey];
        } else {
            throw new Error(`Cannot remove item. No item with id ${itemKey} in stock.`);
        }

    }

    private isKeyUnique(itemKey: string): boolean {
        if (this.itemLookupTable.hasOwnProperty(itemKey)) {
            return false;
        }
        return true;
    }
}
