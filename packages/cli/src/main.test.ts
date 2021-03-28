import path from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";
import { cli } from "./main";
import { receiveToBuffer } from "./util/test/receiveToBuffer";

describe("read", () => {
  it("human-readable", async () => {
    const stream = new PassThrough();
    await cli(
      [
        "read",
        fileURLToPath(
          path.join(
            path.dirname(import.meta.url),
            "../test-fixtures/website.rbn"
          )
        ),
      ],
      stream
    );
    expect((await receiveToBuffer(stream)).toString("utf-8"))
      .toMatchInlineSnapshot(`
      "[92m[1m🌐📦 /Users/JP25309/personal/resourcebundles/packages/cli/test-fixtures/website.rbn[22m[39m
      [94m3 resources[39m

      js.js [33m13 bytes[39m
        [96m:status     [39m [90m=>[39m 200
        [96mcontent-type[39m [90m=>[39m application/javascript

      css.css [33m99 bytes[39m
        [96m:status     [39m [90m=>[39m 200
        [96mcontent-type[39m [90m=>[39m text/css

      index.html [33m506 bytes[39m
        [96m:status     [39m [90m=>[39m 200
        [96mcontent-type[39m [90m=>[39m text/html
      "
    `);
  });
});
