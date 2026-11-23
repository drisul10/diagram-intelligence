# Diagram Intelligence

An agent skill for evidence-backed Mermaid and Markdown diagrams. The agent finds out before it
draws, draws only what a source supports, shows what it does not know, and proves every diagram
renders.

## What it does

- **Five entry points:** Analyze (read a diagram into a model), Design (draw from a brief), Build
  (reverse-engineer from code, schemas, configs), Critique (what to fix first), QA (render, inspect,
  check against the source).
- **Evidence Ledger:** every node and edge is observed (with `path:line`), inferred (with its basis),
  or unknown (drawn dashed with `?`).
- **Hard Gates:** renders, nothing invented, source names, one question per diagram, size budget,
  screen-reader title and description, colour not alone.
- **Validator:** `scripts/validate.mjs` renders every `mermaid` block with real Mermaid 12.3.0 in
  headless Chrome and reports `file:line`, type, drawn size, and warnings. Writes light and dark PNGs.
- **All Mermaid types:** core types in depth (flowchart, sequence, ER, state, class, C4 and
  architecture, gantt, mindmap) and a reference for the other 24, each example checked by the validator.

## Layout

```text
SKILL.md              router, workflow, evidence model, Hard Gates, Delivery Gate
capabilities/         analyze, design, build, critique, qa
knowledge/            evidence, choosing, structure, labels, style, renderers, markdown
types/                flowchart, sequence, er, state, class, architecture, gantt, mindmap, other
scripts/validate.mjs  the validator
```

## Install

1. Copy or symlink this folder into your agent's skills folder, for example
   `ln -s "$PWD" ~/.claude/skills/diagram-intelligence`.
2. Install the validator's dependencies. This uses your installed Chrome and skips Puppeteer's
   browser download:

   ```bash
   cd scripts && PUPPETEER_SKIP_DOWNLOAD=1 npm install
   ```

   Without Chrome, run `npx puppeteer browsers install chrome-headless-shell` in `scripts/`, or set
   `PUPPETEER_EXECUTABLE_PATH`. `node_modules` is about 440 MB (Mermaid CLI bundles fonts, KaTeX, and
   the ZenUML plugin).

Needs Node 22.12 or newer.

## Validate

```bash
node scripts/validate.mjs docs/ --out /tmp/render --png --dark
node scripts/validate.mjs README.md --json
node scripts/validate.mjs . --strict          # warnings fail too
```

Exit codes: 0 all pass, 1 a block failed (or a warning with `--strict`), 2 setup or usage error.

## Limits

- Validation proves the diagram renders in Mermaid 12.3.0. GitHub, GitLab, Obsidian, Notion, and
  docs sites bundle their own versions; `knowledge/renderers.md` explains how to check a target.
- Drawn-size counts cover flowchart, class, ER, state, sequence, and swimlane. Other types report
  "not measured".
- The size budget (25 nodes, 8 participants, 30 messages) is this skill's default, not a standard.

## License

MIT. Structure adapted from [RYUX](https://github.com/ryuxdsgn/design-intelligence) (MIT); see `LICENSE`.
