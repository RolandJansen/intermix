module.exports = {
    exportTrailingSlash: true,
    exportPathMap: function () {
        return {
            '/': { page: '/' }
        };
    },
    assetPrefix: process.env.NODE_ENV === 'production' ? '/intermix.js' : ''
};