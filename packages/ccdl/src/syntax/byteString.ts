import { assertMajorType } from "../error/assertion.js";
import { readBytes } from "../stream/readBytes.js";
import { CCDLSyntax } from "./internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "./internal/head.js";
import { majorTypes } from "./internal/MajorType.js";

export const byteString: CCDLSyntax<Buffer, string | Buffer> = {
  encode(stream, data) {
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
};
