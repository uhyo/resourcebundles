import { LengthCountingStream } from "./LengthCountingStream.js";
import { receiveToBuffer } from "./test/receiveToBuffer.js";

describe("LengthCountingStream", () => {
  it("empty", async () => {
    const l = new LengthCountingStream((length) => {
      const buf = Buffer.allocUnsafe(4);
      buf.writeUInt32BE(length);
      return buf;
    });
    l.end();
    const buf = await receiveToBuffer(l);
    expect(buf).toEqual(Buffer.from([0, 0, 0, 0]));
  });
  it("some contents", async () => {
    const l = new LengthCountingStream((length) => {
      const buf = Buffer.allocUnsafe(4);
      buf.writeUInt32BE(length);
      return buf;
    });
    l.end("hello");
    const buf = await receiveToBuffer(l);
    expect(buf).toEqual(
      Buffer.concat([Buffer.from("hello"), Buffer.from([0, 0, 0, 5])])
    );
  });
});
