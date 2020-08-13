/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackExternalsPlugin = require("html-webpack-externals-plugin");
const DtsBundleWebpack = require("dts-bundle-webpack");
const webpack = require("webpack");

module.exports = {
    entry: {
        intermix: "./src/index.ts",
        demo: "./src/demo/demo.ts",
    },
    output: {
        devtoolModuleFilenameTemplate: "[absolute-resource-path]", // for vs debugger
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js",
        library: "[name]",
        libraryTarget: "umd",
        globalObject: "this",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
    },
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: {
                    loader: "worker-loader",
                    options: { inline: true },
                },
            },
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /(node-modules|bower_components)/,
            },
            {
                test: /\.(wav|mp3|ogg)$/,
                use: "file-loader",
            },
        ],
    },
    plugins: [
        new DtsBundleWebpack({
            // see dts-bundle-webpack npm page for options
            name: "intermix",
            main: "./src/index.d.ts",
            out: "../dist/intermix.d.ts",
            removeSource: true,
            outputAsModuleFolder: true,
        }), // bundle type files
        new webpack.NamedModulesPlugin(), // clean build logs
        new HtmlWebpackPlugin({
            template: "./src/demo/demo.html",
        }), // use a html template for the demo
        new HtmlWebpackExternalsPlugin({
            externals: [
                {
                    module: "Nexus",
                    entry: "https://cdn.jsdelivr.net/npm/nexusui@2.0.13/dist/NexusUI.min.js",
                    global: "Nexus",
                },
            ],
        }),
        new webpack.HotModuleReplacementPlugin(), // use hot resync
    ],
};
