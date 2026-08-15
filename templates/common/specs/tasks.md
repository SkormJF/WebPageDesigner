# TASKS — [PROJECT_NAME]

<!-- SLOT: Owns implementation decomposition, fixed-phase grouping, capability/gate selection, risk and durable task
     status. `.workflow/` holds only the group in flight; git holds code history. Remove every SLOT before Spec Gate. -->

## How to read this

- IDs are stable: `TASK-001`, `TASK-002`, … Never reused.
- Every task links to at least one `REQ-xxx`; every MUST is covered or explicitly out of scope in `requirements.md`.
- **Task != agent cycle.** A task is an outcome/acceptance unit, not a file, component, route or single requirement.
  One task may satisfy several requirements and touch many files.
- The harness owns exactly three implementation phases: `FOUNDATION`, `BUILD_TASKS`, `INTEGRATION`. Planning may create
  build groups inside them; it never creates lifecycle phases.
- Plan **groups first, tasks second**: start from the smallest meaningful context/capability boundaries, then create only
  the tasks needed for traceability and objective acceptance.
- Risk is `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- Status is durable: `PENDING` → `ACTIVE` → `DONE`, written only by the Orchestrator. At project generation every task
  starts `PENDING`; `DONE` means its build group was approved and committed.
- A routine LOW task does not deserve its own group. Split only for a real dependency, context, capability or review
  boundary. The natural starting point is one group per fixed phase, splitting only when one of those boundaries requires it.

## Dependency order

<!-- SLOT: Executable task order. `Depends on` means a real prerequisite, not merely the order Claude will probably work.
     Dependencies may stay within a phase or point to an earlier phase; never to a later phase. -->

```
[TBD]
```

## Build groups

<!-- SLOT: Meaningful context-sharing batches. Capability is what the Builder needs; Gate is how the completed group is
     independently accepted. `Clear after = YES` is optional and may appear at most once, only in BUILD_TASKS at a genuine
     context-domain boundary. Fixed harness checkpoints already exist after FOUNDATION, BUILD_TASKS and INTEGRATION, plus
     HUMAN_PREVIEW approval and QUALITY_GATE PASS. -->

| Group | Phase | Purpose | Capability | Gate | Clear after |
|---|---|---|---|---|---|
| FOUNDATION | FOUNDATION | [TBD] | BASE | AUTO | NO |
| BUILD-01 | BUILD_TASKS | [TBD] | BASE | REVIEW | NO |
| INTEGRATION | INTEGRATION | [TBD] | BASE | REVIEW | NO |

### Fixed phase ownership

**FOUNDATION** — shared prerequisites only: verified Next baseline, approved tokens/fonts/theme, shared primitives and test
baseline; when Backend Mode is `supabase`, backend bootstrap/versioned prerequisite migrations may live here. Do not put
standalone product flows here.

**BUILD_TASKS** — the product itself: pages, feature flows, CRUD, forms, dashboards, Auth UI and business logic. Related
work stays together so the Builder can reuse context and patterns.

**INTEGRATION** — connect and verify already-built features: navigation, protected-route/session boundaries, loading/
empty/error states, cross-feature behaviour, frontend/backend wiring and regression. It is **not** a second feature-build
phase; a feature missing from BUILD_TASKS is a planning gap, not Integration work.

---

## Foundation

<!-- SLOT: Include a task whose acceptance states: the document `lang` must carry PROJECT.md's `Language tag`. -->

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | [TBD outcome] | REQ-xxx | — | FOUNDATION | LOW | [TBD] | PENDING |

## Features

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-0xx | [TBD outcome] | REQ-xxx | TASK-00x | BUILD-01 | MEDIUM | [TBD] | PENDING |

## Integration

| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-1xx | [TBD integration outcome] | REQ-xxx | [TBD] | INTEGRATION | MEDIUM | [TBD] | PENDING |

---

## Capability and review policy

`Capability` and `Gate` are separate on purpose: capability controls what the Builder may use; gate controls how the final
group is accepted.

- `BASE` → normal project tools only.
- `SUPABASE` → valid only when `design.md` says `Backend Mode: supabase`; the Builder receives the composed Supabase
  capability for that group.
- `AUTO` → no Reviewer; valid only when every task in the group is `LOW`. Builder final cleaned-state checks are the gate.
- `REVIEW` → generic Reviewer for MEDIUM/HIGH work and CRITICAL work that is not a database-specific surface.
- `DB_REVIEW` → only for a `SUPABASE` group containing CRITICAL schema/RLS/authorization/data-integrity work whose final
  state is independently inspectable from versioned SQL plus the DB Reviewer's read-only `database`, `debugging` and `docs`
  tools. Mutation tests remain Builder work.
- Supabase project/Auth settings (email confirmation, SMTP, password/provider/project settings), Storage configuration and
  other control-plane configuration are **not DB_REVIEW surfaces**. Keep them in a `SUPABASE + REVIEW` group and make their
  acceptance observable through code/public application behaviour, or record an explicit human/platform precondition.
- A DB_REVIEW group must not also contain work its Reviewer cannot independently observe; split when one gate cannot
  competently review the full group.
- One correction round maximum: findings → targeted Builder correction → targeted re-review. No third automatic pass.

Before dispatch, the Orchestrator validates both required capability and gate. A missing capability fails fast; agents do
not spend turns discovering substitute CLIs or bypasses.

## What does NOT get a task

`VISUAL_QA`, `E2E`, `QUALITY_GATE`, `DEPLOY` and `POST_DEPLOY` are whole-product lifecycle phases. There is no `TASK-9xx`
quality block and no standalone task whose outcome is "the E2E suite passes". A task carries local acceptance; global
accessibility/performance/security belongs to the later gate. Persistent Playwright specs are authored alongside the
feature/integration behaviour they cover and may be discovered or run narrowly during build; the **full suite executes only
in lifecycle phase E2E**. Never require "break the test once to prove it fails" as acceptance.

## Acceptance criteria

A criterion says what someone else can check without asking the implementer what they meant. If it cannot fail, it is not
a criterion.

```
Good   Signing in with an unapproved account shows the pending screen and no dashboard route is reachable by direct URL.
Bad    Auth works correctly.
```
