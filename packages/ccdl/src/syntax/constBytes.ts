import { CCDLSyntaxError } from "../error/CCDLSyntaxError.js";
import { readBytes } from "../stream/readBytes.js";
import { CCDLSyntax } from "./internal/CCDLSyntax.js";

interface ConstBytes extends CCDLSyntax<undefined> {
  bytes: Uint8Array;
}

export function constBytes(bytes: Uint8Array): ConstBytes {
  return {
    bytes,
    encode(stream) {
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
  };
}
