import { Readable } from "node:stream";
import { CCDLSyntaxError } from "../error/CCDLSyntaxError.js";

export function readBytes(stream: Readable, bytes: number): Promise<Buffer> {
  if (bytes === 0) {
    return Promise.resolve(Buffer.allocUnsafe(0));
  }
  return new Promise((resolve, reject) => {
    const endHandler = () => {
      reject(new CCDLSyntaxError("Unexpected end of input"));
    };
    stream.on("end", endHandler);
    stream.on("error", reject);
    readBytesRaw(stream, bytes)
      .finally(() => {
        stream.removeListener("end", endHandler);
        stream.removeListener("error", reject);
      })
      .then(resolve, reject);
  });
}

async function readBytesRaw(stream: Readable, bytes: number): Promise<Buffer> {
  while (true) {
    const data: string | Buffer | null = stream.read(bytes);
    if (data === null) {
      await awaitReadable(stream);
      continue;
    }
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
  return new Promise((resolve) => {
    stream.once("readable", resolve);
  });
}
