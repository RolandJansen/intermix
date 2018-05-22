const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/main.ts',
    // Extract ts sourcemaps and write them into the final bundle.
    devtool: 'inline-source-map',
    module: {
        rules: [
            // {
            //     test: '/\.ts$/',
            //     // apply tslint loader as preLoader
            //     enforce: 'pre',
            //     loader: 'tslint-loader',
            //     options: { /* Loader options go here */ }
            // },
            {
                test: /\.tsx?$/,
                // ts-loader seems to be better integrated
                // with webpack then awesome-ts-loader
                use: 'ts-loader',
                exclude: '/node-modules/'
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
    }
};