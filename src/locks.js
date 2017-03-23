import request from "request";
import _ from "lodash";
import logger from "./logger";

export default class Locks {
  constructor(options, requestMock = null) {
    this.options = _.assign({}, options);
    this.request = request;

    if (requestMock) {
      this.request = requestMock;
    }

    if (this.options.locksServerLocation) {
      logger.log(`Using locks server at ${this.options.locksServerLocation
        } for VM traffic control.`);
    }
  }

  acquire(callback) {
    if (this.options.locksServerLocation) {
      // this will block untill lock server returns a valid vm token
      //
      // http://0.0.0.0:3000/claim
      //
      // {"accepted":false,"message":"Claim rejected. No VMs available."}
      // {"accepted":true,"token":null,"message":"Claim accepted"}
      //
      const pollingStartTime = Date.now();

      // Poll the worker allocator until we have a known-good port, then run this test
      const poll = () => {
        logger.debug("asking for VM..");

        /*eslint-disable consistent-return*/
        return this.request.post({
          url: `${this.options.locksServerLocation}/claim`,
          timeout: this.options.locksRequestTimeout,
          form: {}
        }, (error, response, body) => {
          try {
            if (error) {
              return callback(new Error(error));
            }
            const result = JSON.parse(body);
            if (result) {
              if (result.accepted) {
                logger.debug(`VM claim accepted, token: ${result.token}`);

                return callback(null, { token: result.token });
              } else {
                logger.debug("VM claim not accepted, waiting to try again ..");
                // If we didn't get a worker, try again
                return callback(new Error("Request not accepted"));
              }
            } else {
              return callback(new Error(`Result from locks server is invalid or empty: '${
                result}'`));
            }
          } catch (e) {
            // NOTE: There are several errors that can happen in the above code:
            //
            // 1. Parsing - we got a response from locks, but it's malformed
            // 2. Interpretation - we could parse a result, but it's empty or weird
            // 3. Connection - we attempted to connect, but timed out, 404'd, etc.
            //
            // All of the above errors end up here so that we can indiscriminately
            // choose to tolerate all types of errors until we've waited too long.
            // This allows for the locks server to be in a bad state (whether due
            // to restart, failure, network outage, or whatever) for some amount of
            // time before we panic and start failing tests due to an outage.
            if (Date.now() - pollingStartTime > this.options.locksOutageTimeout) {
              // we've been polling for too long. Bail!
              return callback(new Error(`${"Gave up trying to get "
                + "a saucelabs VM from locks server. "}${e}`));
            } else {
              logger.debug(`${"Error from locks server, tolerating error and" +
                " waiting "}${this.options.locksPollingInterval
                }ms before trying again`);
              setTimeout(poll, this.options.locksPollingInterval);
            }
          }
        });
      };

      return poll();
    } else {
      return callback();
    }
  }

  release(token, callback) {
    if (this.options.locksServerLocation) {
      return this.request({
        method: "POST",
        json: true,
        timeout: this.options.locksRequestTimeout,
        body: {
          token
        },
        url: `${this.options.locksServerLocation}/release`
      }, () => {
        // TODO: decide whether we care about an error at this stage. We're releasing
        // this worker whether the remote release is successful or not, since it will
        // eventually be timed out by the locks server.
        return callback();
      });
    } else {
      return callback();
    }
  }
}
