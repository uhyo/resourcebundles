import { PassThrough } from "node:stream";
import { receiveToBuffer } from "../utils/test/receiveToBuffer";
import { constBytes } from "./constBytes";

describe("constBytes", () => {
  it("encode", async () => {
    const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
    const syntax = constBytes(buf);

    const l = new PassThrough();
    syntax.encode(l);
    l.end();
    const res = await receiveToBuffer(l);
    expect(res).toEqual(buf);
  });
  describe("decode", () => {
    it("successful", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = new PassThrough();
      l.write(buf);
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 5,
        data: undefined,
      });
    });
    it("successful (data added later)", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = new PassThrough();
      const p = syntax.read(l);
      l.write(Buffer.concat([buf, Buffer.from([0x32, 0x33])]));
      const result = await p;
      expect(result).toEqual({
        bytesRead: 5,
        data: undefined,
      });
    });
    it("failure (insufficient data)", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = new PassThrough();
      l.write(Buffer.from([0x30, 0x31, 0x35]));
      l.end();
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong data)", async () => {
      const buf = Buffer.from([0x30, 0x31, 0x35, 0x99, 0x31]);
      const syntax = constBytes(buf);
      const l = new PassThrough();
      l.write("z".repeat(100));
      l.end();
      await expect(syntax.read(l)).rejects.toThrow("Data unmatch");
    });
  });
});
