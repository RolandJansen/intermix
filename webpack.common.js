/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const DtsBundleWebpack = require("dts-bundle-webpack");
const webpack = require("webpack");

module.exports = {
    // entry points which resolve to "[name]" are defined in the dev/prod files.
    output: {
        devtoolModuleFilenameTemplate: "[absolute-resource-path]", // for vs debugger
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js",
        library: "[name]",
        libraryTarget: "umd",
        umdNamedDefine: true,
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
            name: "intermix",
            main: "./build/index.d.ts",
            out: "../dist/intermix.d.ts",
            removeSource: true,
            outputAsModuleFolder: true,
        }), // bundle type files
        new webpack.NamedModulesPlugin(), // clean build logs
    ],
};
