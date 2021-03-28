import {
  parseResourceBundleIndex,
  parseResourceMetadata,
} from "@resourcebundles/format";
import chalk from "chalk";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open } from "node:fs/promises";
import { Writable } from "node:stream";
import path from "path";
import { awaitStream } from "../util/awaitStream.js";

type ExtractOptions = {
  file: string;
  outputDir: string;
  output: Writable;
};

export async function extract({ file, outputDir, output }: ExtractOptions) {
  const fileHandle = await open(file, "r");
  try {
    // read index of bundle
    const readStream = createReadStream("", {
      fd: fileHandle.fd,
      autoClose: false,
    });
    const { resourcesOffset, index } = await parseResourceBundleIndex(
      readStream
    );
    const promises: Promise<void>[] = [];
    for (const [resourceUrl, { offset, length }] of index) {
      output.write(chalk.blueBright(resourceUrl) + "\n");
      const stream = createReadStream("", {
        fd: fileHandle.fd,
        autoClose: false,
        start: resourcesOffset + offset,
        end: resourcesOffset + offset + length - 1,
      });
      // FIXME: headers are parsed although unused
      await parseResourceMetadata(stream);

      const outputFilePath = path.join(outputDir, resourceUrl);
      // guard against polluting outside of outputDir
      if (
        path
          .relative(outputDir, outputFilePath)
          .startsWith(".." + path.delimiter)
      ) {
        throw new Error(`Cannot write to outside of '${outputDir}'`);
      }
      await mkdir(path.dirname(outputFilePath), {
        recursive: true,
      });
      const outputStream = createWriteStream(outputFilePath);
      stream.pipe(outputStream);
      promises.push(awaitStream(outputStream));
    }
    await Promise.all(promises);
  } finally {
    await fileHandle.close();
  }
}
