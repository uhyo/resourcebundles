#! /usr/bin/env node

import { cli } from "./main.js";

cli({
  args: process.argv.slice(2),
  output: process.stdout,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
