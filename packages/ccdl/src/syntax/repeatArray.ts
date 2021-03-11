import { assertMajorType } from "../error/assertion";
import { range } from "../utils/iter/range";
import { CCDLSyntax } from "./internal/CCDLSyntax";
import { countHead, readHead, writeHead } from "./internal/head";
import { majorTypes } from "./internal/MajorType";

export type RepeatArraySyntax<Output, Input> = CCDLSyntax<Output[], Input[]> & {
  syntax: CCDLSyntax<Output, Input>;
};

/**
 * Syntax for array of unknown length and homogeneous elements.
 */
export function repeatArray<Output, Input>(
  syntax: CCDLSyntax<Output, Input>
): RepeatArraySyntax<Output, Input> {
  return {
    syntax,
    async encode(stream, data) {
      let bytesWritten = writeHead(
        stream,
        majorTypes.array,
        data.length * syntax.rootSize
      );
      for (const element of data) {
        bytesWritten += await this.syntax.encode(stream, element);
      }
      return bytesWritten;
    },
    count(data) {
      let bytesWritten = countHead(data.length);
      for (const element of data) {
        bytesWritten += this.syntax.count(element);
      }
      return bytesWritten;
    },
    async read(stream) {
      const {
        majorType,
        additionalInfo,
        bytesRead: headBytesRead,
      } = await readHead(stream);
      assertMajorType(majorTypes.array, majorType);
      const data: Output[] = [];
      let totalBytesRead = headBytesRead;
      for (const _ of range(0, additionalInfo / this.syntax.rootSize)) {
        const { bytesRead, data: element } = await this.syntax.read(stream);
        totalBytesRead += bytesRead;
        data.push(element);
      }
      return {
        bytesRead: totalBytesRead,
        data,
      };
    },
    rootSize: 1,
  };
}
