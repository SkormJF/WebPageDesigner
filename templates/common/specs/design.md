# DESIGN — [PROJECT_NAME]

<!-- SLOT: This file owns the technical HOW. Architecture, routes, data, boundaries, security.
     It does not restate WHAT (requirements.md) and it does not own visual decisions
     (design-system.md). Where it references a requirement, it references the ID.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## Stack profile

- **Profile:** [TBD]
- **Deviations from the profile:** [TBD, or "none"]

<!-- SLOT: A deviation is allowed, but it is never silent. State what differs, and why the profile's
     default did not work here. "Preference" is not a reason -- the profile exists precisely so that
     preference does not re-litigate a validated foundation on every project. -->

## Architecture

<!-- SLOT: The shape of the system in a few sentences plus a diagram if it earns one. Feature/domain
     first, pragmatic boundaries, conceptual Atomic Design, reuse-first, no abstraction that is not
     paying for itself yet. -->

[TBD]

### Boundary rules

These hold for this project. Violations are review findings, not style opinions:

- `app/` and pages may compose features.
- Features may use shared components, `lib/` and services.
- `components/ui` must not depend on product features.
- Shared components must not hide feature-specific business logic.
- Services must not depend on UI.
- `lib/` must not depend on features or `app/`.
- Features do not reach into each other's internals.

## Routes

<!-- SLOT: Every route, its access level, and what it is for. Access level is load-bearing: it is
     what the middleware/proxy and the Quality Gate check against. -->

| Route | Access | Purpose | Requirements |
|---|---|---|---|
| [TBD] | public / authenticated / role:[TBD] | [TBD] | REQ-xxx |

## Modules and features

<!-- SLOT: One entry per feature directory. What it owns, what it exposes, what it depends on. -->

| Feature | Owns | Depends on |
|---|---|---|
| [TBD] | [TBD] | [TBD] |

## Component inventory

<!-- SLOT: Shared components that will exist, named now. Anything that will clearly repeat three or
     more times gets named here rather than being noticed after the third copy has already drifted.
     Visual rules for these live in design-system.md; this is the structural inventory. -->

| Component | Anatomy / props | Used by |
|---|---|---|
| [TBD] | [TBD] | [TBD] |

---

## Backend

<!-- SLOT: If the product has no backend, write "None -- static/content product" and delete the
     remaining backend subsections. Do not leave empty scaffolding: an empty RLS table in a spec
     reads like an unfinished decision rather than an absent one. -->

**Provider:** [TBD, or "none"]

### Data model

| Entity | Fields | Relationships | Requirements |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | REQ-xxx |

### States

<!-- SLOT: For each entity that moves through states, the states and the legal transitions.
     The illegal transitions are requirements too -- they belong in requirements.md's
     "must NOT be possible" table, and the enforcement point goes below. -->

| Entity | States | Legal transitions | Who may trigger |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Derived values

<!-- SLOT: Balances, totals, counts, anything computed from other rows. State the mechanism, not
     just the result -- a database function/trigger or a server-side recomputation on write, never
     a client-side calculation the user can bypass.
     Two failure modes worth naming here because reading the SQL will not reveal either:
     an aggregate over a table joined to its children counts the parent once per child, and the
     wrong number lands close enough to the right one to pass a glance. Verify against
     hand-computed scratch rows, then delete the scratch rows. -->

| Value | Computed from | Mechanism | Recomputed when |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Auth and roles

| Role | May see | May do | May not |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Row-level security

<!-- SLOT: Provider-conditional. Where the provider supports RLS, every table has it enabled and
     every table has an explicit policy -- a table with RLS on and no policy is not "locked down",
     it is broken, and a table with RLS off is open.
     Any function that runs with elevated privileges and takes an id authorizes the caller as its
     first statement: confirm the id belongs to the caller, or that the caller holds the role.
     Elevated-privilege functions are published as callable endpoints, so "it is only called from
     our own code" is not true. -->

| Table | RLS | Policy | Enforces |
|---|---|---|---|
| [TBD] | enabled | [TBD] | REQ-9xx |

### Enforcement points

<!-- SLOT: One row for every "must NOT be possible" requirement. This is the table that turns an
     intention into something a reviewer can check. Hidden UI is never an enforcement point. -->

| Requirement | Enforced at | How |
|---|---|---|
| REQ-9xx | [TBD] | [TBD] |

---

## Integrations

| Service | Used for | Auth method | Failure behaviour |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

## Environment variables

<!-- SLOT: Names and purposes only. Never a value, never a secret, not even a truncated one, not
     even in a comment. A value written here is committed, and a committed secret is a leaked
     secret regardless of what happens to the file afterwards. -->

| Name | Purpose | Where it is used | Public? |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | no |

## Security

<!-- SLOT: The decisions, not a checklist recital. Where secrets live and where they must never
     reach. Which code runs server-only. What is validated on the server regardless of what the
     client already validated. How sessions are checked, and on every request rather than once. -->

[TBD]

## Data flow

<!-- SLOT: For the flows that matter, how data moves: what the client sends, what the server
     trusts, what it re-derives, what it writes, what comes back. Written for whoever has to debug
     it at speed, not as documentation for its own sake. -->

[TBD]

## SEO and indexability

<!-- SLOT: Determined by product intent, not applied by reflex. A public marketing product needs
     indexability, metadata, canonical URLs, sitemap and structured data. A private application
     appropriately gets noindex and minimal metadata, and that is a decision to record here, not a
     gap for a later audit to "fix". -->

- **Intent:** [TBD — public/organic | private/app | mixed]
- **Consequences:** [TBD]
