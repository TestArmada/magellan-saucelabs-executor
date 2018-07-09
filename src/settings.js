

const argv = require("yargs").argv;
const path = require("path");

const debug = argv.debug;
const TEMP_DIR = path.resolve(argv.temp_dir || "./temp");

/*eslint-disable no-magic-numbers*/
const config = {
  tunnel: {
    // required:
    username: null,
    accessKey: null,
    connectVersion: null,

    // optional:
    tunnelIdentifier: null,
    fastFailRegexps: null
  },
  sharedSauceParentAccount: null,
  useTunnels: false,

  sauceOutboundProxy: null,

  app: null,
  appCapabilitiesConfig: null
};


module.exports = {
  debug,
  tempDir: TEMP_DIR,
  config,

  MAX_CONNECT_RETRIES: process.env.SAUCE_CONNECT_NUM_RETRIES || 10,
  BASE_SELENIUM_PORT_OFFSET: 56000,
  BAILED: false
};
