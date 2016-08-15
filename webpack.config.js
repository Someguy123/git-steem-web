var webpack = require('webpack');
var path = require('path');

module.exports = {
    debug: false,
    context: path.join(path.resolve(__dirname), '/lib'),
    entry: [
        './main.jsx',
    ],

    output: {
        path: path.join(path.resolve(__dirname), 'js/'),
        filename: "production.js",
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
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle: {
                except: [
                    'Array', 'BigInteger', 'Boolean', 'Buffer',
                    'ECPair', 'Function', 'Number', 'Point'
                ]
            }
        })
    ]
};
