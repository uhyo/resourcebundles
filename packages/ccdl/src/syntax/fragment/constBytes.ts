import { CCDLSyntaxError } from "../../error/CCDLSyntaxError.js";
import { readBytes } from "../../stream/readBytes.js";
import { NoDataCCDLSyntax } from "../internal/CCDLSyntax.js";

export interface ConstBytes extends NoDataCCDLSyntax<undefined> {
  bytes: Uint8Array;
}

export function constBytes(bytes: Uint8Array): ConstBytes {
  return {
    bytes,
    async encode(stream) {
      stream.write(this.bytes);
      return this.bytes.length;
    },
    count() {
      return this.bytes.length;
    },
    async read(stream) {
      const data = await readBytes(stream, this.bytes.length);
      if (!data.equals(this.bytes)) {
        throw new CCDLSyntaxError("Data unmatch");
      }
      return {
        bytesRead: data.length,
        data: undefined,
      };
    },
    rootSize: 0,
  };
}
