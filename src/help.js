export default {
  "sauce_browser": {
    "visible": true,
    "type": "string",
    "example": "browsername",
    "description": "Run tests in chrome, firefox, etc (default: phantomjs)."
  },
  "sauce_browsers": {
    "visible": true,
    "type": "string",
    "example": "b1,b2,..",
    "description": "Run multiple browsers in parallel."
  },
  "sauce_list_browsers": {
    "visible": true,
    "type": "function",
    "description": "List the available browsers configured (Guacamole integrated)."
  },
  "sauce_create_tunnels": {
    "visible": true,
    "type": "boolean",
    "descriptions": "Create secure tunnels in sauce mode."
  },
  "sauce_tunnel_id": {
    "visible": true,
    "type": "string",
    "example": "testtunnel123123",
    "description": "Use an existing secure tunnel (exclusive with --sauce_create_tunnels)"
  },
  "sauce_app": {
    "visible": true,
    "type": "string",
    "example": "sauce-storage:your_app.apk",
    "description": "Specify the app name in sauce temporary storage"
  },
  "sauce_app_capabilities_config": {
    "visible": true,
    "type": "string",
    "example": "sauceAppCapabilitiesConfig.json",
    "description": "Specify a configuration file containing customized appium "
      + "desiredCapabilities for saucelabs VM"
  },
  "shared_sauce_parent_account": {
    "visible": true,
    "type": "string",
    "example": "testsauceaccount",
    "description": "Specify parent account name if existing shared secure tunnel is "
    + " in use (exclusive with --sauce_create_tunnels)"
  },
  "sauce_tunnel_config": {
    "visible": true,
    "type": "string",
    "example": "tunnelConfig.json",
    "description": "Specify a configuration file to read from to create sauce tunnel"
  }
};
