export function iterMax(iter: Iterable<number>): number {
  let max = -Infinity;
  for (const value of iter) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}
