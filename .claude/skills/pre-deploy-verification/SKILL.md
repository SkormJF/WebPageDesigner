---
name: pre-deploy-verification
description: Mandatory pass before any production deploy. For Full-Stack Extension projects (auth, database, roles): a real end-to-end flow with disposable test accounts, a security review of RLS/secrets/auth, and an explicit go/no-go verdict. For every project regardless of backend: domain-availability-aware Vercel project naming, deploying, and post-deploy verification that the live URL actually works (not just that the deploy status says "ready"). Use in Phase 6, before deploying, whenever the user asks to deploy or asks "is it safe to deploy."
---

# Pre-Deploy Verification

This codifies what a real pre-deploy pass caught in practice on a Next.js + Supabase + Vercel project: real bugs in three different layers (the app's auth flow, a Vercel routing default, a Vercel security default) that a build-only check (`npm run build`) or a "deployment status: ready" message would never have surfaced.

## Scope

- **Part 1 (E2E) and Part 2 (Security)** apply only when the Full-Stack Extension is active (Supabase auth/database/roles in play). A static marketing site has no login flow or RLS to test — skip straight to Part 3.
- **Part 3 (Domain) and Part 4 (Deploy + verify)** apply to every project.

## Part 1 — End-to-end test with disposable accounts

Don't simulate the approval flow entirely by SQL — it proves the database logic works but not that the actual UI path (the button someone will really click) works. Use SQL only for the one step that has no other way to happen (bootstrapping the very first admin).

1. Set up Playwright **isolated from the project's own dependencies** — don't add it to `site/package.json`. Create a scratch directory, `npm init -y && npm install playwright`, `npx playwright install chromium`, and run scripts from there. This keeps a one-off testing tool out of the shipped app's dependency tree.
2. Create two disposable accounts through the **real signup form**, not by inserting into `auth.users` directly — email pattern `test-e2e-<role>-<timestamp>@example.com` so cleanup can target them with a single `LIKE` query later.
3. Promote exactly one of them to `role='admin', status='approved'` via SQL (`execute_sql`) — this is the one unavoidable manual step, since there's no UI path to create the first admin.
4. Log in as the admin account and approve the other one **by clicking the real button in `/admin`** — this is what actually exercises the approval server action and its RLS policy, not just the database function behind it.
5. Log in as the newly-approved account and run a full CRUD cycle through the real UI for every core entity: create, edit, delete. Also verify: form validation errors render on empty/invalid submit, any role-gated UI (nav links, redirects away from admin-only routes) behaves correctly for a non-admin.
6. **Verify RLS isolation with the real UI**, not just by reading the policy text: log in as the second account and confirm it cannot see the first account's data on the same list pages. This is a stronger check than trusting the policy definition alone.
7. Clean up completely: null out any self-referencing FK columns first (e.g. an `approved_by` column pointing between the two test profiles) to avoid constraint errors, then `DELETE FROM auth.users WHERE email LIKE 'test-e2e-%'` — cascading FKs (`ON DELETE CASCADE` from `profiles` down to owned rows) should remove everything else. Confirm with a `COUNT(*)` query across every affected table that it's back to zero, don't just assume the cascade worked.

**Debugging a failing check:** query the database directly before concluding the app is broken. A Playwright assertion failing after a create/edit/delete action is, in practice, more often a **locator problem** than an app bug — especially `.first()` on a broad selector (e.g. `page.locator("div").filter({ hasText })`) when the list has more than one row, since that can match an outer wrapper spanning multiple rows instead of the specific one. Scope locators to a class combination unique to the row component itself, not a generic tag+text filter. Confirming "the data is actually right in the database" first tells you in seconds whether to keep debugging the script or start debugging the app.

## Part 2 — Security review

1. Run the project's advisors (`get_advisors`, type `security`). **Read the actual SQL/function body behind every "SECURITY DEFINER callable by anon/authenticated" warning before acting on it** — Postgres refuses to invoke a function that `RETURNS trigger` outside of an actual trigger context, so any warning about a trigger function being "callable via RPC" is a guaranteed false positive; revoking `EXECUTE` on it does nothing useful and risks breaking nothing, but revoking a *non*-trigger helper function used inside RLS policies (a common `is_admin()`-style pattern) genuinely can break every policy that depends on it. Check `information_schema.triggers` to confirm which functions are really trigger-only before deciding.
2. Read `pg_policies` for every table and confirm the ownership model matches intent (typically `user_id = auth.uid()` on both `USING` and `WITH CHECK` for user-owned data, plus a separate admin policy gated by a role-check function for cross-user admin access).
3. Grep the codebase for `SERVICE_ROLE`/`service_role` — it should not appear anywhere in `site/src`. Confirm `.env.local` only holds the public `NEXT_PUBLIC_*` keys and is git-ignored.
4. Deliver an explicit verdict — "safe to deploy" or "not safe, fix X first" — don't let a real finding pass silently into a deploy.

## Part 3 — Domain availability, checked before creating the project

Don't let Vercel silently append a random suffix to the project name because the clean `<name>.vercel.app` was already taken by someone else. Check first:

```bash
curl -sS -D - "https://<candidate>.vercel.app/" -o /dev/null
```

Read the `X-Vercel-Error` response header:
- `DEPLOYMENT_NOT_FOUND` → nobody has claimed this subdomain. Free to take.
- Anything else (a `200` with real content, `DEPLOYMENT_DISABLED`, or any other error) → taken by someone.

Propose 2-3 candidates, check each, and create (or `vercel project rename`) the project using the **first available one** before the first production deploy — that's what lets the clean alias get claimed automatically. Renaming an *existing* project does not retroactively claim the clean alias on its own; after renaming, explicitly assign it:

```bash
vercel alias set <latest-deployment-url> <candidate>.vercel.app
```

## Part 4 — Deploy, then verify for real

1. Push every `NEXT_PUBLIC_*` variable from `site/.env.local` to Vercel explicitly — `.env.local` never reaches Vercel on its own:
   ```bash
   echo "<value>" | vercel env add <NAME> production
   ```
   If one of the variables needs to be the site's own production URL, expect a throwaway first deploy to learn the actual assigned domain, then correct that variable and deploy once more so the corrected value is baked into the build (`NEXT_PUBLIC_*` values are inlined at build time, not read at runtime).
2. Before the first deploy of a project created via CLI (`vercel project add` / `vercel link`, not through the dashboard), add a `vercel.json` with the framework set explicitly:
   ```json
   { "$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs" }
   ```
   A project created this way can have `framework: null` in its settings even though `next build` runs and succeeds cleanly during the deploy — Vercel's routing layer then doesn't know how to serve the output, and **every route 404s despite a "Build Completed" / "READY" status**. Confirm the failure mode before assuming this is the cause: `get_deployment_build_logs` shows a clean build, but `get_runtime_logs` for that deployment shows **zero requests** — proof the failure is at Vercel's edge routing, not inside the app.
3. Check deployment protection before telling the user it's live: `get_project_deployment_protection`. New Vercel projects have **"Vercel Authentication" (SSO) enabled by default**, which gates every URL behind Vercel's own login — silently defeating "a normal public production URL." Disable it unless the user specifically wants a gated deployment:
   ```
   update_project_deployment_protection: ssoProtection.enabled = false
   ```
4. **A "READY" deployment status is not proof the app is reachable.** Confirm with real HTTP requests before reporting success:
   ```bash
   curl -s -o /dev/null -w "status=%{http_code}\n" "https://<domain>/"
   curl -s -o /dev/null -w "status=%{http_code}\n" "https://<domain>/<a-protected-route>"
   ```
   Expect `200` on public routes and a redirect (`307`/`302`) to the login page on a protected route with no session — that confirms the middleware itself is running in production, not just that pages render.
