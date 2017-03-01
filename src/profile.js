import _ from "lodash";
import SauceBrowsers from "guacamole";
import listSauceCliBrowsers from "guacamole/src/cli_list";
import { argv } from "yargs";
import logger from "./logger";

const FIREFOX_MARIONETTE = 48;

const _patchFirefox = (capabilities) => {
  if (capabilities.browserName === "firefox"
    && parseInt(capabilities.version) >= FIREFOX_MARIONETTE) {
    capabilities.marionette = true;
    capabilities.javascriptEnabled = true;
    capabilities.seleniumVersion = "3.0.1";
  }

  return capabilities;
};

export default {
  getProfiles: (opts, argvMock = null) => {
    let runArgv = argv;

    if (argvMock) {
      runArgv = argvMock;
    }

    return SauceBrowsers
      .initialize()
      .then(() => {
        return new Promise((resolve) => {
          if (runArgv.sauce_browser) {
            const p = {
              desiredCapabilities: _patchFirefox(SauceBrowsers.get({
                id: runArgv.sauce_browser
              })[0]),
              executor: "sauce",
              nightwatchEnv: "sauce",
              id: runArgv.sauce_browser
            };

            logger.debug(`detected profile: ${ JSON.stringify(p)}`);

            resolve(p);
          } else if (runArgv.sauce_browsers) {
            const tempBrowsers = runArgv.sauce_browsers.split(",");
            const returnBrowsers = [];

            _.forEach(tempBrowsers, (browser) => {
              const b = browser.trim();
              const p = {
                desiredCapabilities: _patchFirefox(SauceBrowsers.get({
                  id: b
                })[0]),
                executor: "sauce",
                nightwatchEnv: "sauce",
                // id is for magellan reporter
                id: b
              };

              returnBrowsers.push(p);
            });

            logger.debug(`detected profiles: ${ JSON.stringify(returnBrowsers)}`);

            resolve(returnBrowsers);
          } else {
            resolve();
          }
        });
      });
  },

  /*eslint-disable no-unused-vars*/
  getCapabilities: (profile, opts) => {
    // profile key mapping
    // browser => id
    // resolution => screenResolution
    // orientation => deviceOrientation
    const prof = {
      id: profile.browser
    };

    if (profile.resolution) {
      prof.screenResolution = profile.resolution;
    }

    if (profile.orientation) {
      prof.deviceOrientation = profile.orientation;
    }

    return SauceBrowsers
      .initialize()
      .then(() => {
        return new Promise((resolve, reject) => {
          try {
            const desiredCapabilities = _patchFirefox(SauceBrowsers.get(prof)[0]);
            // add executor info back to capabilities
            const p = {
              desiredCapabilities,
              executor: profile.executor,
              nightwatchEnv: profile.executor,
              id: prof.id
            };

            resolve(p);
          } catch (e) {
            reject(`Executor sauce cannot resolve profile ${
               profile}`);
          }
        });
      });
  },

  listBrowsers: (opts, callback, argvMock = null) => {
    let runArgv = argv;

    if (argvMock) {
      runArgv = argvMock;
    }

    SauceBrowsers
      .initialize(true)
      .then(() => {
        return new Promise((resolve) => {
          if (runArgv.device_additions) {
            logger.log("Loading customized profiles");
            SauceBrowsers.addNormalizedBrowsersFromFile(runArgv.device_additions);
          }
          resolve();
        });
      })
      .then(() => {
        return new Promise((resolve) => {
          listSauceCliBrowsers((browserTable) => {
            // convert table heading
            browserTable.options.head[1] = "Copy-Paste Command-Line Option";
            logger.loghelp(browserTable.toString());
            logger.loghelp("");
            resolve(browserTable);
          });
        });
      })
      .then((browserTable) => {
        callback(null, browserTable);
      })
      .catch((err) => {
        logger.err(`Couldn't fetch sauce browsers. Error: ${ err}`);
        logger.err(err.stack);
        callback(err);
      });
  }
};
