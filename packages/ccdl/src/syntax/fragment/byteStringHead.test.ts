import { bufferConcat } from "../../utils/test/bufConcat.js";
import { bufferToStream } from "../../utils/test/bufferToStream.js";
import { writeToBuffer } from "../../utils/test/writeToBuffer.js";
import { byteStringHead } from "./byteStringHead.js";

describe("byteStringHead", () => {
  describe("encode", () => {
    it("empty string head", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteStringHead.encode(l, 0);
      });
      expect(res).toEqual(bufferConcat(0b010_00000));
    });
    it("encode 9", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteStringHead.encode(l, 9);
      });
      expect(res).toEqual(bufferConcat(0b010_01001));
    });
    it("encode 1025", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteStringHead.encode(l, 1025);
      });
      expect(res).toEqual(bufferConcat(0b010_11001, 4, 1));
    });
  });
  describe("count", () => {
    it("count empty head", async () => {
      expect(byteStringHead.count(1)).toEqual(1);
    });
    it("count 10000 head", async () => {
      expect(byteStringHead.count(10000)).toEqual(1 + 2);
    });
  });
  describe("decode", () => {
    it("successful empty", async () => {
      const l = bufferToStream(0b010_00000, "dummy");
      const result = await byteStringHead.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: 0,
      });
    });
    it("successful 300", async () => {
      const l = bufferToStream(0b010_11001, 1, 44);
      const result = await byteStringHead.read(l);
      expect(result).toEqual({
        bytesRead: 3,
        data: 300,
      });
    });
    it("failure (insufficient data)", async () => {
      const l = bufferToStream();
      await expect(byteStringHead.read(l)).rejects.toThrow(
        "Unexpected end of input"
      );
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b011_00001, "a"));
      await expect(byteStringHead.read(l)).rejects.toThrow(
        "Expected major type 2, received 3"
      );
    });
  });
});
