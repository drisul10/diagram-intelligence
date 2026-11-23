---
name: diagram-intelligence
description: "Diagram Intelligence - evidence-backed Mermaid and Markdown diagrams. Routes to Analyze (read an existing diagram or image into a model), Design (draw from a brief), Build (reverse-engineer a diagram from code, configs, schemas, or docs), Critique (find what to fix first), or QA (render, inspect, and check a diagram against its source), reads only the diagram-type and knowledge files the task needs, and closes with a validator run and a Delivery Gate. Use when the task is to write, generate, fix, review, or validate a Mermaid diagram (flowchart, sequence, ER, state, class, C4, architecture, gantt, mindmap, or any other Mermaid type) or to choose between a diagram and a Markdown table, list, or tree. Not for explaining code in prose, UI design, or drawing images."
---

# Diagram Intelligence

> Evidence-backed Mermaid and Markdown diagrams. Diagram Intelligence 0.1.0, MIT licensed.
> Structure adapted from RYUX (ryuxdsgn/design-intelligence, MIT); see LICENSE.

A diagram is a claim about a system. Every box, line, label, and number on it says "this exists and
works this way". This skill makes the agent find out before it draws, draw only what the evidence
supports, show what it does not know, and prove the diagram renders.

**Answer one question per diagram. Draw what you can cite; mark what you cannot.**

```
Question → Evidence → Model → Choose form → Draft → Render and inspect → Verify and deliver
```

## Start with what you are doing

| Entry point | When | Read |
| --- | --- | --- |
| **Analyze** | read an existing diagram (Mermaid source, image, or doc) into a model | `capabilities/analyze.md` |
| **Design** | draw from a brief, a description, or a conversation | `capabilities/design.md` |
| **Build** | reverse-engineer a diagram from code, configs, schemas, logs, or docs | `capabilities/build.md` |
| **Critique** | judge a diagram: what should change first, and why | `capabilities/critique.md` |
| **QA** | render it, inspect it, and check it against its source | `capabilities/qa.md` |

Then read the one `types/<type>.md` file for the diagram type you chose, plus the knowledge rows the
task table names. Paths are relative to this skill's folder. Do not read every file.

## Stages

1. **Question**: who reads it, what one question it answers, where it will be shown (GitHub, GitLab,
   Obsidian, Notion, a docs site, a slide), and at what zoom level (DI-CH-01).
2. **Evidence**: read the sources the question needs, and record each fact with its origin.
3. **Model**: list the elements and relationships as data before drawing (the Evidence Ledger, below).
4. **Choose form**: the diagram type, or a Markdown table, list, or tree when that answers better
   (`knowledge/choosing.md`).
5. **Draft**: write the Mermaid source from the model, not from memory of the system.
6. **Render and inspect**: run the validator, look at the PNG, fix, render again (`capabilities/qa.md`).
7. **Verify and deliver**: Hard Gates, the Delivery Gate, and honest claims.

Analyze runs 1-3. Design runs 1-7. Build runs 1-7 with code as the evidence. Critique runs 1-3 and
judges. QA runs 6-7. Never go from "generate" straight to "done".

## Evidence model

Every element and edge on a diagram has a source:

| Label | Meaning | Drawn as |
| --- | --- | --- |
| **Observed** | read in a file, schema, config, log, or the user's words; cite `path:line` or the quote | normal |
| **Inferred** | a reasonable reading of evidence (a naming convention, a call through a helper); say what it rests on | normal, listed under Inferred in the ledger |
| **Unknown** | the diagram needs it but no source shows it | dashed edge or node labelled `?` or "unknown", listed under Open questions |

Never invent a component, service, table, column, field, endpoint, message, state, transition,
cardinality, date, duration, owner, or number to make a diagram look complete (DI-EV-01). A blank
or dashed part is honest; a confident invented part is a defect.

The **Evidence Ledger** is the model behind the diagram. Keep it in the reply or under the diagram
(`knowledge/markdown.md`, DI-MD-03):

```text
| Element / edge            | Kind     | Source                         |
| ------------------------- | -------- | ------------------------------ |
| OrderService → PaymentAPI | observed | src/orders/pay.ts:42 (fetch)   |
| PaymentAPI → Bank         | inferred | env var BANK_URL in .env.example |
| Retry on 503              | unknown  | no retry code found            |
```

## Levels

- **[Required]**: applies within its scope; an exception needs a written reason.
- **[Preferred]**: the default; break it with a short reason.
- **[Contextual]**: applies only when its "When" holds.
- **[Hard Gate]**: no exceptions; fix before delivery. Kept for failures a check can show.

## Hard Gates

- **It renders.** Every `mermaid` block passes `scripts/validate.mjs`. A block that was not run is NOT VERIFIED, never PASS. (DI-QA-01)
- **Nothing invented.** No element, edge, label, cardinality, date, or number without a source; unknowns are drawn as unknown. (DI-EV-01)
- **Names match the source.** A node named in code, schema, or config uses that name, or the ledger maps the display name to it. (DI-LB-01)
- **One question, one diagram.** A diagram that mixes zoom levels or answers two questions is split. (DI-CH-01, DI-CX-02)
- **Within the size budget.** More than 25 nodes (flowchart, class, ER, state, architecture) or 8 participants / 30 messages (sequence) is split or justified in writing. (DI-CX-01)
- **Named for screen readers.** `accTitle` and `accDescr` are set, or, for types that cannot carry them (mindmap, block, sankey, venn, kanban, timeline, and others in `knowledge/style.md`), the Markdown right above the diagram states both. (DI-A11Y-01)
- **Colour never carries meaning alone.** Every colour-coded meaning also shows in a label, shape, line style, or legend. (DI-A11Y-02)

## Task table

| Task | Read |
| --- | --- |
| Any new diagram | `knowledge/evidence.md`, `knowledge/choosing.md`, `knowledge/structure.md`, `knowledge/labels.md`, the `types/` file |
| From code or config | add `capabilities/build.md` |
| Will be shown on GitHub, GitLab, Obsidian, Notion, or a docs site | add `knowledge/renderers.md` |
| Colours, themes, legends, dark mode | add `knowledge/style.md` |
| Diagram inside a README, ADR, or doc | add `knowledge/markdown.md` |
| Review only | `capabilities/critique.md`, the `types/` file |
| Fix a render error | `capabilities/qa.md`, the `types/` file |

Diagram types. Core types, in depth: `types/flowchart.md`, `types/sequence.md`, `types/er.md`,
`types/state.md`, `types/class.md`, `types/architecture.md` (C4, architecture-beta, block),
`types/gantt.md`, `types/mindmap.md`. Every other Mermaid type: `types/other.md`.

## Validator

```bash
node <skill>/scripts/validate.mjs <file.md|file.mmd|dir> [--out DIR --png] [--dark] [--max-nodes N] [--json] [--strict]
```

It renders each `mermaid` block with real Mermaid in headless Chrome, and prints `PASS | WARN | FAIL`
per block with `file:line`, type, drawn size, and warnings (missing `accTitle`, hard-coded colours,
size over budget, wrong fence language). `--out DIR --png --dark` writes light and dark PNGs to look at.
Exit 1 on any FAIL. First run: `cd <skill>/scripts && PUPPETEER_SKIP_DOWNLOAD=1 npm install`
(it uses the installed Chrome; set `PUPPETEER_EXECUTABLE_PATH` if Chrome is elsewhere). Write a draft
to a scratch `.md` or `.mmd` file to validate it before putting it in the user's document.

## Delivery Gate

End every diagram task with:

```text
QUESTION     PASS | FAIL | NOT VERIFIED · the one question, the reader, the zoom level
EVIDENCE     PASS | FAIL | NOT VERIFIED · observed <n>, inferred <n>, unknown <n> · sources read <list>
FORM         PASS | FAIL · type chosen and why; Markdown alternative considered
RENDER       PASS | FAIL | NOT VERIFIED · validator result, Mermaid version, blocks <pass>/<total>
VISUAL       PASS | FAIL | NOT VERIFIED · PNG inspected light/dark; crossings, overlaps, clipped labels
SIZE         PASS | FAIL | N/A · nodes <n>/<budget> or participants <n>, messages <n>; counted from source when the validator says "not measured"
ACCESS       PASS | FAIL · accTitle and accDescr, or title and summary in Markdown for types that cannot carry them; colour not alone
TARGET       PASS | NOT VERIFIED | N/A · renderer and version, or "not checked on <target>"
FINAL        PASS | FAIL | NOT VERIFIED
```

- FINAL is FAIL if any area fails, NOT VERIFIED if none fails but one is not verified, else PASS.
- RENDER and VISUAL are NOT VERIFIED when the validator or a PNG look did not run; say why.
- TARGET stays NOT VERIFIED until the diagram is seen on the target or its Mermaid version is known
  (`knowledge/renderers.md`, DI-RN-01). Validating with Mermaid 12 does not prove it renders on GitHub.
- Scale it down for a one-line fix: mark areas the change cannot affect N/A with one reason each.

## Honest claims

Report what was read, what was rendered, and what was not checked. Do not write "complete
architecture", "accurate", or "all flows" unless the ledger covers every source in scope. Say "drawn
from `src/api/` and `docker-compose.yml`; workers in `jobs/` not read" instead. Rule IDs and gate
results go in the reply, never inside the diagram.
