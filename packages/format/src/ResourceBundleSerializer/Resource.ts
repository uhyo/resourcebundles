import type { Headers } from "./Headers";
export type BufferResourcePayload = {
  type: "buffer";
  data: Uint8Array;
};

export type FileResourcePayload = {
  type: "file";
  fileName: string;
  fileSize: number;
};

export type Resource = {
  headers: Headers;
  payload: BufferResourcePayload | FileResourcePayload;
};

export function getResourcePayloadLength(payload: Resource["payload"]): number {
  switch (payload.type) {
    case "buffer": {
      return payload.data.length;
    }
    case "file": {
      return payload.fileSize;
    }
  }
}
