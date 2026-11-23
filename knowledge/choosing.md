# Choosing the form

> Pick the form from the question, not from habit. Sometimes the answer is a table.

## Question → form

| The reader asks | Use | Not |
| --- | --- | --- |
| What happens, in what order, with which decisions? | flowchart TD | sequence (no actors), state (not one thing changing) |
| Who calls whom, in what order, and what comes back? | sequence | flowchart (loses time and the reply) |
| What are the parts of the system and how do they connect? | C4 or architecture-beta, or flowchart LR with subgraphs | class (code-level), sequence (one flow only) |
| What data exists and how is it related? | ER | class (unless it is the code model) |
| What states can this thing be in, and what moves it? | state | flowchart (hides that it is one thing) |
| How is the code structured (types, inheritance, composition)? | class | ER (no behaviour) |
| When does what happen, and what depends on what? | gantt | timeline (no durations or dependencies) |
| What happened when, at a coarse level? | timeline | gantt (implies a plan) |
| What are the parts of this topic? | mindmap, or a nested Markdown list | flowchart (implies flow) |
| How do quantities split or flow? | sankey, pie (few parts), xychart | flowchart with numbers on edges |
| What are the fields of a record or message? | Markdown table, or packet for bit layouts | ER with one entity |
| What is in this folder? | Markdown code block tree, or treeView-beta | flowchart |
| What changed between A and B? | Markdown table with before and after | two diagrams the reader must compare |

Types other than the core set are in `types/other.md`, each with its own "use when".

## Rules

### DI-CH-01 [Required] [Hard Gate] One question, one zoom level

- Do: Write the question in one line before drawing. Keep every element at the same zoom level:
  systems with systems, containers with containers, classes with classes.
- Do not: Put a database table, a Kubernetes cluster, and a user role on the same diagram, or answer
  "what runs" and "what happens on checkout" in one picture.
- Why: A mixed-level diagram has no reading order; the reader cannot tell what a box means.
- Check: every node fits one noun ("a service", "a table", "a step"). A node that needs another noun is a different level.

### DI-CH-02 [Required] The type fits the question

- Do: Choose from the table above, and say in the Delivery Gate (FORM) why.
- Do not: Use a flowchart for everything.
- Why: Each type carries meaning the reader already knows: a sequence reads in time, a state diagram
  says one thing changes, an ER line means a foreign key.
- Check: FORM names the question and the type.

### DI-CH-03 [Preferred] Markdown when there is no structure to see

- Do: Use a table when every item has the same attributes and the reader compares them; a numbered
  list for a strict sequence with no branches; a code-block tree for a hierarchy of paths.
- Do not: Draw a straight line of six boxes, or an ER diagram of one entity to show its columns.
- Why: A diagram earns its place when position and lines carry meaning: branches, cycles, many-to-many
  links, parallel paths. Without those, text is faster to read, search, diff, and translate.
- Check: the diagram has at least one branch, join, cycle, group, or cross-link; otherwise it is Markdown.

### DI-CH-04 [Contextual] A beta or new type needs a target that supports it

- When: the type keyword ends in `-beta`, or the type is new in Mermaid 12 (usecase, swimlane,
  agentflow, eventmodeling, cynefin, railroad, treeView, wardley, venn, ishikawa).
- Do: Use it only when the target renderer is known to run a version that has it, and say so.
  Otherwise use a core type (flowchart with subgraphs stands in for most of them).
- Do not: Put a beta type in a GitHub README without checking the target first.
- Why: Each platform bundles its own Mermaid version; a type it does not know shows as an error box.
- Check: TARGET in the Delivery Gate.
