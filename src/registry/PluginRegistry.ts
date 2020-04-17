import AbstractRegistry from "./AbstractRegistry";
import RegistryItemList from "./RegistryItemList";
import { IActionDef, IPlugin } from "./interfaces";

export default class PluginRegistry extends AbstractRegistry {

    protected itemList: RegistryItemList<IPlugin>;
    protected itemActionDefs: IActionDef[];


}
