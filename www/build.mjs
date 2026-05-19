import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import renderTemplate from "@stackpress/lib/Template";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const specsDir = path.join(rootDir, "specs");
const docsDir = path.join(rootDir, "docs");
const siteUrl = "https://www.stackpress.io/reactus";

const site = {
  canonical: siteUrl,
  description:
    "Reactive React template engine for server-rendered mini-apps with " +
    "Vite-powered development, client hydration, and full control over " +
    "your Node server.",
  kicker: "Reactor docs",
  name: "Reactus",
  previewImage: `${siteUrl}/assets/icon.png`,
  tagline:
    'Reactive React template engine for server-rendered "mini-apps".'
};

const templateFiles = [
  ["layout", "templates/layout.html"],
  ["home", "templates/home.html"],
  ["doc", "templates/doc.html"],
  ["sidebarGroup", "fragments/sidebar-group.html"],
  ["tocList", "fragments/toc-list.html"],
  ["pagerLink", "fragments/pager-link.html"]
];

const assets = [
  ["assets/logo.png", "assets/logo.png"],
  ["assets/icon.png", "assets/icon.png"],
  ["assets/favicon.ico", "assets/favicon.ico"],
  ["styles/site.css", "styles/site.css"],
  ["scripts/site.js", "scripts/site.js"]
];

const fileCache = new Map();

await primeFileCache();
await buildSite();

async function buildSite() {
  const templates = await loadTemplates();
  const allPages = await loadPages();
  const docsPages = attachPager(
    allPages.filter(page => page.relativePath !== "README.md")
  );
  const navigation = createNavigation(docsPages);
  const homePage = createHomePage(allPages);

  await prepareDocsDirectory();
  await copyAssets();

  await writePage({
    content: renderTemplate(templates.home, homePage),
    outputPath: path.join(docsDir, "index.html"),
    page: {
      bodyClass: "route-home",
      canonicalUrl: siteUrl,
      description: site.description,
      home: true,
      showSidebar: false,
      showToc: false,
      title: site.name
    },
    root: "./",
    sidebar: "",
    templates,
    toc: ""
  });

  for (const page of docsPages) {
    const root = relativeRoot(page.routePath);
    const content = renderTemplate(templates.doc, {
      page: {
        content: page.html,
        description: page.description,
        next: page.next
          ? toRenderedLink(page.next, root)
          : null,
        previous: page.previous
          ? toRenderedLink(page.previous, root)
          : null,
        sectionLabel: page.sectionLabel,
        title: page.title
      },
      pager: renderPager(
        templates,
        page.previous ? toRenderedLink(page.previous, root, "previous") : null,
        page.next ? toRenderedLink(page.next, root, "next") : null
      )
    });

    await writePage({
      content,
      outputPath: path.join(docsDir, page.routePath, "index.html"),
      page: {
        bodyClass: "route-doc",
        canonicalUrl: `${siteUrl}/${page.routePath}/`,
        description: page.description,
        home: false,
        showSidebar: true,
        showToc: page.headings.length > 0,
        title: page.title
      },
      root,
      sidebar: renderSidebar(templates, navigation, page.routePath, root),
      templates,
      toc: renderToc(templates, page.headings)
    });
  }

  await fs.writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");
}

async function writePage({
  content,
  outputPath,
  page,
  root,
  sidebar,
  templates,
  toc
}) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const html = renderTemplate(templates.layout, {
    content,
    headerNav: renderHeaderNav(root),
    page,
    root,
    sidebar,
    site,
    toc
  });

  await fs.writeFile(outputPath, html, "utf8");
}

async function loadTemplates() {
  const entries = await Promise.all(
    templateFiles.map(async ([key, relativePath]) => {
      const full = path.join(__dirname, relativePath);
      return [key, await fs.readFile(full, "utf8")];
    })
  );

  return Object.fromEntries(entries);
}

async function loadPages() {
  const files = await walkMarkdown(specsDir);
  const pages = [];

  for (const file of files) {
    const relativePath = path.relative(specsDir, file).replace(/\\/g, "/");
    const routePath = toRoutePath(relativePath);
    const { description, headings, html, title } = parseMarkdown(
      read(file),
      relativePath
    );
    pages.push({
      description,
      file,
      headings,
      html,
      relativePath,
      routePath,
      sectionLabel: sectionLabel(relativePath),
      title
    });
  }

  return sortPages(pages);
}

function parseMarkdown(markdown, relativePath) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const headingCounts = new Map();
  const headings = [];
  const body = [];
  let description = "";
  let title = site.name;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim()) {
      continue;
    }

    const codeMatch = line.match(/^```([a-zA-Z0-9_-]+)?\s*$/);
    if (codeMatch) {
      const chunk = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        chunk.push(lines[index]);
        index += 1;
      }
        body.push(renderCodeBlock(chunk.join("\n"), codeMatch[1] || "text"));
        continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = uniqueHeadingId(slugify(text), headingCounts);
      if (depth === 1) {
        title = stripMarkdown(text);
      } else {
        body.push(
          `<h${depth} id="${id}">${renderInline(text, relativePath)}</h${depth}>`
        );
        if (depth >= 2 && depth <= 4) {
          headings.push({
            depth,
            id,
            text: stripMarkdown(text),
            title: `Jump to ${stripMarkdown(text)}`
          });
        }
      }
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [line];
      while (index + 1 < lines.length && lines[index + 1].startsWith("|")) {
        index += 1;
        tableLines.push(lines[index]);
      }
      body.push(renderTable(tableLines, relativePath));
      continue;
    }

    if (/^- /.test(line)) {
      const items = [line.replace(/^- /, "")];
      while (index + 1 < lines.length && /^- /.test(lines[index + 1])) {
        index += 1;
        items.push(lines[index].replace(/^- /, ""));
      }
      body.push(renderList(items, false, relativePath));
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items = [line.replace(/^\d+\. /, "")];
      while (index + 1 < lines.length && /^\d+\. /.test(lines[index + 1])) {
        index += 1;
        items.push(lines[index].replace(/^\d+\. /, ""));
      }
      body.push(renderList(items, true, relativePath));
      continue;
    }

    if (/^> /.test(line)) {
      const quoteLines = [line.replace(/^> /, "")];
      while (index + 1 < lines.length && /^> /.test(lines[index + 1])) {
        index += 1;
        quoteLines.push(lines[index].replace(/^> /, ""));
      }
      const quote = quoteLines.join(" ");
      body.push(
        `<blockquote><p>${renderInline(quote, relativePath)}</p></blockquote>`
      );
      if (!description) {
        description = stripMarkdown(quote);
      }
      continue;
    }

    const paragraphLines = [line];
    while (index + 1 < lines.length && !isBlockStart(lines[index + 1])) {
      index += 1;
      paragraphLines.push(lines[index]);
    }
    const paragraph = paragraphLines.join(" ").trim();
    body.push(`<p>${renderInline(paragraph, relativePath)}</p>`);
    if (!description) {
      description = stripMarkdown(paragraph);
    }
  }

  return {
    description: description || site.description,
    headings,
    html: body.join("\n"),
    title
  };
}

function isBlockStart(line) {
  return !line.trim()
    || /^```/.test(line)
    || /^(#{1,6})\s+/.test(line)
    || /^\|/.test(line)
    || /^- /.test(line)
    || /^\d+\. /.test(line)
    || /^> /.test(line);
}

function renderTable(lines, relativePath) {
  const rows = lines.map(line => line
    .split("|")
    .slice(1, -1)
    .map(cell => cell.trim()));
  if (rows.length < 2) {
    return "";
  }

  const [header, separator, ...body] = rows;
  if (!separator.every(cell => /^:?-{3,}:?$/.test(cell))) {
    return "";
  }

  const head = header
    .map(cell => `<th>${renderInline(cell, relativePath)}</th>`)
    .join("");
  const bodyRows = body
    .map(row => `<tr>${row.map(cell => `<td>${renderInline(cell, relativePath)}</td>`).join("")}</tr>`)
    .join("");

  return [
    "<table>",
    "  <thead>",
    `    <tr>${head}</tr>`,
    "  </thead>",
    `  <tbody>${bodyRows}</tbody>`,
    "</table>"
  ].join("\n");
}

function renderList(items, ordered, relativePath) {
  const tag = ordered ? "ol" : "ul";
  const body = items
    .map(item => `<li>${renderInline(item, relativePath)}</li>`)
    .join("");
  return `<${tag}>${body}</${tag}>`;
}

function renderInline(input, relativePath) {
  const placeholders = [];
  const token = html => {
    const id = placeholders.push(html) - 1;
    return `@@PLACEHOLDER_${id}@@`;
  };

  let text = input;
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    return token(`<code>${escapeHtml(code)}</code>`);
  });
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const title = escapeHtml(`Open ${stripMarkdown(label)}`);
    const link = rewriteMarkdownHref(href, relativePath);
    const attrs = [
      `href="${escapeHtml(link)}"`,
      `title="${title}"`
    ];
    if (/^https?:\/\//.test(link)) {
      attrs.push(`rel="noreferrer"`, `target="_blank"`);
    }
    return token(`<a ${attrs.join(" ")}>${renderInline(label, relativePath)}</a>`);
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, (_, value) => {
    return token(`<strong>${renderInline(value, relativePath)}</strong>`);
  });
  text = text.replace(/\*([^*]+)\*/g, (_, value) => {
    return token(`<em>${renderInline(value, relativePath)}</em>`);
  });

  let output = escapeHtml(text);
  output = output.replace(/@@PLACEHOLDER_(\d+)@@/g, (_, id) => {
    return placeholders[Number(id)] || "";
  });
  return output;
}

function renderCodeBlock(code, language) {
  const lang = normalizeLanguage(language);
  return [
    `<figure class="code-block">`,
    `  <div class="code-block-header">`,
    `    <span class="code-block-title">${escapeHtml(lang)}</span>`,
    `    <button class="copy-button" data-copy-code type="button">Copy</button>`,
    `  </div>`,
    `  <pre><code class="language-${escapeHtml(lang)}" data-raw="${escapeHtmlAttribute(code)}">${highlightCode(code, lang)}</code></pre>`,
    `</figure>`
  ].join("\n");
}

function createHomePage(pages) {
  const readme = pageByPath(pages, "README.md");
  const gettingStarted = pageByPath(pages, "getting-started.md");
  const strengths = extractBulletsAfterLine(
    readme.file,
    "Use Reactus when you want:"
  );
  const nonGoals = extractBulletsAfterLine(
    readme.file,
    "Reactus does not give you:"
  );
  const frameworks = extractBulletsAfterLine(
    readme.file,
    "Reactus is the template engine for server frameworks."
  );
  const startHere = extractLinkedBullets(readme.file, "Start here");
  const sampleCode = extractCodeBlock(gettingStarted.file, 1);

  return {
    actionsHtml: renderActionList([
      {
        className: "button-primary",
        href: "./getting-started/",
        label: "Start with one page",
        title: "Open the getting started guide"
      },
      {
        className: "button-secondary",
        href: "./guides/framework-integration/",
        label: "See framework integration",
        title: "Open the framework integration guide"
      }
    ]),
    example: {
      code: renderCodeBlock(sampleCode.code, sampleCode.lang),
      file: "pages/home.tsx",
      label: "Hydratable page"
    },
    frameworksHtml: frameworks
      .map(item => `<span class="pill">${escapeHtml(item)}</span>`)
      .join(""),
    highlightsHtml: startHere.map(item => ({
      description: item.description,
      group: item.group,
      href: item.href,
      label: item.label,
      title: `Open ${item.label}`
    })).map(card => [
      `<article class="doc-card">`,
      `  <p class="doc-card-label">${escapeHtml(card.group)}</p>`,
      `  <h3><a href="${escapeHtml(card.href)}" title="${escapeHtml(card.title)}">${escapeHtml(card.label)}</a></h3>`,
      `  <p>${escapeHtml(card.description)}</p>`,
      `</article>`
    ].join("\n")).join("\n"),
    journeyHtml: [
      {
        href: "./getting-started/",
        label: "Getting started",
        title: "Open the getting started guide"
      },
      {
        href: "./explanation/mental-model/",
        label: "Mental model",
        title: "Open the mental model guide"
      },
      {
        href: "./guides/framework-integration/",
        label: "Framework integration",
        title: "Open the framework integration guide"
      },
      {
        href: "./api/",
        label: "API reference",
        title: "Open the API reference"
      }
    ].map(item => {
      return `<li><a href="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}">${escapeHtml(item.label)}</a></li>`;
    }).join(""),
    metricsHtml: [
      { label: "Published guides", value: "5" },
      { label: "API reference pages", value: "14" },
      { label: "Supported server styles", value: String(frameworks.length) }
    ].map(item => {
      return `<div class="hero-metric"><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`;
    }).join(""),
    nonGoalsHtml: nonGoals
      .map(item => `<li>${escapeHtml(item)}</li>`)
      .join(""),
    site,
    strengthsHtml: strengths
      .map(item => `<li>${escapeHtml(item)}</li>`)
      .join("")
  };
}

function createNavigation(pages) {
  return [
    {
      label: "Start here",
      items: [
        {
          current: false,
          label: "Overview",
          routePath: "",
          title: "Go to the Reactus homepage"
        },
        ...pages
          .filter(page => page.relativePath === "getting-started.md")
          .map(toNavItem)
      ]
    },
    {
      label: "Concepts",
      items: pages
        .filter(page => page.relativePath.startsWith("explanation/"))
        .map(toNavItem)
    },
    {
      label: "Guides",
      items: pages
        .filter(page => page.relativePath.startsWith("guides/"))
        .map(toNavItem)
    },
    {
      label: "API reference",
      items: [
        {
          current: false,
          label: "API Reference",
          routePath: "api",
          title: "Open the API reference overview"
        },
        ...pages
          .filter(page => page.relativePath.startsWith("api/") && page.routePath !== "api")
          .map(toNavItem)
      ]
    }
  ].filter(group => group.items.length > 0);
}

function renderSidebar(templates, navigation, currentRoute, root) {
  return navigation
    .map(group => renderTemplate(templates.sidebarGroup, {
      group: {
        ...group,
        itemsHtml: group.items
          .map(item => {
            const href = hrefForRoot(root, item.routePath);
            const className = item.routePath === currentRoute
              ? "sidebar-link is-current"
              : "sidebar-link";
            return [
              "<li>",
              `  <a class="${className}" href="${escapeHtml(href)}" title="${escapeHtml(item.title)}">`,
              `    ${escapeHtml(item.label)}`,
              "  </a>",
              "</li>"
            ].join("\n");
          })
          .join("\n")
      }
    }))
    .join("\n");
}

function renderToc(templates, headings) {
  if (!headings.length) {
    return "";
  }

  return renderTemplate(templates.tocList, {
    itemsHtml: headings.map(heading => {
      return [
        `<li class="toc-item toc-level-${heading.depth}">`,
        `  <a href="#${escapeHtml(heading.id)}" title="${escapeHtml(heading.title)}">`,
        `    ${escapeHtml(heading.text)}`,
        "  </a>",
        "</li>"
      ].join("\n");
    }).join("\n")
  });
}

function renderPager(templates, previous, next) {
  return [
    renderTemplate(templates.pagerLink, { link: previous }),
    renderTemplate(templates.pagerLink, { link: next })
  ].join("\n");
}

function renderHeaderNav(root) {
  const items = [
    {
      href: root,
      label: "Home",
      title: "Go to the Reactus homepage"
    },
    {
      href: `${root}getting-started/`,
      label: "Getting started",
      title: "Open the getting started guide"
    },
    {
      href: `${root}guides/framework-integration/`,
      label: "Guides",
      title: "Browse the integration guides"
    },
    {
      href: `${root}api/`,
      label: "API",
      title: "Browse the API reference"
    },
    {
      href: "https://github.com/stackpress/reactus",
      label: "GitHub",
      title: "Open the Reactus GitHub repository"
    }
  ];

  return items.map(item => {
    return [
      `<a class="header-link" href="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}">`,
      `  ${escapeHtml(item.label)}`,
      "</a>"
    ].join("\n");
  }).join("\n");
}

function renderActionList(items) {
  return items.map(item => {
    return [
      `<a class="${escapeHtml(item.className)}" href="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}">`,
      `  ${escapeHtml(item.label)}`,
      "</a>"
    ].join("\n");
  }).join("\n");
}

function toRenderedLink(link, root, kind = "") {
  return {
    ...link,
    href: hrefForRoot(root, link.routePath),
    kind
  };
}

function hrefForRoot(root, routePath) {
  return routePath ? `${root}${routePath}/` : root;
}

function attachPager(pages) {
  return pages.map((page, index) => ({
    ...page,
    next: pages[index + 1] ? toPageLink(pages[index + 1]) : null,
    previous: pages[index - 1] ? toPageLink(pages[index - 1]) : null
  }));
}

function toPageLink(page) {
  return {
    label: page.title,
    routePath: page.routePath,
    title: `Open ${page.title}`
  };
}

function toNavItem(page) {
  return {
    current: false,
    label: page.title,
    routePath: page.routePath,
    title: `Open ${page.title}`
  };
}

function pageByPath(pages, relativePath) {
  const page = pages.find(entry => entry.relativePath === relativePath);
  if (!page) {
    throw new Error(`Missing page ${relativePath}`);
  }

  return page;
}

async function prepareDocsDirectory() {
  await fs.rm(docsDir, { force: true, recursive: true });
  await fs.mkdir(docsDir, { recursive: true });
}

async function copyAssets() {
  for (const [from, to] of assets) {
    const source = path.join(__dirname, from);
    const destination = path.join(docsDir, to);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
}

async function primeFileCache() {
  const files = await walkMarkdown(specsDir);
  const contents = await Promise.all(
    files.map(async file => [file, await fs.readFile(file, "utf8")])
  );

  for (const [file, content] of contents) {
    fileCache.set(file, content);
  }
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkMarkdown(full);
    }
    return entry.name.endsWith(".md") ? [full] : [];
  }));

  return nested.flat().sort();
}

function sortPages(pages) {
  const explicit = [
    "README.md",
    "getting-started.md",
    "explanation/mental-model.md",
    "guides/development-server.md",
    "guides/build-and-serve.md",
    "guides/framework-integration.md",
    "guides/css-frameworks.md",
    "guides/spa-style-routing.md",
    "api/README.md"
  ];
  const index = new Map(explicit.map((value, order) => [value, order]));

  return [...pages].sort((left, right) => {
    const a = index.get(left.relativePath);
    const b = index.get(right.relativePath);
    if (a !== undefined || b !== undefined) {
      return (a ?? 999) - (b ?? 999);
    }
    return left.relativePath.localeCompare(right.relativePath);
  });
}

function toRoutePath(relativePath) {
  if (relativePath === "README.md") {
    return "";
  }
  if (relativePath.endsWith("/README.md")) {
    return relativePath.slice(0, -"/README.md".length);
  }
  return relativePath.replace(/\.md$/, "");
}

function relativeRoot(routePath) {
  if (!routePath) {
    return "./";
  }
  return "../".repeat(routePath.split("/").length);
}

function sectionLabel(relativePath) {
  if (relativePath.startsWith("api/")) {
    return "API Reference";
  }
  if (relativePath.startsWith("guides/")) {
    return "Guide";
  }
  if (relativePath.startsWith("explanation/")) {
    return "Concept";
  }
  return "Documentation";
}

function rewriteMarkdownHref(href, relativePath = "README.md") {
  if (!href || /^https?:\/\//.test(href)) {
    return href;
  }

  const [pathname, hash] = href.split("#");
  const currentRoute = toRoutePath(relativePath);

  if (href.startsWith("#")) {
    return `#${slugify(href.slice(1))}`;
  }

  let rewritten = pathname;
  if (pathname.endsWith(".md")) {
    const currentDir = path.posix.dirname(relativePath);
    const resolved = path.posix.normalize(
      path.posix.join(currentDir === "." ? "" : currentDir, pathname)
    );
    const targetRoute = toRoutePath(resolved);
    rewritten = routeHrefBetween(currentRoute, targetRoute);
  }

  return hash ? `${rewritten}#${slugify(hash)}` : rewritten;
}

function routeHrefBetween(fromRoute, toRoute) {
  const fromPath = fromRoute || ".";
  const toPath = toRoute || ".";
  const relative = path.posix.relative(fromPath, toPath);
  if (!relative) {
    return "./";
  }
  const withSlash = `${relative}/`;
  return withSlash.startsWith(".") ? withSlash : `./${withSlash}`;
}

function uniqueHeadingId(base, counts) {
  const key = base || "section";
  const count = counts.get(key) || 0;
  counts.set(key, count + 1);
  return count ? `${key}-${count + 1}` : key;
}

function slugify(text) {
  return stripMarkdown(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_>#]/g, "")
    .trim();
}

function extractBullets(file, heading) {
  const section = sectionBody(read(file), heading);
  return [...section.matchAll(/^- (.+)$/gm)].map(match => match[1].trim());
}

function extractBulletsAfterLine(file, marker) {
  const source = read(file);
  const pattern = new RegExp(
    `${escapeRegex(marker)}\\n\\n((?:- .+\\n?)+)`
  );
  const section = source.match(pattern)?.[1] || "";
  return [...section.matchAll(/^- (.+)$/gm)].map(match => match[1].trim());
}

function extractLinkedBullets(file, heading) {
  const section = sectionBody(read(file), heading);
  return [...section.matchAll(/^- \[([^\]]+)\]\(([^)]+)\): (.+)$/gm)].map(match => ({
    description: match[3].trim(),
    group: classifyHighlight(match[2]),
    href: rewriteMarkdownHref(match[2]),
    label: match[1].trim()
  }));
}

function classifyHighlight(href) {
  if (href.includes("/api/")) {
    return "Reference";
  }
  if (href.includes("/guides/")) {
    return "Guide";
  }
  if (href.includes("/explanation/")) {
    return "Concept";
  }
  return "Start";
}

function extractCodeBlock(file, index) {
  const matches = [...read(file).matchAll(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g)];
  const match = matches[index];
  if (!match) {
    return { code: "", lang: "text" };
  }
  return {
    code: match[2].trimEnd(),
    lang: match[1] || "text"
  };
}

function sectionBody(source, heading) {
  const pattern = new RegExp(
    `## ${escapeRegex(heading)}\\n([\\s\\S]*?)(\\n## |$)`
  );
  return source.match(pattern)?.[1] || "";
}

function read(file) {
  const value = fileCache.get(file);
  if (typeof value !== "string") {
    throw new Error(`Missing cached content for ${file}`);
  }
  return value;
}

function normalizeLanguage(language) {
  const value = String(language || "text").toLowerCase();
  if (["bash", "sh", "js", "jsx", "ts", "tsx", "json", "html"].includes(value)) {
    return value;
  }
  return "text";
}

function highlightCode(code, language) {
  const patterns = tokenPatterns(language);
  if (!patterns.length) {
    return escapeHtml(code);
  }

  const matches = [];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern.regex)) {
      if (match.index === undefined) {
        continue;
      }
      matches.push({
        end: match.index + match[0].length,
        start: match.index,
        type: pattern.type,
        value: match[0]
      });
    }
  }

  matches.sort((left, right) => left.start - right.start || right.end - left.end);
  const accepted = [];
  let cursor = -1;

  for (const match of matches) {
    if (match.start < cursor) {
      continue;
    }
    accepted.push(match);
    cursor = match.end;
  }

  let output = "";
  let offset = 0;
  for (const match of accepted) {
    output += escapeHtml(code.slice(offset, match.start));
    output += `<span class="token-${match.type}">${escapeHtml(match.value)}</span>`;
    offset = match.end;
  }
  output += escapeHtml(code.slice(offset));
  return output;
}

function tokenPatterns(language) {
  const shared = [
    { regex: /\/\/.*$/gm, type: "comment" },
    { regex: /\/\*[\s\S]*?\*\//g, type: "comment" },
    { regex: /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`/g, type: "string" },
    { regex: /\b\d+(?:\.\d+)?\b/g, type: "number" }
  ];

  if (["js", "jsx", "ts", "tsx"].includes(language)) {
    return [
      ...shared,
      {
        regex: /\b(import|from|export|default|return|const|let|var|if|else|await|async|new|class|type|function|extends|throw)\b/g,
        type: "keyword"
      },
      { regex: /\b[A-Z][A-Za-z0-9_]*\b/g, type: "property" },
      { regex: /\b[a-zA-Z_][A-Za-z0-9_]*(?=\()/g, type: "function" },
      { regex: /[=<>:+\-*/{}()[\].,]/g, type: "operator" }
    ];
  }

  if (language === "json") {
    return [
      ...shared,
      { regex: /"(?:\\.|[^"])*"(?=\s*:)/g, type: "property" },
      { regex: /\b(true|false|null)\b/g, type: "keyword" },
      { regex: /[{}[\]:,]/g, type: "operator" }
    ];
  }

  if (["bash", "sh"].includes(language)) {
    return [
      { regex: /#.*$/gm, type: "comment" },
      { regex: /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, type: "string" },
      { regex: /\b(npm|npx|yarn|node|cd|cp|mv|export)\b/g, type: "keyword" },
      { regex: /\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/g, type: "property" },
      { regex: /\b\d+(?:\.\d+)?\b/g, type: "number" }
    ];
  }

  if (language === "html") {
    return [
      { regex: /<!--[\s\S]*?-->/g, type: "comment" },
      { regex: /<\/?[A-Za-z0-9-]+/g, type: "keyword" },
      { regex: /\b[A-Za-z-]+(?==)/g, type: "property" },
      { regex: /"(?:\\.|[^"])*"/g, type: "string" }
    ];
  }

  return [];
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
