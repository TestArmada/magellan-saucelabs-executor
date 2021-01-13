

const fork = require("child_process").fork;
const _request = require("request");
const Tunnel = require("./tunnel");
const logger = require("./logger");
const settings = require("./settings");
const analytics = require("./global_analytics");

let config = settings.config;

let tunnel = null;

const MAX_RETRIES = 3;

const request = (options, callback, retries = MAX_RETRIES) => {
  _request(options, (verror, vres, vjson) => {
    if (verror) {
      if (retries > 0) {
        logger.warn(`Request to ${options.url} failed. Retries=${retries}`);
        return request(options, callback, retries - 1);
      } else {
        return callback(verror, vres, vjson);
      }
    }
    return callback(verror, vres, vjson);
  });
};

const Executor = {
  setupRunner: (mocks) => {
    return Executor
      .setupTunnels(mocks);
  },

  setupTunnels: (mocks) => {
    let ITunnel = Tunnel;

    if (mocks) {
      if (mocks.Tunnel) {
        ITunnel = mocks.Tunnel;
      }
      if (mocks.config) {
        config = mocks.config;
      }
    }

    if (config.useTunnels) {
      // create new tunnel if needed
      tunnel = new ITunnel(config);

      return tunnel
        .initialize()
        .then(() => {
          analytics.push("sauce-open-tunnels");
          return tunnel.open();
        })
        .then(() => {
          analytics.mark("sauce-open-tunnels");
          logger.log("Sauce tunnel is opened!  Continuing...");
          logger.log(`Assigned tunnel [${config.tunnel.tunnelIdentifier}] to all workers`);
        })
        .catch((err) => {
          analytics.mark("sauce-open-tunnels", "failed");
          return new Promise((resolve, reject) => {
            reject(err);
          });
        });
    } else {
      return new Promise((resolve) => {
        if (config.tunnel.tunnelIdentifier) {
          let tunnelAnnouncement = config.tunnel.tunnelIdentifier;
          if (config.sharedSauceParentAccount) {
            tunnelAnnouncement = `${config.sharedSauceParentAccount}/${tunnelAnnouncement}`;
          }
          logger.log(`Connected to sauce tunnel [${tunnelAnnouncement}]`);
        } else {
          logger.log("Connected to sauce without tunnel");
        }
        return resolve();
      });
    }
  },

  teardownRunner: (mocks) => {
    if (mocks && mocks.config) {
      config = mocks.config;
    }

    // close tunnel if needed
    if (tunnel && config.useTunnels) {
      return tunnel
        .close()
        .then(() => {
          logger.log("Sauce tunnel is closed!  Continuing...");
        });
    } else {
      return Promise.resolve();
    }
  },

  setupTest: (callback) => {
    return callback();
  },

  teardownTest: (info, callback) => {
    return callback(info);
  },

  execute: (testRun, options, mocks) => {
    let ifork = fork;

    if (mocks && mocks.fork) {
      ifork = mocks.fork;
    }

    return ifork(testRun.getCommand(), testRun.getArguments(), options);
  },

  /*eslint-disable consistent-return*/
  summerizeTest: (magellanBuildId, testResult, callback) => {
    let additionalLog = "";

    if (!testResult.metadata) {
      // testarmada-nightwatch-extra isn't in use, users need
      // to report result to saucelabs by themselves
      logger.warn("No meta data is found, executor will not report result to saucelabs"
        + " This is mainly caused by not using https://github.com/TestArmada/nightwatch-extra");
      return callback();
    }
    try {
      const sessionId = testResult.metadata.sessionId;

      logger.debug(`Saucelabs replay can be found at https://saucelabs.com/tests/${sessionId}\n`);

      if (!testResult.result) {
        // print out sauce replay to console if test failed
        additionalLog = logger.stringifyWarn(`Saucelabs replay can be found at https://saucelabs.com/tests/${sessionId}\n`);
      }
      const infoRequestOption = {
        url: `https://${process.env.SAUCE_API_HOST || "saucelabs.com"}/rest/v1/users/${config.tunnel.username}`,
        method: "GET",
        auth: {
          user: config.tunnel.username,
          pass: config.tunnel.accessKey
        },
        body: {},
        json: true
      };

      if (settings.config.sauceOutboundProxy) {
        infoRequestOption.proxy = settings.config.sauceOutboundProxy;
        infoRequestOption.strictSSL = false;
      }

      // retrieve account visibility from saucelabs
      request(infoRequestOption, (verror, vres, vjson) => {
        if (verror) {
          logger.err(`Error when getting saucelabs account detail for ${config.tunnel.username}:`);
          logger.err(verror);
          return callback();
        }

        logger.debug("Response from Saucelabs account detail");
        logger.debug(JSON.stringify(vjson));

        const visibility = vjson.is_public ? "public" : "team";

        const requestPath = `/rest/v1/${config.tunnel.username}/jobs/${sessionId}`;
        const data = {
          "passed": testResult.result,
          // TODO: remove this
          "build": magellanBuildId,
          "public": visibility
        };

        logger.debug("Data posting to SauceLabs job:");
        logger.debug(JSON.stringify(data));
        logger.debug(`Updating saucelabs ${requestPath}`);

        const requestOptions = {
          url: `https://${process.env.SAUCE_API_HOST || "saucelabs.com"}${requestPath}`,
          method: "PUT",
          auth: {
            user: config.tunnel.username,
            pass: config.tunnel.accessKey
          },
          body: data,
          json: true
        };

        if (settings.config.sauceOutboundProxy) {
          requestOptions.proxy = settings.config.sauceOutboundProxy;
          requestOptions.strictSSL = false;
        }

        request(requestOptions, (error, res, json) => {
          if (error) {
            logger.err("Error when posting update to Saucelabs session with request:");
            logger.err(error);
            return callback();
          }

          logger.debug("Response from Saucelabs session update:");
          logger.debug(JSON.stringify(json));
          return callback(additionalLog);
        });
      });
    } catch (err) {
      logger.err(`Error ${err}`);
      return callback();
    }
  }

};

module.exports = Executor;
