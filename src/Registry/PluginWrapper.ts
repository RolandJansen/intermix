import { bindActionCreators } from "redux";
import { ImxPlugin } from "../plugins/interfaces";

/**
 *
 */
export class PluginWrapper {

    private static makePluginId(plugin: ImxPlugin): string {
        const metaInfo = plugin.name + plugin.version + plugin.author;
        return btoa(metaInfo);
    }

    private static wrapActionCreators(plugin: ImxPlugin): ImxPlugin {
        const boundActionCreators = bindActionCreators(plugin.actionCreators, dispatcher);
        return plugin;
    }

    public static getWrappedPlugin(plugin: ImxPlugin): ImxPlugin {

        const wrapped = class wPlugin extends plugin {
            contructor() {
                super()
            }
        }
    }

    constructor(private plugin: ImxPlugin) {

    }

}
