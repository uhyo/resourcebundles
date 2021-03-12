import { PassThrough } from "node:stream";
import { bufferConcat } from "../utils/test/bufConcat.js";
import {
  asyncBufferToStream,
  bufferToStream,
} from "../utils/test/bufferToStream.js";
import { receiveToBuffer } from "../utils/test/receiveToBuffer.js";
import { writeToBuffer } from "../utils/test/writeToBuffer.js";
import { byteString } from "./byteString.js";

describe("byteString", () => {
  describe("encode", () => {
    it("encode short string", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteString.encode(l, "hello");
      });
      expect(res).toEqual(bufferConcat(0b010_00101, "hello"));
    });
    it("encode UTF-8", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteString.encode(l, "吉野家😃");
      });
      expect(res).toEqual(bufferConcat(0b010_01101, "吉野家😃"));
    });
    it("encode 100 bytes", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteString.encode(l, "x".repeat(100));
      });
      expect(res).toEqual(bufferConcat(0b010_11000, 100, "x".repeat(100)));
    });
    it("encode 1025 bytes", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteString.encode(l, "z".repeat(1025));
      });
      expect(res).toEqual(
        bufferConcat(0b010_11001, 0b100, 0b0000_0001, "z".repeat(1025))
      );
    });
    it("encode 65536 bytes", async () => {
      const res = await writeToBuffer(async (l) => {
        await byteString.encode(l, "a".repeat(65536));
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
    it("successful (empty string)", async () => {
      const l = bufferToStream(bufferConcat(0b010_00000));
      const result = await byteString.read(l);
      expect(result).toEqual({
        bytesRead: 1,
        data: Buffer.allocUnsafe(0),
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

describe("byteString.length", () => {
  describe("encode", () => {
    const syntax = byteString.length(3, 5);
    it("encode short string", async () => {
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, "hello");
      });
      expect(res).toEqual(bufferConcat(0b010_00101, "hello"));
    });
    it("encode UTF-8", async () => {
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, "😃");
      });
      expect(res).toEqual(bufferConcat(0b010_00100, "😃"));
    });
    it("encode 65536 bytes", async () => {
      const syntax = byteString.length(65536, 65536);
      const res = await writeToBuffer(async (l) => {
        await syntax.encode(l, "a".repeat(65536));
      });
      expect(res).toEqual(
        bufferConcat(0b010_11010, 0, 1, 0, 0, "a".repeat(65536))
      );
    });
    it("failure (too short)", async () => {
      const l = new PassThrough();
      await expect(syntax.encode(l, "a")).rejects.toThrow(
        "Length of given data is not in range [3, 5]"
      );
    });
    it("failure (too long)", async () => {
      const l = new PassThrough();
      await expect(syntax.encode(l, "Hello, world!")).rejects.toThrow(
        "Length of given data is not in range [3, 5]"
      );
    });
  });
  describe("count", () => {
    const syntax = byteString.length(3, 5);
    it("count short string", () => {
      expect(syntax.count("Pika!")).toEqual(1 + 5);
    });
    it("count UTF-8", () => {
      expect(syntax.count("富士山🗻")).toEqual(1 + 3 * 3 + 4);
    });
    it("count 100 bytes", () => {
      expect(syntax.count("🙂".repeat(25))).toEqual(2 + 4 * 25);
    });
    it("count 1024 bytes", () => {
      expect(syntax.count("z".repeat(1024))).toEqual(3 + 1024);
    });
    it("count 100000 bytes", () => {
      expect(syntax.count("a".repeat(100_000))).toEqual(5 + 100_000);
    });
  });
  describe("decode", () => {
    const syntax = byteString.length(3, 5);
    it("successful", async () => {
      const buf = bufferConcat(0b010_00100, "pika");
      const l = bufferToStream(buf);
      const result = await byteString.read(l);
      expect(result).toEqual({
        bytesRead: 5,
        data: Buffer.from("pika"),
      });
    });
    it("failure (too short)", async () => {
      const l = bufferToStream(0b010_00001, "a");
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected byteString length to be in [3, 5], received 1"
      );
      // only header is drained from buffer
      expect(await receiveToBuffer(l)).toEqual(Buffer.from("a"));
    });
    it("failure (too long)", async () => {
      const l = bufferToStream(0b010_11000, 30, "x".repeat(30));
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected byteString length to be in [3, 5], received 30"
      );
      // only header is drained from buffer
      expect(await receiveToBuffer(l)).toEqual(Buffer.from("x".repeat(30)));
    });
    it("failure (insufficient data)", async () => {
      const [l] = asyncBufferToStream();
      await expect(syntax.read(l)).rejects.toThrow("Unexpected end of input");
    });
    it("failure (wrong tag)", async () => {
      const l = bufferToStream(bufferConcat(0b100_00000));
      await expect(syntax.read(l)).rejects.toThrow(
        "Expected major type 2, received 4"
      );
    });
  });
});
