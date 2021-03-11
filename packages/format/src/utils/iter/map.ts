export function* iterMap<T, U>(i: Iterable<T>, mapper: (value: T) => U) {
  for (const value of i) {
    yield mapper(value);
  }
}
