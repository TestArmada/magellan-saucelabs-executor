import WebSocket from "ws";
import logger from "./logger";

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
        this.connected = true;
        return callback();
      });

      this.socket.on("error", (ev) => {
        return callback(ev.error);
      });

      this.socket.on("close", () => {
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
          return nextClaim(new Error(`Unexpected message: ${message}`));
        }

        return null;
      });
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
    this.socket.send(JSON.stringify({type: "claim"}));
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
