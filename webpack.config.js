const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DtsBundleWebpack = require('dts-bundle-webpack');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: {
        intermix: './src/index.ts',
        // demo: './src/demo/demo.ts'
    },
    output: {
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',  // for vs debugger
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        globalObject: 'this'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: 'worker-loader'
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /(node-modules|bower_components)/
            }
        ]
    },
    devtool: 'cheap-module-source-map',  // eval based sm doesn't work with vs debugger
    plugins: [
        new DtsBundleWebpack({
            // see dts-bundle-webpack npm page for options
            name: 'Intermix',
            main: './src/index.ts',
            out: '../dist/intermix.d.ts',
            removeSource: true,
            outputAsModuleFolder: true
        }),  // bundle type files
        new webpack.NamedModulesPlugin(),  // clean build logs
        new HtmlWebpackPlugin({
            template: './src/demo/SequencerDemo.html'
        }),  // use a html template for the demo
        new webpack.HotModuleReplacementPlugin()  // use hot resync
    ],
    devServer: {
        contentBase: path.resolve(__dirname, './dist'),
        hot: true
    }
};
