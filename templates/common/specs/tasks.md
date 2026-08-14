# TASKS — [PROJECT_NAME]

<!-- SLOT: Owns the implementation decomposition and the durable status of every task. .workflow/ holds the
     current operational moment, git holds the code history, this file holds what is done.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## How to read this

- **IDs are stable and permanent.** `TASK-001`, `TASK-002`, … Never reused.
- **Every task links to a requirement**, and **every MUST is covered by a task** or listed in `requirements.md` as
  out of scope. Either gap fails the Spec Gate.
- **Status is durable:** `PENDING` → `ACTIVE` → `DONE`, written only by the Orchestrator. A task's finer stages in
  flight (`IMPLEMENTING`, `READY_FOR_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`) live in `.workflow/state.json`.
- **`DONE` means reviewed and committed**, not "implemented".
- **Git owns history.** The `Status` column is the whole record; there is no progress log.

## Dependency order

<!-- SLOT: The order tasks can actually be executed in; the Spec Reviewer checks exactly this. If the graph
     has no valid order, the decomposition is wrong, not the notation. -->

```
[TBD]
```

---

## Foundation

<!-- SLOT: What must exist before feature tasks start: verified dependencies, design tokens, stack baseline,
     backend connection where required, testing foundation, first shared primitives. Inside approved specs
     — foundation is not a licence to design ahead.
     One of these is concrete and easy to leave at its template default: the document `lang` must carry
     PROJECT.md's `Language tag`. The smoke spec compares the two, so give it a task with that acceptance. -->

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-001 | [TBD] | REQ-xxx | — | [TBD] | PENDING |

## Features

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-0xx | [TBD] | REQ-xxx | TASK-00x | [TBD] | PENDING |

## Integration

<!-- SLOT: Cross-feature behaviour, routes, shared state, backend boundaries. Verification, not a second
     design pass. -->

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-1xx | [TBD] | REQ-xxx | [TBD] | [TBD] | PENDING |

## Product-specific work

<!-- SLOT: Anything else this product needs that is not a feature in the ordinary sense — a data import, a
     seeded catalogue, a migration. Optional: delete the section rather than inventing rows. -->

| ID | Task | Requirements | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| TASK-1xx | [TBD] | REQ-xxx | [TBD] | [TBD] | PENDING |

---

## What does NOT get a task

Tasks build the product. `VISUAL_QA`, `E2E` and `QUALITY_GATE` are lifecycle phases already carrying accessibility,
responsive, copy, SEO, security, token and performance verification for the whole product, so there is **no
`TASK-9xx` quality block** — a duplicated gate is one that can be marked `DONE` while the real one never ran.

A task carries **local** acceptance criteria instead: "keyboard reaches every control in this form and the error is
announced" is a local criterion; "the product is accessible" is a gate.

## Acceptance criteria

A criterion states what someone else can check without asking the implementer what they meant. If it cannot fail,
it is not a criterion.

```
Good   Signing in with an unapproved account shows the pending screen and no dashboard route
       is reachable, verified by direct URL entry.
Bad    Auth works correctly.
```
