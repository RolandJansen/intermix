/* eslint-disable @typescript-eslint/no-var-requires */
const merge = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const common = require("./webpack.common.js");

/**
 * The production build doesn't need the demo stuff.
 * Instead we build a human-readable and a minified bundle
 * and source maps for these two.
 * Webpack minifies all bundles in production mode
 * with Terser. But to keep a non-minified build we
 * have to use the terser-plugin.
 */
module.exports = merge(common, {
    mode: "production",
    entry: {
        intermix: "./src/index.ts",
        "intermix.min": "./src/index.ts",
    },
    // devtool: "source-map",
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/,
                // sourceMap: true,
            }),
        ],
    },
});
