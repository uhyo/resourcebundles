import { Readable } from "node:stream";
import { CCDLSyntaxError } from "../error/CCDLSyntaxError";

export function readBytes(stream: Readable, bytes: number): Promise<Buffer> {
  return Promise.race([readBytesRaw(stream, bytes), convertEndToError(stream)]);
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
  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.once("readable", () => {
      stream.removeListener("error", reject);
      resolve();
    });
  });
}

function convertEndToError(stream: Readable): Promise<never> {
  return new Promise((_resolve, reject) => {
    stream.once("end", () => {
      reject(new CCDLSyntaxError("Unexpected end of input"));
    });
  });
}
