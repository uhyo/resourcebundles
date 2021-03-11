import { Readable, Writable } from "node:stream";

export type ReadResult<DataType> = {
  bytesRead: number;
  data: DataType;
};

export type CCDLSyntax<OutputDataType, InputDataType = OutputDataType> = {
  /**
   * Encode given data into given writable stream.
   */
  encode(stream: Writable, data: InputDataType): number;
  /**
   * Return bytes to write without actually writing.
   */
  count(data: InputDataType): number;
  /**
   * Read data from given readable stream.
   */
  read(stream: Readable): Promise<ReadResult<OutputDataType>>;
};

export type NoDataCCDLSyntax<OutputDataType, InputDataType = OutputDataType> = {
  /**
   * Encode given data into given writable stream.
   */
  encode(stream: Writable, data?: InputDataType): number;
  /**
   * Return bytes to write without actually writing.
   */
  count(data?: InputDataType): number;
  /**
   * Read data from given readable stream.
   */
  read(stream: Readable): Promise<ReadResult<OutputDataType>>;
};

export type CCDLSyntaxMaybeNodata<
  OutputDataType,
  InputDataType = OutputDataType
> = undefined extends InputDataType
  ? NoDataCCDLSyntax<OutputDataType, InputDataType>
  : CCDLSyntax<OutputDataType, InputDataType>;

export type InferDataFromSyntax<T> = T extends CCDLSyntax<infer O, infer I>
  ? [O, I]
  : T extends NoDataCCDLSyntax<infer O, infer I>
  ? [O, I]
  : [unknown, unknown];
