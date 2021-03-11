import { assertMajorType } from "../error/assertion.js";
import { range } from "../utils/iter/range.js";
import { CCDLSyntax, CCDLSyntaxMaybeNodata } from "./internal/CCDLSyntax.js";
import { countHead, readHead, writeHead } from "./internal/head.js";
import { majorTypes } from "./internal/MajorType.js";

export type MapSyntax<
  KeyOutput,
  KeyInput,
  ValueOutput,
  ValueInput
> = CCDLSyntax<Map<KeyOutput, ValueOutput>, Map<KeyInput, ValueInput>> & {
  keySyntax: CCDLSyntaxMaybeNodata<KeyOutput, KeyInput>;
  valueSyntax: CCDLSyntaxMaybeNodata<ValueOutput, ValueInput>;
};

export function map<KeyOutput, KeyInput, ValueOutput, ValueInput>(
  keySyntax: CCDLSyntaxMaybeNodata<KeyOutput, KeyInput>,
  valueSyntax: CCDLSyntaxMaybeNodata<ValueOutput, ValueInput>
): MapSyntax<KeyOutput, KeyInput, ValueOutput, ValueInput> {
  return {
    keySyntax,
    valueSyntax,
    encode(stream, data) {
      let bytesWritten = writeHead(stream, majorTypes.map, data.size);
      for (const [key, value] of data) {
        bytesWritten += this.keySyntax.encode(stream, key);
        bytesWritten += this.valueSyntax.encode(stream, value);
      }
      return bytesWritten;
    },
    count(data) {
      let bytesWritten = countHead(data.size);
      for (const [key, value] of data) {
        bytesWritten += this.keySyntax.count(key);
        bytesWritten += this.valueSyntax.count(value);
      }
      return bytesWritten;
    },
    async read(stream) {
      const { majorType, additionalInfo, bytesRead } = await readHead(stream);
      assertMajorType(majorTypes.map, majorType);
      const result = new Map<KeyOutput, ValueOutput>();
      let totalBytesRead = bytesRead;
      for (const _ of range(0, additionalInfo)) {
        const { bytesRead: keyBytes, data: key } = await this.keySyntax.read(
          stream
        );
        const {
          bytesRead: valueBytes,
          data: value,
        } = await this.valueSyntax.read(stream);
        result.set(key, value);
        totalBytesRead += keyBytes + valueBytes;
      }
      return {
        bytesRead: totalBytesRead,
        data: result,
      };
    },
  };
}
