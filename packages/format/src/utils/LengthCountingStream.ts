import { Transform, TransformCallback } from "node:stream";

/**
 * Stream that counts length of data that passed through and gives change of writeing that data at the end.
 */
export class LengthCountingStream extends Transform {
  #lengthCount = 0;
  #finalize: (length: number) => Buffer;

  constructor(finalize: (length: number) => Buffer) {
    super({
      allowHalfOpen: true,
    });
    this.#finalize = finalize;
  }

  _transform(
    chunk: string | Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.#lengthCount += chunk.length;
    callback(null, chunk);
  }

  _flush(callback: TransformCallback) {
    const buf = this.#finalize(this.#lengthCount);
    this.push(buf);
    callback();
  }
}
