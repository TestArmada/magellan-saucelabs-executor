import { fork } from "child_process";
import Locks from "./locks";
import Tunnel from "./tunnel";
import logger from "./logger";
import settings from "./settings";
import analytics from "./global_analytics";
import request from "request";

let config = settings.config;

let tunnel = null;
let locks = null;

const Executor = {
  setupRunner: (mocks = null) => {

    let ILocks = Locks;

    if (mocks && mocks.Locks) {
      ILocks = mocks.Locks;
    }

    locks = new ILocks(config);

    return Executor
      .setupTunnels(mocks)
      .then(() => {
        return locks.initialize();
      });
  },

  setupTunnels: (mocks = null) => {
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

  teardownRunner: (mocks = null) => {
    if (mocks && mocks.config) {
      config = mocks.config;
    }

    // shut down locks
    locks.teardown();

    // close tunnel if needed
    if (tunnel && config.useTunnels) {
      return tunnel
        .close()
        .then(() => {
          logger.log("Sauce tunnel is closed!  Continuing...");
        });
    } else {
      return new Promise((resolve) => {
        resolve();
      });
    }
  },

  setupTest: (callback) => {
    locks.acquire(callback);
  },

  teardownTest: (info, callback) => {
    locks.release(info);
    callback(info);
  },

  execute: (testRun, options, mocks = null) => {
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
        url: `https://saucelabs.com/rest/v1/users/${config.tunnel.username}`,
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
          url: `https://saucelabs.com${requestPath}`,
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
