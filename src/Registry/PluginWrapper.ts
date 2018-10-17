import { ImxPlugin } from "../plugins/interfaces";

/**
 *
 */
export class PluginWrapper {

    private static addPluginId(plugin: ImxPlugin): ImxPlugin {
        const metaInfo = plugin.name + plugin.version + plugin.author;
        const id = btoa(metaInfo);
        plugin.uid = id;
        return plugin;
    }

    private static wrapActionCreators(plugin: ImxPlugin): ImxPlugin {

        return plugin;
    }

    constructor(private plugin: ImxPlugin) {

    }

}
