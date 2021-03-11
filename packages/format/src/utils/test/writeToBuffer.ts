import { Writable } from "node:stream";
import { receiveToBuffer } from "./receiveToBuffer";
import { writeToStream } from "./writeToStream";

/**
 * Internally maintains a stream to collect data written by callback into a Buffer.
 */
export async function writeToBuffer(
  callback: (stream: Writable) => Promise<void>
): Promise<Buffer> {
  return receiveToBuffer(await writeToStream(callback));
}
