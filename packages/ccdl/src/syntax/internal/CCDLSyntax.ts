import { Readable, Writable } from "node:stream";

export type ReadResult<DataType> = {
  bytesRead: number;
  data: DataType;
};

export interface CCDLSyntax<OutputDataType, InputDataType = OutputDataType> {
  encode: undefined extends InputDataType
    ? (stream: Writable, data?: InputDataType) => number
    : (stream: Writable, data: InputDataType) => number;
  read(stream: Readable): Promise<ReadResult<OutputDataType>>;
}
