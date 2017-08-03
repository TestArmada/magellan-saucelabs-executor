import _ from "lodash";
import logger from "./logger";
import LocksAPI from "./locks_socket_api";

export default class Locks {
  constructor(options, apiMock = null) {
    this.options = _.assign({}, options);
    this.apiMock = apiMock;
  }

  initialize() {
    if (this.options.locksServerLocation) {
      this.api = this.apiMock || new LocksAPI(this.options);

      logger.log(`Using locks server at ${this.options.locksServerLocation
        } for VM traffic control.`);

      return new Promise((resolve, reject) => {
        this.api.connect((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else {
      return Promise.resolve();
    }
  }

  //
  // 1) Attempt to claim a VM. If the claim is accepted, return the token.
  // 2) If rejected or given an error, wait, then try again (poll)
  // 3) If max polling time is reached, abandon the claim and return an error.
  //
  acquire(callback) {
    if (!this.api) {
      return callback();
    }

    const pollingStartTime = Date.now();

    const poll = () => {
      logger.debug("Asking for VM..");

      try {
        return this.api.claim((error, token) => {
          // Three possible outcomes to claims:
          //
          // 1) error
          // 2) accepted claim, token received.
          // 3) rejected claim, no token received.

          if (error) {
            logger.err(`waited for ${Date.now() - pollingStartTime} , timeout is
              ${this.options.locksOutageTimeout}`);
            if (Date.now() - pollingStartTime > this.options.locksOutageTimeout) {
              // we've been polling for too long. Bail!
              return callback(new Error(`${"Gave up trying to get "
                + "a saucelabs VM from locks server. "}${error}`));
            } else {
              logger.err(`${"Error from locks server, tolerating error and" +
                " waiting "}${this.options.locksPollingInterval}ms before trying again`);
              return setTimeout(poll, this.options.locksPollingInterval);
            }
          }

          if (token) {
            return callback(null, { token });
          } else {
            logger.debug("Capacity saturated, waiting for clearance to claim next available VM..");
            return setTimeout(poll, this.options.locksPollingInterval);
          }

        });
      } catch (e) {
        logger.err("Internal exception while trying to claim a VM from Saucelabs:");
        logger.err(e);
        return callback(e);
      }
    };

    return poll();
  }

  release(token) {
    if (!this.api) {
      return;
    }
    this.api.release(token);
  }

  teardown() {
    if (!this.api) {
      return;
    }
    this.api.close();
  }
}
