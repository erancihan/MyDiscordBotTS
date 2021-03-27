const path = require("path");
const fs = require("fs");
const { DefinePlugin } = require("webpack");

const findBotFolder = () => {
  const src = path.join(__dirname, "src");

  const files = fs.readdirSync(src);
  for (const key in files) {
    if (!files.hasOwnProperty(key)) continue;
    const file = files[key];
    const isDir = fs.lstatSync(path.join(src, file)).isDirectory();

    if (isDir) {
      return `./${file}`;
    }
  }

  return "";
}

module.exports = (env, argv) => {
  let plugins = [];
  let watch = false;

  const bot = findBotFolder();
  console.log("found bot", bot);

  plugins.push(new DefinePlugin({
    __DEBUG__: JSON.stringify(argv.mode === "development"),
    __BOT_FOLDER__: JSON.stringify(bot),
  }));

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
      alias: {
        __BOT_FOLDER__$: bot,
      }
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
