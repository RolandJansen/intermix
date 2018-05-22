const path = require('path');
const webpack = require('webpack');
const DtsBundleWebpackWrapper = require('dts-bundle-webpack-wrapper');

module.exports = {
    mode: 'development',
    entry: './src/main.ts',
    // Extract ts sourcemaps and write them into the final bundle.
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                // apply tslint loader as preLoader
                test: /\.ts$/,
                enforce: 'pre',
                loader: 'tslint-loader',
                options: { /* Loader options go here */ }
            },
            {
                // ts-loader seems to be better integrated
                // with webpack then awesome-ts-loader
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: '/node-modules/'
            },
            {
                // just to prevent .d.ts files to be included
                // in the library (probably not needed)
                test: /^\.d.ts$/,
                use: 'ignore-loader'
            }
        ]
    },
    // Add '.ts' and '.tsx' as resolvable extensions.
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    // Write everything to ./dist/intermix.js
    output: {
        filename: 'intermix.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        // To prevent infinity loop in webpack watch
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/
        ]),
        // DtsBundlePlugin                              
        new DtsBundleWebpackWrapper({
            typingsDirName: 'dts'  //same as declarationDir in tsconfig
        })
    ]
};