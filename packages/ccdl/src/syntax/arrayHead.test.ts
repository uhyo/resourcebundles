import { bufferConcat } from "../utils/test/bufConcat.js";
import { bufferToStream } from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { arrayHead } from "./arrayHead.js";

describe("arrayHead", () => {
  describe("encode", () => {
    it("empty array head", async () => {
      const syntax = arrayHead();

      const res = await writeToBuffer((l) => {
        syntax.encode(l, 0);
      });
      expect(res).toEqual(bufferConcat(0b100_00000));
    });
    it("encode 1", async () => {
      const syntax = arrayHead();
      const res = await writeToBuffer((l) => {
        syntax.encode(l, 1);
      });
      expect(res).toEqual(bufferConcat(0b100_00001));
    });
    it("encode 200", async () => {
      const syntax = arrayHead();
      const res = await writeToBuffer((l) => {
        syntax.encode(l, 200);
      });
      expect(res).toEqual(bufferConcat(0b100_11000, 200));
    });
  });
  describe("count", () => {
    it("count empty head", async () => {
      const syntax = arrayHead();

      expect(syntax.count(1)).toEqual(1);
    });
    it("count 10000 head", async () => {
      const syntax = arrayHead();

      expect(syntax.count(10000)).toEqual(1 + 2);
    });
  });
  describe("decode", () => {
    it("successful empty", async () => {
      const syntax = arrayHead();
      const l = bufferToStream(0b100_00000, "dummy");
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: 0,
      });
    });
    it("successful 300", async () => {
      const syntax = arrayHead();
      const l = bufferToStream(0b100_11001, 1, 44);
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 3,
        data: 300,
      });
    });
    it("failure (insufficient data)", async () => {
      const syntax = arrayHead();
      const l = bufferToStream();
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b010_00001, "a"));
      const syntax = arrayHead();
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 2, received 4"
      );
    });
  });
});
