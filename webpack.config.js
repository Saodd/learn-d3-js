const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.ts',
  },
  target: ['web', 'es5'],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Project Template: React',
      template: './src/index.html',
      favicon: './src/favicon.ico',
      chunks: ['index'],
    }),
    new CopyPlugin({
      patterns: [{ from: 'static', to: '.' }],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        include: path.resolve('src'),
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { modules: true } },
          { loader: 'sass-loader' },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        include: path.resolve('src'),
        type: 'asset/resource',
        generator: {
          filename: '_asset/[hash][ext][query]',
        },
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        include: path.resolve('src'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/env', '@babel/preset-react', '@babel/preset-typescript'],
              cacheDirectory: true,
              plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    runtimeChunk: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          enforce: true,
          name: 'vendors',
        },
      },
    },
    minimizer: [`...`, new CssMinimizerPlugin()],
  },
  performance: {
    maxEntrypointSize: 1024 * 1024,
    maxAssetSize: 1021 * 1024,
  },
  externals: {},
};
