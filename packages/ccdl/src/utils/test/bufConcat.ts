/**
 * Buffer.concat but also can concat numbers as single byte
 */
export function bufferConcat(...chunks: (number | string | Buffer)[]): Buffer {
  return Buffer.concat(
    chunks.map((value) => {
      if (typeof value === "number") {
        return Buffer.from([value]);
      }
      if (typeof value === "string") {
        return Buffer.from(value);
      }
      return value;
    })
  );
}
