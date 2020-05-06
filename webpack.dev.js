const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'cheap-module-source-map',  // eval based sm doesn't work with vs debugger
    devServer: {
        // contentBase: path.resolve(__dirname, './dist'),
        contentBase: common.output.path,
        open: 'chrome',
        hot: true
    }
});
