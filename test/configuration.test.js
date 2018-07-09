"use strict";

const configuration = require("../src/configuration");
const _ = require( "lodash");

describe("Configuration", () => {
  test("getConfig", () => {
    const config = configuration.getConfig();

    expect(config.tunnel.username).toBe(null);
    expect(config.tunnel.accessKey).toBe(null);
    expect(config.tunnel.connectVersion).toBe(null);
    expect(config.tunnel.tunnelIdentifier).toBe(null);
    expect(config.tunnel.fastFailRegexps).toBe(null);

    expect(config.sharedSauceParentAccount).toBe(null);
    expect(config.useTunnels).toBe(false);
  });

  describe("validateConfig", () => {
    test("Executor disabled", () => {
      let argvMock = {};
      let envMock = {};
      const config = configuration.validateConfig({}, argvMock, envMock);

      expect(config.tunnel.username).toBe(null);
      expect(config.tunnel.accessKey).toBe(null);
      expect(config.tunnel.connectVersion).toBe(null);
      expect(config.tunnel.tunnelIdentifier).toBe(null);
      expect(config.tunnel.fastFailRegexps).toBe(null);

      expect(config.sharedSauceParentAccount).toBe(null);
      expect(config.useTunnels).toBe(false);
    });

    describe("executor enabled", () => {
      let argvMock = {
        sauce_browsers: "chrome_latest_Windows_10_Desktop",
        sauce_browser: "chrome_latest_Windows_10_Desktop"
      };

      test("succeed", () => {
        let argvMock = {
          sauce_browsers: "chrome_latest_Windows_10_Desktop",
          sauce_browser: "chrome_latest_Windows_10_Desktop",
          sauce_create_tunnels: true,
          sauce_app: "fadfadfasdf",
          sauce_app_capabilities_config: "./test/config/app-capabilities-config.js"
        };
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION",
          SAUCE_TUNNEL_CLOSE_TIMEOUT: 400,
          SAUCE_TUNNEL_FAST_FAIL_REGEXPS: "a,b,c",
          SAUCE_OUTBOUND_PROXY: "FAKE_PROXY"
        };

        const config = configuration.validateConfig({}, argvMock, envMock);

        expect(config.tunnel.username).toBe("FAKE_USERNAME");
        expect(config.tunnel.accessKey).toBe("FAKE_ACCESSKEY");
        expect(config.tunnel.connectVersion).toBe("FAKE_VERSION");
        expect(config.tunnel.fastFailRegexps).toBe("a,b,c");

        expect(config.sharedSauceParentAccount).toBe(null);
        expect(config.useTunnels).toBe(true);
        expect(config.sauceOutboundProxy).toBe("FAKE_PROXY");
      });

      test("succeed with isEnabled", () => {
        let argvMock = {
          sauce_browsers: "chrome_latest_Windows_10_Desktop",
          sauce_browser: "chrome_latest_Windows_10_Desktop",
          sauce_create_tunnels: true
        };
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION",
          SAUCE_TUNNEL_CLOSE_TIMEOUT: 400,
          SAUCE_TUNNEL_FAST_FAIL_REGEXPS: "a,b,c"
        };

        const config = configuration.validateConfig({ isEnabled: true }, argvMock, envMock);

        expect(config.tunnel.username).toBe("FAKE_USERNAME");
        expect(config.tunnel.accessKey).toBe("FAKE_ACCESSKEY");
        expect(config.tunnel.connectVersion).toBe("FAKE_VERSION");
        expect(config.tunnel.fastFailRegexps).toBe("a,b,c");

        expect(config.sharedSauceParentAccount).toBe(null);
        expect(config.useTunnels).toBe(true);
      });

      test("missing SAUCE_USERNAME", () => {
        let envMock = {
          // SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };


        try {
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/tunnel.json" }),
            envMock);
          assert(false, "tunnel config shouldn't pass verification.");
        } catch (e) {
          expect(e.message).toBe("Missing configuration for Saucelabs connection.");
        }
      });

      test("missing SAUCE_ACCESS_KEY", () => {
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          // SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY",
          SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/tunnel.json" }),
            envMock);
          assert(false, "tunnel config shouldn't pass verification.");
        } catch (e) {
          expect(e.message).toBe("Missing configuration for Saucelabs connection.");
        }
      });

      test("missing SAUCE_CONNECT_VERSION", () => {
        let envMock = {
          SAUCE_USERNAME: "FAKE_USERNAME",
          SAUCE_ACCESS_KEY: "FAKE_ACCESSKEY"
          // SAUCE_CONNECT_VERSION: "FAKE_VERSION"
        };

        try {
          configuration.validateConfig({},
            _.assign({}, argvMock, { sauce_tunnel_config: "./test/tunnel.json" }),
            envMock);
        } catch (e) {
          assert(false, "tunnel config shouldn't fail verification.");
        }
      });

      test("co-existence of sauce_create_tunnels and sauce_tunnel_id", () => {
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
          expect(e.message).toMatch(/^Only one Saucelabs tunnel arg is allowed/);
        }
      });

      test("co-existence of sauce_create_tunnels and shared_sauce_parent_account", () => {
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
          expect(e.message).toMatch(/^--shared_sauce_parent_account only works with --sauce_tunnel_id/);
        }
      });

      test("config file doesn't exist", () => {
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
          expect(e.message).toMatch(/^Error: Cannot find module/);
        }
      });
    });
  });
});