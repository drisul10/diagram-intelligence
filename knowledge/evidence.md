# Evidence

> The rules behind the Evidence model in `SKILL.md`. Every element and edge has a source, or is shown as unknown.

## Rules

### DI-EV-01 [Required] [Hard Gate] Nothing invented

- Do: Draw only elements, edges, labels, cardinalities, states, dates, durations, scores, and numbers
  that a source shows: a file, a schema, a config, a log, a document, or the user's own words.
- Do not: Add what systems like this usually have (a cache, a load balancer, an audit log, a retry, a
  "cancelled" state), round out a chart with plausible values, or turn a recommended default the
  user did not confirm into a fact.
- Why: A diagram is read as a statement of fact. An invented part is believed, copied into other
  docs, and found wrong later at the worst moment.
- Check: every drawn element and edge has a ledger row; unknown rows are drawn dashed or with `?`.

### DI-EV-02 [Required] Edges need their own evidence

- Do: Cite the call, import, foreign key, subscription, or config line that shows each edge, and its
  direction.
- Do not: Connect two things because both exist, or because their names suggest it.
- Check: the ledger has one row per edge, not only per element.

### DI-EV-03 [Required] Conflicts are shown, not resolved silently

- Do: When sources disagree (a README lists a service the compose file does not run, a migration
  drops a column an ORM model still has), draw what the running code does and list the conflict
  under Open questions with both sources.
- Do not: Pick the version that makes a cleaner diagram.

### DI-EV-04 [Required] Scope is stated

- Do: Say which paths, documents, or conversations were read, and which in-scope ones were not.
- Do not: Call a diagram "the architecture" when it covers one service.
- Check: the caption (DI-MD-01) and EVIDENCE in the Delivery Gate name the sources.
