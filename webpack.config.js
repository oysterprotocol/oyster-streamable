const
  UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
  BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  entry: './build/index.js',
  resolve: {
    modules: ['node_modules']
  },
  output: {
    filename: 'oyster-streamable.min.js',
    path: __dirname + '/dist',
    libraryTarget: 'umd',
    library: 'Oyster'
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin()
    ]
  },
  plugins:
    [ ...(process.env.NODE_ENV == "development"
      // development plugins
      ? [new BundleAnalyzerPlugin()]
      // production plugins
      : []),
      // plugins for both
      
    ]
}