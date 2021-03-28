import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";
import { cli } from "./main";
import { receiveToBuffer } from "./util/test/receiveToBuffer";

const testFixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../test-fixtures"
);

describe("read", () => {
  describe("outputs", () => {
    it("human-readable", async () => {
      const stream = new PassThrough();
      await cli({
        args: ["read", path.join(testFixturesDir, "website.rbn")],
        output: stream,
      });
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
    it("json", async () => {
      const stream = new PassThrough();
      await cli({
        args: [
          "read",
          path.join(testFixturesDir, "website.rbn"),
          "--output",
          "json",
        ],
        output: stream,
      });
      const obj = JSON.parse((await receiveToBuffer(stream)).toString("utf-8"));
      expect(obj).toMatchInlineSnapshot(`
        Object {
          "css.css": Object {
            "headers": Object {
              ":status": "200",
              "content-type": "text/css",
            },
            "payloadSize": 99,
          },
          "index.html": Object {
            "headers": Object {
              ":status": "200",
              "content-type": "text/html",
            },
            "payloadSize": 506,
          },
          "js.js": Object {
            "headers": Object {
              ":status": "200",
              "content-type": "application/javascript",
            },
            "payloadSize": 13,
          },
        }
      `);
    });
    it("url-only", async () => {
      const stream = new PassThrough();
      await cli({
        args: [
          "read",
          path.join(testFixturesDir, "website.rbn"),
          "--output",
          "url-only",
        ],
        output: stream,
      });
      const obj = (await receiveToBuffer(stream)).toString("utf-8");
      expect(obj).toMatchInlineSnapshot(`
        "js.js
        css.css
        index.html
        "
      `);
    });
  });
  describe("error handling", () => {
    it("unknown output", async () => {
      const stream = new PassThrough();
      await expect(
        cli({
          args: [
            "read",
            path.join(testFixturesDir, "website.rbn"),

            "--output",
            "unknown",
          ],

          output: stream,
          locale: "en",
        })
      ).rejects.toMatchInlineSnapshot(`
              "Invalid values:
                Argument: output, Given: \\"unknown\\", Choices: \\"json\\", \\"human-readable\\", \\"url-only\\""
            `);
    });
  });
});

describe("create", () => {
  const testOutputDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../test-output"
  );
  beforeEach(async () => {
    await rm(testOutputDir, {
      recursive: true,
      force: true,
    });
  });

  it("output to stream", async () => {
    const stream = new PassThrough();
    await cli({
      args: [
        "create",
        path.join(testFixturesDir, "hello.txt"),
        "--rootDir",
        testFixturesDir,
      ],
      output: stream,
    });
    const buf = await receiveToBuffer(stream);
    expect(buf).toEqual(
      await readFile(path.join(testFixturesDir, "hello.rbn"))
    );
  });

  it("output to file", async () => {
    const stream = new PassThrough();
    await mkdir(testOutputDir, { recursive: true });
    await cli({
      args: [
        "create",
        path.join(testFixturesDir, "hello.txt"),
        "--rootDir",
        testFixturesDir,
        "--out",
        path.join(testOutputDir, "hello.rbn"),
      ],
      output: stream,
    });
    const buf = await readFile(path.join(testOutputDir, "hello.rbn"));
    expect(buf).toEqual(
      await readFile(path.join(testFixturesDir, "hello.rbn"))
    );
  });
});

describe("error handling", () => {
  it("Unknown command", async () => {
    const stream = new PassThrough();
    await expect(
      cli({
        args: ["foobar"],
        output: stream,
        locale: "en",
      })
    ).rejects.toMatchInlineSnapshot(`"Unknown command: foobar"`);
  });
});
