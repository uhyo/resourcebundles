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
      const res = await writeToBuffer((l) => {
        byteString.encode(l, "hello");
      });
      expect(res).toEqual(bufferConcat(0b010_00101, "hello"));
    });
    it("encode UTF-8", async () => {
      const res = await writeToBuffer((l) => {
        byteString.encode(l, "吉野家😃");
      });
      expect(res).toEqual(bufferConcat(0b010_01101, "吉野家😃"));
    });
    it("encode 100 bytes", async () => {
      const res = await writeToBuffer((l) => {
        byteString.encode(l, "x".repeat(100));
      });
      expect(res).toEqual(bufferConcat(0b010_11000, 100, "x".repeat(100)));
    });
    it("encode 1025 bytes", async () => {
      const res = await writeToBuffer((l) => {
        byteString.encode(l, "z".repeat(1025));
      });
      expect(res).toEqual(
        bufferConcat(0b010_11001, 0b100, 0b0000_0001, "z".repeat(1025))
      );
    });
    it("encode 65536 bytes", async () => {
      const res = await writeToBuffer((l) => {
        byteString.encode(l, "a".repeat(65536));
      });
      expect(res).toEqual(
        bufferConcat(0b010_11010, 0, 1, 0, 0, "a".repeat(65536))
      );
    });
  });
  describe("count", () => {
    it("count short string", () => {
      expect(byteString.count("Pika!")).toEqual(1 + 5);
    });
    it("count UTF-8", () => {
      expect(byteString.count("富士山🗻")).toEqual(1 + 3 * 3 + 4);
    });
    it("count 100 bytes", () => {
      expect(byteString.count("🙂".repeat(25))).toEqual(2 + 4 * 25);
    });
    it("count 1024 bytes", () => {
      expect(byteString.count("z".repeat(1024))).toEqual(3 + 1024);
    });
    it("count 100000 bytes", () => {
      expect(byteString.count("a".repeat(100_000))).toEqual(5 + 100_000);
    });
  });
  describe("decode", () => {
    it("successful", async () => {
      const buf = bufferConcat(0b010_00111, "pikachu");
      const l = bufferToStream(buf);
      const result = await byteString.read(l);
      expect(result).toEqual({
        bytesRead: 8,
        data: Buffer.from("pikachu"),
      });
    });
    it("successful (data added later)", async () => {
      const [l] = asyncBufferToStream(bufferConcat(0b010_00111), "pika", "chu");
      const result = await byteString.read(l);
      expect(result).toEqual({
        bytesRead: 8,
        data: Buffer.from("pikachu"),
      });
    });
    it("failure (insufficient data)", async () => {
      const [l] = asyncBufferToStream(bufferConcat(0b010_00111), "pika");
      await expect(byteString.read(l)).rejects.toThrow(
        "Unexpected end of input"
      );
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b100_00000));
      await expect(byteString.read(l)).rejects.toThrow(
        "Expected major type 2, received 4"
      );
    });
  });
});
