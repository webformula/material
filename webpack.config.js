import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';


export default {
  entry: {
    docs: './docs/app.js',
    components: './src/index.js'
  },
  output: {
    filename: process.env.WEBPACK_SERVE ? '[name].js' : '[name].[contenthash].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './docs/index.html',
      chunks: ['docs']
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/theme.css', to: '' },
        { from: 'docs/favicon.ico', to: '' }
      ]
    }),
    // process.env.NODE_ENV === 'production' ? new CompressionPlugin({ exclude: ['index.html', 'theme.css']  }) : undefined
  ],
  devServer: {
    static: {
      directory: './docs'
    },
    historyApiFallback: true,
    historyApiFallback: {
      rewrites: [
        { from: /bundle\.js/, to: '/docs.js' }
      ]
    }
  },
  devtool: process.env.WEBPACK_SERVE ? 'inline-source-map' : undefined,
  module: {
    rules: [
      {
        test: /^((?!theme).)*\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.html$/,
        use: [ 'html-loader' ]
      },
      {
        test: /\.svg$/i,
        use: 'raw-loader'
      }
    ]
  },
  performance: {
    hints: false
  }
};
