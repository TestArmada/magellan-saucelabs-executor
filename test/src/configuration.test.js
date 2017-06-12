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

    expect(config.tunnel.username).to.equal(null);
    expect(config.tunnel.accessKey).to.equal(null);
    expect(config.tunnel.connectVersion).to.equal(null);
    expect(config.tunnel.tunnelIdentifier).to.equal(null);
    expect(config.tunnel.fastFailRegexps).to.equal(null);

    expect(config.sharedSauceParentAccount).to.equal(null);
    expect(config.useTunnels).to.equal(false);

    expect(config.locksServerLocation).to.equal(null);
    expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
    expect(config.locksPollingInterval).to.equal(5000);
    expect(config.locksRequestTimeout).to.equal(5000);
  });

  describe("validateConfig", () => {
    it("Executor disabled", () => {
      let argvMock = {};
      let envMock = {};
      const config = configuration.validateConfig({}, argvMock, envMock);

      expect(config.tunnel.username).to.equal(null);
      expect(config.tunnel.accessKey).to.equal(null);
      expect(config.tunnel.connectVersion).to.equal(null);
      expect(config.tunnel.tunnelIdentifier).to.equal(null);
      expect(config.tunnel.fastFailRegexps).to.equal(null);

      expect(config.sharedSauceParentAccount).to.equal(null);
      expect(config.useTunnels).to.equal(false);

      expect(config.locksServerLocation).to.equal(undefined);
      expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
      expect(config.locksPollingInterval).to.equal(5000);
      expect(config.locksRequestTimeout).to.equal(5000);
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
          SAUCE_TUNNEL_FAST_FAIL_REGEXPS: "a,b,c",
          SAUCE_OUTBOUND_PROXY: "FAKE_PROXY"
        };

        const config = configuration.validateConfig({}, argvMock, envMock);

        expect(config.tunnel.username).to.equal("FAKE_USERNAME");
        expect(config.tunnel.accessKey).to.equal("FAKE_ACCESSKEY");
        expect(config.tunnel.connectVersion).to.equal("FAKE_VERSION");
        expect(config.tunnel.tunnelIdentifier).to.be.a("string");
        expect(config.tunnel.fastFailRegexps).to.equal("a,b,c");

        expect(config.sharedSauceParentAccount).to.equal(null);
        expect(config.useTunnels).to.equal(true);
        expect(config.sauceOutboundProxy).to.equal("FAKE_PROXY");

        expect(config.locksServerLocation).to.equal("FAKE_LOCKSERVER");
        expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
        expect(config.locksPollingInterval).to.equal(5000);
        expect(config.locksRequestTimeout).to.equal(5000);
      });

      it("succeed with isEnabled", () => {
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

        const config = configuration.validateConfig({ isEnabled: true }, argvMock, envMock);

        expect(config.tunnel.username).to.equal("FAKE_USERNAME");
        expect(config.tunnel.accessKey).to.equal("FAKE_ACCESSKEY");
        expect(config.tunnel.connectVersion).to.equal("FAKE_VERSION");
        expect(config.tunnel.tunnelIdentifier).to.be.a("string");
        expect(config.tunnel.fastFailRegexps).to.equal("a,b,c");

        expect(config.sharedSauceParentAccount).to.equal(null);
        expect(config.useTunnels).to.equal(true);

        expect(config.locksServerLocation).to.equal("FAKE_LOCKSERVER");
        expect(config.locksOutageTimeout).to.equal(1000 * 60 * 5);
        expect(config.locksPollingInterval).to.equal(5000);
        expect(config.locksRequestTimeout).to.equal(5000);
      });

      it("missing SAUCE_USERNAME", () => {
        let envMock = {
          // SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };


        try {
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/src/tunnel.json" }),
            envMock);
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
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/src/tunnel.json" }),
            envMock);
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
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/src/tunnel.json" }),
            envMock);
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

      it("config file doesn't exist", () => {
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/src/nonetunnel.json" }),
            envMock);
        } catch (e) {
          expect(e.message).to.match(/^Error: Cannot find module/);
        }
      });
    });
  });
});