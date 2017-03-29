# Magellan-Saucelabs-Executor

[![Build Status](https://travis-ci.org/TestArmada/magellan-saucelabs-executor.svg?branch=master)](https://travis-ci.org/TestArmada/magellan-saucelabs-executor)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/TestArmada/magellan-saucelabs-executor/branch/master/graph/badge.svg)](https://codecov.io/gh/TestArmada/magellan-saucelabs-executor)

Executor for [Magellan](https://github.com/TestArmada/magellan) to run [nightwatchjs](http://nightwatchjs.org/) tests in [Saucelabs](https://saucelabs.com/) environment.

**PLEASE NOTE: Executor is only supported by magellan version 10.0.0 or higher**.

## What does this executor do
 1. It manages [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) if you test needs it
 2. It talks [Guacamole](https://github.com/TestArmada/guacamole) so that the desiredCapabilities shrinks down to a string, which makes your browser selection an easy work
 3. It collaborates with [Locks](https://github.com/TestArmada/locks) to schedule the traffic intelligently
 4. It reports test result to Saucelabs automatically
 5. It runs nightwatch test by forking it as magellan child process

## How To Use
Please follow the steps

 1. `npm install testarmada-magellan-saucelabs-executor --save`
 2. add following block to your `magellan.json` (if there isn't a `magellan.json` please create one under your folder root)
 ```javascript
 "executors": [
    "testarmada-magellan-saucelabs-executor"
 ]
 ```

 3. `./node_modules/.bin/magellan ----help` to see if you can see the following content printed out
 ```
  Executor-specific (testarmada-magellan-sauce-executor)
   --sauce_browser=browsername          Run tests in chrome, firefox, etc (default: phantomjs).
   --sauce_browsers=b1,b2,..            Run multiple browsers in parallel.
   --sauce_list_browsers                List the available browsers configured (Guacamole integrated).
   --sauce_create_tunnels               undefined
   --sauce_tunnel_id=testtunnel123123   Use an existing secure tunnel (exclusive with --sauce_create_tunnels)
   --shared_sauce_parent_account=testsauSpecify parent account name if existing shared secure tunnel is  in use (exclusive with --sauce_create_tunnels)
 ```

Congratulations, you're all set. 

## Customize sauce tunnel flags

`testarmada-magellan-saucelabs-executor` supports customized sauce tunnel flags since `1.0.3`. You can put customized flags into a `.json` file and use `--sauce_tunnel_config` to load the file. 

```javascript
tunnel config json example

{
  "fastFailRegexps": "p.typekit.net",
  "directDomains": "google.com",
  "noSslBumpDomains": "google.com"
}
```

For all supported flags please refer to [here](https://github.com/bermi/sauce-connect-launcher#advanced-usage).

### Loading rules for env variables and customized flags

Some parameters can be passed in from both env variables and customized flags (such as `SAUCE_USERNAME` from env variables and `username` from flags). It is very important to understand which one will take effect if set up both.

 1. env variable always has top priority.
 2. customized flags only work when no corresponding env variable set

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
