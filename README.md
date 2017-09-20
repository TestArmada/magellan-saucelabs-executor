# Magellan-Saucelabs-Executor

[![Build Status](https://travis-ci.org/TestArmada/magellan-saucelabs-executor.svg?branch=master)](https://travis-ci.org/TestArmada/magellan-saucelabs-executor)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/TestArmada/magellan-saucelabs-executor/branch/master/graph/badge.svg)](https://codecov.io/gh/TestArmada/magellan-saucelabs-executor)

Executor for [Magellan](https://github.com/TestArmada/magellan) to run [nightwatchjs](http://nightwatchjs.org/) tests in [Saucelabs](https://saucelabs.com/) environment.

# Important Notes About Versions

## Magellan Version Compatibility

Important: `testarmada-magellan-saucelabs-executor` is only supported by magellan version `10.0.0` or higher.

## Locks Version Compatibility

If you are running a version of `testarmada-magellan-saucelabs-executor` version `4.x.x` or higher and also use [Locks](https://github.com/TestArmada/locks) to traffic control your Saucelabs VM allocation, then you should run a minimum of `locks@3.x.x`. Earlier versions of Locks do not expose a websocket, which is what executor `4.x.x` or higher expects.

## What does this executor do

 1. It manages [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) if your tests need it.
 2. It talks [Guacamole](https://github.com/TestArmada/guacamole) so that the desiredCapabilities shrinks down to a string, which makes managing your browser selection easier.
 3. It collaborates with [Locks](https://github.com/TestArmada/locks) to schedule the VM acquisition traffic intelligently, preventing a rise in errors when your Sauce capacity is saturated.
 4. It reports test result to Saucelabs automatically.
 5. It runs tests by forking the test framework (i.e. Nightwatch, etc) it as `magellan` child process.

## How To Use

Please follow the following steps:

 1. `npm install testarmada-magellan-saucelabs-executor --save`
 2. Add following the block to your `magellan.json` (if there isn't a `magellan.json` please create one under your folder root):

 ```javascript
 "executors": [
    "testarmada-magellan-saucelabs-executor"
 ]
 ```
 3. Set environment variables:
 ```
 export SAUCE_CONNECT_VERSION=${VERSION}
 export SAUCE_USERNAME=${USERNAME}
 export SAUCE_ACCESS_KEY=${TOKEN}
 ```

 4. `./node_modules/.bin/magellan --help` to see if you can see the following content printed out
 ```
  Executor-specific (testarmada-magellan-sauce-executor)
   --sauce_browser=browsername          Run tests in chrome, firefox, etc (default: phantomjs).
   --sauce_browsers=b1,b2,..            Run multiple browsers in parallel.
   --sauce_list_browsers                List the available browsers configured (Guacamole integrated).
   --sauce_create_tunnels               undefined
   --sauce_tunnel_id=testtunnel123123   Use an existing secure tunnel (exclusive with --sauce_create_tunnels)
   --sauce_app=sauce-storage:your_app.apSpecify the app name in sauce temporary storage
   --sauce_app_capabilities_config=sauceSpecify a configuration file containing customized appium desiredCapabilities for saucelabs VM
   --shared_sauce_parent_account=testsauSpecify parent account name if existing shared secure tunnel is  in use (exclusive with --sauce_create_tunnels)
 ```

Congratulations, you're all set. 


## Configuring `locks` support

`testarmada-magellan-saucelabs-executor` is able to communicate with a [Locks](https://github.com/TestArmada/locks) instance for Saucelabs traffic control.

To configure `locks`, set the `LOCKS_SERVER` environment variable as follows:

```
export LOCKS_SERVER=http://yourlockshost:4765/

### Proxy Configuration

**NOTE:** At this time, proxy configuration for outbound control messages to Saucelabs is only supported for Nightwatch.js consumers. Please consider a filing pull request if you are familiar with how other frameworks configure outbound proxy access!

To use a proxy to reach Saucelabs when querying the Saucelabs API, set an environment variable called `SAUCE_OUTBOUND_PROXY` before running Magellan with this executor:

```console
$ export SAUCE_OUTBOUND_PROXY=http://your-internal-proxy-host:8080
```

## Customize sauce tunnel flags

`testarmada-magellan-saucelabs-executor` supports customized sauce tunnel flags since `1.0.2`. You can put customized flags into a `.json` file and use `--sauce_tunnel_config` to load the file. 

```javascript
tunnel config json example

{
  "fastFailRegexps": "p.typekit.net",
  "directDomains": "google.com",
  "noSslBumpDomains": "google.com"
}
```

For all supported flags please refer to [here](https://github.com/bermi/sauce-connect-launcher#advanced-usage).

## Customize appium desiredCapabilities (for app and mobile web test only)

`testarmada-magellan-saucelabs-executor` supports customized `appium` desiredCapabilies. A user can directly put all the desired `appium` capabilities in a `profile` as shown below:

```
"chrome-android": [
{
    "browser": "Android_GoogleAPI_Emulator_Android_7_0_Android",
    "orientation": "portrait",
    "appium": {
        "browserName": "Chrome",
        "appiumVersion": "1.6.5",
        "platformName": "Android",
        "platformVersion": "7.0"
    }
}
]
```

Also, a user can define the desired capabilities in a `json` or `js` file specified by `appiumCapabilitiesConfig` as shown below.

```
"chrome-android": [
{
    "browser": "Android_GoogleAPI_Emulator_Android_7_0_Android",
    "orientation": "portrait",
    "appCapabilitiesConfig": "./config/appium-capabilities.json"
    "appium": {
        "browserName": "Chrome",
        "appiumVersion": "1.6.5",
        "platformName": "Android",
        "platformVersion": "7.0"
    }
}
]
```

Example of `appium-capabilities.json`
```javascript
{
   "Android_GoogleAPI_Emulator_Android_7_0_Android": {
       "automationName": "XCUITest",
       "sendKeyStrategy": "setValue",
       "waitForAppScript": "true",
       "locationServicesAuthorized": "false"
   },
   "Android_GoogleAPI_Emulator_Android_7_1_Android": {
       "automationName": "XCUITest",
       "sendKeyStrategy": "setValue",
       "waitForAppScript": "false",
       "locationServicesAuthorized": "true"
   }
}
```

Example of `appium-capabilities.js`
```javascript
 'use strict';

 const APPIUM_VERSION = process.env.APPIUM_VERSION;

 module.exports = {
   "Android_GoogleAPI_Emulator_Android_7_0_Android": {
       "appiumVersion": `${APPIUM_VERSION}`
       "automationName": "XCUITest",
       "sendKeyStrategy": "setValue",
       "waitForAppScript": "true",
       "locationServicesAuthorized": "false"
   },
   "Android_GoogleAPI_Emulator_Android_7_1_Android": {
       "appiumVersion": `${APPIUM_VERSION}`
       "automationName": "XCUITest",
       "sendKeyStrategy": "setValue",
       "waitForAppScript": "false",
       "locationServicesAuthorized": "true"
   }
}
```
Using a `js` file is especially useful when you want to add a dynamic value to a property. e.g from an environment variable

Note that the desired capabilities for the browser should be placed under its key e.g `Android_GoogleAPI_Emulator_Android_7_0_Android`. The file can contain more than one browsers as shown in the example.

You can further merge the customized appium desired capabilities via `--sauce_app_capabilities_config`. Any content in the `.json` file will be merged into desiredCapabilities directly.

`customized appium desired capabilities`
```javascript
"Android_GoogleAPI_Emulator_Android_7_0_Android" : {
  {
    "appiumVersion": "1.6.5",
    "automationName": "XCUITest",
    "sendKeyStrategy": "setValue"
  }
}

```

If the browser key is not found in the configuration files (`appCapabilitiesConfig` or `--sauce_app_capabilities_config`), no capabilities are merged from the configuration files.

Note that the desired capabilities from `--sauce_app_capabilities_config` and `appCapabilities` are merged into the local `appium` capabilities with `--sauce_app_capabilities_config` taking precedence over the capabilities from `appCapabilitiesConfig` which in turn takes precedence over the local `appium` capabilities.

### Loading rules for env variables and customized flags

Some parameters can be passed in from both env variables and customized flags (such as `SAUCE_USERNAME` from env variables and `username` from flags). It is very important to understand which one will take effect if set up both.

 1. env variable always has top priority.
 2. customized flags only work when no corresponding env variable set

### Loading rules for command line args, profile and configuration file content

Some arguments can be passed in to excutor from both command line args, profile and configuration files, for example the temporary app location on saucelabs. The rule for deciding the final value of such argument is ordered as following

 1. configuration file content
 2. profile
 3. command line args (except `--sauce_app`, command line value of `--sauce_app` has the top priority)

## Example
To run test in latest chrome on Windows10 without a tunnel
```console
$ ./node_modules/.bin/magellan --sauce_browser chrome_latest_Windows_10_Desktop --test xxx
```

To run test in latest chrome on Windows10 with a new tunnel
```console
$ ./node_modules/.bin/magellan --sauce_browser chrome_latest_Windows_10_Desktop --sauce_create_tunnels --test xxx
```

To run test in latest chrome on Windows10 with an exiting tunnel
```console
$ ./node_modules/.bin/magellan --sauce_browser chrome_latest_Windows_10_Desktop --sauce_tunnel_id xxx --test xxx
```

To run test in latest chrome, latest firefox on Windows10 and safari 9 on MacOS 10.11
```console
$ ./node_modules/.bin/magellan --sauce_browsers chrome_latest_Windows_10_Desktop,firefox_latest_Windows_10_Desktop,safari_9_OS_X_10_11_Desktop --test xxx
```

To create sauce tunnel connection with customized flags from `./tunnel.json`
```console
$ ./node_modules/.bin/magellan --sauce_browsers chrome_latest_Windows_10_Desktop --sauce_create_tunnels --sauce_tunnel_config ./tunnel.json 
```
