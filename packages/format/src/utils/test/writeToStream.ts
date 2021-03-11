import { PassThrough, Readable, Writable } from "node:stream";

export async function writeToStream(
  callback: (stream: Writable) => Promise<void>
): Promise<Readable> {
  const l = new PassThrough();
  await callback(l);
  l.end();
  return l;
}
