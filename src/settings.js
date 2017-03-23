import argvs from "yargs";
import path from "path";

const debug = argvs.argv.debug;
const TEMP_DIR = path.resolve(argvs.temp_dir || "./temp");

/*eslint-disable no-magic-numbers*/
const config = {
  // required:
  username: null,
  accessKey: null,
  sauceConnectVersion: null,

  // optional:
  sauceTunnelId: null,
  sharedSauceParentAccount: null,
  tunnelTimeout: null,
  useTunnels: null,
  fastFailRegexps: null,

  locksServerLocation: null,

  maxTunnels: 1,
  locksOutageTimeout: 1000 * 60 * 5,
  locksPollingInterval: 5000,
  locksRequestTimeout: 5000
};


export default {
  debug,
  tempDir: TEMP_DIR,
  config,

  MAX_CONNECT_RETRIES: process.env.SAUCE_CONNECT_NUM_RETRIES || 10,
  BASE_SELENIUM_PORT_OFFSET: 56000,
  BAILED: false
};
