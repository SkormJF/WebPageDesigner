# TASKS — [PROJECT_NAME]

<!-- SLOT: Owns implementation decomposition, build grouping, gate selection, risk and durable task status. `.workflow/` holds only the
     group in flight; git holds code history. Remove every SLOT before Spec Gate. -->

## How to read this

- IDs are stable: `TASK-001`, `TASK-002`, … Never reused.
- Every task links to at least one `REQ-xxx`; every MUST is covered or explicitly out of scope in `requirements.md`.
- **Task != agent cycle.** Tasks are traceability/acceptance units. Related tasks execute together in build groups.
- Risk is `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`; it controls how much independent review the group earns.
- Status is durable: `PENDING` → `ACTIVE` → `DONE`, written only by the Orchestrator. `DONE` means its build group was
  approved and committed.
- A routine LOW task does not deserve its own group. One-task groups require a real dependency boundary or HIGH/CRITICAL
  risk.

## Dependency order

<!-- SLOT: Executable task order. If the graph has no valid order, the decomposition is wrong. -->

```
[TBD]
```

## Build groups

<!-- SLOT: Meaningful context-sharing batches. Keep groups compact in count; split only for a real dependency, context,
     capability or review boundary. `Clear after = YES` is optional and may appear at most once inside BUILD_TASKS, only
     at a genuine context-domain boundary. Fixed harness checkpoints already exist after FOUNDATION, BUILD_TASKS and INTEGRATION, plus HUMAN_PREVIEW approval and QUALITY_GATE PASS. -->

| Group | Phase | Purpose | Gate | Clear after |
|---|---|---|---|---|
| FOUNDATION | FOUNDATION | [TBD] | AUTO | NO |
| BUILD-01 | BUILD_TASKS | [TBD] | REVIEW | NO |
| INTEGRATION | INTEGRATION | [TBD] | REVIEW | NO |

---

## Foundation

<!-- SLOT: Verified dependencies, approved tokens, stack baseline, backend connection where required, testing foundation
     and first shared primitives. Include a task whose acceptance states: the document `lang` must carry PROJECT.md's `Language tag`. -->

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | [TBD] | REQ-xxx | — | FOUNDATION | LOW | [TBD] | PENDING |

## Features

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-0xx | [TBD] | REQ-xxx | TASK-00x | BUILD-01 | MEDIUM | [TBD] | PENDING |

## Integration

<!-- SLOT: Cross-feature behaviour, routes, shared state and backend boundaries. Verification, not a second design pass. -->

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-1xx | [TBD] | REQ-xxx | [TBD] | INTEGRATION | MEDIUM | [TBD] | PENDING |

## Product-specific work

<!-- SLOT: Optional — migrations, imports, seed work or other non-feature construction. Delete if unused. -->

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-1xx | [TBD] | REQ-xxx | [TBD] | [TBD] | HIGH | [TBD] | PENDING |

---

## Review policy

The **build group declares its gate**; risk tells that gate how much evidence matters, while the gate names the capability:

- `AUTO` → no Reviewer; valid only when every task in the group is `LOW`. Builder final-state checks are the gate.
- `REVIEW` → generic Reviewer without direct file-edit tools for MEDIUM/HIGH work and CRITICAL work that is not a database-specific surface.
- `DB_REVIEW` → `db-reviewer` with project-scoped read-only Supabase MCP. Use it for CRITICAL
  Supabase/schema/RLS/data-integrity groups; mutation tests stay with Builder. A DB_REVIEW group must not also contain
  unrelated MEDIUM/HIGH non-DB work — split that work so one gate can competently review the full group.
- One correction round maximum: findings → targeted Builder correction → targeted re-review. No third automatic pass.

`Gate` is explicit instead of inferred from a risk label so the Orchestrator can capability-check **before** dispatch rather
than discovering mid-review that the selected agent lacks the tool the gate requires.

## What does NOT get a task

`VISUAL_QA`, `E2E` and `QUALITY_GATE` are lifecycle phases for whole-product verification, so there is no `TASK-9xx` quality block. A task carries local acceptance; global accessibility/performance/security belongs to the gate.

## Acceptance criteria

A criterion says what someone else can check without asking the implementer what they meant. If it cannot fail, it is not
a criterion.

```
Good   Signing in with an unapproved account shows the pending screen and no dashboard route is reachable by direct URL.
Bad    Auth works correctly.
```
