import WebSocket from "ws";
import logger from "./logger";

//
// How claims work:
//
// 1) An incoming claim callback is pushed to the claims queue by claim(). A claim request
//    is then sent via the websocket.
//
// 2) Locks is expected to eventually respond with a message with a property called "accepted"
//    set to true or false. There are three cases that can happen:
//
//    A) If accepted is set to false, this means the claim was rejected due to saturation, and
//       the saucelabs executor should submit another claim after a short sleep time (as a
//       courtesy to the locks server, which may be under high load during saturation).
//
//    B) If accepted is set to true, this means the claim was accepted and the message's token
//       property should have a unique claim token (this token can be used to liberate the claim
//       early with the release() function).
//
//    C) An error. Not to be confused with a rejected claim, an error means the locks server
//       is in an undefined state or cannot be reached. Things like gateway or network issues
//       can fall into this case. The saucelabs executor can keep retrying until it's convinced
//       that locks is experiencing an outage and it's appropriate to give up.
//

export default class LocksAPI {
  constructor(options, mockSocket = null) {
    this.mock = mockSocket ? true : false;
    this.socket = mockSocket ? mockSocket : null;
    this.options = options;
    this.claims = [];
    this.connected = false;
  }

  _createSocket() {
    if (!this.mock) {
      this.socket = new WebSocket(this.options.locksServerLocation);
    }
  }

  connect(callback) {
    if (!this.connected) {
      this._createSocket();

      this.socket.on("open", () => {
        logger.debug("Locks websocket established");
        this.connected = true;
        return callback();
      });

      this.socket.on("error", (ev) => {
        logger.debug("Locks websocket error");
        return callback(ev.error);
      });

      this.socket.on("close", () => {
        logger.debug("Locks websocket closed");
        this.connected = false;
        return;
      });

      this.socket.on("message", (message) => {
        try {
          message = JSON.parse(message);
        } catch (e) {
          const nextClaim = this.claims.shift();
          if (nextClaim) {
            return nextClaim(e);
          }
        }

        if (message && message.hasOwnProperty("accepted")) {
          const nextClaim = this.claims.shift();
          if (nextClaim) {
            if (message.accepted) {
              return nextClaim(null, message.token);
            } else {
              return nextClaim(null, null);
            }
          }
        }

        // Reject unexpected or garbled messages
        const nextClaim = this.claims.shift();
        if (nextClaim) {
          return nextClaim(new Error("Received an unexpected message "
            + `from locks server: ${message}`));
        }

        return null;
      });

      return null;
    }

    return callback();
  }

  _rejectAllClaims(reason, error) {
    const rejectedClaims = this.claims;
    this.claims = [];
    rejectedClaims.forEach((nextClaim) => {
      if (error) {
        nextClaim(error);
      } else {
        nextClaim(new Error(reason));
      }
    });
  }

  claim(callback) {
    this.claims.push(callback);
    this.socket.send(JSON.stringify({ type: "claim" }));
  }

  release(token) {
    this.socket.send(JSON.stringify({
      type: "release",
      token
    }));
  }

  close() {
    try {
      this._rejectAllClaims("Shutting down");
      if (this.ws) {
        this.socket.close();
      }
    } catch (e) {
      logger.err(`Exception while trying to close websocket: ${e}`);
    }
  }

}
