# Critique: what should change first

> Judge the diagram against its question, its evidence, and its reader. Report findings someone can act on.

Critique is read-only. It runs Analyze first, then evaluates. It answers "does this diagram tell the
truth, and can the reader get the answer from it quickly?"

## Steps

1. **Analyze** (`capabilities/analyze.md`), including the drift check when the source is reachable.
2. **Render it** with the validator (`--out DIR --png --dark`) when it is Mermaid, and look at both
   PNGs. A critique of a diagram that does not render starts with that.
3. **Evaluate in this order** (a higher layer before a lower one):

| Layer | Ask | Rules |
| --- | --- | --- |
| Truth | Does every element and edge exist in the source? Are unknowns shown as unknown? | DI-EV-01, DI-EV-03, DI-QA-04 |
| Question | Does it answer one question at one zoom level? Is it the right type for that question? | DI-CH-01, DI-CH-02 |
| Size | Is it within budget, or split well? | DI-CX-01, DI-CX-02 |
| Structure | Direction, grouping, crossings, the main path readable first | DI-CX-03, DI-CX-04 |
| Labels | Source names, verbs on edges, one name per thing | DI-LB-01 to DI-LB-05 |
| Access and style | accTitle, accDescr, colour not alone, dark mode | DI-A11Y-01, DI-A11Y-02, DI-ST-01, DI-ST-02 |
| Target | Will it render where it is shown? | DI-RN-01, DI-RN-02 |

4. **Report at most 10 findings**, the ones that mislead the reader most first:

```text
F1 [severity 1-4] <what is wrong> · evidence <path:line, render, or quote> · rule DI-xx-nn · fix <one line>
```

Severity: 4 states something false or hides a failure path the question is about; 3 the reader cannot
get the answer (wrong type, over budget, unreadable); 2 slows the reader (crossings, inconsistent
names, missing labels); 1 polish. A style preference is not a finding unless a rule or the reader's
need makes it one.

5. Close with "Not checked" (what you could not verify and why) and the Delivery Gate areas you could assess.
