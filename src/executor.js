import { fork } from "child_process";
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
    let ILocks = Locks;
    let ITunnel = Tunnel;

    if (mocks) {
      if (mocks.Locks) {
        ILocks = mocks.Locks;
      }
      if (mocks.Tunnel) {
        ITunnel = mocks.Tunnel;
      }
      if (mocks.config) {
        config = mocks.config;
      }
    }

    locks = new ILocks(config);

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
          logger.log(`Assigned tunnel [${ config.sauceTunnelId }] to all workers`);
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
            tunnelAnnouncement = `${config.sharedSauceParentAccount }/${ tunnelAnnouncement}`;
          }
          logger.log(`Connected to sauce tunnel [${ tunnelAnnouncement }]`);
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
    locks.acquire(callback);
  },

  wrapup: (info, callback) => {
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
