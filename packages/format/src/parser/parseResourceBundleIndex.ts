import { arrayHead, byteString } from "@resourcebundles/ccdl";
import { Readable } from "node:stream";
import { indexSyntax } from "../syntax";
import { magicNumber, versionNumber } from "../syntax/const";
import { sectionLengthsSyntax } from "../syntax/sectionLengths";
import { iterMap } from "../utils/iter/map";
import { skipBytes } from "../utils/stream/skipBytes";
import { ResourceBundleParseError } from "./ResourceBundleParseError";

export type ParseResourceBundleIndexOptions = {};

export type BundleIndex = {
  /**
   * bytes read by the parseResourceBundleIndex call.
   */
  bytesRead: number;
  /**
   * The start position of 'resources' section.
   */
  resourcesOffset: number;
  /**
   * Index of resources.
   */
  index: Map<
    string,
    {
      /**
       * Offset of resource in the 'resources' section.
       */
      offset: number;
      /**
       * Length of full CBOR item representing one resource.
       */
      length: number;
    }
  >;
};

/**
 * Parses ResourceBundle from given stream until it has parsed the index section.
 */
export async function parseResourceBundleIndex(
  stream: Readable,
  options: ParseResourceBundleIndexOptions = {}
): Promise<BundleIndex> {
  let currentPosition = 0;
  const bundleArrayHead = await arrayHead.read(stream);
  currentPosition += bundleArrayHead.bytesRead;
  if (bundleArrayHead.data !== 5) {
    throw new ResourceBundleParseError("Bundle Array Length unmatch");
  }
  // magic number
  const inputMagicNumber = await byteString.length(8, 8).read(stream);
  currentPosition += inputMagicNumber.bytesRead;
  if (inputMagicNumber.data.toString("utf8") !== magicNumber) {
    throw new ResourceBundleParseError("Magic number mismatch");
  }
  // version number
  const inputVersionNumber = await byteString.length(4, 4).read(stream);
  currentPosition += inputVersionNumber.bytesRead;
  if (!inputVersionNumber.data.equals(versionNumber)) {
    throw new ResourceBundleParseError("Version number mismatch");
  }
  // section-lengths
  const sectionLengths = await sectionLengthsSyntax.read(stream);
  currentPosition += sectionLengths.bytesRead;

  const sectionInfo = new Map<string, { offset: number; length: number }>();
  let sectionOffset = 0;
  for (const [sectionName, sectionLength] of sectionLengths.data) {
    if (sectionInfo.has(sectionName)) {
      // TODO: really?
      throw new ResourceBundleParseError(
        `Duplicate entry '${sectionName} in section-lengths`
      );
    }
    sectionInfo.set(sectionName, {
      offset: sectionOffset,
      length: sectionLength,
    });
    sectionOffset += sectionLength;
  }
  // now, index is at the start of sections.
  const sectionsArrayHead = await arrayHead.read(stream);
  currentPosition += sectionsArrayHead.bytesRead;
  if (sectionInfo.size !== sectionsArrayHead.data) {
    throw new ResourceBundleParseError(
      `Array length mismatch: expected ${sectionInfo.size}, received ${sectionsArrayHead.data}`
    );
  }
  const sectionsStartIndex = currentPosition;
  const indexSectionOffset = sectionInfo.get("index");
  const resourcesSectionOffset = sectionInfo.get("resources");
  if (indexSectionOffset === undefined) {
    throw new ResourceBundleParseError(`No 'index' section found`);
  }
  if (resourcesSectionOffset === undefined) {
    throw new ResourceBundleParseError(`No 'resources' section found`);
  }
  if (indexSectionOffset.offset > resourcesSectionOffset.offset) {
    // TODO: really?
    throw new ResourceBundleParseError(
      "'index' section must come before 'resources' section"
    );
  }

  // read 'index' section.
  // skip until the start of index section
  await skipBytes(
    stream,
    sectionsStartIndex + indexSectionOffset.offset - currentPosition,
    () => new ResourceBundleParseError("Unexpected end of input")
  );
  currentPosition = sectionsStartIndex + indexSectionOffset.offset;
  const indexData = await indexSyntax.read(stream);
  currentPosition += indexData.bytesRead;
  const indexSection: BundleIndex["index"] = new Map(
    iterMap(indexData.data.entries(), ([resourceUrl, [offset, length]]) => [
      resourceUrl,
      {
        offset,
        length,
      },
    ])
  );
  return {
    bytesRead: currentPosition,
    resourcesOffset: sectionsStartIndex + resourcesSectionOffset.offset,
    index: indexSection,
  };
}
