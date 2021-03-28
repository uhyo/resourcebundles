#! /usr/bin/env node

import { cli } from "./main.js";

cli(process.argv.slice(2), process.stdout).catch((err) => {
  console.error(err);
  process.exit(1);
});
