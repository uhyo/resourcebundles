export function handleOptionMultiple(
  option: string | string[] | undefined
): string[] {
  if (option === undefined) {
    return [];
  }
  if (typeof option === "string") {
    return [option];
  }
  return option;
}
