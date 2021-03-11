import { assertMajorType } from "../../error/assertion.js";
import { CCDLSyntax } from "../internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "../internal/head.js";
import { majorTypes } from "../internal/MajorType.js";

/**
 * Syntax for just reading/writing map head.
 * Note: user of this syntax is responsible to read/write map body correctly.
 */
export const mapHead: CCDLSyntax<number> = {
  async encode(stream, data) {
    // write length.
    return writeHead(stream, majorTypes.map, data);
  },
  count(data) {
    return countHead(data);
  },
  async read(stream) {
    const { majorType, additionalInfo, bytesRead } = await readHead(stream);
    assertMajorType(majorTypes.map, majorType);
    return {
      bytesRead,
      data: additionalInfo,
    };
  },
  rootSize: 0,
};
