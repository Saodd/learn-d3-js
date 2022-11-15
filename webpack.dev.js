const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const config = require('./package.json');
const webpack = require('webpack');

const now = new Date();
config.version = `0.${(now.getMonth() + 1) * 100 + now.getDate()}.${now.getHours() * 100 + now.getMinutes()}`;

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      __NPM_VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    client: {
      webSocketURL: 'ws://localhost:8080/ws',
    },
    historyApiFallback: {
      disableDotRule: true,
    },
    allowedHosts: 'all',
    hot: false,
    liveReload: true,
  },
});
