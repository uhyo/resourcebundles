import { assertMajorType } from "../../error/assertion.js";
import { CCDLSyntaxError } from "../../error/CCDLSyntaxError.js";
import { CCDLSyntax } from "../internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "../internal/head.js";
import { majorTypes } from "../internal/MajorType.js";

export type BytesCborSyntax<Output, Input> = CCDLSyntax<Output, Input> & {
  syntax: CCDLSyntax<Output, Input>;
};

// bytes .cbor {type}
export function bytesCbor<Output, Input>(
  syntax: CCDLSyntax<Output, Input>
): BytesCborSyntax<Output, Input> {
  return {
    syntax,
    async encode(stream, data) {
      const length = this.syntax.count(data);
      const headBytes = writeHead(stream, majorTypes.byteString, length);
      const mainBytes = await this.syntax.encode(stream, data);
      return headBytes + mainBytes;
    },
    count(data) {
      const length = this.syntax.count(data);
      return countHead(length) + length;
    },
    async read(stream) {
      const {
        majorType,
        additionalInfo,
        bytesRead: headBytes,
      } = await readHead(stream);
      assertMajorType(majorTypes.byteString, majorType);
      const { bytesRead, data } = await this.syntax.read(stream);
      if (additionalInfo !== bytesRead) {
        throw new CCDLSyntaxError(
          `Data size unmatch: expected ${additionalInfo}, actual ${bytesRead}`
        );
      }
      return {
        bytesRead: headBytes + bytesRead,
        data,
      };
    },
    rootSize: 1,
  };
}
