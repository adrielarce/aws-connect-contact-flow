const path = require("path");
const slsw = require("serverless-webpack");
const stage = slsw.lib.options.stage;

module.exports = {
  entry: slsw.lib.entries,
  externals: [{ "aws-sdk": "commonjs2 aws-sdk" }],
  target: "node",
  mode: "production",
  stats: "minimal",
  performance: {
    hints: false
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"]
  },
  optimization: {
    minimize: stage === "prod"
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js"
  }
};
