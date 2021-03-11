import { bufferConcat } from "../../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../../utils/test/bufferToStream.js";
import { writeToBuffer } from "../../utils/test/writeToBuffer.js";
import { byteString } from "../byteString.js";
import { map } from "../map.js";
import { sequenceArray } from "../sequenceArray.js";
import { textString } from "../textString.js";
import { uint } from "../uint.js";
import { bytesCbor } from "./bytesCbor.js";

describe("bytesCbor", () => {
  describe("encode", () => {
    it("encode uint", async () => {
      const syntax = bytesCbor(uint);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, 4);
      });
      expect(res).toEqual(bufferConcat(0b010_00001, 0b000_00100));
    });
    it("encode map", async () => {
      const syntax = bytesCbor(map(textString, textString));
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(
          l,
          new Map([
            ["foo", "bar"],
            ["pika", "chu"],
          ])
        );
      });
      expect(res).toEqual(
        bufferConcat(
          0b010_10010,
          0b101_00010, // map header
          0b011_00011, // key 1
          "foo",
          0b011_00011, // value 1
          "bar",
          0b011_00100, // key 2
          "pika",
          0b011_00011, // value 2
          "chu"
        )
      );
    });
  });
  describe("count", () => {
    it("count byteString", () => {
      const syntax = bytesCbor(byteString);
      expect(syntax.count("foobar")).toBe(1 + 1 + 6);
    });
    it("count array", () => {
      const syntax = bytesCbor(sequenceArray(uint, uint));
      expect(syntax.count([1, 2])).toBe(4);
    });
  });
  describe("decode", () => {
    it("successful", async () => {
      const syntax = bytesCbor(map(textString, uint));
      const buf = bufferConcat(
        0b010_01001, // byteString header
        0b101_00010, // map header
        0b011_00001, // key 1
        "a",
        0b000_10111, // value 1
        0b011_00010, // key 2
        "bc",
        0b000_11000, // value 2
        128,
        "dummy"
      );
      const l = bufferToStream(buf);
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 10,
        data: new Map([
          ["a", 23],
          ["bc", 128],
        ]),
      });
    });
    it("failure (insufficient data)", async () => {
      const syntax = bytesCbor(map(textString, uint));
      const [l] = asyncBufferToStream(
        0b010_01001, // byteString header
        0b101_00010, // map header
        0b011_00001, // key 1
        "a",
        0b000_10111, // value 1
        0b011_00010, // key 2
        "bc"
      );
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const syntax = bytesCbor(map(textString, uint));
      const l = bufferToStream(0b100_00000);
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 2, received 4"
      );
    });
  });
});
