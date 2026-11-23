# Build: reverse-engineer a diagram from the source

> Read the system, write the model, then draw it. The code is the evidence; the diagram is a view of it.

Use Build when the diagram must describe something that already exists: a codebase, a database, an
infrastructure config, a CI pipeline, a log, or a document set. Read-only: do not change the source
to make the diagram easier.

## Steps

### 1. Fix the question and the scope

Write one line: "<Reader> needs to see <what> at <zoom level> to <decide or do what>." Then name the
scope as paths: "`src/orders/`, `src/payments/`, `docker-compose.yml`; not `scripts/`." A question you
cannot state in one line is two diagrams (DI-CH-01).

### 2. Find the evidence

Search before you read. Use the recipe for the question; each row names where the truth usually lives.

| Question | Diagram | Where the evidence lives |
| --- | --- | --- |
| What runs, and what talks to what? | architecture / C4 container, flowchart LR | `docker-compose*.yml`, k8s manifests, Terraform, Procfile, `.env.example` (hostnames, URLs), HTTP and queue clients, service READMEs |
| What happens when a request comes in? | sequence | route table (`routes/`, `@Get`, `app.get`, `urls.py`), the handler, the services and clients it calls, middleware order, retries and timeouts |
| What data exists and how is it related? | ER | migrations (newest wins), ORM models (`models.py`, `*.entity.ts`, Prisma schema, Mongoose schemas), `CREATE TABLE`, foreign keys and indexes |
| What states can a thing be in? | state | status enums and constants, `status =` assignments, guards that check status, state-machine libraries, DB check constraints |
| How is the code organised? | class, flowchart (module graph) | class and interface declarations, imports, dependency injection registrations |
| How does work move through the pipeline? | flowchart TD | CI files (`.github/workflows/`, `.gitlab-ci.yml`), Makefile, `package.json` scripts, job `needs:` |
| What is the plan and its timing? | gantt | the plan doc, issue tracker export, dates the user gave; never estimate dates yourself |
| What are the parts of a topic? | mindmap, Markdown list | headings of the docs, the folder tree |

Prefer the source of truth over a description of it: a migration over a README's table list, a
compose file over an old architecture doc. When two sources disagree, draw what the code does and
list the disagreement under Open questions (DI-EV-03).

### 3. Write the Evidence Ledger

Before any Mermaid, list every element and edge with its kind and source (SKILL.md, Evidence model).
Cite `path:line` for observed facts. For inferred ones, say what the inference rests on. Anything the
question needs but no source shows is unknown.

Rules for the ledger:

- One row per element and per edge. Edges need their own evidence: two services existing does not
  show that one calls the other.
- An edge's direction is the direction of the call or the data, and the ledger says which.
- Count: "observed 14, inferred 3, unknown 2". This goes into the Delivery Gate.
- Stop reading when every element the question needs has a row. Do not map the whole repository for
  a one-flow question.

### 4. Choose the form and the cut

Read `knowledge/choosing.md`. If the ledger has more elements than the size budget (DI-CX-01), cut
by zoom level (one overview plus one detail diagram per area), by flow (one sequence per use case),
or by bounded area (one ER per schema area). Never cut by dropping edges silently: an overview
that hides an area names it as one node ("Billing (see diagram 3)").

### 5. Draft from the ledger

Write the Mermaid from the ledger rows, in ledger order. Use the source's names (DI-LB-01). Draw
inferred rows normally and unknown rows dashed with a `?` label. Add `accTitle` and `accDescr`.
Read the `types/` file for syntax and pitfalls.

### 6. Render, inspect, fix

Run `capabilities/qa.md`. Then compare the drawn diagram back to the ledger row by row: every row is
drawn, and nothing is drawn that has no row.

### 7. Deliver

Put the diagram, a one-line caption with its scope and source paths, the ledger (or its counts and
the unknowns), and the Delivery Gate in the reply. When the diagram goes into a repository document,
add the "Sources" and "Open questions" lines under it (`knowledge/markdown.md`).

## Don'ts

- Do not draw from what systems like this usually have ("there is probably a cache"). That is DI-EV-01.
- Do not copy an existing diagram from the repo's docs as evidence. It is a claim to check, not a source.
- Do not tidy the system: a circular dependency or a service calling the database of another service
  is drawn as it is, and named as a finding if it matters to the question.
- Do not include secrets, internal hostnames, or credentials from config files in labels.
