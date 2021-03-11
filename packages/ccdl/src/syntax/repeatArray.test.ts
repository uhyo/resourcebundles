import { bufferConcat } from "../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { byteString } from "./byteString.js";
import { group } from "./group.js";
import { repeatArray } from "./repeatArray.js";
import { textString } from "./textString.js";
import { uint } from "./uint.js";

describe("repeatArray", () => {
  describe("encode", () => {
    it("encode empty repeatArray", async () => {
      const syntax = repeatArray(byteString);

      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, []);
      });
      expect(res).toEqual(bufferConcat(0b100_00000));
    });
    it("encode singleton", async () => {
      const syntax = repeatArray(textString);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, ["hello"]);
      });
      expect(res).toEqual(bufferConcat(0b100_00001, 0b011_00101, "hello"));
    });
    it("encode two items", async () => {
      const syntax = repeatArray(textString);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, ["pika", "chu"]);
      });
      expect(res).toEqual(
        bufferConcat(
          0b100_00010, // array header
          0b011_00100, // element 1
          "pika",
          0b011_00011, // element 2
          "chu"
        )
      );
    });
    it("repeatArray of group", async () => {
      const syntax = repeatArray(group(textString, uint));
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, [
          ["pika", 1],
          ["chu", 2],
        ]);
      });
      expect(res).toEqual(
        bufferConcat(
          0b100_00100, // array header
          0b011_00100, // element 1
          "pika",
          0b000_00001, // element 2
          0b011_00011, // element 3
          "chu",
          0b000_00010 // element 4
        )
      );
    });
  });
  describe("count", () => {
    it("count empty array", async () => {
      const syntax = repeatArray(byteString);

      expect(syntax.count([])).toEqual(1);
    });
    it("count three items array", async () => {
      const syntax = repeatArray(uint);

      expect(syntax.count([1, 2, 100])).toEqual(1 + 1 + 1 + 2);
    });
    it("count array of group", async () => {
      const syntax = repeatArray(group(uint, uint, uint));
      expect(
        syntax.count([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ])
      ).toBe(10);
    });
  });
  describe("decode", () => {
    it("successful empty", async () => {
      const syntax = repeatArray(uint);
      const l = bufferToStream(0b100_00000, "dummy");
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: [],
      });
    });
    it("successful 512 elements", async () => {
      const syntax = repeatArray(uint);
      const l = bufferToStream(
        0b100_11001, // array header
        2,
        0,
        Buffer.allocUnsafe(512).fill(1)
      );
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 515,
        data: new Array(512).fill(1),
      });
    });
    it("successful array of group", async () => {
      const syntax = repeatArray(group(textString, uint));
      const l = bufferToStream(
        0b100_00110, // array header
        0b011_00101, // element 1
        "hello",
        0b000_01111, // element 2
        0b011_00011, // element 3
        "foo",
        0b000_11000, // element 4
        255,
        0b011_00000, // element 5
        0b000_00111 // element 6
      );
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 16,
        data: [
          ["hello", 15],
          ["foo", 255],
          ["", 7],
        ],
      });
    });
    it("failure (insufficient data)", async () => {
      const syntax = repeatArray(uint);
      const [l] = asyncBufferToStream(0b100_00011, 0b000_01000);
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b010_00001, "a"));
      const syntax = repeatArray(byteString);
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 4, received 2"
      );
    });
  });
});
