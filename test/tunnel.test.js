"use strict";

const Tunnel = require("../src/tunnel");
const _ = require("lodash");

describe("Tunnel", () => {
  let tunnel;

  let options = {
    tunnel: {
      username: "FAKE_USERNAME",
      accessKey: "FAKE_ACCESSKEY",
      tunnelIdentifier: "FAKE_TUNNELID",
      fastFailRegexps: "FAKE_EXP"
    }
  };

  let sauceConnectLauncherMock = {
    download(opts, callback) {
      callback(null);
    }
  };

  beforeEach(() => {
    tunnel = new Tunnel(options, sauceConnectLauncherMock);
  });

  test("constructor", () => {
    expect(tunnel.options.tunnel.username).toBe("FAKE_USERNAME");
    expect(tunnel.options.tunnel.accessKey).toBe("FAKE_ACCESSKEY");
    expect(tunnel.options.tunnel.tunnelIdentifier).toBe("FAKE_TUNNELID");
    expect(tunnel.options.tunnel.fastFailRegexps).toBe("FAKE_EXP");
  });

  describe("initialize", () => {
    test("successful", () => {
      return tunnel
        .initialize()
        .catch(err => assert(false, "tunnel isn't initialized correctly." + err));
    });

    test("missing username", () => {
      tunnel = new Tunnel({ tunnel: {} }, sauceConnectLauncherMock);

      return tunnel
        .initialize()
        .then(() => assert(false, "tunnel username isn't processed correctly"))
        .catch(err =>
          expect(err)
            .toBe("Sauce tunnel support is missing configuration: Sauce username."));
    });

    test("missing accesskey", () => {
      tunnel = new Tunnel({ tunnel: { username: "FAKE_USERNAME" } }, sauceConnectLauncherMock);

      return tunnel
        .initialize()
        .then(() => assert(false, "tunnel accesskey isn't processed correctly"))
        .catch(err =>
          expect(err)
            .toBe("Sauce tunnel support is missing configuration: Sauce access key."));
    });

    test("download error", () => {
      sauceConnectLauncherMock.download = (opts, callback) => { callback("FAKE_ERROR") };

      return tunnel
        .initialize()
        .then(() => assert(false, "tunnel download error isn't processed correctly"))
        .catch(err =>
          expect(err)
            .toBe("FAKE_ERROR"));
    });
  });

  describe("open", function () {

    test("straight succeed", () => {
      sauceConnectLauncherMock = (opts, callback) => {
        callback(null, "FAKE_TUNNEL_PROCESS");
      };

      tunnel = new Tunnel(options, sauceConnectLauncherMock);

      return tunnel
        .open()
        .then(() => expect(tunnel.tunnelInfo.process)
          .toBe("FAKE_TUNNEL_PROCESS"))
        .catch(err => assert(false, "tunnel isn't open correctly." + err));
    });

    test("cannot start sauce connect", () => {
      sauceConnectLauncherMock = (opts, callback) => {
        callback(new Error("Could not start Sauce Connect"));
      };

      tunnel = new Tunnel(options, sauceConnectLauncherMock);

      return tunnel
        .open()
        .then(() => assert(false, "tunnel isn't launch correctly." + err))
        .catch(err => expect(err)
          .toBe("Could not start Sauce Connect"));
    });

    test("retry 10 times", () => {
      sauceConnectLauncherMock = (opts, callback) => {
        callback(new Error("FAIL_ON_PURPOSE"));
      };

      tunnel = new Tunnel(options, sauceConnectLauncherMock);

      return tunnel
        .open()
        .then(() => assert(false, "tunnel isn't launch correctly." + err))
        .catch(err => expect(err.message)
          .toBe("Failed to create a secure sauce tunnel after 10 attempts."));
    });
  });

  describe("close", () => {
    test("tunnel is already closed", () => {
      return tunnel
        .close()
        .catch(err => assert(false, "tunnel isn't close correctly." + err));
    });

    test("tunnel isn't closed", () => {
      tunnel.tunnelInfo = {
        process: {
          close: (callback) => callback()
        }
      };

      return tunnel
        .close()
        .catch(err => assert(false, "tunnel isn't close correctly." + err));
    });
  });
});