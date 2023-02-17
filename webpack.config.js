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
      { from: 'docs/font.css', to: '' },
      { from: 'docs/favicon.ico', to: '' },
      {
        from: 'pages/**/*.html',
        context: 'docs/',
        to: '',
        globOptions: {
          ignore: ['**/page.html']
        }
      }
    ]
  })
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(new CompressionPlugin({ exclude: [/.html$/, 'theme.css'] }));
}

export default {
  entry: {
    docs: { import: './docs/app.js', filename: process.env.WEBPACK_SERVE ? '[name].js' : '[name].[contenthash].js'  },
    bundle: { import: './docs/app.js', filename: 'bundle.js' },
    components: { import: './src/index.js', filename: 'components.js' }
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
        test: /\.css$/i,
        oneOf: [
          {
            assert: { type: "css" },
            loader: "css-loader",
            options: {
              exportType: "css-style-sheet"
            }
          },
          {
            use: [
              "style-loader",
              { loader: "css-loader" }
            ]
          }
        ]
      },
      {
        test: /\.html$/,
        use: [ 'html-loader' ]
      }
    ]
  },
  performance: {
    hints: false
  }
};
