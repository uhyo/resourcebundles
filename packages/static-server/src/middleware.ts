import {
  parseResourceBundleIndex,
  parseResourceMetadata,
} from "@resourcebundles/format";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";

const resourceBundleStaticPlugin: FastifyPluginAsync<{
  file: string;
}> = async (fastify, options) => {
  // load the index of Resource Bundle
  const fileHandle = await open(options.file, "r");
  const firstStream = createReadStream("", {
    fd: fileHandle.fd,
    autoClose: false,
  });
  const { resourcesOffset, index } = await parseResourceBundleIndex(
    firstStream
  );

  fastify.addHook("onRequest", async (req, reply) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return;
    }

    const url = req.url;
    // look up resource bundle of that name. url.slice(1) removes initial '/'
    // TODO: is this correct?
    const resource = index.get(url) || index.get(url.slice(1));
    if (resource === undefined) {
      return;
    }
    const start = resourcesOffset + resource.offset;
    const resourceStream = createReadStream("", {
      fd: fileHandle.fd,
      autoClose: false,
      start,
      end: start + resource.length - 1,
    });
    const metadata = await parseResourceMetadata(resourceStream);
    reply.status(parseInt(metadata.headers.get(":status") || "200", 10));
    for (const [key, value] of metadata.headers) {
      if (!key.startsWith(":")) {
        reply.header(key, value);
      }
    }
    if (!metadata.headers.has("content-length")) {
      reply.header("content-length", resource.length - metadata.bytesRead);
    }
    // rest of resource should be raw payload.
    reply.send(resourceStream);

    return reply;
  });
};

export default fp(resourceBundleStaticPlugin);
