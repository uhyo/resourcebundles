export function fileSizeString(size: number) {
  if (size === 1) {
    return `${size} byte`;
  }
  if (size < 2 ** 10) {
    return `${size} bytes`;
  }
  if (size < 2 ** 20) {
    return `${(size / 2 ** 10).toFixed(3)}KiB`;
  }
  if (size < 2 ** 30) {
    return `${(size / 2 ** 20).toFixed(3)}MiB`;
  }
  return `${(size / 2 ** 30).toFixed(3)}GiB`;
}
