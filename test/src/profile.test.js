import profile from "../../lib/profile";
import configuration from "../../lib/configuration";
import chai from "chai";
import path from "path";
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
      ss.sauceOutboundProxy = "FAKE_PROXY";
      const config = profile.getNightwatchConfig(p, ss);
      expect(config.proxy).to.equal("FAKE_PROXY");
    });

  });

  describe("getProfiles", () => {
    it("with sauce_browser", () => {
      let settings = configuration.getConfig();

      settings.appCapabilitiesConfig = {
        chrome_latest_Windows_10_Desktop: {
          "appiumVersion": "1.6.6",
          "automationName": "XCUITest",
          "sendKeyStrategy": "setValue",
          "locationServicesAuthorized": "false",
          "bundleId": "com.beta.electronics",
          "locationServicesEnabled": "true"
        }
      };
      let argvMock = {
        sauce_browser: "chrome_latest_Windows_10_Desktop"
      };

      return profile
        .getProfiles({}, argvMock)
        .then((profile) => {
          expect(profile.desiredCapabilities.browserName).to.equal("chrome");
          expect(profile.desiredCapabilities.version).to.equal("61");
          expect(profile.desiredCapabilities.platform).to.equal("Windows 10");
          expect(profile.desiredCapabilities.appiumVersion).to.equal("1.6.6");
          expect(profile.desiredCapabilities.automationName).to.equal("XCUITest");
          expect(profile.desiredCapabilities.sendKeyStrategy).to.equal("setValue");
          expect(profile.desiredCapabilities.locationServicesAuthorized).to.equal("false");
          expect(profile.desiredCapabilities.bundleId).to.equal("com.beta.electronics");
          expect(profile.desiredCapabilities.locationServicesEnabled).to.equal("true");
          expect(profile.executor).to.equal("sauce");
          expect(profile.nightwatchEnv).to.equal("sauce");
          expect(profile.id).to.equal("chrome_latest_Windows_10_Desktop");

          delete settings.appCapabilitiesConfig;
        });
    });

    it("with sauce_browsers", () => {
      let argvMock = {
        sauce_browsers: "chrome_latest_Windows_10_Desktop, safari_10_OS_X_10_11_Desktop"
      };

      let settings = configuration.getConfig();
      settings.appCapabilitiesConfig = {
        chrome_latest_Windows_10_Desktop: {
          "appiumVersion": "1.6.6",
          "automationName": "XCUITest",
          "sendKeyStrategy": "setValue",
          "locationServicesAuthorized": "false",
          "bundleId": "com.beta.electronics",
          "locationServicesEnabled": "true"
        },
        safari_10_OS_X_10_11_Desktop: {
          "appiumVersion": "1.6.6",
          "automationName": "XCUITest",
          "sendKeyStrategy": "setValue",
          "locationServicesAuthorized": "false",
          "bundleId": "com.beta.electronics",
          "locationServicesEnabled": "true"
        }
      };


      return profile
        .getProfiles({}, argvMock)
        .then((profiles) => {
          expect(profiles.length).to.equal(2);
          expect(profiles[0].desiredCapabilities.browserName).to.equal("chrome");
          expect(profiles[0].desiredCapabilities.version).to.equal("61");
          expect(profiles[0].desiredCapabilities.platform).to.equal("Windows 10");
          expect(profiles[0].desiredCapabilities.appiumVersion).to.equal("1.6.6");
          expect(profiles[0].desiredCapabilities.automationName).to.equal("XCUITest");
          expect(profiles[0].desiredCapabilities.sendKeyStrategy).to.equal("setValue");
          expect(profiles[0].desiredCapabilities.locationServicesAuthorized).to.equal("false");
          expect(profiles[0].desiredCapabilities.bundleId).to.equal("com.beta.electronics");
          expect(profiles[0].desiredCapabilities.locationServicesEnabled).to.equal("true");

          expect(profiles[0].executor).to.equal("sauce");
          expect(profiles[0].nightwatchEnv).to.equal("sauce");
          expect(profiles[0].id).to.equal("chrome_latest_Windows_10_Desktop");
          expect(profiles[1].desiredCapabilities.browserName).to.equal("safari");
          expect(profiles[1].desiredCapabilities.version).to.equal("10");
          expect(profiles[1].desiredCapabilities.platform).to.equal("OS X 10.11");
          expect(profiles[1].desiredCapabilities.appiumVersion).to.equal("1.6.6");
          expect(profiles[1].desiredCapabilities.automationName).to.equal("XCUITest");
          expect(profiles[1].desiredCapabilities.sendKeyStrategy).to.equal("setValue");
          expect(profiles[1].desiredCapabilities.locationServicesAuthorized).to.equal("false");
          expect(profiles[1].desiredCapabilities.bundleId).to.equal("com.beta.electronics");
          expect(profiles[1].desiredCapabilities.locationServicesEnabled).to.equal("true");

          expect(profiles[1].executor).to.equal("sauce");
          expect(profiles[1].nightwatchEnv).to.equal("sauce");
          expect(profiles[1].id).to.equal("safari_10_OS_X_10_11_Desktop");

          delete settings.appCapabilitiesConfig;
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

    it("appCapabilitiesConfig valid", () => {
      let p = {
        "browser": "iphone_10_3_iOS_iPhone_7_Simulator",
        "orientation": "portrait",
        "appCapabilitiesConfig": "./test/config/app-capabilities-config.js",
        "appium": {
          "appiumVersion": "1.6.1", // exists in appCapabilitiesConfig too,
          "waitForAppScript": "true", // local to this config
        }
      };

      return profile
        .getCapabilities(p)
        .then((result) => {
          expect(result.desiredCapabilities.browserName).to.equal(undefined);
          expect(result.desiredCapabilities.version).to.equal("10.3");
          expect(result.desiredCapabilities.platform).to.equal("iOS");
          expect(result.desiredCapabilities.deviceName).to.equal("iPhone 7 Simulator");
          expect(result.desiredCapabilities.app).to.equal("sauce-storage:App.zip");
          expect(result.desiredCapabilities.appiumVersion).to.equal("1.6.5");
          expect(result.desiredCapabilities.automationName).to.equal("XCUITest");
          expect(result.desiredCapabilities.sendKeyStrategy).to.equal("setValue");
          expect(result.desiredCapabilities.waitForAppScript).to.equal("true");
          expect(result.desiredCapabilities.locationServicesAuthorized).to.equal("false");
          expect(result.desiredCapabilities.bundleId).to.equal("com.beta.electronics");
          expect(result.desiredCapabilities.deviceOrientation).to.equal("portrait");
          expect(result.id).to.equal("iphone_10_3_iOS_iPhone_7_Simulator");
      });

    });


    it("appCapabilitiesConfig if non existent appCapabilitiesConfig", () => {
      let p = {
        "browser": "iphone_10_3_iOS_iPhone_7_Simulator",
        "orientation": "portrait",
        "appCapabilitiesConfig": "./test/config/does-not-exist.js"
      };

      return profile
          .getCapabilities(p)
          .catch((error) => {
            expect(error).to.not.be.undefined;
            expect(error).to.equal('Executor sauce cannot resolve profile {"browser":"iphone_10_3_iOS_iPhone_7_Simulator","orientation":"portrait","appCapabilitiesConfig":"./test/config/does-not-exist.js"}');
          });
    });


    it("appCapabilitiesConfig if browser is not found in appCapabilitiesConfig", () => {
      let p = {
        "browser": "invalid_browser_key",
        "orientation": "portrait",
        "appCapabilitiesConfig": "./test/config/app-capabilities-config.js"
      };

    return profile
        .getCapabilities(p)
        .catch((error) => {
          expect(error).to.not.be.undefined;
          expect(error).to.equal('Executor sauce cannot resolve profile {"browser":"invalid_browser_key","orientation":"portrait","appCapabilitiesConfig":"./test/config/app-capabilities-config.js"}');
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