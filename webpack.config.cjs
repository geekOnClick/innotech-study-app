const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const usePolling = process.env.WEBPACK_USE_POLLING === 'true';

module.exports = {
  entry: './src/main.tsx',
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.app.json',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  watchOptions: usePolling
    ? {
        poll: 500,
        ignored: /node_modules/,
      }
    : undefined,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
      watch: false,
    },
    port: 3000,
    open: false,
    hot: true,
    historyApiFallback: true,
  },
};
