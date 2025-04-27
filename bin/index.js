#!/usr/bin/env node

import { program } from "commander";
import { run } from "./actions.js";

program
  .version("1.0.0")
  .description("Tux CLI")
  .requiredOption("-t, --tests <PATH>", "Specify the text execution file")
  .requiredOption(
    "-a, --assistant <PATH>",
    "Create an assistant with the given configuration"
  )
  .action((options) => {
    run(options);
  });

program.parse(process.argv);
