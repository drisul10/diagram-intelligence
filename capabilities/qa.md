# QA: render, inspect, and check against the source

> A diagram is not done because the source looks right. It is done when it renders, reads clearly, and matches its evidence.

## Rules

### DI-QA-01 [Required] [Hard Gate] It renders

- Do: Run `node <skill>/scripts/validate.mjs <file>` on every file you wrote or changed. Fix every
  FAIL, and every WARN unless it has a written reason.
- Do not: Deliver Mermaid you only reasoned about, or mark RENDER as PASS without a run.
- Why: Mermaid's parser is strict and its error messages are far from the cause; a mistake is easy
  to make and invisible until rendered.
- Check: validator exit code 0; the summary line goes into the Delivery Gate.

### DI-QA-02 [Required] Render, look, fix, render again

- Do: Render with `--out <scratch>/render --png --dark`, then open both PNGs and look for: crossing
  edges on the main path, labels clipped or overlapping, edges hidden behind groups, a group that
  breaks the reading order, text unreadable in the dark render, a diagram so wide it will be scaled
  to unreadable size.
- Do not: Treat a passing parse as a passing diagram.
- Why: Layout engines (ELK by default in Mermaid 12, dagre on older renderers) place things in ways
  the source does not predict.
- Check: VISUAL in the Delivery Gate names the PNGs looked at and what was fixed.

### DI-QA-03 [Preferred] Width fits the place

- Do: For docs and READMEs, prefer a diagram whose PNG is under about 1600 px wide at default scale.
  Switch `LR` to `TB`, split, or group when it is wider.
- Do not: Ship a 30-step `LR` flowchart that the page will shrink to unreadable size.
- Why: Markdown renderers scale a diagram to the content column.
- Check: the PNG width from the render.

### DI-QA-04 [Required] The drawn diagram matches the ledger

- Do: After the final render, walk the ledger: each row is on the diagram, and each element and edge
  on the diagram has a row. When updating an existing diagram, re-check it against the current source.
- Do not: Let a fix during layout (removing an edge to reduce crossings, renaming a node to shorten a
  label) change what the diagram claims without updating the ledger.
- Why: Layout fixes are where diagrams drift from the truth.
- Check: counts in EVIDENCE match the drawn element and edge counts.

## Fixing render errors

| Error says | Usually |
| --- | --- |
| `Parse error on line N` past the end of the block | an unclosed `[`, `(`, `{`, or `"` earlier |
| `Expecting ... got 'end'` | `end` used as a flowchart node id; use another id (`done`) and put "end" in its label: `done[end]` |
| A label with `(`, `)`, `:`, `;`, `#`, `<`, `>` breaks parsing | wrap the label in double quotes: `A["call (retry)"]`; write `#quot;` for a quote inside |
| sequence `got 'NEWLINE'` on a message | `;` in the message text ends the statement; write `#59;` or rephrase |
| ER `Expecting 'ATTRIBUTE_WORD'` | an attribute type or name with a space; use one word each (`varchar name`), and put a comment in `"quotes"` after the key |
| Diagram renders empty or as an error box | the first keyword is misspelled, or the type needs `-beta` |

When the error is unclear, cut the block in half, render each half, and repeat. Use `--json` to get
the failing line programmatically.
