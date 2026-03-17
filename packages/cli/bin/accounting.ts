#!/usr/bin/env node

/**
 * @emisso/accounting-cli entry point
 */

import { runCli, OutputRendererLive } from "@emisso/cli-core";
import { rootCommand } from "../src/index.js";

runCli({
  command: rootCommand,
  layer: OutputRendererLive,
  name: "accounting",
  version: "0.1.0",
});
