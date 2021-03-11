import { Readable } from "node:stream";
import { CCDLSyntaxError } from "../error/CCDLSyntaxError";

export async function readBytes(
  stream: Readable,
  bytes: number
): Promise<Buffer> {
  while (true) {
    const data: Buffer | null = stream.read(bytes);
    if (data === null) {
      await awaitReadable(stream);
      continue;
    }
    if (data.length < bytes) {
      // stream ended before providing sufficient bytes
      throw new CCDLSyntaxError("Unexpected end of input");
    }
    return data;
  }
}

function awaitReadable(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.once("readable", () => {
      stream.removeListener("error", reject);
      resolve();
    });
  });
}
