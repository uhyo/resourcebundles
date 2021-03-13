# `@resourcebundles/static-server`

Server that serves from a Resource Bundle.

Try out with `example/example.rbn` in this repository!

## Installation

```sh
npm install -g @resourcebundles/static-server
```

## Usage

### CLI

```sh
rbn-static-server bundle.rbn
```

#### options

- `--port`: the port to listen to. Default: `8080`
- `--host`: the address to bind. Default: `127.0.0.1`

### Fastify Plugin

```ts
import fastify from "fastify";
import { resourceBundleStaticPlugin } from "@resourcebundles/static-server";

const app = fastify();

app.register(resourceBundleStaticPlugin, {
  file: "./bundle.rbn",
});
```
