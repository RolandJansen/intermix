declare module "store/initialState" {
    export const initialState: {
        controllers: never[];
    };
}
declare module "store/reducers" {
    import { Action } from "redux";
    function reducer(state: {} | undefined, action: Action): {} | undefined;
    export default reducer;
}
declare module "main" {
    import { Store } from "redux";
    export class Intermix {
        private _store;
        private _audioContext;
        constructor();
        readonly audioContext: AudioContext;
        readonly store: Store;
    }
}
