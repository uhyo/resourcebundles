import { Transform, TransformCallback } from "node:stream";

/**
 * Stream that counts length of data that passed through and writes that data at the end.
 */
export class LengthCountingStream extends Transform {
  #lengthCount = 0n;

  constructor() {
    super({
      allowHalfOpen: true,
    });
  }

  _transform(
    chunk: string | Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.#lengthCount += BigInt(chunk.length);
    callback(null, chunk);
  }

  _flush(callback: TransformCallback) {
    // write total data in 8 bytes BE
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(this.#lengthCount + 8n);
    this.push(buf);
    callback();
  }
}
