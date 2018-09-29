const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

const deepClone = a => {
  if (!a) return a;

  const b = new a.constructor();
  for (let key in a) {
    const val = a[key];
    b[key] = typeof val === "object" ? deepClone(val) : val;
  }
  return b;
};

const config = Object.freeze({
  entry: "./src/index.js",
  resolve: {
    modules: ["node_modules"]
  },
  output: {
    filename: "oyster-streamable.js",
    path: __dirname + "/dist",
    libraryTarget: "umd",
    library: "Oyster",
    globalObject: "typeof self !== 'undefined' ? self : this"
  },
  optimization: {
    minimizer: []
  },
  module: {
    rules: [
      {
        test: /src\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["env"]
          }
        }
      }
    ]
  },
  plugins: [
    ...(process.env.NODE_ENV == "development"
      ? // development plugins
        [new BundleAnalyzerPlugin()]
      : // production plugins
        [])
    // plugins for both
  ]
});

minifiedConfig = (config => {
  config.output.filename = "oyster-streamable.min.js";

  config.optimization = {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true
      })
    ]
  };

  return config;
})(deepClone(config));

module.exports = [config, minifiedConfig];
