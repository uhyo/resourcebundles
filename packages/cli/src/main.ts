import { Writable } from "node:stream";
import yargs, { Argv } from "yargs";
import { create } from "./command/create.js";
import { read } from "./command/read.js";
import { handleOptionMultiple } from "./util/handleOptionMultiple.js";

export function cli(args: readonly string[], output: Writable): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    (yargs(args).command(
      "read <file>",
      "read the header of given Resource Bundle",
      (yargs) => {
        return yargs
          .positional("file", {
            describe: "file to read",
            type: "string",
            demandOption: true,
          })
          .option("output", {
            describe: "output format",
            // default: "human-readable" as const,
            choices: ["json", "human-readable", "url-only"] as const,
          });
      },
      (argv) => {
        resolve(
          read({
            file: argv.file,
            output,
            outputType: argv.output || "human-readable",
          })
        );
      }
    ) as Argv<{}>)
      .command(
        "create [files..]",
        "create a Resource Bundle fron given files",
        (yargs) => {
          return yargs
            .positional("files", {
              describe: "input files",
              type: "string",
            })
            .option("out", {
              describe: "output file",
              type: "string",
            })
            .option("rootDir", {
              describe: "root directory of input file",
              type: "string",
            })
            .option("header", {
              alias: "H",
              describe: "header added to each file",
              type: "string",
              nargs: 1,
            });
        },
        (argv) => {
          resolve(
            create({
              files: handleOptionMultiple(argv.files),
              headers: handleOptionMultiple(argv.header),
              rootDir: argv.rootDir,
              outFile: argv.out,
            })
          );
        }
      )
      .fail((msg) => {
        reject(msg);
      })
      .demandCommand(1).argv;
  }).finally(() => {
    output.end();
  });
}
