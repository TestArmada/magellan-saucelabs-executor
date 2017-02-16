import { fork } from "child_process";

import _ from "lodash";
import Locks from "./locks";
import Tunnel from "./tunnel";
import logger from "./logger";
import settings from "./settings";
import analytics from "./global_analytics";

let config = settings.config;

let tunnel = null;
let locks = null;

export default {
  setup: (mocks = null) => {
    let iLocks = Locks;
    let iTunnel = Tunnel;

    if (mocks) {
      if (mocks.Locks) {
        iLocks = mocks.Locks;
      }
      if (mocks.Tunnel) {
        iTunnel = mocks.Tunnel;
      }
      if (mocks.config) {
        config = mocks.config;
      }
    }

    locks = new iLocks(config);
    logger.log("Setting pre-requisites up");

    if (config.useTunnels) {
      // create new tunnel if needed
      tunnel = new iTunnel(config);

      return tunnel
        .initialize()
        .then(() => {
          analytics.push("sauce-open-tunnels");
          return tunnel.open();
        })
        .then(() => {
          analytics.mark("sauce-open-tunnels");
          logger.log("Sauce tunnel is opened!  Continuing...");
          logger.log("Assigned tunnel [" + config.sauceTunnelId + "] to all workers");
        })
        .catch((err) => {
          analytics.mark("sauce-open-tunnels", "failed");
          return new Promise((resolve, reject) => {
            reject(err);
          });
        });
    } else {
      return new Promise((resolve) => {
        if (config.sauceTunnelId) {
          let tunnelAnnouncement = config.sauceTunnelId;
          if (config.sharedSauceParentAccount) {
            tunnelAnnouncement = config.sharedSauceParentAccount + "/" + tunnelAnnouncement;
          }
          logger.log("Connected to sauce tunnel pool with tunnel [" + tunnelAnnouncement + "]");
        } else {
          logger.log("Connected to sauce without tunnel");
        }
        return resolve();
      });
    }
  },

  teardown: (mocks = null) => {
    if (mocks && mocks.config) {
      config = mocks.config;
    }

    logger.log("Tearing pre-requisites down");

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

  stage: (callback) => {
    logger.log("Staging before test run");

    locks.acquire(callback);
  },

  wrapup: (info, callback) => {
    logger.log("Cleaning up after test run");

    locks.release(info, callback);
  },

  execute: (testRun, options, mocks = null) => {
    let ifork = fork;

    if (mocks && mocks.fork) {
      ifork = mocks.fork;
    }

    return ifork(testRun.getCommand(), testRun.getArguments(), options);
  }
};