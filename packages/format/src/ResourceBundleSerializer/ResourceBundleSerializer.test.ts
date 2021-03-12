import { decodeAll, encodeOne } from "cbor";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
    await serializer.addResourceFromBuffer(
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
  it("file and buffer", async () => {
    const serializer = new ResourceBundleSerializer();
    await serializer.addResourceFromBuffer(
      "hello.txt",
      Buffer.from("Hello, world!"),
      {
        "Content-Type": "text/plain",
      }
    );
    await serializer.addResourceFromFile(
      "file.txt",
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../test-fixtures/file.txt"
      ),
      {
        "Content-Type": "application/octet-stream",
      }
    );
    const buf = await receiveToBuffer(serializer.serialize());
    const decoded = await decodeAll(buf);

    const resource1Headers = encodeOne(
      new Map([[Buffer.from("Content-Type"), Buffer.from("text/plain")]])
    );
    const resource2Headers = encodeOne(
      new Map([
        [Buffer.from("Content-Type"), Buffer.from("application/octet-stream")],
      ])
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
          1 + (9 + 4) + (10 + 5),
          "resources",
          1 +
            1 +
            (2 + resource2Headers.length + 13) +
            1 +
            (2 + resource1Headers.length + 14),
        ]),
        // sections
        [
          // index
          {
            "file.txt": [1, 1 + 2 + resource2Headers.length + 13],
            "hello.txt": [
              1 + (1 + 2 + resource2Headers.length + 13),
              1 + 2 + resource1Headers.length + 14,
            ],
          },
          // resources
          [
            [resource2Headers, Buffer.from("This is file")],
            [resource1Headers, Buffer.from("Hello, world!")],
          ],
        ],
        // bundle length
        Buffer.from([0, 0, 0, 0, 0, 0, 0, buf.length]),
      ],
    ]);
  });
});
