import { Writable } from "node:stream";
import { majorTags } from "./constants.js";

/**
 * Write value as additional information, with given major tag
 * @returns written bytes
 */
export function writeTagAndAdditionalValue(
  writable: Writable,
  majorTag: number,
  value: number
): number {
  const majorPart = majorTag << 5;
  if (value <= 23) {
    // immediate
    writable.write(Buffer.from([majorPart | value]));
    return 1;
  } else if (value <= 0xff) {
    // one byte
    writable.write(Buffer.from([majorPart | 24, value]));
    return 2;
  } else if (value <= 0xffff) {
    // two bytes
    const buf = Buffer.allocUnsafe(3);
    buf.writeUInt8(majorPart | 25, 0);
    buf.writeUInt16BE(value, 1);
    writable.write(buf);
    return 3;
  } else if (value <= 0xffffffff) {
    const buf = Buffer.allocUnsafe(5);
    buf.writeUInt8(majorPart | 26, 0);
    buf.writeUInt32BE(value, 1);
    writable.write(buf);
    return 5;
  } else {
    const buf = Buffer.allocUnsafe(9);
    buf.writeUInt8(majorPart | 27, 0);
    buf.writeBigUInt64BE(BigInt(value), 1);
    writable.write(buf);
    return 9;
  }
}

/**
 * Write given string as a byte string.
 * @returns written bytes
 */
export function writeByteString(
  writable: Writable,
  str: string | Buffer
): number {
  // write length information with major tag
  const length = Buffer.byteLength(str, "utf8");
  const b = writeTagAndAdditionalValue(writable, majorTags.byteString, length);
  writable.write(str);
  return b + length;
}
