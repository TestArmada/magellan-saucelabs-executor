import configuration from "../../lib/configuration";
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

describe("Configuration", () => {
  it("getConfig", () => {
    const config = configuration.getConfig();

    expect(config.username).to.equal(null);
    expect(config.accessKey).to.equal(null);
    expect(config.sauceConnectVersion).to.equal(null);
    expect(config.sauceTunnelId).to.equal(null);
    expect(config.sharedSauceParentAccount).to.equal(null);
    expect(config.tunnelTimeout).to.equal(null);
    expect(config.useTunnels).to.equal(null);
    expect(config.fastFailRegexps).to.equal(null);
    expect(config.locksServerLocation).to.equal(null);

    expect(config.maxTunnels).to.equal(1);
    expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
    expect(config.locksPollingInterval).to.equal(2500);
    expect(config.locksRequestTimeout).to.equal(2500);
  });

  describe("validateConfig", () => {
    it("Executor disabled", () => {
      let argvMock = {};

      const config = configuration.validateConfig({}, {}, {});

      expect(config.username).to.equal(undefined);
      expect(config.accessKey).to.equal(undefined);
      expect(config.sauceConnectVersion).to.equal(undefined);
      expect(config.sauceTunnelId).to.equal(undefined);
      expect(config.sharedSauceParentAccount).to.equal(undefined);
      expect(config.tunnelTimeout).to.equal(undefined);
      expect(config.useTunnels).to.equal(false);
      expect(config.fastFailRegexps).to.equal(undefined);
      expect(config.locksServerLocation).to.equal(undefined);

      expect(config.maxTunnels).to.equal(1);
      expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
      expect(config.locksPollingInterval).to.equal(2500);
      expect(config.locksRequestTimeout).to.equal(2500);
    });

    describe("executor enabled", () => {
      let argvMock = {
        sauce_browsers: "chrome_latest_Windows_10_Desktop",
        sauce_browser: "chrome_latest_Windows_10_Desktop"
      };

      it("succeed", () => {
        let argvMock = {
          sauce_browsers: "chrome_latest_Windows_10_Desktop",
          sauce_browser: "chrome_latest_Windows_10_Desktop",
          sauce_create_tunnels: true
        };
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION",
          LOCKS_SERVER: "FAKE_LOCKSERVER/",
          SAUCE_TUNNEL_CLOSE_TIMEOUT: 400,
          SAUCE_TUNNEL_FAST_FAIL_REGEXPS: "a,b,c"
        };

        const config = configuration.validateConfig({}, argvMock, envMock);

        expect(config.username).to.equal("FAKE_USERNAME");
        expect(config.accessKey).to.equal("FAKE_ACCESSKEY");
        expect(config.sauceConnectVersion).to.equal("FAKE_VERSION");
        expect(config.sauceTunnelId).to.be.a("string");
        expect(config.sharedSauceParentAccount).to.equal(undefined);
        expect(config.tunnelTimeout).to.equal(400);
        expect(config.useTunnels).to.equal(true);
        expect(config.fastFailRegexps).to.equal("a,b,c");
        expect(config.locksServerLocation).to.equal("FAKE_LOCKSERVER");

        expect(config.maxTunnels).to.equal(1);
        expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
        expect(config.locksPollingInterval).to.equal(2500);
        expect(config.locksRequestTimeout).to.equal(2500);
      });

      it("missing SAUCE_USERNAME", () => {
        let envMock = {
          // SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({}, argvMock, envMock);
          assert(false, "tunnel config shouldn't pass verification.");
        } catch (e) {
          expect(e.message).to.equal("Missing configuration for Saucelabs connection.");
        }
      });

      it("missing SAUCE_ACCESS_KEY", () => {
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          // SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({}, argvMock, envMock);
          assert(false, "tunnel config shouldn't pass verification.");
        } catch (e) {
          expect(e.message).to.equal("Missing configuration for Saucelabs connection.");
        }
      });

      it("missing SAUCE_CONNECT_VERSION", () => {
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY"
          // SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({}, argvMock, envMock);
        } catch (e) {
          assert(false, "tunnel config shouldn't fail verification.");
        }
      });

      it("co-existence of sauce_create_tunnels and sauce_tunnel_id", () => {
        let argvMock = {
          sauce_browsers: "chrome_latest_Windows_10_Desktop",
          sauce_browser: "chrome_latest_Windows_10_Desktop",
          sauce_create_tunnels: true,
          sauce_tunnel_id: "FAKE_TUNNELUD"
        };

        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({}, argvMock, envMock);
        } catch (e) {
          expect(e.message).to.match(/^Only one Saucelabs tunnel arg is allowed/);
        }
      });

      it("co-existence of sauce_create_tunnels and shared_sauce_parent_account", () => {
        let argvMock = {
          sauce_browsers: "chrome_latest_Windows_10_Desktop",
          sauce_browser: "chrome_latest_Windows_10_Desktop",
          sauce_create_tunnels: true,
          shared_sauce_parent_account: "FAKE_PARENTID"
        };

        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({}, argvMock, envMock);
        } catch (e) {
          expect(e.message).to.match(/^--shared_sauce_parent_account only works with --sauce_tunnel_id/);
        }
      });
    });
  });
});