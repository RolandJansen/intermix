/* eslint-disable @typescript-eslint/no-var-requires */
const typescript = require("@wessberg/rollup-plugin-ts");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const terser = require("rollup-plugin-terser").terser;
const liveServer = require("rollup-plugin-live-server").liveServer;
const pkg = require("./package.json");

// es2015 modules are currently not possible
// should be changed with the next node lts version (>=13):
// import ts from "@wessberg/rollup-plugin-ts";
// import pkg from "./package.json";

/**
 * For details to the typescript plugin see
 * https://github.com/wessberg/rollup-plugin-ts
 * https://www.npmjs.com/package/@wessberg/rollup-plugin-ts
 */
const extensions = [".js", ".jsx", ".ts", ".tsx"];
const input = pkg.entry;
const output = [
    {
        file: "dist/cjs/" + pkg.name + ".cjs.js",
        format: "cjs",
        sourcemap: true,
    },
    {
        file: "dist/cjs/" + pkg.name + ".cjs.min.js",
        format: "cjs",
        sourcemap: true,
        plugins: [terser()],
    },
    {
        file: "dist/esm/" + pkg.name + ".esm.js",
        format: "es",
        sourcemap: true,
    },
    {
        file: "dist/esm/" + pkg.name + ".esm.min.js",
        format: "es",
        sourcemap: true,
        plugins: [terser()],
    },
];
const plugins = [resolve({ module: true, extensions }), commonjs(), typescript()];
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
const liveServerConfig = {
    port: 5000,
    open: false,
    logLevel: 2,
    root: "demo",
    file: "index.html",
    mount: [
        ["/demo", "./demo"],
        ["/dist", "./dist"],
        ["/node_modules", "./node_modules"],
    ],
};

const config = {
    input,
    output,
    external,
    plugins,
};

if (process.env.TARGET === "debug") {
    config.plugins = [...plugins, liveServer(liveServerConfig)];
    config.external = [];
}

module.exports = config;
