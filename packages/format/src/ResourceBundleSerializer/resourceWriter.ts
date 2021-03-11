import {
  bytesCbor,
  byteString,
  byteStringHead,
  CCDLSyntax,
  map,
  sequenceArray,
} from "@resourcebundles/ccdl";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertNever } from "../utils/assertNever.js";
import { getResourcePayloadLength, Resource } from "./Resource.js";

// intermediate representation of the resources section
export type ResourceSectionItem = {
  resourceUrl: string;
  headers: Map<string, string>;
  payloadByteSize: number;
  resource: Resource;
};

const resourceWriter: CCDLSyntax<Resource["payload"]> = {
  async encode(stream, payload) {
    const headerBytes = await byteStringHead.encode(
      stream,
      getResourcePayloadLength(payload)
    );
    switch (payload.type) {
      case "buffer": {
        stream.write(payload.data);
        return headerBytes + payload.data.length;
      }
      case "file": {
        const fileDataStream = createReadStream(payload.fileName);
        fileDataStream.pipe(stream);
        await waitForReadableStream(fileDataStream);
        return headerBytes + payload.fileSize;
      }
      default: {
        assertNever(payload);
      }
    }
  },
  count(data) {
    const payloadLength = getResourcePayloadLength(data);
    const headerBytes = byteStringHead.count(payloadLength);
    return headerBytes + payloadLength;
  },
  read() {
    throw new Error("Write Only");
  },
  rootSize: 1,
};

// response = [headers: bstr .cbor headers, payload: bstr]
// headers = {* bstr => bstr}
export const resourceSectionItemSyntax = sequenceArray(
  bytesCbor(map(byteString, byteString)),
  resourceWriter
);

function waitForReadableStream(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once("end", resolve);
    stream.once("error", reject);
  });
}
