import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { constBytes } from "./constBytes.js";

describe("constBytes", () => {
  it("encode", async () => {
    const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
    const syntax = constBytes(buf);

    const res = await writeToBuffer((l) => {
      syntax.encode(l);
    });
    expect(res).toEqual(buf);
  });
  describe("decode", () => {
    it("successful", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = bufferToStream(buf);
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 5,
        data: undefined,
      });
    });
    it("successful (data added later)", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const [l] = asyncBufferToStream(
        buf.slice(0, 3),
        buf.slice(3),
        Buffer.from([0x32, 0x33])
      );
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 5,
        data: undefined,
      });
    });
    it("failure (insufficient data)", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = bufferToStream(Buffer.from([0x30, 0x31, 0x35]));
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong data)", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = bufferToStream("z".repeat(100));
      await expect(syntax.read(l)).rejects.toThrow("Data unmatch");
    });
  });
});
