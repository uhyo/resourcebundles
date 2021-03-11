import { stat } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import {
  countArray,
  countArrayHeader,
  countByteString,
  countByteStringMapObject,
  countByteStringOfLength,
} from "../cbor/count.js";
import { iterMap } from "../utils/iter/map.js";
import { LengthCountingStream } from "../utils/LengthCountingStream.js";
import type { Headers } from "./Headers.js";
import { getResourcePayloadLength, Resource } from "./Resource.js";

// https://github.com/WICG/resource-bundles/commit/a6a2c676a2714c09f46e6c630cbc84435356b535

/**
 * Serializes files.
 */
export class ResourceBundleSerializer {
  #resourceMap = new Map<string, Resource>();

  async addResourceFromFile(
    resourceUrl: string,
    fileName: string,
    headers: Headers = {}
  ) {
    const fileStat = await stat(fileName);
    this.#resourceMap.set(resourceUrl, {
      headers,
      payload: {
        type: "file",
        fileName,
        fileSize: fileStat.size,
      },
    });
  }

  async addResourceFromBuffer(
    resourceUrl: string,
    buffer: Uint8Array,
    headers: Headers = {}
  ) {
    this.#resourceMap.set(resourceUrl, {
      headers,
      payload: {
        type: "buffer",
        data: buffer,
      },
    });
  }

  serialize(): Readable {
    const result = new LengthCountingStream();
    this.runSerialize(result).then(
      () => {
        result.end();
      },
      (error) => {
        result.destroy(error);
      }
    );
    return result;
  }

  /**
   * Main implementation of serialization
   */
  private async runSerialize(result: Writable) {
    // magic number
    result.write(Buffer.from([0xf0, 0x9f, 0x8c, 0x90, 0xf0, 0x9f, 0x93, 0xa6]));
    // version
    result.write(Buffer.from([0x31, 0, 0, 0]));

    // generate data for resource section
    const resourceList = Array.from(
      iterMap(this.#resourceMap.entries(), ([resourceUrl, resource]) => {
        const payloadByteSize = getResourcePayloadLength(resource.payload);
        return {
          resourceUrl,
          payloadByteSize,
          // headers + payload
          dataByteSize:
            countByteStringMapObject(resource.headers, countByteString) +
            countByteStringOfLength(payloadByteSize),
          resource,
        };
      })
    );
    const resourceSectionByteSize = countArray(
      resourceList,
      ({ dataByteSize }) => dataByteSize
    );

    // generate index
    const index = new Map();
    let offset = countArrayHeader(resourceList.length);
    for (const { payloadByteSize, resourceUrl } of resourceList) {
      index.set(resourceUrl, {
        offset,
        length: payloadByteSize,
      });
    }
  }
}
