import { parseResourceBundleIndex } from "@resourcebundles/format";
import { createReadStream } from "node:fs";
type ReadOptions = {
  file: string;
  output: "json" | "human-readable";
};

export async function read({ file, output }: ReadOptions): Promise<void> {
  const readStream = createReadStream(file);
  const parsedIndex = await parseResourceBundleIndex(readStream);
  console.log(parsedIndex);
}
