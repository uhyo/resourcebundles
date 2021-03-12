import { assertMajorType } from "../error/assertion.js";
import { CCDLSyntaxError } from "../error/CCDLSyntaxError.js";
import { readBytes } from "../stream/readBytes.js";
import { CCDLSyntax } from "./internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "./internal/head.js";
import { majorTypes } from "./internal/MajorType.js";

export type ByteStringSyntax = CCDLSyntax<Buffer, string | Buffer> & {
  /**
   * Create a ByteString syntax with limited length.
   */
  length(min: number, max: number): ByteStringLengthSyntax;
};

export type ByteStringLengthSyntax = CCDLSyntax<Buffer, string | Buffer> & {
  min: number;
  max: number;
};

export const byteString: ByteStringSyntax = {
  async encode(stream, data) {
    const length = Buffer.byteLength(data);
    // write length.
    const headerBytes = writeHead(stream, majorTypes.byteString, length);
    // write body.
    stream.write(data);
    return headerBytes + length;
  },
  count(data) {
    const length = Buffer.byteLength(data);
    return countHead(length) + length;
  },
  async read(stream) {
    const { majorType, additionalInfo, bytesRead } = await readHead(stream);
    assertMajorType(majorTypes.byteString, majorType);
    const buf = await readBytes(stream, additionalInfo);
    return {
      bytesRead: bytesRead + buf.length,
      data: buf,
    };
  },
  rootSize: 1,
  length,
};

function length(min: number, max: number): ByteStringLengthSyntax {
  return {
    min,
    max,
    async encode(stream, data) {
      const byteLength = Buffer.byteLength(data);
      if (byteLength < this.min || this.max < byteLength) {
        throw new Error(
          `Length of given data is not in range [${this.min}, ${this.max}]`
        );
      }
      return byteString.encode(stream, data);
    },
    count(data) {
      return byteString.count(data);
    },
    async read(stream) {
      const { majorType, additionalInfo, bytesRead } = await readHead(stream);
      assertMajorType(majorTypes.byteString, majorType);
      if (additionalInfo < this.min || this.max < additionalInfo) {
        throw new CCDLSyntaxError(
          `Expected byteString length to be in [${this.min}, ${this.max}], received ${additionalInfo}`
        );
      }
      const buf = await readBytes(stream, additionalInfo);
      return {
        bytesRead: bytesRead + buf.length,
        data: buf,
      };
    },
    rootSize: 1,
  };
}
