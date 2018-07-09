"use strict";

const logger = require("../src/logger");

jest.mock("yargs", () => {
  return {
    argv: {
      debug: true
    }
  }
});

test("log", () => {
  logger.log("msg");
});

test("warn", () => {
  logger.warn("warn");
});

test("debug enabled", () => {
  
  logger.debug("debug");
});

test("debug disabled", () => {
  logger.debug("debug");
});

test("err", () => {
  logger.err("err");
});

test("loghelp", () => {
  logger.loghelp("debug");
});

test("stringifyLog", () => {
  logger.stringifyLog("debug");
});

test("stringifyWarn", () => {
  logger.stringifyWarn("debug");
});

test("stringifyErr", () => {
  logger.stringifyErr("debug");
});