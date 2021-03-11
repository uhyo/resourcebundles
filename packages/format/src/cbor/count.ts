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
 * Count bytes to write given length of string as a byte string.
 * @returns written bytes
 */
export function countByteStringOfLength(length: number): number {
  // write length information with major tag
  return countTagAndAdditionalValue(majorTags.byteString, length) + length;
}

/**
 * Count bytes to write given string as a byte string.
 * @returns written bytes
 */
export function countByteString(str: string | Buffer): number {
  // write length information with major tag
  return countByteStringOfLength(Buffer.byteLength(str, "utf8"));
}

/**
 * Count bytes to write given object as a map.
 */
export function countByteStringMapObject<T>(
  map: Record<string, T>,
  elementCounter: (value: T) => number
): number {
  let result = 0;
  const entries = Object.entries(map);
  const mapSize = entries.length;
  result += countTagAndAdditionalValue(majorTags.map, mapSize);
  for (const [key, element] of entries) {
    result += countByteString(key);
    result += elementCounter(element);
  }
  return result;
}

/**
 * Count bytes to write header of array of given length.
 */
export function countArrayHeader(length: number): number {
  return countTagAndAdditionalValue(majorTags.array, length);
}

/**
 * Count bytes to write given array.
 */
export function countArray<T>(
  arr: readonly T[],
  elementCounter: (value: T) => number
): number {
  return arr.reduce(
    (acc, elm) => acc + elementCounter(elm),
    countArrayHeader(arr.length)
  );
}
