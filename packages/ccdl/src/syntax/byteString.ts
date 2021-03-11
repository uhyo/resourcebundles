import { assertMajorType } from "../error/assertion";
import { readBytes } from "../stream/readBytes";
import { CCDLSyntax } from "./internal/CCDLSyntax";
import { readHead, writeHead } from "./internal/head";
import { majorTypes } from "./internal/MajorType";

export function byteString(): CCDLSyntax<Buffer, string | Buffer> {
  return {
    encode(stream, data) {
      const length = Buffer.byteLength(data);
      // write length.
      const headerBytes = writeHead(stream, majorTypes.byteString, length);
      // write body.
      stream.write(data);
      return headerBytes + length;
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
}
