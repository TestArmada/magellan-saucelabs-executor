import Tunnel from "../../lib/tunnel";
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

  it("constructor", () => {
    expect(tunnel.options.tunnel.username).to.equal("FAKE_USERNAME");
    expect(tunnel.options.tunnel.accessKey).to.equal("FAKE_ACCESSKEY");
    expect(tunnel.options.tunnel.tunnelIdentifier).to.equal("FAKE_TUNNELID");
    expect(tunnel.options.tunnel.fastFailRegexps).to.equal("FAKE_EXP");
  });

  describe("initialize", () => {
    it("successful", () => {
      return tunnel
        .initialize()
        .catch(err => assert(false, "tunnel isn't initialized correctly." + err));
    });

    it("missing username", () => {
      tunnel = new Tunnel({ tunnel: {} }, sauceConnectLauncherMock);

      return tunnel
        .initialize()
        .then(() => assert(false, "tunnel username isn't processed correctly"))
        .catch(err =>
          expect(Promise.resolve(err))
            .to.eventually
            .equal("Sauce tunnel support is missing configuration: Sauce username."));
    });

    it("missing accesskey", () => {
      tunnel = new Tunnel({ tunnel: { username: "FAKE_USERNAME" } }, sauceConnectLauncherMock);

      return tunnel
        .initialize()
        .then(() => assert(false, "tunnel accesskey isn't processed correctly"))
        .catch(err =>
          expect(Promise.resolve(err))
            .to.eventually
            .equal("Sauce tunnel support is missing configuration: Sauce access key."));
    });

    it("download error", () => {
      sauceConnectLauncherMock.download = (opts, callback) => { callback("FAKE_ERROR") };

      return tunnel
        .initialize()
        .then(() => assert(false, "tunnel download error isn't processed correctly"))
        .catch(err =>
          expect(Promise.resolve(err))
            .to.eventually
            .equal("FAKE_ERROR"));
    });
  });

  describe("open", function () {
    this.timeout(60000);

    it("straight succeed", () => {
      sauceConnectLauncherMock = (opts, callback) => {
        callback(null, "FAKE_TUNNEL_PROCESS");
      };

      tunnel = new Tunnel(options, sauceConnectLauncherMock);

      return tunnel
        .open()
        .then(() => expect(Promise.resolve(tunnel.tunnelInfo.process))
          .to.eventually.equal("FAKE_TUNNEL_PROCESS"))
        .catch(err => assert(false, "tunnel isn't open correctly." + err));
    });

    it("cannot start sauce connect", () => {
      sauceConnectLauncherMock = (opts, callback) => {
        callback(new Error("Could not start Sauce Connect"));
      };

      tunnel = new Tunnel(options, sauceConnectLauncherMock);

      return tunnel
        .open()
        .then(() => assert(false, "tunnel isn't launch correctly." + err))
        .catch(err => expect(Promise.resolve(err))
          .to.eventually.equal("Could not start Sauce Connect"));
    });

    it("retry 10 times", () => {
      sauceConnectLauncherMock = (opts, callback) => {
        callback(new Error("FAIL_ON_PURPOSE"));
      };

      tunnel = new Tunnel(options, sauceConnectLauncherMock);

      return tunnel
        .open()
        .then(() => assert(false, "tunnel isn't launch correctly." + err))
        .catch(err => expect(Promise.resolve(err.message))
          .to.eventually.equal("Failed to create a secure sauce tunnel after 10 attempts."));
    });
  });

  describe("close", () => {
    it("tunnel is already closed", () => {
      return tunnel
        .close()
        .catch(err => assert(false, "tunnel isn't close correctly." + err));
    });

    it("tunnel isn't closed", () => {
      tunnel.tunnelInfo = {
        process: {
          close(callback) { callback() }
        }
      };

      return tunnel
        .close()
        .catch(err => assert(false, "tunnel isn't close correctly." + err));
    });
  });
});