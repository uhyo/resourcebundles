import { countByteString } from "./count.js";

describe("count", () => {
  describe("countByteString", () => {
    it("ascii short", () => {
      // 1 + 5
      expect(countByteString("hello")).toBe(6);
    });
    it("UTF-8 short", () => {
      // 1 + 3 + 3 + 3 + 4
      expect(countByteString("吉野家🙂")).toBe(14);
    });
    it("~255", () => {
      // 2 + 100
      expect(countByteString("a".repeat(100))).toBe(102);
    });
    it("~65535", () => {
      // 3 + 10000
      expect(countByteString("a".repeat(10000))).toBe(10003);
    });
    it("~0xffffffff", () => {
      // 5 + 100000
      expect(countByteString("a".repeat(100000))).toBe(100005);
    });
  });
});
