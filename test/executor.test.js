"use strict";

const executor = require("../src/executor");

jest.mock("request", () => {
  return (opts, cb) => cb(null, {}, { is_public: false });
});

jest.mock("../src/settings", () => {
  return {
    config: {
      sauceOutboundProxy: "FAKE_OUTBOUND_PROXY"
    }
  }
});

describe("Executor", () => {
  test("execute", () => {
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
    expect(r).toBe(1);
  });

  describe("setupRunner", () => {
    let mocks;

    beforeEach(() => {
      mocks = {

        Tunnel: class Tunnel {
          constructor(config) { }
          initialize() { return new Promise((resolve) => resolve()) }
          open() { return new Promise((resolve) => resolve()) }
        },

        config: {}
      };
    });

    test("no create tunnel", () => {
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

    test("use existing tunnel", () => {
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

    test("create new tunnel", () => {
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

    test("create new tunnel failed in initialization", () => {
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
        .catch(err => expect(err).toBe("initialization error"));
    });

    test("create new tunnel failed in open", () => {
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
        .catch(err => expect(err).toBe("open error"));
    });
  });

  describe("teardownRunner", () => {
    test("no create tunnel", () => {
      let mocks = {

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

    test("use tunnel", () => {
      let mocks = {

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

  test("setupTest", () => {
    let mocks = {

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
        executor.setupTest(() => {
        });
      });
  });

  test("teardownTest", () => {
    let mocks = {

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
          expect(info).toBe("FAKE_TOKEN");
        });
      });
  });

  describe("summerizeTest", () => {
    test("no meta data in testResult", (done) => {
      executor.summerizeTest("FAKE_ID", {}, () => {
        done();
      });
    });

    test("successfully reported", (done) => {
      executor.summerizeTest("FAKE_ID", {
        metadata: {
          sessionId: "FAKE_SESSION_ID"
        }
      }, () => {
        done();
      });
    });
  });
});