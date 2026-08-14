# DESIGN — [PROJECT_NAME]

<!-- SLOT: Owns the technical HOW — architecture, routes, data, boundaries, security. Not WHAT
     (requirements.md), not visuals (design-system.md); requirements are referenced by ID.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## Stack profile

- **Profile:** [TBD]
- **Deviations from the profile:** [TBD, or "none"]

<!-- SLOT: A deviation is allowed but never silent: what differs and why. "Preference" is not a reason. -->

## Architecture

<!-- SLOT: The shape of the system in a few sentences, plus a diagram if it earns one. Feature/domain
     first, reuse-first, no abstraction not yet paying for itself. -->

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

<!-- SLOT: Access level is load-bearing — the middleware and the Quality Gate check against it. -->

| Route | Access | Purpose | Requirements |
|---|---|---|---|
| [TBD] | public / authenticated / role:[TBD] | [TBD] | REQ-xxx |

## Modules and features

| Feature | Owns | Depends on |
|---|---|---|
| [TBD] | [TBD] | [TBD] |

## Component inventory

<!-- SLOT: Named now rather than noticed after the third copy has drifted. Structural only; visual rules
     live in design-system.md. -->

| Component | Anatomy / props | Used by |
|---|---|---|
| [TBD] | [TBD] | [TBD] |

---

## Backend

<!-- SLOT: With no backend, write "None — static/content product" and delete the subsections below. -->

**Provider:** [TBD, or "none"]

### Data model

| Entity | Fields | Relationships | Requirements |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | REQ-xxx |

### States

<!-- SLOT: The legal transitions. Illegal ones belong in requirements.md's "must NOT be possible" table,
     enforced below. -->

| Entity | States | Legal transitions | Who may trigger |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Derived values

<!-- SLOT: State the mechanism, not the result: a database function or server-side recomputation on write,
     never a client-side calculation the user can bypass. An aggregate over a table joined to its children
     counts the parent once per child — verify against hand-computed rows. -->

| Value | Computed from | Mechanism | Recomputed when |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Auth and roles

| Role | May see | May do | May not |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Row-level security

<!-- SLOT: Provider-conditional. Every table has RLS enabled and an explicit policy — RLS on with no policy
     is broken, RLS off is open. An elevated-privilege function taking an id authorizes the caller first;
     these are published as callable endpoints. -->

| Table | RLS | Policy | Enforces |
|---|---|---|---|
| [TBD] | enabled | [TBD] | REQ-9xx |

### Enforcement points

<!-- SLOT: One row per "must NOT be possible" requirement. Hidden UI is never an enforcement point. -->

| Requirement | Enforced at | How |
|---|---|---|
| REQ-9xx | [TBD] | [TBD] |

---

## Integrations

<!-- SLOT: Auth method names the credential this project presents, not the session mechanism — that has
     one owner, `## Security`, and a second divergent version is how a wrong rule spreads. -->

| Service | Used for | Auth method | Failure behaviour |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

## Environment variables

<!-- SLOT: Names and purposes only. Never a value, not even truncated, not even in a comment. -->

| Name | Purpose | Where it is used | Public? |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | no |

## Security

<!-- SLOT: The decisions, not a checklist recital: where secrets live and must never reach, what runs
     server-only, what the server revalidates, how sessions are checked on every request.

     Session handling states the mechanism the approved architecture actually supports, not the one that
     sounds strongest. Choosing Supabase does not by itself choose a session mechanism — `## Architecture`
     does:

       IF the approved architecture uses @supabase/ssr
         - Session tokens are managed through the supported @supabase/ssr cookie pattern.
         - Do not store auth tokens in localStorage.
         - Do not impose HttpOnly as a blanket rule.
         - Document the browser/server session flow that architecture requires.
       ELSE
         - Do not inject an @supabase/ssr cookie contract.
         - Use the auth/session model the approved architecture defines.

     A Vite SPA on Supabase, Supabase used only as a database, and Supabase Auth without an SSR
     architecture all fall in the ELSE branch. Write the architectural responsibility — where the session
     lives, who may read it, what revalidates it on each request — not another library's internals. -->

[TBD]

## Data flow

<!-- SLOT: For the flows that matter: what the client sends, what the server trusts and re-derives, what it
     writes, what comes back. -->

[TBD]

## SEO and indexability

<!-- SLOT: Product intent, not reflex. A private application appropriately gets noindex and minimal metadata
     — recorded here as a decision, not left as a gap for a later audit. -->

- **Intent:** [TBD — public/organic | private/app | mixed]
- **Consequences:** [TBD]
