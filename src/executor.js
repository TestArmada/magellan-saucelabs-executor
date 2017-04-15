import { fork } from "child_process";
import https from "https";
import Locks from "./locks";
import Tunnel from "./tunnel";
import logger from "./logger";
import settings from "./settings";
import analytics from "./global_analytics";

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
      .then(locks.initialize);
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
    try {
      const sessionId = testResult.metadata.sessionId;
      const requestPath = `/rest/v1/${config.tunnel.username}/jobs/${sessionId}`;
      const data = JSON.stringify({
        "passed": testResult.result,
        // TODO: remove this
        "build": magellanBuildId,
        "public": "team"
      });

      logger.debug("Data posting to SauceLabs job:");
      logger.debug(JSON.stringify(data));
      logger.debug(`Updating saucelabs ${requestPath}`);

      const req = https.request({
        hostname: "saucelabs.com",
        path: requestPath,
        method: "PUT",
        auth: `${config.tunnel.username}:${config.tunnel.accessKey}`,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length
        }
      }, (res) => {
        res.setEncoding("utf8");
        logger.debug(`Response: ${res.statusCode}${JSON.stringify(res.headers)}`);

        res.on("data", (chunk) => {
          logger.debug(`BODY: ${chunk}`);
        });
        res.on("end", () => {
          return callback();
        });
      });

      req.on("error", (e) => {
        logger.err(`problem with request: ${e.message}`);
      });
      req.write(data);
      req.end();
    } catch (err) {
      logger.err(`Error${err}`);
      return callback();
    }
  }

};

module.exports = Executor;
