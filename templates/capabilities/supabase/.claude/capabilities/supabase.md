# Supabase capability contract

Load this file only when `design.md` declares `Backend Mode: supabase`, before any Supabase remote work. The generated
project contains one shared Supabase MCP plus `db-reviewer`; this file owns scoping, restart and recovery rules.

## Foundation scope

Before schema work: authorize → create/select THIS project's database → obtain `project_ref` → rewrite `.mcp.json` to
`https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>` → commit → persist the restart action → print
`RESTART REQUIRED — Supabase MCP scope changed. Reinicia Claude Code y luego escribe continúa.` → **STOP**.
This is an operational restart, **not** a `/clear` context checkpoint. Never probe another project to test isolation.

```json
{ "pending_action": { "type": "RESTART_FOR_SUPABASE_MCP_SCOPE", "project_ref": "abc123" } }
```

`project_ref` is mandatory in that record. On recovery compare the persisted expectation with the single project MCP on disk
before any Supabase work:

```text
expected_ref = pending_action.project_ref
disk_ref = project_ref parsed from .mcp.json
expected_ref != disk_ref → stay blocked
```

After restart, read state and `.mcp.json` from disk, then make one read-only Supabase call that must **prove identity, not
connectivity**. Only `PASS → pending_action = null`; it is never cleared on the way in. A 200 proves a server answered, not
which project answered. Do not emit a normal `/clear` checkpoint while this pending action exists.

The scoped `supabase` connection is then reused by the Orchestrator, SUPABASE Builder groups and DB Reviewer. Agents never
create a second Supabase MCP or select a different project independently.

## Builder mutation rules

When a Builder is assigned Supabase work, this composed capability adds `mcp__supabase` to that Builder's tool allowlist.
The MCP is for implementation, not browsing: verify the exact project-scoped call, never probe another project, and never
route around a permission denial with a CLI or credential trick.

Migrations are code: create a versioned local SQL migration first and apply that same migration through the authorized
MCP. The remote database is deployed state, never the only source copy. For ordinary per-user RLS predicates whose auth
identity is statement-stable, use the Supabase/Postgres init-plan form `(select auth.uid())` rather than a bare `auth.uid()`
when it preserves the approved predicate; keep the same optimized form in `design.md` so spec and deployed policy cannot
drift. Scratch rows/users are allowed only when acceptance genuinely needs them and they can be cleaned safely. Use only newly
created disposable identities/data; record what was created, test, delete/cleanup it, then verify absence/no residue. Never
modify an existing account to manufacture a test. If cleanup cannot be completed or proven, STOP for the human instead of
trying another credential path or weakening constraints/RLS/triggers. Never drop constraints, disable RLS, remove triggers
or weaken a production invariant merely to make a test easier. A blocked optional check gets at most one reasonable alternative.

## Database source and review

`DB_REVIEW` uses the dedicated `db-reviewer` over the **same project-scoped `supabase` MCP**. Separation is by role and tool
contract, not by a second connection: the Reviewer has no file-write/shell tools, performs only non-mutating Supabase reads,
and never applies migrations or changes remote state. Mutation-based verification stays with Builder; the Reviewer inspects
versioned SQL plus the resulting live catalog/policies/advisors. If a critical claim cannot be independently observed without
mutation, return `REVIEW_CONFLICT` rather than creating another path.

Supabase Auth/project settings, SMTP/email-confirmation settings, Storage configuration and other remote control-plane
configuration must be planned outside DB_REVIEW. If `design.md` marks the action `HPA-nnn`, the Orchestrator pauses for the
human and Builder must never attempt the setting; subsequent REVIEW/application behaviour may verify the result. Automatable
control-plane work that is not HPA stays outside DB_REVIEW and must have an observable acceptance path.
