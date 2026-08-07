---
name: staged-app-builder
description: Plans and executes complex Full-Stack Extension builds (3+ database entities, cross-entity business logic, or a detailed user-provided specification) in verified, checklist-tracked phases inside PROJECT-BRIEF.md. Use once a Full-Stack Extension backend is confirmed and its scope is too large for a single build pass.
---

# Staged App Builder

You are still the web builder (see the Role lock rule in `CLAUDE.md`) — this skill only supplies methodology for a large backend build, it does not change who you are or hand the conversation to a different persona.

## When to use this

Not every Full-Stack Extension project needs this. A login-gated page with one or two simple tables just follows `CLAUDE.md`'s normal Phase 3.5 steps in one pass. Reach for this skill when at least one of these is true:

- The confirmed data model has 3+ entities with real relationships between them (not just `profiles` + one child table).
- The user provides a detailed specification beyond the standard questionnaire answers (a numbered feature list, business rules doc, etc.).
- Features clearly depend on each other in a way that makes "build it all at once" risky — e.g. a dashboard that needs numbers from three other features that don't exist yet.

If none of those apply, don't invoke this — just build it directly per `CLAUDE.md`.

## Step 1 — Turn the spec into a phase plan, not a separate file

Don't save the user's spec verbatim into its own file (e.g. `site/SPEC.md`) — that's a second source of truth to keep in sync with `PROJECT-BRIEF.md`, and it drifts. Instead, translate it directly into the `## Build Plan & Progress` checklist (Step 3 below) inside `PROJECT-BRIEF.md`, and keep every Decisions Log entry short as work happens — one line: what changed, why. Never rely on chat history or a `.claude/plans/*.md` file to preserve intent — plan files are overwritten every stage and aren't part of the repo. A checklist for "where am I" plus a terse log for "why did it happen this way" is deliberately lightweight: cheap to reload every session, and durable even if the current conversation's context gets compressed or a new session starts cold.

## Step 2 — Design the phase sequence

Order phases by dependency, not by feature importance. The pattern that works:

1. **Foundation** — the full database schema for the *entire* spec (even the parts with no UI yet), plus any shared shell (navigation, layout) the rest of the build sits inside. Design the schema right the first time, even though later phases build UI against pieces of it that don't exist yet — redesigning schema mid-build is far more expensive than over-designing it up front.
2. **Base entities** — CRUD for the tables everything else references (e.g., in a finance app: accounts/categories before transactions; in a CMS: authors/categories before posts).
3. **Dependent features** — things that read/write the base entities.
4. **Integration** — a dashboard or summary view that pulls real numbers from everything built so far. Never fabricate a number a later phase would need to add — an honest "coming in the next phase" beats a fake placeholder.
5. **Polish/settings** — profile, configuration, anything that isn't core business logic.

Confirm the phase breakdown with the user before starting (a short list is enough, doesn't need full `EnterPlanMode` ceremony) — they may want to reorder or bundle phases differently than you'd guess.

## Step 3 — Track phases in PROJECT-BRIEF.md

Add (or update) a checklist section, kept current as phases complete:

```markdown
## Build Plan & Progress
- [x] Etapa 1: [what it covered] — completa
- [x] Etapa 2: [what it covered] — completa
- [ ] Etapa 3: [what it covers] — en progreso
- [ ] Etapa 4: [what it covers]
```

This is the whole point: a future session (or the same one, later) reads this list and immediately knows what's done, what's next, and doesn't need the spec re-explained. Update it the moment a phase's verification passes — not before, not as an afterthought at the end of the conversation.

**Keep the Decisions Log entries short.** One line per decision: what changed, why. Not a paragraph, not a narrative. A long entry is a sign the detail belongs in a code comment or commit message instead — `PROJECT-BRIEF.md` only needs enough to answer "why is it built this way" at a glance.

## Step 4 — Per-phase loop

For each phase:

1. **Plan.** For a phase with real design ambiguity (new schema shapes, new UI patterns not yet established in this codebase), use `EnterPlanMode` — even a quick design-review pass (a `Plan` subagent stress-testing your approach before you write code) has caught real bugs in practice: wrong FK cascade behavior, a sign error in a financial calculation, a missing case in a type enum. For a phase that's just repeating an already-established pattern (e.g. the third CRUD section built the same way as the first two), skip the ceremony and just build it.
2. **Build.** Reuse whatever patterns the first phase established (list/row components, form-dialog components, server-action shape) rather than inventing a new one per phase — consistency compounds, and a reviewer (or you, next session) shouldn't have to relearn the codebase's conventions per feature.
3. **Verify before marking done** — see the checklist below. A phase is not complete until it passes verification, regardless of how much code got written.
4. **Mark the phase done** in `PROJECT-BRIEF.md`'s checklist, and log any non-obvious decisions in the Decisions Log.
5. **Commit.** One commit per phase (or per closely-related group of fixes) keeps history readable and gives the user a natural point to pause.

## Verification checklist (run every phase)

Every Supabase interaction below goes through the Supabase MCP — see `CLAUDE.md` → MCP Availability. If it isn't connected, stop and wait for the user to connect it rather than falling back to manual SQL/credentials.

- `npm run build` and `npm run lint` clean.
- If migrations were added: apply via the Supabase MCP one at a time, then `list_tables(verbose=true)` to confirm the resulting schema matches intent, and `get_advisors(security)` to confirm no new warnings.
- For anything with real calculation logic (balances, totals, triggers): test directly with `execute_sql` against scratch rows — insert, edit, delete, whatever transitions matter — assert the numbers are exactly right, then **delete the scratch rows** before moving on. Don't trust code review alone for money-math; run it.
- Cross-user RLS: confirm one user can't see/edit another's rows. Do this with `execute_sql` (query the affected rows as each `user_id` would see them, or reason through the policy's `USING`/`WITH CHECK` clauses against real data) — not by spinning up a second disposable account and a full browser session per phase. That heavier check belongs in the single comprehensive end-to-end pass right before deploy (see `CLAUDE.md` → Full-Stack Extension → Testing cadence), not in every phase's verification.
- If you can't test the authenticated UI yourself (no user credentials in this session), say so explicitly and hand off a specific test list to the user — don't claim something works that you only verified at the database layer.
- None of the above requires Playwright or a disposable test account. If a phase's build/lint/SQL checks all pass, mark it done — don't hold it back waiting for a browser-level pass that belongs at deploy time instead.

## Known stack gotchas

These cost real debugging time building with this exact stack (Next.js + Supabase + shadcn + react-hook-form + zod). Check for them proactively rather than rediscovering them:

- **A `SECURITY DEFINER` function that takes an id parameter bypasses RLS — and Supabase exposes it as a public REST endpoint.** This is the sharpest trap in this stack, because the table protection looks correct and the hole is somewhere else entirely. `entradas_restantes(p_miembro uuid)` reads a member's balance; RLS stops anyone reading another member's row from the table, but the function runs as its owner, so `POST /rest/v1/rpc/entradas_restantes` with someone else's uuid returns their data to any caller. Every `SECURITY DEFINER` function that accepts an id needs its **own** authorization check as its first statement — `if p_id <> auth.uid() and not es_staff() then raise exception 'No autorizado'; end if;` — and `revoke execute ... from anon` for anything that should require a session. `get_advisors(security)` flags these; run it after every migration that adds a function, not just after the ones that add tables.

- **Aggregating over a join double-counts, and the number looks plausible.** `select sum(b.total) - count(v.id) from bonos b left join visitas v on v.bono_id = b.id` returns 18 where the answer is 8: the join repeats the bono row once per visit, so the `sum` adds 10 twice. Nothing errors, the figure is in the right ballpark, and code review slides right past it. Use independent subqueries instead of aggregating across a join — and this is precisely why the verification bar says to test calculations against scratch rows rather than reading them. Reading this SQL will not reveal it; running it with two visits will, immediately.

- **shadcn `Form` component isn't guaranteed.** Some shadcn styles/registry versions don't ship a `Form`/`FormField`/`FormItem`/`FormMessage` wrapper. After `npx shadcn@latest add form`, check whether `site/src/components/ui/form.tsx` actually exists. If not, wire forms directly: `useForm` + `Controller` (for non-native inputs like `Select`) + plain `Label`/`Input`/error-paragraph markup.
- **zod v4 + `z.coerce` breaks single-generic `useForm`.** If a schema uses `z.coerce.number()` (or similar) with `@hookform/resolvers`'s `zodResolver`, `useForm<SchemaType>()` fails to typecheck (input/output type mismatch). Use `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>()` instead.
- **A new Supabase project has "Confirm email" ON by default, no SMTP configured.** First login after signup fails with a generic "invalid credentials" error (real cause: `email_confirmed_at` stays null, no way to deliver the confirmation email). If the project already has its own approval gate, disabling "Confirm email" (Authentication → Providers → Email) is usually the right call — confirm with the user first, log the decision.
- **Supabase's default auth email templates are read-only without custom SMTP.** Authentication → Emails → SMTP Settings must be configured before template content (including the confirmation link) can be edited — the dashboard blocks edits and shows "Set up custom SMTP to edit templates" otherwise. If a phase needs a customized password-reset or other auth-email flow, ask the user upfront: set up SMTP now (a real decision — e.g. Resend, or their own Gmail account), or build the feature's UI now and defer wiring the email step. Don't assume the default template is editable.
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`** (exported function `middleware` → `proxy`). Using the old filename on a Next 16 project compiles but is silently never invoked — verify the actual convention against `node_modules/next/dist/docs` (or `site/AGENTS.md`, which `next dev` generates specifically to flag breaking changes like this) before writing route-protection middleware.
