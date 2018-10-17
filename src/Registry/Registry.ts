import { ImxPlugin } from "../plugins/interfaces";

/**
 * Plugin registry
 *
 * static plugins bekommen vom wrapper eine eindeutige kennung:
 * name+version+author => base64
 * instanzen werden nur hochgezählt, dabei die ID im store via
 * action hinterlegen.
 *
 */
export default class Registry {

    private pluginStore: ImxPlugin[] = [];

    public addPlugin(plugin: ImxPlugin): boolean {
        if (plugin.name !== "" && plugin.version !== "" && plugin.author !== "") {
            const meta: string = plugin.name + plugin.version + plugin.author;
            this.pluginStore.forEach((p) => {
                const pMeta = p.name + p.version + p.author;
                if (meta === pMeta) {
                    return false;
                }
            });
        }
        this.pluginStore.push(plugin);
        return true;
    }

    public removePlugin(pName: string, pVersion: string): boolean {
        this.pluginStore.forEach((p, index) => {
            if (p.name === pName && p.version === pVersion) {
                this.pluginStore.splice(index, 1);
                return true;
            }
        });
        return false;
    }

}
