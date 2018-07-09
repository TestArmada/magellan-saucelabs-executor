

const argv = require("yargs").argv;
const util = require("util");
const clc = require("cli-color");

const debug = argv.debug;
const PREFIX = "Saucelabs Executor";

module.exports = {
  output: console,

  debug(msg) {
    console.log(debug);
    if (debug) {
      const deb = clc.blueBright("[DEBUG]");
      this.output.log(util.format("%s [%s] %s", deb, PREFIX, msg));
    }
  },
  log(msg) {
    const info = clc.greenBright("[INFO]");
    this.output.log(util.format("%s [%s] %s", info, PREFIX, msg));
  },
  warn(msg) {
    const warn = clc.yellowBright("[WARN]");
    this.output.warn(util.format("%s [%s] %s", warn, PREFIX, msg));
  },
  err(msg) {
    const err = clc.redBright("[ERROR]");
    this.output.error(util.format("%s [%s] %s", err, PREFIX, msg));
  },
  loghelp(msg) {
    this.output.log(msg);
  },
  stringifyLog(msg) {
    const info = clc.greenBright("[INFO]");
    return util.format("%s [%s] %s", info, PREFIX, msg);
  },
  stringifyWarn(msg) {
    const warn = clc.yellowBright("[WARN]");
    return util.format("%s [%s] %s", warn, PREFIX, msg);
  },
  stringifyErr(msg) {
    const err = clc.redBright("[ERROR]");
    return util.format("%s [%s] %s", err, PREFIX, msg);
  }
};
