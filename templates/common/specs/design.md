# DESIGN — [PROJECT_NAME]

<!-- SLOT: Owns the technical HOW — architecture, routes, data, boundaries, security. Not WHAT
     (requirements.md), not visuals (design-system.md); requirements are referenced by ID.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## Architecture

<!-- SLOT: The shape of the system in a few sentences, plus a diagram if it earns one. Feature/domain
     first, reuse-first, no abstraction not yet paying for itself. The Factory already fixes Next.js; do not restate
     the framework here. Record only a material implementation deviation from that baseline, with its reason. -->

[TBD]

- **Baseline deviations:** [TBD, or "none"]

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

<!-- SLOT: Access level is load-bearing. The Stack Profile owns the request-boundary filename/export; design owns which
     routes require that boundary. Include `/` explicitly, even when it redirects. -->

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

<!-- SLOT: The Factory supports exactly two application backend modes. Choose from product need, not preference:
     `none` for a site/app with no project-owned persistent data/auth backend; `supabase` when the product owns persistent
     data, authentication, storage, realtime or database-enforced authorization. External APIs remain Integrations.
     With `none`, delete the backend-only subsections below. -->

**Mode:** [TBD: none | supabase]
**Authentication:** [TBD: none | supabase]

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

<!-- SLOT: Authentication is `supabase` only when this product uses Supabase Auth. In this harness every Supabase login
     is intentionally **without email confirmation**. Because Confirm Email is a human-owned dashboard setting, include an
     HPA before FOUNDATION that disables Confirm Email; do not ask Builder to discover or mutate it. -->

| Role | May see | May do | May not |
|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] |

### Row-level security

<!-- SLOT: Provider-conditional. Every table has RLS enabled and an explicit policy — RLS on with no policy
     is broken, RLS off is open. For Supabase per-user predicates, record the optimized `(select auth.uid())`
     form when it is semantically equivalent so the approved spec already matches the policy that should be deployed.
     An elevated-privilege function taking an id authorizes the caller first; these are published as callable endpoints. -->

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

## Human platform actions

<!-- SLOT: Human-only external actions current tools must not perform: HPA-nnn + blocked phase + completion proof.
     Use `— | None | — | —` when absent. No secrets. -->

| ID | Human-only action | Before phase | Completion proof |
|---|---|---|---|
| [TBD: HPA-001 or —] | [TBD: action or None] | [TBD: FOUNDATION / PRODUCT_BUILD / —] | [TBD: confirmation/observable proof] |

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

     Supabase used only as a database, Supabase Auth without an SSR session architecture, or a project that chooses
     a different Next-compatible session flow all fall in the ELSE branch. Write the architectural responsibility — where the session
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
