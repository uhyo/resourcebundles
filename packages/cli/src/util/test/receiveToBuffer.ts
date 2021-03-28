import { Readable } from "node:stream";

/**
 * Receives given stream into a buffer.
 */
export async function receiveToBuffer(stream: Readable) {
  const bufs: Buffer[] = [];
  for await (const chunk of stream) {
    bufs.push(Buffer.from(chunk));
  }
  return Buffer.concat(bufs);
}
