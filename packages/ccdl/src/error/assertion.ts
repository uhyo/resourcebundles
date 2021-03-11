import { MajorType } from "../syntax/internal/MajorType.js";
import { unexpectedMajorTypeError } from "./CCDLSyntaxError.js";

export function assertMajorType(expected: MajorType, actual: MajorType) {
  if (expected !== actual) {
    throw unexpectedMajorTypeError(expected, actual);
  }
}

export function invariant(condition: boolean) {
  throw new Error("Invariant Error");
}
