import {
  arrayHead,
  byteString,
  deterministicSortStringMap,
  InferInputFromSyntax,
  mapHead,
  repeatArray,
} from "@resourcebundles/ccdl";
import { stat } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import { indexSyntax } from "../syntax/index.js";
import { sectionLengthsSyntax } from "../syntax/sectionLengths.js";
import { iterMap } from "../utils/iter/map.js";
import { LengthCountingStream } from "../utils/LengthCountingStream.js";
import type { Headers } from "./Headers.js";
import { Resource } from "./Resource.js";
import { resourceSectionItemSyntax } from "./resourceWriter.js";

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
    const result = new LengthCountingStream((length) => {
      const buf = Buffer.allocUnsafe(9);
      // TODO: do not know CBOR
      buf.writeUInt8(0b010_01000);
      buf.writeBigUInt64BE(BigInt(length + 9), 1);
      return buf;
    });
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
    // bundle is a 5-array
    await arrayHead.encode(result, 5);
    // magic number
    // magic: h'F0 9F 8C 90 F0 9F 93 A6'
    await byteString.encode(result, "🌐📦");
    // version
    // version: bytes .size 4
    await byteString.encode(result, Buffer.from([0x31, 0, 0, 0]));

    type ResourceMapItem = InferInputFromSyntax<
      typeof resourceSectionItemSyntax
    >;
    // generate data for resource section
    const resourceMap = deterministicSortStringMap(
      new Map<string, ResourceMapItem>(
        iterMap(this.#resourceMap.entries(), ([resourceUrl, resource]) => {
          const headersMap = deterministicSortStringMap(
            new Map(Object.entries(resource.headers))
          );
          return [resourceUrl, [headersMap, resource.payload]];
        })
      )
    );

    // generate index
    const index = new Map<string, [offset: number, length: number]>();
    let offset = mapHead.count(resourceMap.size);
    for (const [resourceUrl, item] of resourceMap) {
      const itemSize = resourceSectionItemSyntax.count(item);
      index.set(resourceUrl, [offset, itemSize]);
      offset += itemSize;
    }

    const indexSectionByteSize = indexSyntax.count(index);
    const resourceSectionByteSize = offset;

    // write section-lengths
    // section-lengths: bytes .cbor section-lengths
    await sectionLengthsSyntax.encode(result, [
      ["index", indexSectionByteSize],
      ["resources", resourceSectionByteSize],
    ]);

    // beginning of sections array ([index, resources]).
    await arrayHead.encode(result, 2);

    // write index section
    // index = {* tstr => [location-in-responses] }
    // location-in-responses = (offset: uint, length: uint)
    await indexSyntax.encode(result, index);

    // write resource section
    await repeatArray(resourceSectionItemSyntax).encode(
      result,
      Array.from(resourceMap.values())
    );
  }
}
