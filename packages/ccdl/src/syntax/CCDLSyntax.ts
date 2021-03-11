import { Readable, Writable } from "node:stream";

export type ReadResult<DataType> = {
  bytesRead: number;
  data: DataType;
};

export interface CCDLSyntax<DataType> {
  encode: undefined extends DataType
    ? (stream: Writable, data?: DataType) => void
    : (stream: Writable, data: DataType) => void;
  read(stream: Readable): Promise<ReadResult<DataType>>;
}
