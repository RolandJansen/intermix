/* eslint-disable @typescript-eslint/no-var-requires */
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackExternalsPlugin = require("html-webpack-externals-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "development",
    entry: {
        intermix: "./src/index.ts",
        demo: "./src/demo/demo.ts",
    },
    devtool: "cheap-module-source-map", // eval based sm doesn't work with vs debugger
    devServer: {
        // contentBase: path.resolve(__dirname, './dist'),
        contentBase: common.output.path,
        open: "chrome",
        hot: true,
    },
    plugins: [
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
});
