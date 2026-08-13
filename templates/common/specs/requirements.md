# REQUIREMENTS — [PROJECT_NAME]

<!-- SLOT: This file owns WHAT the product must do. Never how. A requirement that names a library,
     a component or a file path has leaked into design.md's territory.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## How to read this

Each requirement has a stable ID (`REQ-001`, `REQ-002`, …). **IDs are permanent.** When a requirement is
dropped, it is marked `WITHDRAWN` and its ID is never reused — `tasks.md`, commit messages and review notes
point at these numbers, and a recycled ID silently reassigns that history.

EARS-style wording is used where it clarifies and skipped where it would be ceremony:

```
Ubiquitous     The system shall <response>
Event-driven   When <trigger>, the system shall <response>
State-driven   While <state>, the system shall <response>
Conditional    If <condition>, then the system shall <response>
Optional       Where <feature is included>, the system shall <response>
```

## Functional requirements

<!-- SLOT: One table row per requirement. Keep each one testable -- if you cannot describe what
     "not met" looks like, it is a goal, not a requirement. -->

| ID | Requirement | Priority | Source |
|---|---|---|---|
| REQ-001 | [TBD] | MUST | [TBD — where in discovery.md this came from] |

<!-- Priority: MUST / SHOULD / COULD. A MUST that no task covers fails the Spec Gate. -->

## Non-functional requirements

<!-- SLOT: Performance, accessibility, security, privacy, availability, compatibility.
     These get IDs too, and they get tasks too. A non-functional requirement with no task is the
     single most common way accessibility and security quietly leave a project. -->

| ID | Requirement | Priority | Source |
|---|---|---|---|
| REQ-1xx | [TBD] | MUST | [TBD] |

## Constraints on requirements

<!-- SLOT: Factual and legal limits on what the product may claim or do. Anything the human stated
     as a hard boundary -- claims that cannot be made, data that cannot be collected, wording that
     is legally required. These bind the copy and the behaviour, and no later pass gets to soften
     them for style. -->

- [TBD]

## What must NOT be possible

<!-- SLOT: From Discovery Round 3, and worth its own section because it is the half that gets
     skipped. Access another user's data. Reach an admin action without the role. Move a record
     into a state it should not reach from where it is. Each of these needs an enforcement point
     named in design.md -- hiding the UI is not one. -->

| ID | Must not be possible | Enforcement point (design.md) |
|---|---|---|
| REQ-9xx | [TBD] | [TBD] |

## Withdrawn

<!-- SLOT: IDs retired during planning, with one line on why. Keeps the numbering honest and stops
     a withdrawn requirement from being re-added by someone who only sees a gap in the sequence. -->

| ID | Was | Why withdrawn |
|---|---|---|
| — | — | — |
