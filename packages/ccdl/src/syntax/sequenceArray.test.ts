import { bufferConcat } from "../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { byteString } from "./byteString.js";
import { constBytes } from "./constBytes.js";
import { sequenceArray } from "./sequenceArray.js";

describe("sequenceArray", () => {
  describe("encode", () => {
    it("encode empty array", async () => {
      const syntax = sequenceArray();

      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, []);
      });
      expect(res).toEqual(bufferConcat(0b100_00000));
    });
    it("encode [bstr]", async () => {
      const syntax = sequenceArray(byteString);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, ["hello"]);
      });
      expect(res).toEqual(bufferConcat(0b100_00001, 0b010_00101, "hello"));
    });
    it("encode [const, const, bstr]", async () => {
      const syntax = sequenceArray(
        constBytes(Buffer.from("hel")),
        constBytes(Buffer.from("lo")),
        byteString
      );
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, [undefined, undefined, "pikachu"]);
      });
      expect(res).toEqual(
        bufferConcat(0b100_00011, "hello", 0b010_00111, "pikachu")
      );
    });
  });
  describe("count", () => {
    it("count empty sequence", async () => {
      const syntax = sequenceArray();

      expect(syntax.count([])).toEqual(1);
    });
    it("count [bstr, bstr]", async () => {
      const syntax = sequenceArray(byteString, byteString);

      expect(syntax.count(["富士山", "🗻"])).toEqual(1 + 10 + 5);
    });
  });
  describe("decode", () => {
    it("successful empty", async () => {
      const syntax = sequenceArray();
      const l = bufferToStream(0b100_00000, "dummy");
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: [],
      });
    });
    it("successful [bstr, const]", async () => {
      const syntax = sequenceArray(
        byteString,
        constBytes(Buffer.from("pikachu"))
      );
      const l = bufferToStream(0b100_00010, 0b010_00101, "hello", "pikachu");
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 14,
        data: [Buffer.from("hello"), undefined],
      });
    });
    it("failure (insufficient data)", async () => {
      const syntax = sequenceArray(byteString, byteString);
      const [l] = asyncBufferToStream(0b100_00010, 0b010_00100, "pika");
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b010_00001, "a"));
      const syntax = sequenceArray();
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 4, received 2"
      );
    });
    it("failure (array length)", async () => {
      const l = bufferToStream(
        bufferConcat(0b100_00011, 0b010_00000, 0b010_00000, 0b010_00000)
      );
      const syntax = sequenceArray(byteString, byteString);
      await expect(syntax.read(l)).rejects.toThrow(
        "Array length unmatch: expected 2, received 3"
      );
    });
  });
});
