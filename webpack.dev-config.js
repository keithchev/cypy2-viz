
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const config = {

    entry: [
        './src/index.js'
    ],

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },{
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader' // why is this here?
                ]
            },{
                test: /\.png$/,
                use: ['file-loader']
            }
        ]
    },

    resolve: {
        extensions: ['*', '.js', '.jsx']
    },

    output: {
        path: path.resolve(__dirname, 'dev'),
        filename: 'bundle.js',
        publicPath: '/',
    },

    devServer: {
        contentBase: './static',
    },

    devtool: 'eval-source-map',

    plugins: [
        new MiniCssExtractPlugin({filename: 'bundle.css'}),
        new HtmlWebpackPlugin({template: './static/index.html'})
    ]

};

module.exports = config;
