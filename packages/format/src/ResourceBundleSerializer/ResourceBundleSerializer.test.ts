import { decodeAll, encodeOne } from "cbor";
import { receiveToBuffer } from "../utils/test/receiveToBuffer.js";
import { ResourceBundleSerializer } from "./index.js";

describe("ResourceBundleSerializer", () => {
  it("empty bundle", async () => {
    const serializer = new ResourceBundleSerializer();
    const buf = await receiveToBuffer(serializer.serialize());
    const decoded = await decodeAll(buf);

    expect(decoded).toEqual([
      [
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
      ],
    ]);
  });
});
