export default abstract class AbstractRegistry {

    public abstract add(newItem: any): void;
    public abstract remove(itemId: string): void;

}
