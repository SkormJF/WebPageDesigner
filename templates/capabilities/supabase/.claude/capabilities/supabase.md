# Supabase capability contract

Load this file only when `design.md` declares `Backend Mode: supabase`, before any Supabase remote work. The generated
project already contains the Supabase MCP and `db-reviewer`; this file owns their scoping, restart and recovery rules.

## Foundation scope

Before schema work: authorize → create/select THIS project's database → obtain `project_ref` → rewrite `.mcp.json` to
`https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>` → rewrite the inline `supabase_review` URL in
`.claude/agents/db-reviewer.md` from `__UNSCOPED_UNTIL_FOUNDATION__` to the same ref → commit → persist the restart
action → tell the human to restart → **STOP**. Never probe another project to test isolation.

```json
{ "pending_action": { "type": "RESTART_FOR_SUPABASE_MCP_SCOPE", "project_ref": "abc123" } }
```

`project_ref` is mandatory in that record. On recovery compare all three values before any Supabase work:

```text
expected_ref = pending_action.project_ref
disk_ref = project_ref parsed from .mcp.json
reviewer_ref = project_ref parsed from .claude/agents/db-reviewer.md supabase_review URL
expected_ref != disk_ref OR expected_ref != reviewer_ref → stay blocked
```

Then make one read-only call that must **prove identity, not connectivity**. Only `PASS → pending_action = null`; it is
never cleared on the way in. A 200 proves a server answered, not which project answered.

## Builder mutation rules

When a Builder is assigned Supabase work, this composed capability adds `mcp__supabase` to that Builder's tool allowlist.
The writable MCP is for implementation, not browsing: verify the exact project-scoped call, never probe another project,
and never route around a permission denial with a CLI or credential trick.

Migrations are code: create a versioned local SQL migration first and apply that same migration through the authorized
MCP. The remote database is deployed state, never the only source copy. For ordinary per-user RLS predicates whose auth
identity is statement-stable, use the Supabase/Postgres init-plan form `(select auth.uid())` rather than a bare `auth.uid()`
when it preserves the approved predicate; keep the same optimized form in `design.md` so spec and deployed policy cannot
drift. Scratch rows/users are allowed only when acceptance genuinely needs them and they can be cleaned safely. Never drop
constraints, disable RLS, remove triggers or weaken a production invariant merely to make a test easier. A blocked optional
check gets at most one reasonable alternative.

## Database source and review

`DB_REVIEW` uses the dedicated `db-reviewer`, whose own MCP is project-scoped and `read_only=true`; mutation-based
verification stays with Builder.
