import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs");

const requiredFiles = [
  "index.html",
  "getting-started/index.html",
  "api/index.html",
  "styles/site.css",
  "scripts/site.js",
  "assets/logo.png",
  "assets/icon.png"
];

await check();

async function check() {
  for (const file of requiredFiles) {
    await assertExists(path.join(docsDir, file), `Missing ${file}`);
  }

  const htmlFiles = await walkHtml(docsDir);
  for (const file of htmlFiles) {
    const html = await fs.readFile(file, "utf8");
    assert(!html.includes("{{"), `Unresolved template placeholder in ${file}`);
    assert(!html.includes(".md\""), `Markdown link leaked in ${file}`);
    assert(/<title>/.test(html), `Missing title in ${file}`);
    assert(
      /<meta[^>]+name="description"/.test(html),
      `Missing description meta in ${file}`
    );

    const hrefs = [...html.matchAll(/href="([^"#][^"]*)"/g)]
      .map(match => match[1])
      .filter(href => !/^https?:\/\//.test(href));

    for (const href of hrefs) {
      const target = resolveOutputPath(file, href);
      await assertExists(target, `Broken link ${href} from ${file}`);
    }
  }

  console.log(`Checked ${htmlFiles.length} HTML files.`);
}

function resolveOutputPath(file, href) {
  const currentDir = path.dirname(file);
  const target = href.endsWith("/")
    ? path.join(currentDir, href, "index.html")
    : path.join(currentDir, href);
  return path.resolve(target);
}

async function walkHtml(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkHtml(full);
    }

    return entry.name.endsWith(".html") ? [full] : [];
  }));

  return files.flat();
}

async function assertExists(file, message) {
  try {
    await fs.access(file);
  } catch (error) {
    throw new Error(message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
