import { Readable } from "node:stream";

/**
 * Read and discard specified bytes from given stream.
 */
export function skipBytes(
  stream: Readable,
  bytes: number,
  onUnexpectedEnd: () => Error
): Promise<void> {
  if (bytes < 0) {
    throw new Error(`Cannot skip ${bytes} bytes`);
  }
  if (bytes === 0) {
    return Promise.resolve();
  }
  return Promise.race([
    convertEndToError(stream, onUnexpectedEnd),
    skipBytesImpl(stream, bytes),
  ]);
}

async function skipBytesImpl(stream: Readable, bytes: number) {
  let readBytes = 0;
  while (readBytes < bytes) {
    const buf = Buffer.from(stream.read());
    if (buf !== null) {
      readBytes += buf.length;
      if (readBytes > bytes) {
        // read too much. Have to unshift (readBytes - bytes) bytes
        stream.unshift(buf.subarray(buf.length - (readBytes - bytes)));
        break;
      }
      if (readBytes === bytes) {
        // hooray!
        break;
      }
      continue;
    }
    // wait for next 'readable' event
    await awaitReadable(stream);
  }
}

function awaitReadable(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once("error", reject);
    stream.once("readable", () => {
      stream.removeListener("error", reject);
      resolve();
    });
  });
}

function convertEndToError(
  stream: Readable,
  onUnexpectedEnd: () => Error
): Promise<never> {
  return new Promise((_resolve, reject) => {
    stream.once("end", () => {
      reject(onUnexpectedEnd());
    });
  });
}
