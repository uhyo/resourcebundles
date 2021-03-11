import { assertMajorType } from "../error/assertion.js";
import { CCDLSyntaxError } from "../error/CCDLSyntaxError.js";
import { CCDLSyntax, InferDataFromSyntax } from "./internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "./internal/head.js";
import { majorTypes } from "./internal/MajorType.js";

type SequenceArray<Defs extends readonly CCDLSyntax<any>[]> = {
  defs: Defs;
} & CCDLSyntax<
  {
    [K in keyof Defs]: InferDataFromSyntax<Defs[K]> extends [infer O, infer I]
      ? O
      : unknown;
  },
  {
    [K in keyof Defs]: InferDataFromSyntax<Defs[K]> extends [infer O, infer I]
      ? I
      : unknown;
  }
>;

/**
 * Fixed-length array where each data can have different types.
 */
export function sequenceArray<Defs extends readonly CCDLSyntax<any>[]>(
  ...defs: [...Defs]
): SequenceArray<Defs> {
  return {
    defs,
    encode(stream, data) {
      if (this.defs.length !== data.length) {
        throw new Error(`Data must have length ${this.defs.length}`);
      }
      let bytesWritten = writeHead(stream, majorTypes.array, data.length);
      for (const [i, def] of this.defs.entries()) {
        bytesWritten += def.encode(stream, data[i]!);
      }
      return bytesWritten;
    },
    count(data) {
      if (this.defs.length !== data.length) {
        throw new Error(`Data must have length ${this.defs.length}`);
      }
      let bytesWritten = countHead(data.length);
      for (const [i, def] of this.defs.entries()) {
        bytesWritten += def.count(data[i]!);
      }
      return bytesWritten;
    },
    async read(stream) {
      const { majorType, additionalInfo, bytesRead } = await readHead(stream);
      assertMajorType(majorTypes.array, majorType);
      if (this.defs.length !== additionalInfo) {
        throw new CCDLSyntaxError(
          `Array length unmatch: expected ${this.defs.length}, received ${additionalInfo}`
        );
      }
      let totalBytesRead = bytesRead;
      const result: unknown[] = [];
      for (const def of this.defs) {
        const { bytesRead, data } = await def.read(stream);
        totalBytesRead += bytesRead;
        result.push(data);
      }
      return {
        bytesRead: totalBytesRead,
        // type definition justifies this `as any`.
        data: result as any,
      };
    },
    rootSize: 1,
  };
}
