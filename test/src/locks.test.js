import Locks from "../../lib/locks";
import chai from "chai";
import chaiAsPromise from "chai-as-promised";
import _ from "lodash";
import EventEmitter from "events";

import logger from "../../lib/logger";
import LocksAPI from "../../lib/locks_socket_api";

// eat console logs
// logger.output = {
//   log() { },
//   error() { },
//   debug() { },
//   warn() { }
// };

chai.use(chaiAsPromise);

const expect = chai.expect;
const assert = chai.assert;

describe("Locks", () => {
  let mockSocket;
  let mockLocksAPI;
  let locks;
  let options = {
    locksServerLocation: "SOME_FAKE_HOST",
    locksRequestTimeout: 1000,
    locksOutageTimeout: 1500,
    locksPollingInterval: 250
  };

  beforeEach((done) => {
    mockSocket = new EventEmitter();
    mockSocket.send = (message) => {
      mockSocket.emit("message", JSON.stringify({
        "accepted": true,
        "token": "fdsaasdf"
      }));
    };
    mockLocksAPI = new LocksAPI(options, mockSocket);
    locks = new Locks(options, mockLocksAPI);
    locks.initialize().then(() => {
      done();
    });
    mockSocket.emit("open");
  });

  it("initialize", () => {
    expect(locks.options.locksServerLocation).to.equal("SOME_FAKE_HOST");
    expect(locks.options.locksRequestTimeout).to.equal(1000);
    expect(locks.options.locksOutageTimeout).to.equal(1500);
    expect(locks.options.locksPollingInterval).to.equal(250);
  });

  describe("acquire locks", () => {

    it("no lock server configured", (done) => {
      locks = new Locks({}, mockLocksAPI);
      locks.initialize().then(() => {
        locks.acquire((err, response) => {
          expect(err).to.equal(undefined);
          expect(response).to.equal(undefined);
          done();
        });
      });
    });

    it("succeed", (done) => {
      locks.acquire((err, response) => {
        expect(err).to.equal(null);
        expect(response.token).to.equal("fdsaasdf");
        done();
      });
    });

    it("with response error", (done) => {
      mockLocksAPI.claim = (callback) => {
        callback("SOME_FAKE_ERROR");
      };

      locks.acquire((err, response) => {
        expect(err.message).to.include("SOME_FAKE_ERROR");
        done();
      });
    });

    describe("socket listeners", () => {

      it("handles malformed messages", (done) => {
        mockSocket.send = (message) => {
          mockSocket.emit("message", "malformed message");
        };

        locks.acquire((err, response) => {
          expect(err.message).to.include("SyntaxError");
          done();
        });
      });


      it("handles unexpected messages", (done) => {
        mockSocket.send = (message) => {
          mockSocket.emit("message", JSON.stringify({
            "garbled": "asdfasdf"
          }));
        };

        locks.acquire((err, response) => {
          expect(err.message).to.include("Unexpected message");
          done();
        });
      });

    });

    describe("broad claim rejection", () => {
      it("rejects all stuck claims", (done) => {
        mockSocket.send = (message) => {
          // cause claims to go nowhere
          mockLocksAPI._rejectAllClaims("unit testing");
        };

        locks.acquire((err, response) => {
          expect(err.message).to.include("unit testing");
          done();
        });

      });
    });

  });

  describe("release lock", () => {
    it("no lock server configured", () => {
      locks = new Locks({}, mockLocksAPI);
      
      try{
        locks.release("FAKE_TOKEN");
      }catch(e){
        assert(false, "shouldn't reach here");
      }
    });

    it("lock server called", (done) => {
      mockSocket.send = (message) => {
        message = JSON.parse(message);
        expect(message.token).to.equal("FAKE_TOKEN");
        expect(message.type).to.equal("release");
        done();        
      };

      locks.release("FAKE_TOKEN");
    });
  });

});