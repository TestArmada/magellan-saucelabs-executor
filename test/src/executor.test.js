import executor from "../../lib/executor";
import chai from "chai";
import chaiAsPromise from "chai-as-promised";
import _ from "lodash";
import settings from "../../lib/settings";

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

describe("Executor", () => {
  it("execute", () => {
    const mocks = {
      fork(cmd, args, opts) {
        return 1;
      }
    };

    const testRun = {
      getCommand() { },
      getArguments() { }
    };

    let r = executor.execute(testRun, {}, mocks);
    expect(r).to.equal(1);
  });

  describe("setupRunner", () => {
    let mocks;

    beforeEach(() => {
      mocks = {
        Locks: class Locks {
          constructor(config) { }
          acquire(callback) { callback() }
          release(info, callback) { callback() }
          initialize() { return new Promise((resolve) => resolve()) }
          teardown() { }
        },

        Tunnel: class Tunnel {
          constructor(config) { }
          initialize() { return new Promise((resolve) => resolve()) }
          open() { return new Promise((resolve) => resolve()) }
        },

        config: {}
      };
    });

    it("no create tunnel", () => {
      mocks.config = {
        tunnel: {
          useTunnels: false
        }
      };

      return executor
        .setupRunner(mocks)
        .then(() => { })
        .catch(err => {
          assert(false, "executor setupRunner isn't successful for no create tunnel config");
        });
    });

    it("use existing tunnel", () => {
      mocks.config = {
        tunnel: {
          useTunnels: false,
          tunnelIdentifier: "FAKE_ID"
        },
        sharedSauceParentAccount: "FAKE_PARENT_ACCOUNT"
      };

      return executor
        .setupRunner(mocks)
        .then(() => { })
        .catch(err => assert(false, "executor setupRunner isn't successful for use existing tunnel config"));
    });

    it("create new tunnel", () => {
      mocks.config = {
        tunnel: {
          useTunnels: true,
        }
      };

      return executor
        .setupRunner(mocks)
        .then(() => { })
        .catch(err => assert(false, "executor setupRunner isn't successful for create new tunnel config"));
    });

    it("create new tunnel failed in initialization", () => {
      mocks.config = {
        useTunnels: true
      };

      mocks.Tunnel = class Tunnel {
        constructor(config) { }
        initialize() { return new Promise((resolve, reject) => reject("initialization error")) }
        open() { return new Promise((resolve) => resolve()) }
      };

      return executor
        .setupRunner(mocks)
        .then(() => assert(false, "executor setupRunner isn't successful"))
        .catch(err => expect(err).to.equal("initialization error"));
    });

    it("create new tunnel failed in open", () => {
      mocks.config = {
        useTunnels: true
      };

      mocks.Tunnel = class Tunnel {
        constructor(config) { }
        initialize() { return new Promise((resolve) => resolve()) }
        open() { return new Promise((resolve, reject) => reject("open error")) }
      };

      return executor
        .setupRunner(mocks)
        .then(() => assert(false, "executor setupRunner isn't successful"))
        .catch(err => expect(err).to.equal("open error"));
    });
  });

  describe("teardownRunner", () => {
    it("no create tunnel", () => {
      let mocks = {
        Locks: class Locks {
          constructor(config) { }
          acquire(callback) { callback(1) }
          release(info, callback) { callback(2) }
          initialize() { return new Promise((resolve) => resolve()) }
          teardown() { }
        },

        Tunnel: class Tunnel {
          constructor(config) { }
          initialize() { return new Promise((resolve) => resolve()) }
          open() { return new Promise((resolve) => resolve()) }
        },

        config: { tunnel: {} }
      };

      return executor
        .setupRunner(mocks)
        .then(() => executor.teardownRunner())
        .catch(err => assert(false, "executor teardownRunner isn't successful for no create tunnel config"));
    });

    it("use tunnel", () => {
      let mocks = {
        Locks: class Locks {
          constructor(config) { }
          acquire(callback) { callback(1) }
          release(info, callback) { callback(2) }
          initialize() { return new Promise((resolve) => resolve()) }
          teardown() { }
        },

        Tunnel: class Tunnel {
          constructor(config) { }
          initialize() { return new Promise((resolve) => resolve()) }
          open() { return new Promise((resolve) => resolve()) }
          close() { return new Promise((resolve) => resolve()) }
        },

        config: {
          useTunnels: true,
          tunnel: {
            tunnelIdentifier: null
          }
        }
      };

      return executor
        .setupRunner(mocks)
        .then(() => executor.teardownRunner(mocks))
        .catch(err => assert(false, "executor teardownRunner isn't successful for use tunnel config"));
    });
  });

  it("setupTest", () => {
    let mocks = {
      Locks: class Locks {
        constructor(config) { }
        acquire(callback) { callback(1) }
        release(info, callback) { callback(2) }
        initialize() { return new Promise((resolve) => resolve()) }
        teardown() { }
      },

      Tunnel: class Tunnel {
        constructor(config) { }
        initialize() { return new Promise((resolve) => resolve()) }
        open() { return new Promise((resolve) => resolve()) }
      },

      config: { tunnel: {} }
    };

    return executor
      .setupRunner(mocks)
      .then(() => {
        executor.setupTest((num) => {
          expect(num).to.equal(1);
        });
      });
  });

  it("teardownTest", () => {
    let mocks = {
      Locks: class Locks {
        constructor(config) { }
        acquire(callback) { callback(1) }
        release(info) { }
        initialize() { return new Promise((resolve) => resolve()) }
        teardown() { }
      },

      Tunnel: class Tunnel {
        constructor(config) { }
        initialize() { return new Promise((resolve) => resolve()) }
        open() { return new Promise((resolve) => resolve()) }
      },

      config: { tunnel: {} }
    };

    return executor
      .setupRunner(mocks)
      .then(() => {
        executor.teardownTest("FAKE_TOKEN", (info) => {
          expect(info).to.equal("FAKE_TOKEN");
        });
      });
  });
});