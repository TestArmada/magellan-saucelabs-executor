import profile from "../../lib/profile";
import chai from "chai";
import chaiAsPromise from "chai-as-promised";
import _ from "lodash";

import logger from "../../lib/logger";

// eat console logs
// logger.output = {
//   log() { },
//   error() { },
//   debug() { },
//   warn() { },
//   loghelp() { }
// };

chai.use(chaiAsPromise);

const expect = chai.expect;
const assert = chai.assert;

describe("Profile", () => {
  describe("getNightwatchConfig", () => {
    let p = {};
    let ss = {};

    beforeEach(() => {
      p = {
        desiredCapabilities: {
          browser: "chrome"
        }
      };

      ss = {
        tunnel: {
          tunnelIdentifier: "FAKE_TUNNEL_ID",
          username: "FAME_USERNAME",
          accessKey: "FAKE_KEY"
        }
      };
    });

    it("only with tunnel id", () => {
      const config = profile.getNightwatchConfig(p, ss);
      expect(config.desiredCapabilities.browser).to.equal("chrome");
      expect(config.desiredCapabilities["tunnel-identifier"]).to.equal("FAKE_TUNNEL_ID");
      expect(config.desiredCapabilities["parent-tunnel"]).to.equal(undefined);
      expect(config.username).to.equal("FAME_USERNAME");
      expect(config.access_key).to.equal("FAKE_KEY");
    });

    it("with parent tunnel id", () => {
      ss.sharedSauceParentAccount = "FAKE_SHARED";

      const config = profile.getNightwatchConfig(p, ss);
      expect(config.desiredCapabilities.browser).to.equal("chrome");
      expect(config.desiredCapabilities["tunnel-identifier"]).to.equal("FAKE_TUNNEL_ID");
      expect(config.desiredCapabilities["parent-tunnel"]).to.equal("FAKE_SHARED");
      expect(config.username).to.equal("FAME_USERNAME");
      expect(config.access_key).to.equal("FAKE_KEY");
    });

    it("no tunnel id", () => {
      ss.tunnel.tunnelIdentifier = null;

      const config = profile.getNightwatchConfig(p, ss);
      expect(config.desiredCapabilities.browser).to.equal("chrome");
      expect(config.desiredCapabilities["tunnel-identifier"]).to.equal(undefined);
      expect(config.desiredCapabilities["parent-tunnel"]).to.equal(undefined);
      expect(config.username).to.equal("FAME_USERNAME");
      expect(config.access_key).to.equal("FAKE_KEY");
    });

    it("set proxy configuration", () => {
      ss.seleniumOutboundProxy = "FAKE_PROXY";
      const config = profile.getNightwatchConfig(p, ss);
      expect(config.proxy).to.equal("FAKE_PROXY");
    });

  });

  describe("getProfiles", () => {
    it("with sauce_browser", () => {
      let argvMock = {
        sauce_browser: "chrome_latest_Windows_10_Desktop"
      };

      return profile
        .getProfiles({}, argvMock)
        .then((profile) => {
          expect(profile.desiredCapabilities.browserName).to.equal("chrome");
          expect(profile.desiredCapabilities.version).to.equal("58");
          expect(profile.desiredCapabilities.platform).to.equal("Windows 10");
          expect(profile.executor).to.equal("sauce");
          expect(profile.nightwatchEnv).to.equal("sauce");
          expect(profile.id).to.equal("chrome_latest_Windows_10_Desktop");
        });
    });

    it("with sauce_browsers", () => {
      let argvMock = {
        sauce_browsers: "chrome_latest_Windows_10_Desktop, safari_10_OS_X_10_11_Desktop"
      };

      return profile
        .getProfiles({}, argvMock)
        .then((profiles) => {
          expect(profiles.length).to.equal(2);
          expect(profiles[0].desiredCapabilities.browserName).to.equal("chrome");
          expect(profiles[0].desiredCapabilities.version).to.equal("58");
          expect(profiles[0].desiredCapabilities.platform).to.equal("Windows 10");
          expect(profiles[0].executor).to.equal("sauce");
          expect(profiles[0].nightwatchEnv).to.equal("sauce");
          expect(profiles[0].id).to.equal("chrome_latest_Windows_10_Desktop");
          expect(profiles[1].desiredCapabilities.browserName).to.equal("safari");
          expect(profiles[1].desiredCapabilities.version).to.equal("10");
          expect(profiles[1].desiredCapabilities.platform).to.equal("OS X 10.11");
          expect(profiles[1].executor).to.equal("sauce");
          expect(profiles[1].nightwatchEnv).to.equal("sauce");
          expect(profiles[1].id).to.equal("safari_10_OS_X_10_11_Desktop");
        });
    });

    it("without param", () => {
      let argvMock = {};

      return profile
        .getProfiles({}, argvMock)
        .then((thing) => {
          expect(thing).to.equal(undefined);
        });
    });
  });

  describe("getCapabilities", () => {
    it("desktop web", () => {
      let p = {
        "browser": "microsoftedge_14_Windows_10_Desktop",
        "resolution": "1280x1024",
        "executor": "sauce"
      };

      return profile
        .getCapabilities(p)
        .then((result) => {
          expect(result.desiredCapabilities.browserName).to.equal("microsoftedge");
          expect(result.desiredCapabilities.version).to.equal("14");
          expect(result.desiredCapabilities.platform).to.equal("Windows 10");
          expect(result.executor).to.equal("sauce");
          expect(result.nightwatchEnv).to.equal("sauce");
          expect(result.id).to.equal("microsoftedge_14_Windows_10_Desktop");
        });
    });

    it("mobile device", () => {
      let p = {
        "browser": "iphone_9_2_iOS_iPhone_Simulator",
        "orientation": "portrait",
        "executor": "sauce"
      };

      return profile
        .getCapabilities(p)
        .then((result) => {
          expect(result.desiredCapabilities.browserName).to.equal("iphone");
          expect(result.desiredCapabilities.version).to.equal("9.2");
          expect(result.desiredCapabilities.platform).to.equal("iOS");
          expect(result.desiredCapabilities.deviceName).to.equal("iPhone Simulator");
          expect(result.desiredCapabilities.deviceOrientation).to.equal("portrait");
          expect(result.executor).to.equal("sauce");
          expect(result.nightwatchEnv).to.equal("sauce");
          expect(result.id).to.equal("iphone_9_2_iOS_iPhone_Simulator");
        });
    });
  });

  describe("listBrowsers", () => {
    it("from sauce", (done) => {
      return profile
        .listBrowsers({}, (err, browserTable) => {
          expect(err).to.equal(null);
          expect(browserTable.length).to.be.above(0);
          done();
        });
    });

    it("from local file", (done) => {
      return profile
        .listBrowsers({}, (err, browserTable) => {
          expect(err).to.equal(null);
          expect(browserTable.length).to.be.above(0);
          done();
        }, { device_additions: "./test/src/devices.json" });
    });
  });

});