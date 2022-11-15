const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      __NPM_VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
});
