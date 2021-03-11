import { LengthCountingStream } from "./LengthCountingStream.js";
import { receiveToBuffer } from "./test/receiveToBuffer.js";

describe("LengthCountingStream", () => {
  it("empty", async () => {
    const l = new LengthCountingStream();
    l.end();
    const buf = await receiveToBuffer(l);
    // 8 in 64bit BE
    expect(buf).toEqual(Buffer.from([0, 0, 0, 0, 0, 0, 0, 8]));
  });
  it("some contents", async () => {
    const l = new LengthCountingStream();
    l.end("hello");
    const buf = await receiveToBuffer(l);
    expect(buf).toEqual(
      Buffer.concat([
        Buffer.from("hello"),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 13]),
      ])
    );
  });
});
