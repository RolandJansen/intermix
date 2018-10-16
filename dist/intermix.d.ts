declare module "store/initialState" {
    export const initialState: {
        controllers: never[];
        instruments: never[];
        processors: never[];
    };
}
declare module "store/reducers" {
    import { Action } from "redux";
    function reducer(state: {} | undefined, action: Action): {};
    export default reducer;
}
declare module "main" {
    import { Store } from "redux";
    export default class Intermix {
        private _store;
        private _audioContext;
        constructor();
        readonly audioContext: AudioContext;
        readonly store: Store;
        getPluginInstanceRef(instanceId: number): boolean;
        loadPlugin(): boolean;
        removePlugin(): boolean;
        makePluginInstance(pluginId: number): boolean;
        private initDefaultPlugins();
    }
}
