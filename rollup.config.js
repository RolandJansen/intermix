/* eslint-disable @typescript-eslint/no-var-requires */
const ts = require("@wessberg/rollup-plugin-ts");
const pkg = require("./package.json");

// es2015 modules are currently not possible
// should be changed with the next node lts version (>=13)
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

module.exports = {
    input: "src/index.ts",
    output: [
        {
            file: pkg.main,
            format: "es",
        },
    ],
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    plugins: [
        ts({
            /* plugin options */
        }),
    ],
};
