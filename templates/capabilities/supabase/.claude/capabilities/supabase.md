# Supabase capability contract
Load only when `design.md` declares `Backend Mode: supabase`. The project has one shared Supabase MCP. Builder may use it
for authorized implementation; the generic Reviewer reuses it read-only during `FOUNDATION_REVIEW`. Never create a second
connection or reviewer-specific credential.

## Scope and restart

Before remote work, authorize and select this project's database, obtain `project_ref`, rewrite the Supabase MCP URL to
include `?project_ref=<PROJECT_REF>`, persist:

```json
{ "pending_action": { "type": "RESTART_FOR_SUPABASE_MCP_SCOPE", "project_ref": "abc123" } }
```

Then print the required restart message and stop. After restart, compare the persisted ref with `.mcp.json` and make one
read-only identity call that proves the selected project. Connectivity alone is not identity. Clear the action only after
proof.

## Builder mutation contract

- Version local SQL migration before applying the same migration remotely.
- Every exposed table has explicit RLS; authorization is never UI-only.
- Use `(select auth.uid())` for statement-stable per-user predicates when semantically equivalent.
- Record `external_operation` before every consequential remote mutation; observe result, then clear it.
- Never auto-retry an interrupted mutation or bypass permissions.
- Scratch users/rows are newly created, recorded, tested, deleted and verified absent. Never modify existing identities.
- Cleanup failure stops for the human; never weaken constraints, RLS or triggers to make a test pass.
- Human-only project/Auth/SMTP/provider settings remain `HPA-nnn`; Builder does not mutate them.

## Reviewer contract

Reviewer receives this guide during `FOUNDATION_REVIEW`. It may inspect local migrations, live catalogs, policies,
functions and advisors using non-mutating reads over the same scoped MCP. It does not apply migrations, create fixtures,
change settings or reproduce mutation tests. If a critical claim cannot be independently observed, return
`REVIEW_CONFLICT` rather than inventing another path.
