# Design: draw from a brief

> The brief is the evidence. Ask for what the diagram needs before drawing what the brief does not say.

Use Design when the diagram describes something planned, proposed, or explained in words: a feature
spec, a meeting outcome, a process someone describes, a system that does not exist yet.

## Steps

### 1. Question, reader, place

Write the one-line question (DI-CH-01). Name where it will be shown, because that decides syntax limits
(`knowledge/renderers.md`) and size (a slide holds less than a doc page).

### 2. Separate what the brief says from what it does not

List the facts the brief states. Then list what the diagram would need that the brief leaves open:
missing steps, actors, error paths, data fields, cardinalities, dates, owners. These are unknowns.

### 3. Ask, or label

When the unknowns change the shape of the diagram (a missing actor, a decision with no known
outcome, a relationship of unknown cardinality), ask the user, all questions at once, each with a
recommended default. When they do not, or the user said to go ahead, draw them as unknown (dashed,
`?`) and list them under Open questions. A recommended default the user did not confirm is still an
assumption: label it in the ledger as inferred, with "assumed, not confirmed".

### 4. Choose the form

Read `knowledge/choosing.md`. For a design that is still open, two small alternatives (for example
"sync call" and "queue") drawn side by side answer more than one large diagram. Offer them as options
with the trade-off of each.

### 5. Draft, render, deliver

Write the ledger from the brief (source = "brief: <quote>"), draft from it, then run
`capabilities/qa.md` and close with the Delivery Gate.

## Don'ts

- Do not complete a process with steps nobody named (approval, notification, audit log) because
  processes like it usually have them. Ask, or draw them as unknown.
- Do not give a planned system real-looking hostnames, versions, numbers, or SLAs.
- Do not draw a happy path only when the brief mentions failure, timeout, or rejection. Draw those
  paths, or list them as not covered.
