import { assertMajorType } from "../error/assertion.js";
import { CCDLSyntax } from "./internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "./internal/head.js";
import { majorTypes } from "./internal/MajorType.js";

/**
 * Syntax for just reading/writing array head.
 * Note: user of this syntax is responsible to read/write array body correctly.
 */
export function arrayHead(): CCDLSyntax<number> {
  return {
    encode(stream, data) {
      // write length.
      return writeHead(stream, majorTypes.array, data);
    },
    count(data) {
      return countHead(data);
    },
    async read(stream) {
      const { majorType, additionalInfo, bytesRead } = await readHead(stream);
      assertMajorType(majorTypes.array, majorType);
      return {
        bytesRead,
        data: additionalInfo,
      };
    },
  };
}
