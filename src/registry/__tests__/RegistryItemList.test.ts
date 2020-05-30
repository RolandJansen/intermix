import SeqPart from "../../seqpart/SeqPart";
import RegistryItemList from "../RegistryItemList";

describe("RegistryItemList", () => {
    let itemList: RegistryItemList<SeqPart>;
    let item1: SeqPart;
    let item2: SeqPart;
    let key1: string;
    let key2: string;

    beforeEach(() => {
        itemList = new RegistryItemList();
        item1 = new SeqPart();
        item2 = new SeqPart();
        key1 = itemList.add(item1);
        key2 = itemList.add(item2);
    });

    test("has a default keylength of 5", () => {
        expect(key1).toHaveLength(5);
    });

    test("exposes a list of all keys", () => {
        const keyList = itemList.getUidList();
        expect(keyList).toHaveLength(2);
        expect(keyList).toContain(key1);
        expect(keyList).toContain(key2);
    });

    test("getItem throws", () => {
        expect(itemList.getItem).toThrow();
    });

    test("getItem throws if key is not in store", () => {
        expect(() => {
            itemList.getItem("12345");
        }).toThrow();
    });

    test("getItem returns an item", () => {
        const itemRetrieved = itemList.getItem(key1);
        expect(itemRetrieved).toEqual(item1);
    });

    test("add creates and returns a unique key", () => {
        const item3 = new SeqPart();
        const key3 = itemList.add(item3);
        const keyList = itemList.getUidList();
        expect(keyList).toContain(key3);
    });

    test("add adds an item", () => {
        const item3 = new SeqPart();
        const key3 = itemList.add(item3);
        const newItemInStore = itemList.getItem(key3);
        expect(newItemInStore).toEqual(item3);
    });

    test("remove throws", () => {
        expect(itemList.remove).toThrow();
    });

    test("remove throws if key is not in store", () => {
        expect(() => {
            itemList.remove("12345");
        }).toThrow();
    });

    test("remove removes an item", () => {
        itemList.remove(key1);
        const keyList = itemList.getUidList();
        expect(keyList).toHaveLength(1);
        expect(keyList[0]).toMatch(key2);
    });
});
