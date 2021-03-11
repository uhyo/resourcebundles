import { map, sequenceArray, textString, uint } from "@resourcebundles/ccdl";

// index = {* tstr => [location-in-responses] }
// location-in-responses = (offset: uint, length: uint)
export const indexSyntax = map(textString, sequenceArray(uint, uint));
