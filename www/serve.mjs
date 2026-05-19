import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${host}:${port}`);
    const requested = decodeURIComponent(requestUrl.pathname);
    const safePath = requested === "/"
      ? "index.html"
      : requested.endsWith("/")
        ? path.join(requested, "index.html")
        : requested;
    const full = path.join(docsDir, safePath);
    const resolved = path.resolve(full);

    if (!resolved.startsWith(docsDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const contents = await fs.readFile(resolved);
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(resolved)] || "application/octet-stream"
    });
    res.end(contents);
  } catch (error) {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Reactus docs preview: http://${host}:${port}/`);
});
