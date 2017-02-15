const executor = require("./lib/executor");
const configuration = require("./lib/configuration");
const profile = require("./lib/profile");
const help = require("./lib/help");

module.exports = {
  name: "testarmada-magellan-sauce-executor",
  shortName: "sauce",

  // from help
  help: help,

  getConfig: configuration.getConfig,
  validateConfig: configuration.validateConfig,

  getProfiles: profile.getProfiles,
  getCapabilities: profile.getCapabilities,
  listBrowsers: profile.listBrowsers,

  setup: executor.setup,
  teardown: executor.teardown,
  stage: executor.stage,
  wrapup: executor.wrapup,
  execute: executor.execute,
};
