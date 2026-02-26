const path = require("path");

module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  transform: {
    "^.+\.js$": ["babel-jest", { configFile: path.join(__dirname, "babel.config.cjs") }],
  },
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: false,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
};
