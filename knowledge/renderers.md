# Target renderers

> Valid in Mermaid 12 is not the same as working where the reader looks. Each platform runs its own Mermaid version.

The validator renders with Mermaid 12.3.0 (pinned in `scripts/package.json`). GitHub, GitLab,
Obsidian, Notion, Confluence apps, VS Code previews, MkDocs and Docusaurus plugins each bundle their
own version, which this skill does not know and which changes over time. Do not state a platform's
version from memory.

## Find the target's version

Paste this into the target (a GitHub comment preview, an Obsidian note):

```mermaid
info
```

It renders the running Mermaid version (for example `v12.3.0`). If the target shows an error
instead, it does not support `info` and the version stays unknown.

## Rules

### DI-RN-01 [Required] Target compatibility is checked, or marked NOT VERIFIED

- Do: Name the target in stage 1. When its Mermaid version is known (from `info` or its docs read in
  this session), keep to features that version has. When it is not known, use the conservative
  subset below and mark TARGET NOT VERIFIED.
- Do not: Claim a diagram "works on GitHub" because the validator passed.
- Check: TARGET line in the Delivery Gate.

### DI-RN-02 [Preferred] Conservative subset for unknown targets

Likely safe on most renderers in use, because this syntax has existed for several major versions
(this skill's judgment, not checked per platform):

- `flowchart` with basic shapes, `subgraph`, edge labels, `classDef`; `sequenceDiagram` with
  `participant`/`actor`, `alt`/`opt`/`loop`/`par`, `Note`, `activate`; `erDiagram` with attributes;
  `stateDiagram-v2`; `classDiagram`; `gantt`; `pie`; `mindmap`; `timeline`; `journey`; `gitGraph`.
- `accTitle` and `accDescr`.

Avoid unless the target is known to support it:

- Front matter `config:` keys `layout:` and `look:`, and the `neo` look or `redux` themes (Mermaid 12 defaults).
- Types that exist only in a `-beta` form (`radar-beta`, `treemap-beta`, `architecture-beta`) and
  types new in recent versions (`usecase-beta`, `swimlane-beta`, `agentflow-beta`, `eventmodeling`,
  `cynefin-beta`, `railroad-*-beta`, `treeView-beta`, `wardley-beta`, `venn-beta`, `ishikawa-beta`).
- The flowchart `@{ shape: ... }` syntax, edge ids (`e1@-->`), edge animation and `step` numbers.
- `click` callbacks and links: platforms may disable interaction for security.
- Icons (`fa:fa-...`, icon packs): platforms may not load the icon font.

For `sankey`, `xychart`, `block`, and `packet`, Mermaid 12.3.0 accepts both the plain keyword and the
older `-beta` keyword (both checked). Mermaid 11 used the `-beta` form (from memory, not checked
here), so for an unknown target prefer `sankey-beta`, `xychart-beta`, `block-beta`, `packet-beta`.

### DI-RN-03 [Required] The fence is exactly `mermaid`

- Do: Open the block with three backticks and `mermaid`, lower case, nothing else on the line.
- Do not: Use `mmd`, `Mermaid`, or `mermaid-js`. Most renderers draw only `mermaid`.
- Check: validator warning DI-RN-03 (fence language).

### DI-RN-04 [Contextual] Static exports

- When: the target does not render Mermaid (a PDF, a slide tool, an email, a wiki without the plugin).
- Do: Export with the validator (`--out DIR --png`, or SVG), commit the source next to the image, and
  reference the image with alt text equal to `accDescr`.
- Do not: Ship only the image; the source is how the next person updates it.
