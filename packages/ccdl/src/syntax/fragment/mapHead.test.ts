import { bufferConcat } from "../../utils/test/bufConcat.js";
import { bufferToStream } from "../../utils/test/bufferToStream.js";
import { writeToBuffer } from "../../utils/test/writeToBuffer.js";
import { mapHead } from "./mapHead.js";

describe("mapHead", () => {
  describe("encode", () => {
    it("empty map head", async () => {
      const res = await writeToBuffer(async (l) => {
        await mapHead.encode(l, 0);
      });
      expect(res).toEqual(bufferConcat(0b101_00000));
    });
    it("encode 1", async () => {
      const res = await writeToBuffer(async (l) => {
        await mapHead.encode(l, 1);
      });
      expect(res).toEqual(bufferConcat(0b101_00001));
    });
    it("encode 200", async () => {
      const res = await writeToBuffer(async (l) => {
        await mapHead.encode(l, 200);
      });
      expect(res).toEqual(bufferConcat(0b101_11000, 200));
    });
  });
  describe("count", () => {
    it("count empty head", async () => {
      expect(mapHead.count(1)).toEqual(1);
    });
    it("count 10000 head", async () => {
      expect(mapHead.count(10000)).toEqual(1 + 2);
    });
  });
  describe("decode", () => {
    it("successful empty", async () => {
      const l = bufferToStream(0b101_00000, "dummy");
      const result = await mapHead.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: 0,
      });
    });
    it("successful 300", async () => {
      const l = bufferToStream(0b101_11001, 1, 44);
      const result = await mapHead.read(l);
      expect(result).toEqual({
        bytesRead: 3,
        data: 300,
      });
    });
    it("failure (insufficient data)", async () => {
      const l = bufferToStream();
      await expect(mapHead.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b100_00001, "a"));
      await expect(mapHead.read(l)).rejects.toThrow(
        "Expected major type 5, received 4"
      );
    });
  });
});
