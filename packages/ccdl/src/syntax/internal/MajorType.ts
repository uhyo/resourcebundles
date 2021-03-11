export type MajorType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const majorTypes = {
  uint: 0,
  byteString: 2,
  array: 4,
  map: 5,
} as const;
