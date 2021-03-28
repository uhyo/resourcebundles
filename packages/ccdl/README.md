## `@resourcebundles/ccdl`

Stream-based CBOR parser combinator for Node.js.

This package can decode CBOR guided by predefined syntax, erroring out anything that does not match the syntax.

- [API Guides / References](./docs/api.md)

### Examples

```ts
import { createReadStream, createWriteStream } from "node:fs";
import {
  byteString,
  map,
  repeatArray,
  textString,
  uint,
} from "@resourcebundles/ccdl";

// writing a Map<number, string> into file
const data = new Map([
  ["banana", 130],
  ["apple", 200],
  ["melon", 1000],
]);

await map(uint, textString).encode(createWriteStream("./data"), data);

// reading a Buffer[] from file
const { bytesRead, data: arr } = await repeatArray(byteString).read(
  createReadStream("./data2")
);
```
