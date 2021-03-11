import { bufferConcat } from "../utils/test/bufConcat.js";
import { bufferToStream } from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { uint } from "./uint.js";

describe("uint", () => {
  describe("encode", () => {
    it("0", async () => {
      const res = await writeToBuffer((l) => {
        uint.encode(l, 0);
      });
      expect(res).toEqual(bufferConcat(0b000_00000));
    });
    it("1", async () => {
      const res = await writeToBuffer((l) => {
        uint.encode(l, 1);
      });
      expect(res).toEqual(bufferConcat(0b000_00001));
    });
    it("255", async () => {
      const res = await writeToBuffer((l) => {
        uint.encode(l, 255);
      });
      expect(res).toEqual(bufferConcat(0b000_11000, 255));
    });
    it("65539", async () => {
      const res = await writeToBuffer((l) => {
        uint.encode(l, 65539);
      });
      expect(res).toEqual(bufferConcat(0b000_11010, 0, 1, 0, 3));
    });
    it("2 ** 40 + 128", async () => {
      const res = await writeToBuffer((l) => {
        uint.encode(l, 2 ** 40 + 128);
      });
      expect(res).toEqual(bufferConcat(0b000_11011, 0, 0, 1, 0, 0, 0, 0, 128));
    });
  });
  describe("count", () => {
    it("count 0", () => {
      expect(uint.count(0)).toEqual(1);
    });
    it("count 10000", () => {
      expect(uint.count(10000)).toEqual(1 + 2);
    });
    it("count 2 ** 50", () => {
      expect(uint.count(2 ** 50)).toEqual(1 + 8);
    });
  });
  describe("decode", () => {
    it("successful 9", async () => {
      const l = bufferToStream(0b000_01001, "dummy");
      const result = await uint.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: 9,
      });
    });
    it("successful 300", async () => {
      const l = bufferToStream(0b000_11001, 1, 44);
      const result = await uint.read(l);
      expect(result).toEqual({
        bytesRead: 3,
        data: 300,
      });
    });
    it("failure (insufficient data)", async () => {
      const l = bufferToStream();
      await expect(uint.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b010_00001, "a"));
      await expect(uint.read(l)).rejects.toThrow(
        "Expected major type 0, received 2"
      );
    });
  });
});
