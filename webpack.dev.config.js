var webpack = require('webpack');
var path = require('path');

module.exports = {
    debug: true,
    context: path.join(path.resolve(__dirname), '/lib'),
    entry: [
        'webpack-dev-server/client?http://0.0.0.0:8080', // WebpackDevServer host and port
        'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
        './main.jsx',
    ],

    output: {
        path: path.join(path.resolve(__dirname)),
        filename: "js/production.js",
    },

    module: {
        loaders: [
            { test: /\.jsx?$/, loaders: ['react-hot', 'babel?presets=es2015'], include: path.join(path.resolve(__dirname), '/lib')},
            { test: /\.json$/, loader: "json-loader"}
        ],
    },

    resolve: {
        extensions: ['', '.js', '.jsx', '.json'],
    },

    plugins: [
        // new webpack.NoErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin()
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     },
        //     mangle: {
        //         except: [
        //             'Array', 'BigInteger', 'Boolean', 'Buffer',
        //             'ECPair', 'Function', 'Number', 'Point'
        //         ]
        //     }
        // })
    ]
};
