import { assertMajorType } from "../../error/assertion.js";
import { CCDLSyntax } from "../internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "../internal/head.js";
import { majorTypes } from "../internal/MajorType.js";

/**
 * Syntax for just reading/writing byte head.
 * Note: user of this syntax is responsible to read/write byteString body correctly.
 */
export const byteStringHead: CCDLSyntax<number> = {
  async encode(stream, data) {
    // write length.
    return writeHead(stream, majorTypes.byteString, data);
  },
  count(data) {
    return countHead(data);
  },
  async read(stream) {
    const { majorType, additionalInfo, bytesRead } = await readHead(stream);
    assertMajorType(majorTypes.byteString, majorType);
    return {
      bytesRead,
      data: additionalInfo,
    };
  },
  rootSize: 0,
};
