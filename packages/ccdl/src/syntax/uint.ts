import { assertMajorType } from "../error/assertion.js";
import { CCDLSyntax } from "./internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "./internal/head.js";
import { majorTypes } from "./internal/MajorType.js";

export const uint: CCDLSyntax<number> = {
  encode(stream, data) {
    return writeHead(stream, majorTypes.uint, data);
  },
  count(data) {
    return countHead(data);
  },
  async read(stream) {
    const { majorType, additionalInfo, bytesRead } = await readHead(stream);
    assertMajorType(majorTypes.uint, majorType);
    return {
      bytesRead,
      data: additionalInfo,
    };
  },
  rootSize: 1,
};
