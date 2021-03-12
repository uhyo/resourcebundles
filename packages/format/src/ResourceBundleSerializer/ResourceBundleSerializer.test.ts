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
  it("single buffer resource", async () => {
    const serializer = new ResourceBundleSerializer();
    serializer.addResourceFromBuffer(
      "hello.txt",
      Buffer.from("Hello, world!"),
      {
        "Content-Type": "text/plain",
      }
    );
    const buf = await receiveToBuffer(serializer.serialize());
    const decoded = await decodeAll(buf);

    const resource1Headers = encodeOne(
      new Map([[Buffer.from("Content-Type"), Buffer.from("text/plain")]])
    );

    expect(decoded).toEqual([
      [
        // magic number
        Buffer.from("🌐📦"),
        // verison
        Buffer.from([0x31, 0, 0, 0]),
        // section-lengths
        encodeOne([
          "index",
          1 + 10 + 4,
          "resources",
          1 + 1 + 2 + resource1Headers.length + 14,
        ]),
        // sections
        [
          // index
          {
            "hello.txt": [1, 1 + 2 + resource1Headers.length + 14],
          },
          // resources
          [[resource1Headers, Buffer.from("Hello, world!")]],
        ],
        // bundle length
        Buffer.from([0, 0, 0, 0, 0, 0, 0, buf.length]),
      ],
    ]);
  });
});
