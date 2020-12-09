UglifyJsPlugin = require('uglifyjs-webpack-plugin');

var a = { 
            minimizer: [
                new UglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    uglifyOptions: {
                    compress: {
                        compress: false,
                        ecma: 6,
                        mangle: true,
                        warnings: false,
                        drop_console: true,//console
                        pure_funcs: ['console.log']//移除console
                    }
                    },
                    sourceMap: true,
                    parallel: true
                }),
            ]
        }