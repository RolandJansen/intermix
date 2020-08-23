/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const typescript = require("@wessberg/rollup-plugin-ts");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
// const typescript = require("rollup-plugin-typescript2");
// const workerLoader = require("rollup-plugin-web-worker-loader");
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

// todo:
// add common.js and node-resolve plugins to resolve
// dependencies better

const extensions = [".js", ".jsx", ".ts", ".tsx"];

module.exports = {
    // input: path.resolve(__dirname, pkg.entry),
    input: pkg.entry,
    output: [
        {
            // file: path.resolve(__dirname, pkg.module),
            dir: "dist",
            format: "es",
            sourcemap: true,
        },
    ],
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    // eslint-disable-next-line prettier/prettier
    plugins: [
        resolve({ extensions }),
        commonjs(),
        // workerLoader({ extensions }),
        typescript({
            hook: {
                declarationStats: (declarationStats) => console.log(declarationStats),
            },
        }),
        omt(),
        // workerLoader({
        //     // input: path.resolve(__dirname, pkg.entry),
        //     extensions,
        // }),
    ],
};
