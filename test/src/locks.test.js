import Locks from "../../lib/locks";
import chai from "chai";
import chaiAsPromise from "chai-as-promised";
import _ from "lodash";

import logger from "../../lib/logger";

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
  let locks;
  let options = {
    locksServerLocation: "SOME_FAKE_HOST",
    locksRequestTimeout: 1000,
    locksOutageTimeout: 2000,
    locksPollingInterval: 500
  };
  let requestMock = {
    post(opts, callback) {
      console.log(opts, callback)
      callback(null, "", '{"accepted":true,"token":"fdsaasdf"}');
    }
  };

  beforeEach(() => {
    locks = new Locks(options, requestMock);
  });

  it("initialize", () => {
    expect(locks.options.locksServerLocation).to.equal("SOME_FAKE_HOST");
    expect(locks.options.locksRequestTimeout).to.equal(1000);
    expect(locks.options.locksOutageTimeout).to.equal(2000);
    expect(locks.options.locksPollingInterval).to.equal(500);
  });

  describe("acquire locks", () => {
    it("no lock server configured", (done) => {
      locks = new Locks({}, requestMock);

      locks.acquire((err, response) => {
        expect(err).to.equal(undefined);
        expect(response).to.equal(undefined);
        done();
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
      requestMock.post = (opts, callback) => {
        callback("SOME_FAKE_ERROR")
      };

      locks.acquire((err, response) => {
        expect(err.message).to.equal("SOME_FAKE_ERROR");
        done();
      });
    });

    it("with not accepted error", (done) => {
      requestMock.post = (opts, callback) => {
        callback(null, "", '{"accepted":false,"token":"fdsaasdf"}');
      };

      locks.acquire((err, response) => {
        expect(err.message).to.equal("Request not accepted");
        done();
      });
    });

    it("with empty response error", (done) => {
      requestMock.post = (opts, callback) => {
        callback(null, "", null);
      };

      locks.acquire((err, response) => {
        expect(err.message).to.match(/^Result from locks server is invalid or empty/);
        done();
      });
    });

    it("with empty response error", (done) => {
      requestMock.post = (opts, callback) => {
        callback(null, "", null);
      };

      locks.acquire((err, response) => {
        expect(err.message).to.match(/^Result from locks server is invalid or empty/);
        done();
      });
    });

    it("with response parse error", (done) => {
      let options = {
        locksServerLocation: "SOME_FAKE_HOST",
        locksRequestTimeout: 1000,
        locksOutageTimeout: 1,
        locksPollingInterval: 500
      };
      requestMock.post = (opts, callback) => {
        callback(null, "", "FAKE_BODY");
      };

      locks = new Locks(options, requestMock);

      locks.acquire((err, response) => {
        expect(err.message).to.match(/^Gave up trying to get a saucelabs VM from locks server./);
        done();
      });
    });
  });

  describe("release lock", () => {
    it("no lock server configured", (done) => {
      requestMock = (opts, callback) => {
        callback();
      };
      locks = new Locks({}, requestMock);

      locks.release("FAKE_TOKEN", () => {
        done();
      });
    });

    it("lock server called", (done) => {
      requestMock = (opts, callback) => {
        callback();
      };

      locks.release("FAKE_TOKEN", () => {
        done();
      });
    });
  });
});