import { bufferConcat } from "../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { byteString } from "./byteString.js";
import { map } from "./map.js";
import { uint } from "./uint.js";

describe("map", () => {
  describe("encode", () => {
    it("encode empty map", async () => {
      const syntax = map(byteString, byteString);

      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, new Map());
      });
      expect(res).toEqual(bufferConcat(0b101_00000));
    });
    it("encode singleton", async () => {
      const syntax = map(byteString, byteString);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, new Map([["hello", "world"]]));
      });
      expect(res).toEqual(
        bufferConcat(0b101_00001, 0b010_00101, "hello", 0b010_00101, "world")
      );
    });
    it("encode two items", async () => {
      const syntax = map(byteString, uint);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(
          l,
          new Map([
            ["hello", 0],
            ["world", 512],
          ])
        );
      });
      expect(res).toEqual(
        bufferConcat(
          0b101_00010, // map header
          0b010_00101, // key 1
          "hello",
          0b000_00000, // value 1
          0b010_00101, // key 2
          "world",
          0b000_11001, // value 2
          2,
          0
        )
      );
    });
  });
  describe("count", () => {
    it("count empty map", async () => {
      const syntax = map(byteString, byteString);

      expect(syntax.count(new Map())).toEqual(1);
    });
    it("count three items map", async () => {
      const syntax = map(byteString, uint);

      expect(
        syntax.count(
          new Map([
            ["a", 10],
            ["b", 100],
            ["c", 1000],
          ])
        )
      ).toEqual(1 + 2 + 1 + 2 + 2 + 2 + 3);
    });
  });
  describe("decode", () => {
    it("successful empty", async () => {
      const syntax = map(uint, uint);
      const l = bufferToStream(0b101_00000, "dummy");
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: new Map(),
      });
    });
    it("successful map", async () => {
      const syntax = map(uint, uint);
      const l = bufferToStream(
        0b101_00010,
        0b000_00111,
        0b000_11000,
        128,
        0b000_01111,
        0b000_11001,
        1,
        0xff
      );
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 8,
        data: new Map([
          [7, 128],
          [15, 0x1ff],
        ]),
      });
    });
    it("failure (insufficient data)", async () => {
      const syntax = map(byteString, uint);
      const [l] = asyncBufferToStream(
        0b101_00010,
        0b010_00100,
        "pika",
        0b000_00001
      );
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b010_00001, "a"));
      const syntax = map(byteString, byteString);
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 5, received 2"
      );
    });
  });
});
