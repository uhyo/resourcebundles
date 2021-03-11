import { Readable, Writable } from "node:stream";
import { readBytes } from "../../stream/readBytes.js";
import { MajorType } from "./MajorType.js";

export function writeHead(
  writable: Writable,
  majorType: MajorType,
  additionalInfo: number
) {
  const majorPart = majorType << 5;
  if (additionalInfo <= 23) {
    // immediate
    writable.write(Buffer.from([majorPart | additionalInfo]));
    return 1;
  } else if (additionalInfo <= 0xff) {
    // one byte
    writable.write(Buffer.from([majorPart | 24, additionalInfo]));
    return 2;
  } else if (additionalInfo <= 0xffff) {
    // two bytes
    const buf = Buffer.allocUnsafe(3);
    buf.writeUInt8(majorPart | 25, 0);
    buf.writeUInt16BE(additionalInfo, 1);
    writable.write(buf);
    return 3;
  } else if (additionalInfo <= 0xffffffff) {
    const buf = Buffer.allocUnsafe(5);
    buf.writeUInt8(majorPart | 26, 0);
    buf.writeUInt32BE(additionalInfo, 1);
    writable.write(buf);
    return 5;
  } else {
    const buf = Buffer.allocUnsafe(9);
    buf.writeUInt8(majorPart | 27, 0);
    buf.writeBigUInt64BE(BigInt(additionalInfo), 1);
    writable.write(buf);
    return 9;
  }
}

type ReadHeadResult = {
  majorType: MajorType;
  additionalInfo: number;
  bytesRead: number;
};

export async function readHead(stream: Readable): Promise<ReadHeadResult> {
  const byte = await readBytes(stream, 1);
  const majorType = ((byte[0]! >> 5) & 0b111) as MajorType;
  const additional = byte[0]! & 0b11111;
  if (additional <= 23) {
    // immediate value
    return {
      majorType,
      additionalInfo: additional,
      bytesRead: 1,
    };
  } else if (additional === 24) {
    // 1-byte additional info
    const b = await readBytes(stream, 1);
    return {
      majorType,
      additionalInfo: b[0]!,
      bytesRead: 2,
    };
  } else if (additional === 25) {
    // 2-byte additional info
    const b = await readBytes(stream, 2);
    return {
      majorType,
      additionalInfo: b.readInt16BE(0),
      bytesRead: 3,
    };
  } else if (additional === 26) {
    // 4-byte additional info
    const b = await readBytes(stream, 4);
    return {
      majorType,
      additionalInfo: b.readInt32BE(0),
      bytesRead: 5,
    };
  } else if (additional === 27) {
    // 8-byte additional info
    const b = await readBytes(stream, 8);
    return {
      majorType,
      // warning: conversion from BigInt to number
      additionalInfo: Number(b.readBigInt64BE(0)),
      bytesRead: 9,
    };
  }
  if (additional === 31) {
    // TODO: indefinite length
    throw new Error(`Type not supported: ${byte[0]}`);
  }
  throw new Error(`Unknown type: ${byte[0]}`);
}
