# `@resourcebundles/ccdl` API Guide

## Basics

To encode/decode data with this package, you first define a **syntax** for your data. Syntaxes for basic types are provided by this package. For more complex data, you can create your own syntax by composing syntaxes.

A syntax is a value with type `CCDLSyntax<OutputDataType, InputDataType>`. It has following methods:

- `encode`: encodes given value of type `InputDataType` into CBOR and writes to given stream.
- `count`: returns the number of bytes after CBOR-encoding given data.
- `decode`: reads data from given stream and decodes it into a value of type `OutputDataType`. If data from the stream cannot be interpreted as `OutputDataType`, an error is returned. This method drains no extra data from given stream.

Currently, this package does not cover all of CBOR specification. Especially, indefinite length CBOR items are not supported at all.

## API Reference

### Basic Types

#### `uint`

```ts
const uint: CCDLSyntax<number>;
```

Syntax for unsigned integers (Major Type 0).

#### `byteString`

```ts
const byteString: CCDLSyntax<Buffer, string | Buffer>;
```

Syntax for byte strings (Major Type 2). While decoded value is always a `Buffer`, it can also take strings when encoding. Strings are converted to `Buffer`s with `utf-8` encoding.

#### `byteString.length`

```ts
function length(min: number, max: number): CCDLSyntax<Buffer, string | Buffer>;
```

With `byteString.length`, you can create a syntax for byte strings where the length of buffer is constrained. By setting a max length, you can prevent unintentionally reading huge data into memory.

#### `textString`

```ts
const textString: CCDLSyntax<string>;
```

Syntax for text string (Major Type 3).

#### `repeatArray`

Syntax for arrays (Major Type 4). The `repeatArray` combinator represents homogeneous arrays of arbitrary length, corresponding to TypeScript's `Array<T>` type.

```ts
function repeatArray<Output, Input>(
  syntax: CCDLSyntax<Output, Input>
): CCDLSyntax<Output[], Input[]>;
```

#### `sequenceArray`

Syntax for arrays (Major Type 4). Unlike `repeatArray`, this syntax represents fixed-length heterogeneous arrays (known as tuples).

```ts
function sequenceArray<Defs extends readonly CCDLSyntax<any>[]>(
  ...defs: [...Defs]
): CCDLSyntax</* snip. */>;
```

For example, `sequenceArray(uint, byteString, uint)` returns a syntax of type `CCDLSyntax<[number, Buffer, number]>`.

#### `map`

Syntax for maps (Major Type 5).

```ts
export function map<KeyOutput, KeyInput, ValueOutput, ValueInput>(
  keySyntax: CCDLSyntax<KeyOutput, KeyInput>,
  valueSyntax: CCDLSyntax<ValueOutput, ValueInput>
): CCDLSyntax<Map<KeyOutput, ValueOutput>, Map<KeyInput, ValueInput>>;
```

For example, `map(textString, uint)` returns a syntax for encoding/decoding `Map<string, number>`.

### Fragments

Fragment syntaxes allow partially encoding/decoding one CBOR item. Careful use of fragments is required since users must manually handle the remaining part.

#### `arrayHead`

```ts
const arrayHead: CCDLSyntax<number>;
```

Syntax for the length of an array (Major Type 4), located at the beginning of the encoding of an array.

#### `byteStringHead`

```ts
const byteStringHead: CCDLSyntax<number>;
```

Syntax for the length of a byte string (Major Type 2), located at the beginning of the encoding of a byte string.

#### `mapHead`

```ts
const mapHead: CCDLSyntax<number>;
```

Syntax for the size of a map (Major Type 5), located at the beginning of the encoding of a map.

### Others

#### `group`

Syntax for fixed-length sequence of data. Groups are encoded as a sequence of multiple CBOR items, in contrast to `sequenceArray` with which the sequence of data is encoded as a CBOR array.

```ts
function group<Defs extends readonly CCDLSyntax<any>[]>(
  ...defs: [...Defs]
): CCDLSyntax</* snip. */>;
```

The `group` combinator corresponds to CCDL's group syntax (e.g. `(foo: uint, bar: bytes)`) and is useful for expressing arrays of groups.

```ts
// CCDL:
// section-lengths = [* (section-name: tstr, length: uint) ]
const sectionLengths = repeatArray(group(textString, uint));
```

#### `bytesCbor`

The `bytesCbor` syntax represents data encoded into a byte string (Major Type 2) whose content can be interpreted as a CBOR encoding of the original data.

This corresponds to the CCDL construct `bytes .cbor {type}`.

```ts
function bytesCbor<Output, Input>(
  syntax: CCDLSyntax<Output, Input>
): CCDLSyntax<Output, Input>;
```
