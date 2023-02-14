import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';

const plugins = [
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './docs/index.html',
    chunks: ['docs']
  }),
  new CopyPlugin({
    patterns: [
      { from: 'src/theme.css', to: '' },
      { from: 'src/theme.css', to: 'components/' },
      { from: 'docs/favicon.ico', to: '' }
    ]
  })
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(new CompressionPlugin({ exclude: ['index.html', 'theme.css'] }));
}

export default {
  entry: {
    docs: { import: './docs/app.js', filename: process.env.WEBPACK_SERVE ? '[name].js' : '[name].[contenthash].js'  },
    components: { import: './src/index.js', filename: 'components/components.js' }
  },
  output: {
    clean: true
  },
  plugins,
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
        test: /\.css$/, ///^((?!theme).)*\.css$/i,
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
