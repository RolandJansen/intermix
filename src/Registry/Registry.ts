import BasicSynth from "../plugins/BasicSynth";

/**
 * Plugin registry
 */
export default class Registry {

    private _pluginStore = {
        controllers: [],
        instruments: [],
        processors: [],
    };

    public get pluginStore() {
        return this._pluginStore;
    }

    public addController(ctrlPlugin) {
        //plugin in pstore einfügen mit eindeutiger id,
    }

    private addDefaultPlugins(): boolean {
        return true;
    }
}
