import {
  BundleIndex,
  parseResourceBundleIndex,
  parseResourceMetadata,
  ResourceMetadata,
} from "@resourcebundles/format";
import chalk from "chalk";
import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import { fileSizeString } from "../util/fileSize.js";
import { iterMap } from "../util/iter/iterMap.js";
import { iterMax } from "../util/iter/iterMax.js";

type ReadOptions = {
  file: string;
  output: "json" | "human-readable";
};

export async function read({ file, output }: ReadOptions): Promise<void> {
  const result = await readBundle(file);

  switch (output) {
    case "human-readable": {
      humanReadable(file, result);
      return;
    }
  }
}

type ReadBundleResult = {
  bundleIndex: BundleIndex;
  resourceMetadata: Map<string, ResourceMetadata>;
};

async function readBundle(file: string): Promise<ReadBundleResult> {
  const fileHandle = await open(file, "r");
  try {
    // read index.
    const readStream = createReadStream("", {
      fd: fileHandle.fd,
      autoClose: false,
    });
    const parsedIndex = await parseResourceBundleIndex(readStream);

    const resourceMetadataMap = new Map<string, ResourceMetadata>();
    for (const [resourceUrl, { offset }] of parsedIndex.index) {
      const stream = createReadStream("", {
        fd: fileHandle.fd,
        autoClose: false,
        start: parsedIndex.resourcesOffset + offset,
      });
      const metadata = await parseResourceMetadata(stream);
      resourceMetadataMap.set(resourceUrl, metadata);
    }

    return { bundleIndex: parsedIndex, resourceMetadata: resourceMetadataMap };
  } finally {
    await fileHandle.close();
  }
}

function humanReadable(file: string, { resourceMetadata }: ReadBundleResult) {
  console.log(chalk.greenBright.bold(`🌐📦 ${file}`));
  console.log(chalk.blueBright(`${resourceMetadata.size} resources`));
  for (const [resourceUrl, item] of resourceMetadata) {
    console.log("");
    console.log(
      chalk`${resourceUrl} {yellow ${fileSizeString(item.payloadSize)}}`
    );
    const maxHeaderLength = iterMax(
      iterMap(item.headers.keys(), (key) => key.length)
    );
    for (const [headerName, value] of item.headers) {
      console.log(
        chalk`  {cyanBright ${headerName.padEnd(
          maxHeaderLength,
          " "
        )}} {gray =>} ${value}`
      );
    }
  }
}
