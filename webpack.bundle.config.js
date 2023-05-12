import CopyPlugin from 'copy-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';

const plugins = [
  new CopyPlugin({
    patterns: [
      { from: 'src/theme.css', to: '' }
    ]
  })
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(new CompressionPlugin({ exclude: [/.html$/, 'theme.css'] }));
}

export default {
  entry: {
    components: {
      import: './src/index.js',
      filename: 'components.js',
      library: {
        type: "module"
      }
    },
    styles: {
      import: './src/styles.js',
      filename: 'styles.js',
      library: {
        type: "module"
      }
    }
  },
  output: {
    clean: true
  },
  plugins,
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
        use: ['html-loader']
      }
    ]
  },
  optimization: {
    usedExports: true
  },
  experiments: {
    outputModule: true
  },
  performance: {
    hints: false
  }
};
