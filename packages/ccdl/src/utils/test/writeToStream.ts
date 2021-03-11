import { PassThrough, Readable, Writable } from "node:stream";

export function writeToStream(callback: (stream: Writable) => void): Readable {
  const l = new PassThrough();
  callback(l);
  l.end();
  return l;
}
