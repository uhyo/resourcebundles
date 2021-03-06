#! /usr/bin/env node
import fastify from "fastify";
import yargs from "yargs";
import resourceBundleStaticPlugin from "./middleware.js";

yargs(process.argv.slice(2)).command(
  "$0 <file>",
  "Serve from given Resource Bundle.",
  (yargs) => {
    return yargs
      .positional("file", {
        desc: "File to serve from",
        type: "string",
        demandOption: true,
      })
      .option("host", {
        type: "string",
        default: "127.0.0.1",
      })
      .option("port", {
        type: "number",
        default: "8080",
      });
  },
  (argv) => {
    (async () => {
      const app = fastify({
        logger: true,
        rewriteUrl(req) {
          if (req.url === "/") {
            return "/index.html";
          }
          return req.url!;
        },
      });
      await app.register(resourceBundleStaticPlugin, {
        file: argv.file,
      });

      await app.listen(argv.port, argv.host);
    })().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
).argv;
