import { fork } from "child_process";

import _ from "lodash";
import Locks from "./locks";
import Tunnel from "./tunnel";
import guid from "./util/guid";
import logger from "./logger";
import settings from "./settings";


const config = settings.config;

let tunnel = null;
let locks = null;

export default {
  setup: () => {
    locks = new Locks(config);

    if (config.useTunnels) {
      // create new tunnel if needed
      tunnel = new Tunnel(config);

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
          return new Promise((reject) => {
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

  teardown: () => {
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

  execute: (testRun, options) => {
    return fork(testRun.getCommand(), testRun.getArguments(), options);
  }
};