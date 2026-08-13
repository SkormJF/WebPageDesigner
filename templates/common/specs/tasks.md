# TASKS — [PROJECT_NAME]

<!-- SLOT: This file owns the implementation decomposition and the durable status of every task.
     It is the only place task status lives -- .workflow/ holds the current operational moment,
     git holds the code history, and this file holds what is done.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## How to read this

- **IDs are stable and permanent.** `TASK-001`, `TASK-002`, … Never reused.
- **Every task links to at least one requirement.** A task tracing to nothing is work nobody asked for.
- **Every MUST requirement is covered by at least one task**, or is listed in `requirements.md` as
  explicitly out of scope. An uncovered MUST fails the Spec Gate.
- **Status is durable:** `PENDING` → `ACTIVE` → `DONE`. Only the Orchestrator writes it.
  The finer operational stages of a single task in flight (`IMPLEMENTING`, `READY_FOR_REVIEW`,
  `CHANGES_REQUESTED`, `APPROVED`) live in `.workflow/state.json`, not here — they change several times
  per task and would turn this file into a log.
- **`DONE` means reviewed and committed.** Not "implemented". A task whose code exists but has not passed
  review is `ACTIVE`.

## Dependency order

<!-- SLOT: The order tasks can actually be executed in. A task that needs another's output cannot be
     scheduled before it, and the Spec Reviewer checks exactly this. If the graph has no valid order,
     the decomposition is wrong, not the notation. -->

```
[TBD]
```

---

## Foundation

<!-- SLOT: Work that must exist before feature tasks can start: verified dependencies, design tokens,
     stack baseline, backend connection where required, testing foundation, the first shared
     primitives. Kept inside approved specs -- foundation is not a licence to design ahead. -->

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-001 | [TBD] | REQ-xxx | — | [TBD] | PENDING |

## Features

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-0xx | [TBD] | REQ-xxx | TASK-00x | [TBD] | PENDING |

## Integration

<!-- SLOT: Cross-feature behaviour, routes, shared state, backend boundaries, product coherence.
     Verification work, not a second design pass. -->

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-1xx | [TBD] | REQ-xxx | [TBD] | [TBD] | PENDING |

## Quality

<!-- SLOT: The non-functional requirements get tasks here -- accessibility, performance, security,
     SEO where it applies. They are listed as work because a non-functional requirement with no task
     is how accessibility and security quietly leave a project between planning and delivery. -->

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-9xx | [TBD] | REQ-1xx | [TBD] | [TBD] | PENDING |

---

## Acceptance criteria — how to write one

An acceptance criterion states what someone else can check, without asking the implementer what they meant.

```
Good   Signing in with an unapproved account shows the pending screen and no dashboard route
       is reachable, verified by direct URL entry.
Bad    Auth works correctly.
```

If a criterion cannot fail, it is not a criterion. If checking it requires knowing what the implementer
intended, it is not written yet.

## Progress log

<!-- SLOT: One line per completed task: ID, one sentence on what changed, and the commit hash.
     Never the full narrative -- that belongs in the commit message, and anyone who needs it is one
     `git show` away. This terseness is what keeps the file readable in full after a hundred tasks. -->

| Task | What changed | Commit |
|---|---|---|
| — | — | — |
