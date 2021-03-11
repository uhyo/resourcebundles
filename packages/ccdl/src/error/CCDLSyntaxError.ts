import { MajorType } from "../syntax/internal/MajorType";

export class CCDLSyntaxError extends Error {}

export function unexpectedMajorTypeError(
  expected: MajorType,
  actual: MajorType
): CCDLSyntaxError {
  return new CCDLSyntaxError(
    `Expected major type ${actual}, received ${expected}`
  );
}
