'use strict';

const args = require('yargs');

const HOST = process.env.HOST;
const PORT = args.argv.mocking_port || 12000;

module.exports = {
  'iphone_10_3_iOS_iPhone_7_Simulator': {
    "app": "sauce-storage:App.zip",
    "appiumVersion": "1.6.5",
    "automationName": "XCUITest",
    "sendKeyStrategy": "setValue",
    "locationServicesAuthorized": "false",
    "bundleId": "com.beta.electronics",
    "locationServicesEnabled": "true",
    "processArguments": {
      "args": [
      '-kSchemePref',
      'http',
      '-kServerHostPref',
      `${HOST}:${PORT}`
      ]
    }
  }
}