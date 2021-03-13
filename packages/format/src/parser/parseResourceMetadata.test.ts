import { encodeOne } from "cbor";
import { writeToStream } from "../utils/test/writeToStream.js";
import { parseResourceMetadata } from "./parseResourceMetadata.js";

describe("parseResourceMetadata", () => {
  it("successful", async () => {
    const resource1Headers = encodeOne(
      new Map([[Buffer.from("content-type"), Buffer.from("text/plain")]])
    );
    const resource = encodeOne([
      resource1Headers,
      Buffer.from("Hello, world!"),
    ]);
    const metadata = await parseResourceMetadata(
      await writeToStream(async (l) => {
        l.write(resource);
      })
    );
    expect(metadata).toEqual({
      bytesRead: resource.length - 13,
      payloadSize: 13,
      headers: new Map([["content-type", "text/plain"]]),
    });
  });
});
