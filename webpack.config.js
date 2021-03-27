const path = require("path");
const { DefinePlugin } = require("webpack");

module.exports = (env, argv) => {
  let plugins = [];
  let watch = false;

  if (argv.mode === "development") {
    plugins.push(
      new DefinePlugin({
        __DEBUG__: JSON.stringify(true),
      })
    );
  }

  if (argv.mode === "production") {
    plugins.push(
      new DefinePlugin({
        __DEBUG__: JSON.stringify(false),
      })
    );
  }

  return {
    entry: {
      main: "./src/index.ts",
    },
    externals: {
      "discord.js": "commonjs discord.js",
      mongodb: "commonjs mongodb",
    },
    devtool: "inline-source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      fallback: {
        path: false,
        "ffmpeg-static": false,
        "utf-8-validate": false,
        bufferutil: false,
        "zlib-sync": false,
        erlpack: false,
      },
    },
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    plugins: plugins,
    target: "node",
    node: {
      __dirname: false,
    },
    watch: watch,
  };
};
