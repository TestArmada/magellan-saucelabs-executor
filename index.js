"use strict";

const executor = require("./src/executor");
const configuration = require("./src/configuration");
const profile = require("./src/profile");
const help = require("./src/help");

module.exports = {
  name: "testarmada-magellan-sauce-executor",
  shortName: "sauce",

  // from help
  help: help,

  getConfig: configuration.getConfig,
  validateConfig: configuration.validateConfig,

  getNightwatchConfig: profile.getNightwatchConfig,
  getProfiles: profile.getProfiles,
  getCapabilities: profile.getCapabilities,
  listBrowsers: profile.listBrowsers,

  setupRunner: executor.setupRunner,
  teardownRunner: executor.teardownRunner,
  setupTest: executor.setupTest,
  teardownTest: executor.teardownTest,
  execute: executor.execute,
  summerizeTest: executor.summerizeTest
};
