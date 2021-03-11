import { PassThrough, Readable } from "node:stream";

/**
 * Creates a readable stream that emits given buffer.
 */
export function bufferToStream(
  ...bufs: (number | string | Buffer)[]
): Readable {
  const l = new PassThrough();
  for (const chunk of bufs) {
    if (typeof chunk === "number") {
      l.write(Buffer.from([chunk]));
    } else {
      l.write(chunk);
    }
  }
  l.end();
  return l;
}

/**
 * Creates a readable stream that emits given buffer. Chunks are added asynchronously.
 */
export function asyncBufferToStream(
  ...bufs: (number | string | Buffer)[]
): [Readable, Promise<void>] {
  const l = new PassThrough();
  const p = (async () => {
    for (const chunk of bufs) {
      await null;
      if (typeof chunk === "number") {
        l.write(Buffer.from([chunk]));
      } else {
        l.write(chunk);
      }
    }
    l.end();
  })();
  return [l, p];
}
