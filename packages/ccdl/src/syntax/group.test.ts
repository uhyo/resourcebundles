import { bufferConcat } from "../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { byteString } from "./byteString.js";
import { group } from "./group.js";
import { uint } from "./uint.js";

describe("group", () => {
  describe("encode", () => {
    it("encode empty group", async () => {
      const syntax = group();

      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, []);
      });
      expect(res).toEqual(bufferConcat());
    });
    it("encode [bstr, uint]", async () => {
      const syntax = group(byteString, uint);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, ["hello", 3]);
      });
      expect(res).toEqual(bufferConcat(0b010_00101, "hello", 0b000_00011));
    });
  });
  describe("count", () => {
    it("count single group", async () => {
      const syntax = group(uint);

      expect(syntax.count([24])).toEqual(2);
    });
    it("count (bstr, bstr)", async () => {
      const syntax = group(byteString, byteString);

      expect(syntax.count(["富士山", "🗻"])).toEqual(10 + 5);
    });
  });
  describe("decode", () => {
    it("successful (uint)", async () => {
      const syntax = group(uint);
      const l = bufferToStream(0b000_11000, 250, "dummy");
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 2,
        data: [250],
      });
    });
    it("successful (uint, bstr, uint)", async () => {
      const syntax = group(uint, byteString, uint);
      const l = bufferToStream(
        0b000_00010,
        0b010_00101,
        "hello",
        0b000_11001,
        1,
        0
      );
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 10,
        data: [2, Buffer.from("hello"), 256],
      });
    });
    it("failure (insufficient data)", async () => {
      const syntax = group(byteString, uint);
      const [l] = asyncBufferToStream(0b010_00100, "pika");
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (insufficient data 2)", async () => {
      const syntax = group(byteString, uint);
      const [l] = asyncBufferToStream(0b010_00100, "pika", 0b000_11010);
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
  });
});
