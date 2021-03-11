import { PassThrough } from "node:stream";
import { receiveToBuffer } from "../utils/test/receiveToBuffer.js";
import { writeByteString } from "./write.js";

describe("write", () => {
  describe("writeByteString", () => {
    it("ascii short", async () => {
      const l = new PassThrough();
      writeByteString(l, "hello");
      l.end();
      const buf = await receiveToBuffer(l);
      expect(buf).toEqual(
        Buffer.concat([Buffer.from([0b010_00101]), Buffer.from("hello")])
      );
    });
    it("UTF-8 short", async () => {
      const l = new PassThrough();
      writeByteString(l, "富士山🗻");
      l.end();
      const buf = await receiveToBuffer(l);
      expect(buf).toEqual(
        Buffer.concat([
          Buffer.from([0b010_01101]),
          Buffer.from("富士山🗻", "utf8"),
        ])
      );
    });
    it("100 a's", async () => {
      const l = new PassThrough();
      writeByteString(l, "a".repeat(100));
      l.end();
      const buf = await receiveToBuffer(l);
      expect(buf).toEqual(
        Buffer.concat([
          Buffer.from([0b010_11000, 100]),
          Buffer.from("a".repeat(100)),
        ])
      );
    });
    it("1025 z's", async () => {
      const l = new PassThrough();
      writeByteString(l, "z".repeat(1025));
      l.end();
      const buf = await receiveToBuffer(l);
      expect(buf).toEqual(
        Buffer.concat([
          Buffer.from([0b010_11001, 0b0000_0100, 0b0000_0001]),
          Buffer.from("z".repeat(1025)),
        ])
      );
    });
  });
});
