"use strict";

const profile = require("../src/profile");
const configuration = require("../src/configuration");

jest.mock("guacamole");
const SauceBrowsers = require("guacamole");

jest.mock("../src/logger", () => {
  return {
    debug(msg) { },
    log(msg) { },
    warn(msg) { },
    err(msg) { },
    loghelp(msg) { },
    stringifyLog(msg) { },
    stringifyWarn(msg) { },
    stringifyErr(msg) { }
  }
});

jest.mock("guacamole/src/cli_list", () => {
    return (cb) => {
        const ret = [{}];
        ret.options = {
            head:[]
        }
        cb(ret)
    };
});

describe("Profile", () => {
  beforeEach(() => {
    SauceBrowsers.initialize = jest.fn( () => Promise.resolve());
    SauceBrowsers.get.mockImplementation((id) => {
        switch(id.id){
            case "chrome_67_Windows_10_Desktop":
            return [{
                browserName: "chrome",
                version: "67",
                platform: "Windows 10",
                appiumVersion: "1.6.6"
            }];
            case "safari_10_OS_X_10_11_Desktop":
            return [{
                browserName: "safari",
                version: "10",
                platform: "OS X 10.11",
                appiumVersion: "1.6.6"
            }];
            case "MicrosoftEdge_14_Windows_10_Desktop":
            return [{
                browserName: "MicrosoftEdge",
                version: "14",
                platform: "Windows 10",
                appiumVersion: "1.6.6"
            }];
            case "iphone_12_2_iOS_iPhone_Simulator":
            return [{
                deviceName: "iPhone Simulator",
                browserName: "iphone",
                deviceOrientation: "portrait",
                version: "12.2",
                platform: "iOS",
            }];
            case "iphone_10_3_iOS_iPhone_7_Simulator":
            return [{
                deviceName: "iPhone 7 Simulator",
                browserName: "iphone",
                deviceOrientation: "portrait",
                version: "10.3",
                platform: "iOS",
            }];
            default:
            return [{
                browserName: "safari",
                version: "10",
                platform: "OS X 10.11",
                appiumVersion: "1.6.6"
            }];
        }
    });
  });
      
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

    test("only with tunnel id", () => {
      const config = profile.getNightwatchConfig(p, ss);
      expect(config.desiredCapabilities.browser).toBe("chrome");
      expect(config.desiredCapabilities["tunnel-identifier"]).toBe("FAKE_TUNNEL_ID");
      expect(config.desiredCapabilities["parent-tunnel"]).toBe(undefined);
      expect(config.username).toBe("FAME_USERNAME");
      expect(config.access_key).toBe("FAKE_KEY");
    });

    test("with parent tunnel id", () => {
      ss.sharedSauceParentAccount = "FAKE_SHARED";

      const config = profile.getNightwatchConfig(p, ss);
      expect(config.desiredCapabilities.browser).toBe("chrome");
      expect(config.desiredCapabilities["tunnel-identifier"]).toBe("FAKE_TUNNEL_ID");
      expect(config.desiredCapabilities["parent-tunnel"]).toBe("FAKE_SHARED");
      expect(config.username).toBe("FAME_USERNAME");
      expect(config.access_key).toBe("FAKE_KEY");
    });

    test("no tunnel id", () => {
      ss.tunnel.tunnelIdentifier = null;

      const config = profile.getNightwatchConfig(p, ss);
      expect(config.desiredCapabilities.browser).toBe("chrome");
      expect(config.desiredCapabilities["tunnel-identifier"]).toBe(undefined);
      expect(config.desiredCapabilities["parent-tunnel"]).toBe(undefined);
      expect(config.username).toBe("FAME_USERNAME");
      expect(config.access_key).toBe("FAKE_KEY");
    });

    test("set proxy configuration", () => {
      ss.sauceOutboundProxy = "FAKE_PROXY";
      const config = profile.getNightwatchConfig(p, ss);
      expect(config.proxy).toBe("FAKE_PROXY");
    });

  });

  describe("getProfiles", () => {
    test("with sauce_browser", () => {
      let settings = configuration.getConfig();

      settings.appCapabilitiesConfig = {
        chrome_67_Windows_10_Desktop: {
          "appiumVersion": "1.6.6",
          "automationName": "XCUITest",
          "sendKeyStrategy": "setValue",
          "locationServicesAuthorized": "false",
          "bundleId": "com.beta.electronics",
          "locationServicesEnabled": "true"
        }
      };
      let argvMock = {
        sauce_browser: "chrome_67_Windows_10_Desktop"
      };
      return profile
        .getProfiles({}, argvMock)
        .then((profile) => {
          expect(SauceBrowsers.initialize).toBeCalled();
          expect(profile.desiredCapabilities.browserName).toBe("chrome");
          expect(profile.desiredCapabilities.version).toBe("67");
          expect(profile.desiredCapabilities.platform).toBe("Windows 10");
          expect(profile.desiredCapabilities.appiumVersion).toBe("1.6.6");
          expect(profile.desiredCapabilities.automationName).toBe("XCUITest");
          expect(profile.desiredCapabilities.sendKeyStrategy).toBe("setValue");
          expect(profile.desiredCapabilities.locationServicesAuthorized).toBe("false");
          expect(profile.desiredCapabilities.bundleId).toBe("com.beta.electronics");
          expect(profile.desiredCapabilities.locationServicesEnabled).toBe("true");
          expect(profile.executor).toBe("sauce");
          expect(profile.nightwatchEnv).toBe("sauce");
          expect(profile.id).toBe("chrome_67_Windows_10_Desktop");

          delete settings.appCapabilitiesConfig;
        });
    });

    test("with sauce_browsers", () => {
      let argvMock = {
        sauce_browsers: "chrome_67_Windows_10_Desktop, safari_10_OS_X_10_11_Desktop"
      };

      let settings = configuration.getConfig();
      settings.appCapabilitiesConfig = {
        chrome_67_Windows_10_Desktop: {
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
          expect(SauceBrowsers.initialize).toBeCalled();
          expect(profiles.length).toBe(2);
          expect(profiles[0].desiredCapabilities.browserName).toBe("chrome");
          expect(profiles[0].desiredCapabilities.version).toBe("67");
          expect(profiles[0].desiredCapabilities.platform).toBe("Windows 10");
          expect(profiles[0].desiredCapabilities.appiumVersion).toBe("1.6.6");
          expect(profiles[0].desiredCapabilities.automationName).toBe("XCUITest");
          expect(profiles[0].desiredCapabilities.sendKeyStrategy).toBe("setValue");
          expect(profiles[0].desiredCapabilities.locationServicesAuthorized).toBe("false");
          expect(profiles[0].desiredCapabilities.bundleId).toBe("com.beta.electronics");
          expect(profiles[0].desiredCapabilities.locationServicesEnabled).toBe("true");

          expect(profiles[0].executor).toBe("sauce");
          expect(profiles[0].nightwatchEnv).toBe("sauce");
          expect(profiles[0].id).toBe("chrome_67_Windows_10_Desktop");
          expect(profiles[1].desiredCapabilities.browserName).toBe("safari");
          expect(profiles[1].desiredCapabilities.version).toBe("10");
          expect(profiles[1].desiredCapabilities.platform).toBe("OS X 10.11");
          expect(profiles[1].desiredCapabilities.appiumVersion).toBe("1.6.6");
          expect(profiles[1].desiredCapabilities.automationName).toBe("XCUITest");
          expect(profiles[1].desiredCapabilities.sendKeyStrategy).toBe("setValue");
          expect(profiles[1].desiredCapabilities.locationServicesAuthorized).toBe("false");
          expect(profiles[1].desiredCapabilities.bundleId).toBe("com.beta.electronics");
          expect(profiles[1].desiredCapabilities.locationServicesEnabled).toBe("true");

          expect(profiles[1].executor).toBe("sauce");
          expect(profiles[1].nightwatchEnv).toBe("sauce");
          expect(profiles[1].id).toBe("safari_10_OS_X_10_11_Desktop");

          delete settings.appCapabilitiesConfig;
        });
    });

    test("without param", () => {
      let argvMock = {};

      return profile
        .getProfiles({}, argvMock)
        .then((thing) => {
          expect(thing).toBe(undefined);
          expect(SauceBrowsers.initialize).not.toBeCalled();
        });
    });
  });

  describe("getCapabilities", () => {
    test("desktop web", () => {
      let p = {
        "browser": "MicrosoftEdge_14_Windows_10_Desktop",
        "resolution": "1280x1024",
        "executor": "sauce"
      };

      return profile
        .getCapabilities(p)
        .then((result) => {
          expect(result.desiredCapabilities.browserName).toBe("MicrosoftEdge");
          expect(result.desiredCapabilities.version).toBe("14");
          expect(result.desiredCapabilities.platform).toBe("Windows 10");
          expect(result.executor).toBe("sauce");
          expect(result.nightwatchEnv).toBe("sauce");
          expect(result.id).toBe("MicrosoftEdge_14_Windows_10_Desktop");
        });
    });

    test("mobile device", () => {
      let p = {
        "browser": "iphone_12_2_iOS_iPhone_Simulator",
        "orientation": "portrait",
        "executor": "sauce"
      };

      return profile
        .getCapabilities(p)
        .then((result) => {
          expect(result.desiredCapabilities.browserName).toBe("iphone");
          expect(result.desiredCapabilities.version).toBe("12.2");
          expect(result.desiredCapabilities.platform).toBe("iOS");
          expect(result.desiredCapabilities.deviceName).toBe("iPhone Simulator");
          expect(result.desiredCapabilities.deviceOrientation).toBe("portrait");
          expect(result.executor).toBe("sauce");
          expect(result.nightwatchEnv).toBe("sauce");
          expect(result.id).toBe("iphone_12_2_iOS_iPhone_Simulator");
        });
    });

    test("appCapabilitiesConfig valid", () => {
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
          expect(result.desiredCapabilities.browserName).toBe(undefined);
          expect(result.desiredCapabilities.version).toBe("10.3");
          expect(result.desiredCapabilities.platform).toBe("iOS");
          expect(result.desiredCapabilities.deviceName).toBe("iPhone 7 Simulator");
          expect(result.desiredCapabilities.app).toBe("sauce-storage:App.zip");
          expect(result.desiredCapabilities.appiumVersion).toBe("1.6.5");
          expect(result.desiredCapabilities.automationName).toBe("XCUITest");
          expect(result.desiredCapabilities.sendKeyStrategy).toBe("setValue");
          expect(result.desiredCapabilities.waitForAppScript).toBe("true");
          expect(result.desiredCapabilities.locationServicesAuthorized).toBe("false");
          expect(result.desiredCapabilities.bundleId).toBe("com.beta.electronics");
          expect(result.desiredCapabilities.deviceOrientation).toBe("portrait");
          expect(result.id).toBe("iphone_10_3_iOS_iPhone_7_Simulator");
        });

    });


    test("appCapabilitiesConfig if non existent appCapabilitiesConfig", () => {
      let p = {
        "browser": "iphone_10_3_iOS_iPhone_7_Simulator",
        "orientation": "portrait",
        "appCapabilitiesConfig": "./test/config/does-not-exist.js"
      };

      return profile
        .getCapabilities(p)
        .catch((error) => {
          expect(error).toBeTruthy();
          expect(error).toBe('Executor sauce cannot resolve profile {"browser":"iphone_10_3_iOS_iPhone_7_Simulator","orientation":"portrait","appCapabilitiesConfig":"./test/config/does-not-exist.js"}');
        });
    });


    test("appCapabilitiesConfig if browser is not found in appCapabilitiesConfig", () => {
      let p = {
        "browser": "invalid_browser_key",
        "orientation": "portrait",
        "appCapabilitiesConfig": "./test/config/app-capabilities-config.js"
      };

      return profile
        .getCapabilities(p)
        .catch((error) => {
          expect(error).toBeTruthy();
          expect(error).toBe('Executor sauce cannot resolve profile {"browser":"invalid_browser_key","orientation":"portrait","appCapabilitiesConfig":"./test/config/app-capabilities-config.js"}');
        });
    });


  });

  describe("listBrowsers", () => {
    test("from sauce", (done) => {
      return profile
        .listBrowsers({}, (err, browserTable) => {
          expect(err).toBe(null);
          expect(browserTable.length).toBeGreaterThan(0);
          done();
        });
    });

    test("from local file", (done) => {
      return profile
        .listBrowsers({}, (err, browserTable) => {
          expect(err).toBe(null);
          expect(browserTable.length).toBeGreaterThan(0);
          done();
        }, { device_additions: "./test/devices.json" });
    });
  });

});