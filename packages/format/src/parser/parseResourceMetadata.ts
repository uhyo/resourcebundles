import {
  arrayHead,
  bytesCbor,
  byteString,
  byteStringHead,
  map,
} from "@resourcebundles/ccdl";
import { Readable } from "node:stream";
import { iterMap } from "../utils/iter/map";
import { ResourceBundleParseError } from "./ResourceBundleParseError";

export type ResourceMetadata = {
  bytesRead: number;
  headers: Map<string, string>;
  payloadSize: number;
};

/**
 * Parses metadata of one resource from given stream.
 * Given stream must emit contents from the start of one resoucre CBOR object.
 */
export async function parseResourceMetadata(
  stream: Readable
): Promise<ResourceMetadata> {
  // response = [headers: bstr .cbor headers, payload: bstr]
  // headers = {* bstr => bstr}

  let bytesRead = 0;
  const responseObjectHeader = await arrayHead.read(stream);
  bytesRead += responseObjectHeader.bytesRead;
  if (responseObjectHeader.data !== 2) {
    throw new ResourceBundleParseError(
      `Expected Array of length 2, received ${responseObjectHeader.data}`
    );
  }

  // read headers
  const headers = await bytesCbor(map(byteString, byteString)).read(stream);
  bytesRead += headers.bytesRead;
  // read just size of payload
  const payloadSize = await byteStringHead.read(stream);
  bytesRead += payloadSize.bytesRead;

  return {
    bytesRead,
    headers: new Map(
      iterMap(headers.data.entries(), ([k, v]) => [k.toString(), v.toString()])
    ),
    payloadSize: payloadSize.data,
  };
}
