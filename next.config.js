module.exports = {
    webpack: (config) => {
        config.module.rules.push(
            {
                test: /\.md$/,
                use: 'raw-loader'
            }
        )

        return config
    },
    exportTrailingSlash: true,
    exportPathMap: function () {
        return {
            '/': { page: '/' }
        };
    },
    assetPrefix: process.env.NODE_ENV === 'production' ? '/intermix.js' : ''

};