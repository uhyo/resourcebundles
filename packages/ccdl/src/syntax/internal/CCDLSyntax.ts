import { Readable, Writable } from "node:stream";

export type ReadResult<DataType> = {
  bytesRead: number;
  data: DataType;
};

export interface CCDLSyntax<OutputDataType, InputDataType = OutputDataType> {
  /**
   * Encode given data into given writable stream.
   */
  encode: undefined extends InputDataType
    ? (stream: Writable, data?: InputDataType) => number
    : (stream: Writable, data: InputDataType) => number;
  /**
   * Return bytes to write without actually writing.
   */
  count: undefined extends InputDataType
    ? (data?: InputDataType) => number
    : (data: InputDataType) => number;
  /**
   * Read data from given readable stream.
   */
  read(stream: Readable): Promise<ReadResult<OutputDataType>>;
}
