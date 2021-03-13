import { range } from "./iter/range.js";

/**
 * Sort the entries in given map according to Core Deterministic Encoding Requirements (4.2.1 in RFC8949).
 * Currently only supprts string keys.
 */
export function deterministicSortStringMap<T>(
  map: ReadonlyMap<string, T>
): Map<string, T> {
  const entries = Array.from(map.entries());
  entries.sort((a, b) => {
    // as strings have their length at the beginning, shorter strings come first.
    // for the same length strings, just order by char codes.
    if (a[0].length !== b[0].length) {
      return a[0].length - b[0].length;
    }
    for (const i of range(0, a[0].length)) {
      const ac = a[0].charCodeAt(i);
      const bc = b[0].charCodeAt(i);
      if (ac !== bc) {
        return ac - bc;
      }
    }
    return 0;
  });
  return new Map(entries);
}
