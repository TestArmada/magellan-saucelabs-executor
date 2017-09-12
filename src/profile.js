import _ from "lodash";
import path from "path";
import SauceBrowsers from "guacamole";
import listSauceCliBrowsers from "guacamole/src/cli_list";
import { argv } from "yargs";
import logger from "./logger";
import settings from "./settings";

const FIREFOX_MARIONETTE = 48;

const _mergeCapabilities = (capabilities, capsConfig, browser) => {
  if (capsConfig && capsConfig[browser]) {
    capabilities = _.merge(capabilities, capsConfig[browser]);
    logger.debug(`DesiredCapabilities after merging appCapabilitiesConfig for browser ${browser}`);
    logger.debug(JSON.stringify(capabilities));
  }
  return capabilities;
};

const _patchFirefox = (capabilities) => {
  if (capabilities.browserName === "firefox"
    && parseInt(capabilities.version) >= FIREFOX_MARIONETTE) {
    capabilities.marionette = true;
    capabilities.javascriptEnabled = true;
  }

  return capabilities;
};

const _patchAppium = (capabilities, browser) => {
  let tempCap = _.cloneDeep(capabilities);
  // for customized app capabilities
  tempCap = _mergeCapabilities(tempCap, settings.config.appCapabilitiesConfig, browser);

  // if app location is passed via command line arg
  if (settings.config.app) {
    tempCap.app = settings.config.app;
  }

  if (tempCap.app) {
    delete tempCap.browserName;
  }

  return tempCap;
};

const _mergeLocalAppiumCapabilities = (appCapabilitiesConfig, browser, capabilities) => {
  // for appCapabilitiesConfig
  logger.debug(appCapabilitiesConfig);
  let appCapabilitiesConfigPath;

  try {
    appCapabilitiesConfigPath = path.resolve(process.cwd(), appCapabilitiesConfig);
    logger.debug(`Requiring ${appCapabilitiesConfigPath}`);
    /* eslint-disable global-require */
    const capabilitiesConfig = require(appCapabilitiesConfigPath);
    /* eslint-enable global-require */

    capabilities = _mergeCapabilities(capabilities, capabilitiesConfig, browser);
  } catch (e) {
    logger.log(`Could not load ${appCapabilitiesConfigPath}.
                Does the file exist or is it a valid JSON or JS file ?`);
  }

  return capabilities;
};

export default {
  getNightwatchConfig: (profile, sauceSettings) => {
    const capabilities = _.assign({}, profile.desiredCapabilities);

    if (sauceSettings.tunnel.tunnelIdentifier) {
      capabilities["tunnel-identifier"] = sauceSettings.tunnel.tunnelIdentifier;
      if (sauceSettings.sharedSauceParentAccount) {
        // if tunnel is shared by parent account
        capabilities["parent-tunnel"] = sauceSettings.sharedSauceParentAccount;
      }
    } else {
      // This property may exist, so blow it away
      delete capabilities["tunnel-identifier"];
    }

    /*eslint-disable camelcase*/
    const config = {
      desiredCapabilities: capabilities,
      username: sauceSettings.tunnel.username,
      access_key: sauceSettings.tunnel.accessKey
    };

    // For *outbound Selenium control traffic*, Nightwatch supports a proxy
    // property directly on the environment configuration object (note: this is
    // NOT to be confused with proxy settings in desiredCapabilities, which are
    // used for return path traffic from the remote browser).
    if (sauceSettings.sauceOutboundProxy) {
      config.proxy = sauceSettings.sauceOutboundProxy;
    }

    logger.debug(`executor config: ${JSON.stringify(config)}`);
    return config;
  },

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
            p.desiredCapabilities = _patchAppium(p.desiredCapabilities, runArgv.sauce_browser);

            logger.debug(`detected profile: ${JSON.stringify(p)}`);

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

              p.desiredCapabilities = _patchAppium(p.desiredCapabilities, b);

              returnBrowsers.push(p);
            });

            logger.debug(`detected profiles: ${JSON.stringify(returnBrowsers)}`);

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
            // for appium test
            if (profile.appium) {
              p.desiredCapabilities = _.merge(p.desiredCapabilities, profile.appium);
            }
            if (profile.appCapabilitiesConfig) {
              p.desiredCapabilities = _mergeLocalAppiumCapabilities(profile.appCapabilitiesConfig,
                profile.browser,
                p.desiredCapabilities);
            }
            p.desiredCapabilities = _patchAppium(p.desiredCapabilities, profile.browser);
            resolve(p);
          } catch (e) {
            reject(`Executor sauce cannot resolve profile ${
              JSON.stringify(profile)}`);
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
        logger.err(`Couldn't fetch sauce browsers. Error: ${err}`);
        logger.err(err.stack);
        callback(err);
      });
  }
};
