define("store/initialState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initialState = {
        controllers: [],
        instruments: [],
        processors: [],
    };
});
define("store/reducers", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function reducer(state = {}, action) {
        switch (action.type) {
            case "fantasyAction":
                return Object.assign({}, state);
        }
    }
    exports.default = reducer;
});
define("main", ["require", "exports", "redux", "store/initialState", "store/reducers"], function (require, exports, redux_1, initialState_1, reducers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Intermix {
        constructor() {
            this._audioContext = new AudioContext();
            this._store = redux_1.createStore(reducers_1.default, initialState_1.initialState);
        }
        get audioContext() {
            return this._audioContext;
        }
        get store() {
            return this._store;
        }
        getPluginInstanceRef(instanceId) {
            return true;
        }
        loadPlugin() {
            return true;
        }
        removePlugin() {
            return true;
        }
        makePluginInstance(pluginId) {
            return true;
        }
    }
    exports.default = Intermix;
});
//# sourceMappingURL=intermix.js.map