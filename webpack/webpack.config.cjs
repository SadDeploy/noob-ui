// Libraries
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const globImporter = require('node-sass-glob-importer');
const utils = require('./utils');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const SVGSpriteMapPlugin = require("svg-spritemap-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const WebpackNotifierPlugin = require("webpack-notifier");
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const glob = require("glob");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const PATHS = {
	src: path.join(__dirname, '../src')
};

// Configuration
module.exports = (env, argv) => {
    return {
        entry: './app.js',
        devtool: (argv.mode === 'development') ? 'source-map' : false,
        context: path.resolve(__dirname, '../src'),
        devServer: {
            static: {
                directory: path.resolve(__dirname, '../src'),
            },
            open: ['/index'],
            compress: true,
        },
        output: {
            path: path.resolve(__dirname, '../dist'),
            publicPath: '',
            filename: 'assets/[name].js'
        },
        resolve: {
            modules: [path.resolve(__dirname, '../src'), 'node_modules'],
            extensions: ['.js', '.css', '.scss'],
            alias: {
                Images: path.resolve(__dirname, '../src/assets/images'), // Relative path of images
                Styles: path.resolve(__dirname, '../src/assets/styles'), // Relative path of styles
                Scripts: path.resolve(__dirname, '../src/assets/scripts'), // Relative path of scripts
            }
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        module: {
            rules: [
                {
                    mimetype: 'application/json',
                    type: 'json',
                },
                {
                    test: /\.js$/,
                    exclude: [/node_modules/],
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {presets: ['@babel/preset-env']}
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        argv.mode === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                sourceMap: true
                            },
                        },
                    ],
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                        },
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    importer: globImporter()
                                },
                                webpackImporter: true
                            }
                        }
                    ]
                },
                {
                    test: /\.pug$/,
                    use: [
                        'pug-loader',
                        {
                            loader: 'pug-html-loader',
                            options: {
                                data: {
                                    menu: require('../src/views/data/menu.json'),
                                    index: require('../src/views/data/index.json'),
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
                    use: [
                        'url-loader',
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 3000,
                                name: 'assets/images/[name].[hash:7].[ext]'
                            }
                        }
                    ]
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                    loader: 'url-loader',
                    options: {
                        limit: 5000,
                        name: 'assets/fonts/[name].[hash:7].[ext]'
                    }
                },
                {
                    test: /\.(mp4)(\?.*)?$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: 'assets/videos/[name].[hash:7].[ext]'
                    }
                }
            ],
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                }),
                new ImageMinimizerPlugin({
                    minimizer: {
                        implementation: ImageMinimizerPlugin.imageminMinify,
                        options: {
                            // Lossless optimization with custom option
                            // Feel free to experiment with options for better result for you
                            plugins: [
                                ["gifsicle", { interlaced: true }],
                                ["jpegtran", { progressive: true }],
                                ["optipng", { optimizationLevel: 5 }],
                                // Svgo configuration here https://github.com/svg/svgo#configuration
                                [
                                    "svgo",
                                    {
                                        plugins: [
                                            {
                                                name: "preset-default",
                                                params: {
                                                    overrides: {
                                                        removeViewBox: false,
                                                        addAttributesToSVGElement: {
                                                            params: {
                                                                attributes: [
                                                                    { xmlns: "http://www.w3.org/2000/svg" },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            ],
                        },
                    },
                }),
            ],
            splitChunks: {
                cacheGroups: {
                    default: false,
                    vendors: false,
                    // vendor chunk
                    vendor: {
                        filename: 'assets/vendor.js',
                        // sync + async chunks
                        chunks: 'all',
                        // import file path containing node_modules
                        test: /node_modules/
                    },
                    styles: {
                        name: 'styles',
                        test: /\.css$/,
                        chunks: 'all',
                        enforce: true
                    }
                }
            }
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {from: 'assets/images/favicons/favicon.ico', to: 'assets/favicon.ico'},
                    {from: 'assets/images', to: 'assets/images'},
                    {from: 'assets/fonts', to: 'assets/fonts'},
                ]
            }),

            new SVGSpriteMapPlugin('src/sprites/**/*.svg', {
                styles: path.join(__dirname, '../src/assets/styles/_sprites.scss'),
                output: {
                    filename: 'assets/sprite.svg'
                }
            }),

            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: 'vendors.css',
            }),

            ...utils.pages(argv.mode),

            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.$': 'jquery',
                'window.jQuery': 'jquery'
            }),

            new PurgeCSSPlugin({
                paths: glob.sync(`${PATHS.src}/**/*`, {nodir: true}),
                only: ['app'],
                safelist: [/select2/, /my-mfp/, /swiper/], // add plugin's classes to exclude from purge
            }),

            new WebpackNotifierPlugin({
                title: 'Noob__ui',
                contentImage: path.join(__dirname, '../src/assets/images/logo.png'),
            }),
        ]
    };
};
