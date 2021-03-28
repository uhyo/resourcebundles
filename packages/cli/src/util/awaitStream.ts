import { Stream } from "node:stream";

export function awaitStream(stream: Stream) {
  return new Promise<void>((resolve, reject) => {
    stream.once("close", resolve);
    stream.once("error", reject);
  });
}
