import { argv } from "yargs";
import _ from "lodash";
import logger from "./logger";
import settings from "./settings";
import guid from "./util/guid";

export default {
  getConfig: () => {
    return settings.config;
  },

  validateConfig: (opts, argvMock = null, envMock = null) => {
    // let config = _.assign({}, settings.config);
    let runArgv = argv;
    let env = process.env;

    if (argvMock) {
      runArgv = argvMock;
    }

    if (envMock) {
      env = envMock;
    }

    // required:
    settings.config.username = env.SAUCE_USERNAME;
    settings.config.accessKey = env.SAUCE_ACCESS_KEY;
    settings.config.sauceConnectVersion = env.SAUCE_CONNECT_VERSION;
    // optional:
    settings.config.sauceTunnelId = runArgv.sauce_tunnel_id;
    settings.config.sharedSauceParentAccount = runArgv.shared_sauce_parent_account;
    settings.config.useTunnels = !!runArgv.sauce_create_tunnels;
    settings.config.tunnelTimeout = env.SAUCE_TUNNEL_CLOSE_TIMEOUT;
    settings.config.fastFailRegexps = env.SAUCE_TUNNEL_FAST_FAIL_REGEXPS;

    settings.config.locksServerLocation = env.LOCKS_SERVER;

    // Remove trailing / in locks server location if it's present.
    if (typeof settings.config.locksServerLocation === "string" && settings.config.locksServerLocation.length > 0) {
      if (settings.config.locksServerLocation.charAt(settings.config.locksServerLocation.length - 1) === "/") {
        settings.config.locksServerLocation = settings.config.locksServerLocation.substr(0,
          settings.config.locksServerLocation.length - 1);
      }
    }

    const parameterWarnings = {
      username: {
        required: true,
        envKey: "SAUCE_USERNAME"
      },
      accessKey: {
        required: true,
        envKey: "SAUCE_ACCESS_KEY"
      },
      sauceConnectVersion: {
        required: false,
        envKey: "SAUCE_CONNECT_VERSION"
      }
    };

    // Validate configuration if we have --sauce
    if (runArgv.sauce_browsers
      || runArgv.sauce_browser) {
      let valid = true;

      _.forEach(parameterWarnings, (v, k) => {
        if (!settings.config[k]) {
          if (v.required) {
            logger.err("Error! Sauce requires " + k + " to be set. Check if the"
              + " environment variable $" + v.envKey + " is defined.");
            valid = false;
          } else {
            logger.warn("Warning! No " + k + " is set. This is set via the"
              + " environment variable $" + v.envKey + " . This isn't required, but can cause "
              + "problems with Sauce if not set");
          }
        }
      });

      if (!valid) {
        throw new Error("Missing configuration for Saucelabs connection.");
      }

      if (runArgv.sauce_create_tunnels) {
        if (runArgv.sauce_tunnel_id) {
          throw new Error("Only one Saucelabs tunnel arg is allowed, --sauce_tunnel_id " +
            "or --create_tunnels.");
        }

        if (runArgv.shared_sauce_parent_account) {
          throw new Error("--shared_sauce_parent_account only works with --sauce_tunnel_id.");
        }
      }

      // after verification we want to add sauce_tunnel_id if it's null till now
      if (!settings.config.sauceTunnelId && settings.config.useTunnels) {
        // auto generate tunnel id
        settings.config.sauceTunnelId = guid();
      }

      logger.debug("Sauce configuration: ");
      logger.debug(JSON.stringify(settings.config));

      logger.log("Sauce configuration OK");

    }

    return settings.config;
  }
};