import {
  bytesCbor,
  group,
  repeatArray,
  textString,
  uint,
} from "@resourcebundles/ccdl";

// section-lengths: bytes .cbor section-lengths
// section-lengths = [* (section-name: tstr, length: uint) ]
export const sectionLengthsSyntax = bytesCbor(
  repeatArray(group(textString, uint))
);
