// import { getRandomString } from "../helper";
import { IRegistryItem } from "./interfaces";

interface IRegistryItemLookup<itemType> {
    [hashValue: string]: itemType;
}

export default class RegistryItemList<T extends IRegistryItem> {
    // private keyLength = 5;
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

    public add(item: T): string {
        // if (!this.isKeyUnique(item.uid)) {
        //     throw new Error(`Item-ID ${item.uid} is already in the list.`);
        // }

        this.itemLookupTable[item.uid] = item;
        return item.uid;
    }

    public remove(itemKey: string): void {
        if (this.itemLookupTable.hasOwnProperty(itemKey)) {
            delete this.itemLookupTable[itemKey];
        } else {
            throw new Error(`Cannot remove item. No item with id ${itemKey} in stock.`);
        }
    }

    // public getUniqueItemKey(): string {
    //     let itemKey = getRandomString(this.keyLength);
    //     while (!this.isKeyUnique(itemKey)) {
    //         itemKey = getRandomString(this.keyLength);
    //     }

    //     return itemKey;
    // }

    // private isKeyUnique(itemKey: string): boolean {
    //     if (this.itemLookupTable.hasOwnProperty(itemKey)) {
    //         return false;
    //     }
    //     return true;
    // }
}
