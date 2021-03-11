import { bufferConcat } from "../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { byteString } from "./byteString.js";

describe("byteString", () => {
  describe("encode", () => {
    it("encode short string", async () => {
      const syntax = byteString();

      const res = await writeToBuffer((l) => {
        syntax.encode(l, "hello");
      });
      expect(res).toEqual(bufferConcat(0b010_00101, "hello"));
    });
    it("encode UTF-8", async () => {
      const syntax = byteString();

      const res = await writeToBuffer((l) => {
        syntax.encode(l, "吉野家😃");
      });
      expect(res).toEqual(bufferConcat(0b010_01101, "吉野家😃"));
    });
    it("encode 100 bytes", async () => {
      const syntax = byteString();

      const res = await writeToBuffer((l) => {
        syntax.encode(l, "x".repeat(100));
      });
      expect(res).toEqual(bufferConcat(0b010_11000, 100, "x".repeat(100)));
    });
    it("encode 1025 bytes", async () => {
      const syntax = byteString();

      const res = await writeToBuffer((l) => {
        syntax.encode(l, "z".repeat(1025));
      });
      expect(res).toEqual(
        bufferConcat(0b010_11001, 0b100, 0b0000_0001, "z".repeat(1025))
      );
    });
    it("encode 65536 bytes", async () => {
      const syntax = byteString();

      const res = await writeToBuffer((l) => {
        syntax.encode(l, "a".repeat(65536));
      });
      expect(res).toEqual(
        bufferConcat(0b010_11010, 0, 1, 0, 0, "a".repeat(65536))
      );
    });
  });
  describe("decode", () => {
    it("successful", async () => {
      const buf = bufferConcat(0b010_00111, "pikachu");
      const syntax = byteString();
      const l = bufferToStream(buf);
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 8,
        data: Buffer.from("pikachu"),
      });
    });
    it("successful (data added later)", async () => {
      const [l] = asyncBufferToStream(bufferConcat(0b010_00111), "pika", "chu");
      const syntax = byteString();
      const result = await syntax.read(l);
      expect(result).toEqual({
        bytesRead: 8,
        data: Buffer.from("pikachu"),
      });
    });
    it("failure (insufficient data)", async () => {
      const [l] = asyncBufferToStream(bufferConcat(0b010_00111), "pika");
      const syntax = byteString();
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b100_00000));
      const syntax = byteString();
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 4, received 2"
      );
    });
  });
});
