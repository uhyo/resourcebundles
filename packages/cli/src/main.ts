import { Writable } from "node:stream";
import yargs, { Argv } from "yargs";
import { create } from "./command/create.js";
import { extract } from "./command/extract.js";
import { read } from "./command/read.js";
import { handleOptionMultiple } from "./util/handleOptionMultiple.js";

export type CLIOptions = {
  /**
   * Args.
   */
  args: readonly string[];
  /**
   * Output channel.
   */
  output: Writable;
  /**
   * Locale (for yargs).
   * Defaults to OS locale.
   */
  locale?: string;
};

export function cli({ args, output, locale }: CLIOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let y = ((yargs(args).command(
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
    ) as Argv<{}>).command(
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
            output: argv.out
              ? {
                  type: "file",
                  filePath: argv.out,
                }
              : {
                  type: "stream",
                  stream: output,
                },
          })
        );
      }
    ) as Argv<{}>)
      .command(
        "extract <file>",
        "extract all resoucres in given Resource Bundle as files",
        (yargs) => {
          return yargs
            .positional("file", {
              describe: "file to extract",
              type: "string",
              demandOption: true,
            })
            .option("out", {
              describe: "output directory",
              type: "string",
            });
        },
        (argv) => {
          resolve(
            extract({
              file: argv.file,
              outputDir: argv.out ?? process.cwd(),
              output,
            })
          );
        }
      )
      .fail((msg) => {
        reject(msg);
      });

    if (locale) {
      y = y.locale(locale);
    }
    y.demandCommand(1).strictCommands().argv;
  }).finally(() => {
    output.end();
  });
}
