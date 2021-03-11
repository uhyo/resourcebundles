import { Writable } from "node:stream";
import { receiveToBuffer } from "./receiveToBuffer";
import { writeToStream } from "./writeToStream";

/**
 * Internally maintains a stream to collect data written by callback into a Buffer.
 */
export async function writeToBuffer(
  callback: (stream: Writable) => void
): Promise<Buffer> {
  return receiveToBuffer(writeToStream(callback));
}
