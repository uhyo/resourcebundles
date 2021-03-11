import { PassThrough, Readable } from "node:stream";

/**
 * Creates a readable stream that emits given buffer.
 */
export function bufferToStream(...bufs: (string | Buffer)[]): Readable {
  const l = new PassThrough();
  for (const chunk of bufs) {
    l.write(chunk);
  }
  l.end();
  return l;
}

/**
 * Creates a readable stream that emits given buffer. Chunks are added asynchronously.
 */
export function asyncBufferToStream(
  ...bufs: (string | Buffer)[]
): [Readable, Promise<void>] {
  const l = new PassThrough();
  const p = (async () => {
    for (const chunk of bufs) {
      await null;
      l.write(chunk);
    }
    l.end();
  })();
  return [l, p];
}
