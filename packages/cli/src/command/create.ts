import { ResourceBundleSerializer } from "@resourcebundles/format";
import mime from "mime";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Stream } from "node:stream";

type WriteOptions = {
  files: readonly string[];
  headers: readonly string[];
  rootDir: string | undefined;
  outFile: string | undefined;
};

export async function create({
  files,
  headers,
  outFile,
  rootDir = process.cwd(),
}: WriteOptions) {
  const headersMap: Record<string, string> = Object.create(null);
  // parse and normalize headers and
  for (const h of headers) {
    const [k, v] = h.split("=");
    if (v === undefined) {
      throw new Error(`Invalid header format: '${h}'`);
    }
    headersMap[String(k).trim().toLowerCase()] = v.trim();
  }
  if (headersMap[":status"] === undefined) {
    // :status pseudo-header
    headersMap[":status"] = "200";
  }

  const serializer = new ResourceBundleSerializer();

  for (const file of files) {
    const ext = path.extname(file);
    const h = { ...headersMap };
    if (h["content-type"] === undefined) {
      // no content-type header specified.
      const typeFromExt = mime.getType(ext);
      if (typeFromExt !== null) {
        h["content-type"] = typeFromExt;
      }
    }
    const filePath = path.resolve(file);
    const resourceUrl = path.relative(rootDir, filePath);

    await serializer.addResourceFromFile(resourceUrl, filePath, h);
  }

  const outputStream = outFile ? createWriteStream(outFile) : process.stdout;

  const resourceBundleStream = serializer.serialize();
  resourceBundleStream.pipe(outputStream);

  await Promise.all([
    awaitStream(resourceBundleStream),
    awaitStream(outputStream),
  ]);
}

function awaitStream(stream: Stream) {
  return new Promise((resolve, reject) => {
    stream.once("close", resolve);
    stream.once("error", reject);
  });
}
