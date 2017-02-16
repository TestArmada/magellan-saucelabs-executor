import executor from "../../lib/executor";
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

  describe("setup", () => {
    let mocks;

    beforeEach(() => {
      mocks = {
        Locks: class Locks {
          constructor(config) { }
          acquire(callback) { callabck() }
          release(info, callback) { callback() }
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
        useTunnels: null
      };

      return executor
        .setup(mocks)
        .then(() => { })
        .catch(err => assert(false, "executor setup isn't successful for no create tunnel config"));
    });

    it("use existing tunnel", () => {
      mocks.config = {
        useTunnels: null,
        sauceTunnelId: "FAKE_ID",
        sharedSauceParentAccount: "FAKE_PARENT_ACCOUNT"
      };

      return executor
        .setup(mocks)
        .then(() => { })
        .catch(err => assert(false, "executor setup isn't successful for use existing tunnel config"));
    });

    it("create new tunnel", () => {
      mocks.config = {
        useTunnels: true,
      };

      return executor
        .setup(mocks)
        .then(() => { })
        .catch(err => assert(false, "executor setup isn't successful for create new tunnel config"));
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
        .setup(mocks)
        .then(() => assert(false, "executor setup isn't successful"))
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
        .setup(mocks)
        .then(() => assert(false, "executor setup isn't successful"))
        .catch(err => expect(err).to.equal("open error"));
    });
  });

  describe("teardown", () => {
    it("no create tunnel", () => {
      let mocks = {
        Locks: class Locks {
          constructor(config) { }
          acquire(callback) { callback(1) }
          release(info, callback) { callback(2) }
        },

        Tunnel: class Tunnel {
          constructor(config) { }
          initialize() { return new Promise((resolve) => resolve()) }
          open() { return new Promise((resolve) => resolve()) }
        },

        config: {}
      };

      return executor
        .setup(mocks)
        .then(() => executor.teardown())
        .catch(err => assert(false, "executor teardown isn't successful for no create tunnel config"));
    });

    it("use tunnel", () => {
      let mocks = {
        Locks: class Locks {
          constructor(config) { }
          acquire(callback) { callback(1) }
          release(info, callback) { callback(2) }
        },

        Tunnel: class Tunnel {
          constructor(config) { }
          initialize() { return new Promise((resolve) => resolve()) }
          open() { return new Promise((resolve) => resolve()) }
          close() { return new Promise((resolve) => resolve()) }
        },

        config: {
          useTunnels: true
        }
      };

      return executor
        .setup(mocks)
        .then(() => executor.teardown(mocks))
        .catch(err => assert(false, "executor teardown isn't successful for use tunnel config"));
    });
  });

  it("stage", () => {
    let mocks = {
      Locks: class Locks {
        constructor(config) { }
        acquire(callback) { callback(1) }
        release(info, callback) { callback(2) }
      },

      Tunnel: class Tunnel {
        constructor(config) { }
        initialize() { return new Promise((resolve) => resolve()) }
        open() { return new Promise((resolve) => resolve()) }
      },

      config: {}
    };

    return executor
      .setup(mocks)
      .then(() => {
        executor.stage((num) => {
          expect(num).to.equal(1);
        });
      });
  });

  it("wrapup", () => {
    let mocks = {
      Locks: class Locks {
        constructor(config) { }
        acquire(callback) { callback(1) }
        release(info, callback) { callback(info) }
      },

      Tunnel: class Tunnel {
        constructor(config) { }
        initialize() { return new Promise((resolve) => resolve()) }
        open() { return new Promise((resolve) => resolve()) }
      },

      config: {}
    };

    return executor
      .setup(mocks)
      .then(() => {
        executor.wrapup("FAKE_TOKEN", (info) => {
          expect(info).to.equal("FAKE_TOKEN");
        });
      });
  });
});