# API Reference

Use this section when you already know the task and need exact API details.

## Top-level wrappers

- [dev()](./dev.md)
- [build()](./build.md)
- [serve()](./serve.md)
- [engine() default export](./engine.md)

## Configuration

- [Configuration types](./configuration.md)

## Core classes

- [Server](./Server.md)
- [Builder](./Builder.md)
- [Document](./Document.md)

## Document helpers

- [DocumentBuilder](./DocumentBuilder.md)
- [DocumentLoader](./DocumentLoader.md)
- [DocumentRender](./DocumentRender.md)

## Runtime helpers

- [ServerLoader](./ServerLoader.md)
- [ServerManifest](./ServerManifest.md)
- [ServerResource](./ServerResource.md)
- [VirtualServer](./VirtualServer.md)

## Package exports

The root package exports:

- wrapper functions: `dev`, `build`, `serve`
- default export: `engine`
- classes such as `Server`, `Builder`, `Document`, `DocumentBuilder`, `DocumentLoader`, and `DocumentRender`
- runtime helpers such as `ServerLoader`, `ServerManifest`, `ServerResource`, and `VirtualServer`
- constants, helpers, and plugin helpers from the root module

Most application code should start with `dev()`, `build()`, or `serve()`. The lower-level classes are most useful when you need tighter control.
