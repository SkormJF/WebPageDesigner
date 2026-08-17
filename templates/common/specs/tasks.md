# TASKS — [PROJECT_NAME]

<!-- SLOT: Owns only implementation decomposition, dependencies, risk, acceptance and durable status.
     Lifecycle, reviewers and checkpoints belong to the generated harness, not to this file.
     Remove every SLOT before the Spec Gate. -->

## How to read this

- IDs are stable and never reused: `TASK-001`, `TASK-002`, …
- Every task links to at least one `REQ-xxx`; every MUST is covered.
- A task is an observable outcome, not a file, component, route, requirement or agent turn.
- The only implementation phases are `FOUNDATION` and `PRODUCT_BUILD`.
- Risk is `LOW`, `MEDIUM`, `HIGH` or `CRITICAL`.
- Status is `PENDING` → `ACTIVE` → `DONE`, written only by the Orchestrator.
- All tasks start `PENDING`; `DONE` means the phase review accepted the final cleaned state.

## Dependency order

<!-- SLOT: Show only real prerequisites. A dependency may stay in its phase or point backward, never forward. -->

```text
[TBD]
```

## Phase ownership

**FOUNDATION** owns the verified stack baseline, design tokens and shared primitives, test baseline, environment contract,
and—when Backend Mode is `supabase`—versioned migrations, Auth/session boundary, RLS and security prerequisites.

**PRODUCT_BUILD** owns the complete integrated product: routes, pages, components, flows, CRUD, business logic, navigation,
loading/empty/error states, responsive behaviour and persistent Playwright specifications for its declared critical paths.
It does not stop for task-by-task reviews. Integration is part of building the product, not a separate phase.

## Implementation tasks

| ID | Task | Requirements | Depends on | Phase | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | [TBD foundation outcome] | REQ-xxx | — | FOUNDATION | [TBD] | [TBD objective evidence] | PENDING |
| TASK-002 | [TBD complete product outcome] | REQ-xxx | TASK-001 | PRODUCT_BUILD | [TBD] | [TBD objective evidence] | PENDING |

## Planning constraints

- Include the document language contract from `PROJECT.md` in Foundation acceptance.
- Do not create tasks for `FOUNDATION_REVIEW`, `BUILD_REVIEW`, `LOCAL_PREVIEW`, `VISUAL_QA`, `HUMAN_PREVIEW`, `E2E`,
  `QUALITY_GATE`, deployment or `/clear`; the harness owns those gates.
- Persistent Playwright specs may be authored by Product Build, but the complete suite runs only in lifecycle phase `E2E`.
- Human-only platform actions are `HPA-nnn` in `design.md`, not tasks.
- Supabase work uses the composed Supabase capability automatically when `design.md` declares `Backend Mode: supabase`.
- Acceptance states the observable finished result, not a test procedure. Keep it concrete (`una edición permitida
  persiste`, `una transición prohibida sigue rechazada`); commands, fixture lifecycle and cleanup belong downstream.
