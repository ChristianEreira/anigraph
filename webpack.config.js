const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'index': './src/index.js',
    'signed-in': '/src/signed-in.js',
    'edit': '/src/edit.js',
    'view': '/src/view.js'},
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  watch: true,
  devtool: false,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  }
};