import { encodeOne } from "cbor";
import { writeToStream } from "../utils/test/writeToStream.js";
import { parseResourceBundleIndex } from "./parseResourceBundleIndex.js";

describe("parseResourceBundleIndex", () => {
  it("parses empty bundle", async () => {
    const emptyBundle = encodeOne([
      // magic number
      Buffer.from("🌐📦"),
      // verison
      Buffer.from([0x31, 0, 0, 0]),
      // section-lengths
      encodeOne(["index", 1, "resources", 1]),
      // sections
      [
        // index
        {},
        // resources
        [],
      ],
      // bundle length
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 47]),
    ]);
    const stream = await writeToStream(async (l) => {
      l.write(emptyBundle);
    });
    const index = await parseResourceBundleIndex(stream);
    expect(index).toEqual({
      bytesRead: 37,
      index: new Map(),
      resourcesOffset: 37,
    });
  });
});
