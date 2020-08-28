/* eslint-disable @typescript-eslint/no-var-requires */
const typescript = require("@wessberg/rollup-plugin-ts");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const liveServer = require("rollup-plugin-live-server");
const omt = require("@surma/rollup-plugin-off-main-thread");
const pkg = require("./package.json");

// es2015 modules are currently not possible
// should be changed with the next node lts version (>=13):
// import ts from "@wessberg/rollup-plugin-ts";
// import pkg from "./package.json";

/**
 * For details to the typescript plugin see
 * https://github.com/wessberg/rollup-plugin-ts
 * https://www.npmjs.com/package/@wessberg/rollup-plugin-ts
 *
 * For details to the worker loader see
 * https://github.com/darionco/rollup-plugin-web-worker-loader#readme
 * https://www.npmjs.com/package/rollup-plugin-web-worker-loader
 */
const extensions = [".js", ".jsx", ".ts", ".tsx"];
const input = pkg.entry;
const output = [
    {
        dir: "dist",
        name: pkg.name,
        format: "es",
        sourcemap: true,
    },
];
let plugins = [resolve({ extensions }), commonjs(), typescript(), omt()];
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
const liveServerConfig = {
    port: 5000,
    open: false,
    logLevel: 2,
    root: "src/demo",
    file: "index.html",
    mount: [["/dist", "./dist"]],
};

if (process.env.TARGET === "debug") {
    plugins = [...plugins, liveServer.liveServer(liveServerConfig)];
}

module.exports = {
    input,
    output,
    external,
    plugins,
};
