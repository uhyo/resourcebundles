import { majorTags } from "./constants.js";

/**
 * Count bytes to write value as additional information, with given major tag
 * @returns written bytes
 */
export function countTagAndAdditionalValue(
  _majorTag: number,
  value: number
): number {
  if (value <= 23) {
    // immediate
    return 1;
  } else if (value <= 0xff) {
    // one byte
    return 2;
  } else if (value <= 0xffff) {
    // two bytes
    return 3;
  } else if (value <= 0xffffffff) {
    return 5;
  } else {
    return 9;
  }
}

/**
 * Count bytes to write given string as a byte string.
 * @returns written bytes
 */
export function countByteString(str: string | Buffer): number {
  // write length information with major tag
  const length = Buffer.byteLength(str, "utf8");
  return countTagAndAdditionalValue(majorTags.byteString, length) + length;
}
