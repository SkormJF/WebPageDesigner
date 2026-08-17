# REQUIREMENTS — [PROJECT_NAME]

<!-- SLOT: Owns WHAT the product must do, never how. A requirement naming a library, a component or a file
     path has leaked into design.md's territory.
     Every product requirement cites one or more stable `DISC-nnn` decisions from `discovery.md` in Source.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## How to read this

**IDs are permanent.** A dropped requirement is marked `WITHDRAWN` and its ID is never reused. EARS wording is used
where it clarifies and skipped where it would be ceremony:

```
Ubiquitous  The system shall <response>          Conditional  If <condition>, then the system shall …
Event       When <trigger>, the system shall …   Optional     Where <feature is included>, the system shall …
State       While <state>, the system shall …
```

## Functional requirements

<!-- SLOT: One row per requirement, each testable — if you cannot describe what "not met" looks like, it is
     a goal. A MUST that no task covers fails the Spec Gate. -->

| ID | Requirement | Priority | Source |
|---|---|---|---|
| REQ-001 | [TBD] | MUST | [TBD — where in discovery.md this came from] |

## Non-functional requirements

<!-- SLOT: Only where THIS product carries a constraint of its own: usable on 2G, a legal retention period, a
     reading-comfort decision, a browser that must be supported.
     Harness work is not a requirement — axe, Lighthouse, E2E, SEO, security review, Visual QA, the Quality
     Gate and humanizalo run in the generated project's lifecycle whether or not a REQ names them. The test:
     could this project be built correctly and still miss this? If a gate covers it, it is not one. -->

| ID | Requirement | Priority | Source |
|---|---|---|---|
| REQ-1xx | [TBD] | MUST | [TBD] |

## Constraints on requirements

<!-- SLOT: Factual and legal limits on what the product may claim or do. No later pass softens these for
     style. -->

- [TBD]

## What must NOT be possible

<!-- SLOT: From Discovery Round 3, and its own section because it is the half that gets skipped. Each needs
     an enforcement point in design.md — hiding the UI is not one. -->

| ID | Must not be possible | Source | Enforcement point (design.md) |
|---|---|---|---|
| REQ-9xx | [TBD] | DISC-xxx | [TBD] |

## Withdrawn

<!-- SLOT: IDs retired during planning, one line on why, so a gap in the sequence is not refilled. -->

| ID | Was | Why withdrawn |
|---|---|---|
| — | — | — |
