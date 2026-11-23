#!/usr/bin/env node
// Diagram Intelligence validator: renders every Mermaid block in Markdown (.md, .markdown)
// or Mermaid (.mmd, .mermaid) files with real Mermaid in a headless browser, and reports
// file:line, diagram type, size, accessibility, and styling findings per block.
//
// Usage: node validate.mjs <file|dir>... [--out DIR] [--png] [--dark] [--max-nodes N]
//                          [--json] [--strict]
// Exit codes: 0 all blocks render (and, with --strict, no warnings), 1 a block failed,
// 2 usage or setup error.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SYSTEM_BROWSERS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function usage(msg) {
  if (msg) console.error(`error: ${msg}`);
  console.error(
    "usage: node validate.mjs <file|dir>... [--out DIR] [--png] [--dark] [--max-nodes N] [--json] [--strict]",
  );
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { inputs: [], out: null, png: false, dark: false, maxNodes: 25, json: false, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i] ?? usage("--out needs a directory");
    else if (a === "--png") opts.png = true;
    else if (a === "--dark") opts.dark = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--strict") opts.strict = true;
    else if (a === "--max-nodes") {
      opts.maxNodes = Number(argv[++i]);
      if (!Number.isInteger(opts.maxNodes) || opts.maxNodes < 1) usage("--max-nodes needs a positive integer");
    } else if (a === "-h" || a === "--help") usage();
    else if (a.startsWith("--")) usage(`unknown option ${a}`);
    else opts.inputs.push(a);
  }
  if (opts.inputs.length === 0) usage("no input files");
  if (opts.png && !opts.out) usage("--png needs --out");
  return opts;
}

const MD_EXT = new Set([".md", ".markdown"]);
const MMD_EXT = new Set([".mmd", ".mermaid"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "vendor"]);

function collectFiles(input, files) {
  const st = fs.statSync(input, { throwIfNoEntry: false });
  if (!st) usage(`not found: ${input}`);
  if (st.isDirectory()) {
    for (const entry of fs.readdirSync(input, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const p = path.join(input, entry.name);
      if (entry.isDirectory()) collectFiles(p, files);
      else if (MD_EXT.has(path.extname(p).toLowerCase()) || MMD_EXT.has(path.extname(p).toLowerCase())) files.push(p);
    }
  } else files.push(input);
}

// Extract fenced Mermaid blocks. Handles ``` and ~~~ fences of any length, fences indented
// inside lists (indentation is stripped from the body), and info strings with extra words
// ("mermaid title=x"). A block whose language is only a near match (Mermaid, mmd) is reported
// as a warning, not rendered, because most Markdown renderers will not draw it.
export function extractBlocks(text, file) {
  const ext = path.extname(file).toLowerCase();
  if (MMD_EXT.has(ext)) return [{ file, line: 1, offset: 0, code: text, lang: "mermaid", nearMiss: false }];
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!open) {
      const m = line.match(/^(\s*)(`{3,}|~{3,})\s*([^\s`]*)(.*)$/);
      if (m) {
        open = { indent: m[1].length, fence: m[2], lang: m[3], start: i + 1, body: [] };
      }
      continue;
    }
    const close = line.match(/^(\s*)(`{3,}|~{3,})\s*$/);
    if (close && close[2][0] === open.fence[0] && close[2].length >= open.fence.length) {
      const lang = open.lang;
      if (lang === "mermaid" || /^(mermaid|mmd)$/i.test(lang)) {
        const code = open.body.map((l) => l.slice(Math.min(open.indent, l.match(/^\s*/)[0].length))).join("\n");
        blocks.push({ file, line: open.start, offset: open.start, code, lang, nearMiss: lang !== "mermaid" });
      }
      open = null;
      continue;
    }
    open.body.push(line);
  }
  if (open && /^mermaid$/i.test(open.lang)) {
    blocks.push({ file, line: open.start, code: open.body.join("\n"), lang: open.lang, unclosed: true });
  }
  return blocks;
}

// The first keyword after optional YAML front matter, %% comments, and %%{init}%% directives.
export function diagramType(code) {
  const lines = code.split("\n");
  let i = 0;
  if (lines[0]?.trim() === "---") {
    i = 1;
    while (i < lines.length && lines[i].trim() !== "---") i++;
    i++;
  }
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t || t.startsWith("%%")) continue;
    return t.split(/[\s:{]/)[0];
  }
  return "unknown";
}

// Types that, in Mermaid 12.3.0, reject accTitle/accDescr (parse error), draw them as visible
// text, or drop them silently. Measured by rendering each type with and without the lines.
export const ACC_UNSUPPORTED = new Map([
  ["mindmap", "parse error"],
  ["block", "parse error"],
  ["block-beta", "parse error"],
  ["sankey", "parse error"],
  ["sankey-beta", "parse error"],
  ["venn-beta", "parse error"],
  ["kanban", "drawn as a card"],
  ["ishikawa-beta", "drawn as a branch"],
  ["zenuml", "drawn as text"],
  ["timeline", "ignored"],
  ["eventmodeling", "ignored"],
]);

// Source-level checks that do not need a render.
export function lintSource(code, type) {
  const warnings = [];
  const hasTitle = /^\s*accTitle\s*:/m.test(code);
  const hasDescr = /^\s*accDescr\s*(:|\{)/m.test(code);
  if (ACC_UNSUPPORTED.has(type)) {
    if (hasTitle || hasDescr)
      warnings.push(`DI-A11Y-01 ${type} does not support accTitle/accDescr (${ACC_UNSUPPORTED.get(type)}): remove them and state the title and summary in the Markdown around the diagram`);
    else
      warnings.push(`DI-A11Y-01 note: ${type} cannot carry accTitle/accDescr; state the title and summary in the Markdown around the diagram`);
  } else if (type !== "info") {
    if (!hasTitle && !/^\s*title[\s:]/m.test(code))
      warnings.push("DI-A11Y-01 no accTitle (or title): screen readers get no name for this diagram");
    if (!hasDescr)
      warnings.push("DI-A11Y-01 no accDescr: add a one-sentence summary of what the diagram shows");
  }
  if (type === "gantt") {
    // Mermaid 12.3.0 renders a task whose `after` id does not exist at today's date, with no error.
    const ids = new Set();
    const refs = [];
    for (const line of code.split("\n")) {
      const m = line.match(/^\s*[^:%]+?:\s*(.+)$/);
      if (!m || /^\s*(title|dateFormat|axisFormat|excludes|includes|todayMarker|section|accTitle|accDescr|tickInterval|weekday)\b/.test(line)) continue;
      const parts = m[1].split(",").map((x) => x.trim());
      for (const part of parts) {
        const after = part.match(/^after\s+(.+)$/);
        if (after) refs.push(...after[1].split(/\s+/));
      }
      const id = parts.find((x) => /^[A-Za-z_][\w-]*$/.test(x) && !/^(done|active|crit|milestone|vert)$/.test(x));
      if (id) ids.add(id);
    }
    for (const r of refs)
      if (!ids.has(r)) warnings.push(`DI-GT-02 task depends on unknown id "${r}": Mermaid draws it at today's date without an error`);
  }
  const fills = code.match(/(fill|stroke|color)\s*:\s*#[0-9a-f]{3,8}/gi) ?? [];
  if (fills.length)
    warnings.push(
      `DI-ST-02 ${fills.length} hard-coded colour value(s): check the --dark render, or use classDef roles with a theme`,
    );
  if (/%%\{\s*init/.test(code))
    warnings.push("DI-RN-02 %%{init}%% directive: front matter `config:` is the current form; check the target renderer supports either");
  if (/^\s*---[\s\S]*?\n\s*(layout|look)\s*:/m.test(code))
    warnings.push("DI-RN-02 layout/look set in front matter: older renderers ignore or reject it; confirm on the target");
  return warnings;
}

// Approximate size from the rendered SVG. Counts are of drawn shapes, so they are reported as
// measured from this render, not as a model of the source.
export function measure(svg, type) {
  const count = (re) => (svg.match(re) ?? []).length;
  const nodes =
    count(/<g[^>]*class="[^"]*\bnode\b[^"]*"/g) ||
    count(/<g[^>]*class="[^"]*\bentityBox\b[^"]*"/g) ||
    count(/<g[^>]*id="entity-[^"]*"/g);
  const edges = count(/<path[^>]*class="[^"]*\b(flowchart-link|relation|transition|edge-thickness-[a-z]+)\b[^"]*"/g);
  const actors = type === "sequenceDiagram" ? count(/<text[^>]*class="[^"]*\bactor\b[^"]*"/g) / 2 : 0;
  const messages = type === "sequenceDiagram" ? count(/<text[^>]*class="[^"]*\bmessageText\b[^"]*"/g) : 0;
  return { nodes, edges, actors, messages };
}

// Types whose drawn size the regexes in measure() count reliably (checked on 12.3.0 renders).
const MEASURED = new Set(["flowchart", "graph", "classDiagram", "erDiagram", "stateDiagram", "stateDiagram-v2", "sequenceDiagram", "swimlane-beta"]);

function findBrowser() {
  for (const p of SYSTEM_BROWSERS) if (fs.existsSync(p)) return p;
  return null;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const files = [];
  for (const input of opts.inputs) collectFiles(input, files);

  const blocks = [];
  for (const f of files) blocks.push(...extractBlocks(fs.readFileSync(f, "utf8"), f));

  let renderMermaid, puppeteer;
  try {
    ({ renderMermaid } = await import("@mermaid-js/mermaid-cli"));
    puppeteer = (await import("puppeteer")).default;
  } catch {
    console.error(`setup: dependencies missing. Run: cd ${here} && PUPPETEER_SKIP_DOWNLOAD=1 npm install`);
    process.exit(2);
  }
  const mermaidVersion = require("mermaid/package.json").version;

  const executablePath = findBrowser();
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "shell",
      args: ["--no-sandbox"],
      ...(executablePath ? { executablePath } : {}),
    });
  } catch (e) {
    console.error(
      `setup: could not start a browser (${String(e.message).split("\n")[0]}). Install Chrome, set PUPPETEER_EXECUTABLE_PATH, or run \`npx puppeteer browsers install chrome-headless-shell\` in ${here}.`,
    );
    process.exit(2);
  }

  // mermaid-cli forwards the page's console to console.warn; plugins (ZenUML) log layout noise there.
  // Keep it out of the report unless DI_VERBOSE is set.
  if (!process.env.DI_VERBOSE) console.warn = () => {};

  if (opts.out) fs.mkdirSync(opts.out, { recursive: true });
  const results = [];
  try {
    for (const [idx, b] of blocks.entries()) {
      const type = diagramType(b.code);
      const r = { file: b.file, line: b.line, type, status: "PASS", error: null, warnings: [], notes: [], size: null, outputs: [] };
      if (b.unclosed) {
        r.status = "FAIL";
        r.error = "fence is never closed";
      } else if (b.nearMiss) {
        r.status = "WARN";
        r.warnings.push(`DI-RN-03 fence language is "${b.lang}", not "mermaid": most Markdown renderers will show it as code`);
      } else {
        try {
          const { data, title, desc } = await renderMermaid(browser, b.code, "svg", {
            mermaidConfig: { theme: "default" },
          });
          const svg = Buffer.from(data).toString("utf8");
          r.size = MEASURED.has(type) ? measure(svg, type) : null;
          for (const w of lintSource(b.code, type)) (w.includes(" note: ") ? r.notes : r.warnings).push(w.replace(" note: ", " "));
          if (r.size && r.size.nodes > opts.maxNodes)
            r.warnings.push(`DI-CX-01 ${r.size.nodes} nodes drawn, over the budget of ${opts.maxNodes}: split it or raise the budget with a reason`);
          if (opts.out) {
            const base = `${path.basename(b.file).replace(/\.[^.]+$/, "")}-L${b.line}`;
            const write = async (theme, ext, fmt) => {
              const out = path.join(opts.out, `${base}${theme === "dark" ? "-dark" : ""}.${ext}`);
              const res = await renderMermaid(browser, b.code, fmt, {
                mermaidConfig: { theme },
                backgroundColor: theme === "dark" ? "#0d1117" : "white",
              });
              fs.writeFileSync(out, res.data);
              r.outputs.push(out);
            };
            fs.writeFileSync(path.join(opts.out, `${base}.svg`), svg);
            r.outputs.push(path.join(opts.out, `${base}.svg`));
            if (opts.png) await write("default", "png", "png");
            if (opts.dark) await write("dark", opts.png ? "png" : "svg", opts.png ? "png" : "svg");
          }
          r.title = title ?? null;
          r.desc = desc ?? null;
          if (!ACC_UNSUPPORTED.has(type) && /^\s*accDescr\s*(:|\{)/m.test(b.code) && !r.desc)
            r.warnings.push(`DI-A11Y-01 accDescr was written but the rendered SVG has no description; state it in the Markdown around the diagram`);
          if (r.warnings.length) r.status = "WARN";
        } catch (e) {
          r.status = "FAIL";
          const msg = String(e?.message ?? e);
          const lines = msg.split("\n").filter((l) => l.trim() && !/^\s*at\s/.test(l) && !/\(https?:\/\/|\(file:\/\//.test(l));
          const m = msg.match(/on line (\d+)/);
          // The parser's line is inside the block. Map it to the file only when it falls
          // inside the block; Mermaid sometimes reports the line after an unclosed shape.
          const n = m ? Number(m[1]) : null;
          const bodyLines = b.code.split("\n").length;
          r.blockLine = n;
          // Body line N sits N lines after the fence line in Markdown, and is line N in a .mmd file.
          r.errorLine = n && n <= bodyLines ? b.offset + n : null;
          r.error = (n && !r.errorLine ? `(parser line ${n}, past the end of the block: look for an unclosed shape or quote) ` : "") + lines.slice(0, 4).join(" | ");
        }
      }
      results.push(r);
      if (!opts.json) {
        const loc = `${b.file}:${r.errorLine ?? b.line}`;
        const size = r.size
          ? type === "sequenceDiagram"
            ? ` actors=${r.size.actors} messages=${r.size.messages}`
            : ` nodes=${r.size.nodes} edges=${r.size.edges}`
          : r.status === "FAIL" || b.nearMiss ? "" : " size=not measured for this type";
        console.log(`${r.status.padEnd(4)} ${loc} [${type}]${size}`);
        if (r.error) console.log(`     ${r.error}`);
        for (const w of r.warnings) console.log(`     warn: ${w}`);
        for (const n of r.notes) console.log(`     note: ${n}`);
        for (const o of r.outputs) console.log(`     out:  ${o}`);
      }
      void idx;
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;
  const summary = {
    mermaid: mermaidVersion,
    browser: executablePath ?? "puppeteer-managed",
    files: files.length,
    blocks: results.length,
    pass: results.length - failed - warned,
    warn: warned,
    fail: failed,
  };
  if (opts.json) console.log(JSON.stringify({ summary, results }, null, 2));
  else
    console.log(
      `\nmermaid ${summary.mermaid} · ${summary.files} file(s) · ${summary.blocks} block(s) · ${summary.pass} pass · ${summary.warn} warn · ${summary.fail} fail`,
    );
  process.exit(failed || (opts.strict && warned) ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
