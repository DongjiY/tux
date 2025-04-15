#!/usr/bin/env node

import { program } from "commander";
import { run } from "./actions.js";

program
  .version("1.0.0")
  .description("Tux CLI")
  .option("-f, --file <path>", "Specify the text execution script")
  .action((options) => {
    run(options);
  });

program.parse(process.argv);
