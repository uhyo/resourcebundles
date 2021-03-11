import { CCDLSyntax, InferDataFromSyntax } from "./internal/CCDLSyntax.js";

type GroupSyntax<Defs extends readonly CCDLSyntax<any>[]> = {
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
 * Fixed-length sequence of data.
 */
export function group<Defs extends readonly CCDLSyntax<any>[]>(
  ...defs: [...Defs]
): GroupSyntax<Defs> {
  return {
    defs,
    encode(stream, data) {
      let bytesWritten = 0;
      for (const [i, def] of this.defs.entries()) {
        bytesWritten += def.encode(stream, data[i]!);
      }
      return bytesWritten;
    },
    count(data) {
      let bytesWritten = 0;
      for (const [i, def] of this.defs.entries()) {
        bytesWritten += def.count(data[i]!);
      }
      return bytesWritten;
    },
    async read(stream) {
      let totalBytesRead = 0;
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
    rootSize: defs.reduce((acc, d) => acc + d.rootSize, 0),
  };
}
