import { Readable } from "node:stream";
import { CCDLSyntaxError } from "../error/CCDLSyntaxError";

export async function readBytes(
  stream: Readable,
  bytes: number
): Promise<Buffer> {
  let nullFlag = false;
  while (true) {
    const data: string | Buffer | null = stream.read(bytes);
    if (data === null) {
      if (!nullFlag) {
        await awaitReadable(stream);
        nullFlag = true;
        continue;
      }
      // "readable" was emitted but still null. This means that the stream has reacted end
      break;
    }
    nullFlag = false;
    const buf = Buffer.from(data);
    if (buf.length < bytes) {
      // stream ended before providing sufficient bytes
      break;
    }
    return buf;
  }
  throw new CCDLSyntaxError("Unexpected end of input");
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
