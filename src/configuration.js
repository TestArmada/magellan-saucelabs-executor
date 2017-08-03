import { argv } from "yargs";
import _ from "lodash";
import path from "path";
import logger from "./logger";
import settings from "./settings";
import guid from "./util/guid";

const _loadConfig = (filename) => {
  const filepath = path.resolve(process.cwd() + path.sep + filename);
  try {
    /*eslint-disable global-require*/
    const config = require(filepath);
    logger.log(`Loaded config file ${filename}`);
    logger.debug(`Loading config from ${filename}:`);
    logger.debug(`${JSON.stringify(config)}`);
    return _.cloneDeep(config);
  } catch (err) {
    logger.err(`Cannot load config file from ${filename}`);
    logger.err(err);
    throw new Error(err);
  }
};

export default {
  getConfig: () => {
    return settings.config;
  },

  /*eslint-disable complexity*/
  validateConfig: (opts, argvMock = null, envMock = null) => {
    let runArgv = argv;
    let env = process.env;

    if (argvMock) {
      runArgv = argvMock;
    }

    if (envMock) {
      env = envMock;
    }

    if (runArgv.sauce_tunnel_config) {
      settings.config.tunnel = _loadConfig(runArgv.sauce_tunnel_config);
    }

    // override sauce configurations from default source
    // required:
    if (env.SAUCE_USERNAME) {
      settings.config.tunnel.username = env.SAUCE_USERNAME;
    }

    if (env.SAUCE_ACCESS_KEY) {
      settings.config.tunnel.accessKey = env.SAUCE_ACCESS_KEY;
    }

    if (env.SAUCE_CONNECT_VERSION) {
      settings.config.tunnel.connectVersion = env.SAUCE_CONNECT_VERSION;
    }
    // optional:
    if (runArgv.sauce_tunnel_id) {
      settings.config.tunnel.tunnelIdentifier = runArgv.sauce_tunnel_id;
    }

    // optional:
    if (runArgv.sauce_app) {
      settings.config.app = runArgv.sauce_app;
    }

    // optional:
    if (runArgv.sauce_app_capabilities_config) {
      settings.config.appCapabilitiesConfig = _loadConfig(runArgv.sauce_app_capabilities_config);
    }

    // optional: *Outbound* HTTP Sauce-specific proxy configuration. Note
    // that this is for Selenium outbound control traffic only, not the
    // return path, and not to be confused with sauceconnect.
    if (env.SAUCE_OUTBOUND_PROXY) {
      settings.config.sauceOutboundProxy = env.SAUCE_OUTBOUND_PROXY;
    }

    if (env.SAUCE_TUNNEL_FAST_FAIL_REGEXPS
      && !settings.config.tunnel.fastFailRegexps) {
      // only if fastFailRegexps isn't set anywhere
      settings.config.tunnel.fastFailRegexps = env.SAUCE_TUNNEL_FAST_FAIL_REGEXPS;
    }

    if (runArgv.shared_sauce_parent_account) {
      settings.config.sharedSauceParentAccount = runArgv.shared_sauce_parent_account;
    }

    if (runArgv.sauce_create_tunnels) {
      settings.config.useTunnels = !!runArgv.sauce_create_tunnels;
    }

    // locks config
    settings.config.locksServerLocation = env.LOCKS_SERVER;

    // Remove trailing / in locks server location if it's present.
    if (typeof settings.config.locksServerLocation === "string"
      && settings.config.locksServerLocation.length > 0) {
      if (settings.config.locksServerLocation.charAt(
        settings.config.locksServerLocation.length - 1) === "/") {
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
      connectVersion: {
        required: false,
        envKey: "SAUCE_CONNECT_VERSION"
      }
    };

    // Validate configuration if we have --sauce
    if (runArgv.sauce_browsers
      || runArgv.sauce_browser
      || opts.isEnabled) {
      let valid = true;

      _.forEach(parameterWarnings, (v, k) => {
        if (!settings.config.tunnel[k]) {
          if (v.required) {
            logger.err(`Error! Sauce requires ${k} to be set. Check if the`
              + ` environment variable $${v.envKey} is defined.`);
            valid = false;
          } else {
            logger.warn(`Warning! No ${k} is set. This is set via the`
              + ` environment variable $${v.envKey} . This isn't required, but can cause `
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
      if (!settings.config.tunnel.tunnelIdentifier && settings.config.useTunnels) {
        // auto generate tunnel id
        settings.config.tunnel.tunnelIdentifier = guid();
      }

      logger.debug("Sauce configuration: ");
      logger.debug(JSON.stringify(settings.config));

      logger.log("Sauce configuration OK");

    }

    return settings.config;
  }
};
