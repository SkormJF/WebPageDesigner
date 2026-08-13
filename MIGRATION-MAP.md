# MIGRATION MAP — legacy repo → Web Builder / Project Factory

Migration-time working document. Produced in Phase 2 of `REBUILD-PLAN.md` §39 (proposal, no edits).
Baseline commit: `ffcd118 chore: baseline before web-builder rebuild`.

Every legacy element is classified `KEEP` / `MOVE` / `REWRITE` / `ABSORB` / `CREATE` / `REMOVE` per §1,
with its new owner named. Nothing is deleted by string match; each row records *why*.

---

## 0. Inventory taken (Phase 1)

| Area | Found |
|---|---|
| Root files | `CLAUDE.md` (505 lines), `README.md`, `README.es.md`, `package.json`, `.gitignore`, `.mcp.json`, `LICENSE`, `.github/CODEOWNERS` |
| `docs/` | 8 documents + `examples/` (3 files) |
| `.claude/` | `skills/` only — **no `agents/`**, no `config/`, no `templates/`, no `scripts/` |
| Skills | 22, matching §14's list exactly |
| Legacy assumptions | 236 occurrences of `site/` · `PROJECT-BRIEF` · `integracion` · `AGENTS.md` · `Phase N` · `feature/` across 29 files |

**§40 reverification of `artifact-design`:** it does **not** exist in `.claude/skills/`. It exists only as a
Claude Code *bundled* skill. So §14's `CREATE` applies. Because creating it means a project skill will carry
the same name as a bundled one, the precedence behaviour was **verified technically before the decision was
kept**, rather than assumed:

- **Official documentation** (`code.claude.com/docs/en/skills`, "when skills share the same name") states the
  resolution order outright: *"Across levels, enterprise overrides personal, and personal overrides project.
  **A skill at any of these levels also overrides a bundled skill with the same name.** For example, a
  `code-review` skill in your project's `.claude/skills/` replaces the bundled `/code-review`."* The worked
  example is `code-review` — a bundled skill from the same set `artifact-design` belongs to.
- **Installed version here is 2.1.231** (`.vscode/extensions/anthropic.claude-code-2.1.231-win32-x64`), later
  than every version-gated note on that page (v2.1.199 / v2.1.200 / v2.1.205), so the documented behaviour is
  the one in force.
- **Contradicting evidence weighed and dismissed:** [issue #33080](https://github.com/anthropics/claude-code/issues/33080)
  reports the opposite ("the built-in takes precedence, the custom skill is effectively displaced"). It is
  **closed as not planned** and predates the documented resolution order above. The docs win.
- **Residual risk, and it is small:** a *personal* skill (`~/.claude/skills/`) or an enterprise one would
  outrank the project's. Checked — `C:\Users\MattU\.claude\skills\` does not exist on this machine, so there
  is no personal-level `artifact-design` to lose to. `skillOverrides` in settings is the documented escape
  hatch if one ever appears.

**Verdict: no real conflict. The plan's name is kept.** Recorded here with its evidence so §42 does not have
to re-derive it, and so a future collision has a documented starting point.

**Related constraint found while verifying:** project skills are reported to be silently dropped past roughly
28 ([issue #31505](https://github.com/anthropics/claude-code/issues/31505)). The Builder carries 20 and a
generated project 18–19, so both sit under it — but the ceiling is close enough that adding skills freely is
not safe, which is an independent argument for §13's fixed inherited set.

---

## 1. Root files

| Legacy | Class | New owner / action |
|---|---|---|
| `CLAUDE.md` | **REWRITE** | Becomes the Builder Orchestrator contract: role, state machine (§4), `.builder/current/` (§5), Discovery (§6), spec ownership (§7), Spec Gate (§8), change policy (§9), the three scripts (§17–20), handoff (§37), context discipline (§44). Everything about *building a landing page* leaves — it is not the Builder's job any more. |
| `README.md` | **REWRITE** | Describes the Factory: what the Builder does, what it hands off, how to run it. Loses the 9-step landing-page walkthrough and the `site/` structure diagram. |
| `README.es.md` | **REWRITE** | Same, Spanish. The bilingual pair is kept — the user-facing language of this project is Spanish. |
| `package.json` | **REWRITE** | Renamed to the Builder; gains a `scripts` block wiring the three mechanical scripts (§17). |
| `package-lock.json` | **CREATE** | Required by §2. Produced by a real `npm install` at Builder root. |
| `.gitignore` | **REWRITE** | Drop `site/` (§38 residue). Add `.builder/current/` (§2: the only transient path). Keep node/env/OS/IDE/Python rules. |
| `.mcp.json` | **KEEP + VERIFY** | Vercel + Supabase MCP stay the required primary remote path (§15, §34). The file is kept as-is, but "declared in `.mcp.json`" is not "usable" — **both servers currently report as needing authorization in this environment**, and §34 requires verifying connection/auth *before* a remote operation, not at the point of failure. The Builder never deploys, so this does not block the migration; it is the generated project's `vercel-deploy` path that must check the specific capability it is about to use (a server answering is not a grant) and block rather than fall back to CLI. |
| `LICENSE` | **KEEP** | Unchanged. |
| `.github/CODEOWNERS` | **KEEP** | Unchanged. |
| `REBUILD-PLAN.md` | **KEEP** | Migration authority; retained as the record the final audit (§42) checks against. |
| `MIGRATION-MAP.md` | **CREATE** | This file. Migration provenance for §42. |

---

## 2. `docs/` — dissolved, but conditionally

The Builder tree in §2 does not draw a `docs/` directory. **Absence from a conceptual tree is not a
prohibition**, and this migration does not treat it as one. `docs/` is removed **only if** every document
below has been fully migrated to its correct owner — checked document by document against the destination
file, not assumed from this table. Any document whose knowledge has no confirmed home keeps `docs/` alive
until it gets one. The removal is an *outcome* of complete migration, never its justification.

| Legacy | Class | New owner |
|---|---|---|
| `docs/system-prompt.md` | **ABSORB → REMOVE** | Builder persona + communication rules → root `CLAUDE.md`. The banned-Spanish-vocabulary list → `humanizalo`. |
| `docs/questionnaire.md` | **ABSORB → REMOVE** | Rounds 1–4 map 1:1 onto §6. Condensed into root `CLAUDE.md`'s Discovery section. The nuances worth keeping and easy to lose: the "what changes, how often, who changes it" question; "no social proof → omit the section, never fabricate testimonials"; the file-upload requirement that neither `mailto:` nor free Formspree covers; "no social networks → put nothing, not placeholder icons". **The 18px base size stays conditional knowledge, not a default.** It is a *trigger* — when a user's answer reveals a reading-comfort need rather than a taste preference ("oscuro no, que luego no veo bien el texto"), raise the base size and record it in `design-system.md` as an accessibility decision so a later polish pass cannot undo it. Migrated as a rule for *recognising the condition*, never as a universal 18px baseline; the default base size remains the design system's own. |
| `docs/design-guide.md` | **ABSORB → REMOVE** | Typography/color/spacing/motion/layout → `frontend-design`. Control size scale + molecule inventory + interaction states → new `atomic-design`. AI copy patterns → `humanizalo`. Touch-target AA-vs-AAA distinction → `accessibility-audit`. |
| `docs/landing-page-patterns.md` | **MOVE** | → `frontend-design/reference/landing-archetypes.md`. Eight archetypes with section orders; real product knowledge, wrong location. |
| `docs/performance-checklist.md` | **ABSORB → REMOVE** | Core Web Vitals targets + font/image/bundle rules → `performance-audit`; the React-specific half is already covered by `vercel-react-best-practices`. |
| `docs/accessibility-checklist.md` | **ABSORB → REMOVE** | → new `accessibility-audit` skill (§14 CREATE). It is that skill's entire behavioural half — keyboard, focus, forms, contrast, reduced motion — which axe cannot check (§15). |
| `docs/deployment-guide.md` | **ABSORB → REMOVE** | → rewritten `vercel-deploy`. Most of it describes the sandbox `deploy.sh` path, which §15 retires in favour of MCP-primary. |
| `docs/skill-reference.md` | **REPLACE → REMOVE** | Superseded by `config/skill-manifest.json` (§16) as the machine-readable source, plus a short human table in `README.md`. A hand-maintained skill index is exactly the duplication §13 warns about. |
| `docs/examples/*.md` (3) | **REMOVE** | Example `PROJECT-BRIEF.md`s for the retired landing-page flow. Format and file no longer exist; nothing in them survives the move to five specs. |

---

## 3. Skills — 22 → 20

Final composition per §13: **17 inherited-standard + 2 profile-inherited + 1 optional = 20.**
(22 − 5 removed + 3 created = 20. ✓)

### 3.1 Kept, with the adjustment §14 prescribes

| Skill | Class | What actually changes |
|---|---|---|
| `building-components` | KEEP + ADJUST | Composition/a11y/token guidance stays. Strip references to the old phase numbering. |
| `chrome-bridge-automation` | KEEP + STRONGLY RESTRICT | Demoted to optional/emergency. Requires explicit human approval; Playwright stays first choice (§13). |
| `deep-research` | KEEP + STRONG REWRITE | Loses the landing-page-copy framing; becomes stack/domain research usable at Discovery and in generated projects. |
| `emil-design-eng` | KEEP + STRONG TRIM | 29KB → the motion/interaction judgement that is actually unique to it; absorbs the motion knowledge released by `design-taste-frontend` and `imagegen-frontend-web`. |
| `frontend-design` | KEEP + ADJUST | Gains `docs/design-guide.md`'s system rules and the archetype reference; loses Builder-phase logic. |
| `humanizalo` | KEEP + REWRITE | Scope pinned to user-facing product prose (§15). The editorial score/report mode is removed — it was a reviewer persona competing with the Reviewer agent's authority. |
| `navigation-shell` | KEEP + ADJUST | WCAG/sticky/sidebar content is sound. Drop `site/` paths and phase references. |
| `performance-audit` | KEEP + ADJUST | Absorbs `docs/performance-checklist.md`. Reframed as a Quality Gate input, not a phase-5 ritual. |
| `playwright-cli` | KEEP + TRIM | §15 evidence priority: error/result → screenshot → console/network → trace → video last. Playwright **Test** stays separate and primary for reproducible E2E. |
| `redesign-existing-projects` | KEEP + ADJUST | Audit/upgrade workflow retargeted at a generated project's own iteration, not at "Phase 5". |
| `seo-audit` | KEEP + TRIM | Applicability now decided by product intent (§33) — a private app legitimately gets `noindex`, not an SEO scolding. |
| `shadcn-ui` | KEEP + STRONG TRIM | 32KB → the component API shape and the Radix-vs-Base-UI `asChild` trap. Profile-inherited (React/Next only). |
| `ui-ux-pro-max` | KEEP + STRONG TRIM | 46KB `SKILL.md` → a thin CLI front door. The 1.3MB CSV corpus and Python scripts are the value and stay untouched. |
| `vercel-deploy` | **REWRITE** | MCP-primary, no silent CLI fallback (§15). Absorbs `docs/deployment-guide.md` and `pre-deploy-verification`'s deploy/post-deploy halves. The bundled `deploy.sh` sandbox path is retired. |
| `vercel-react-best-practices` | KEEP + TRIM | The `rules/` directory (64 files, ~1KB each) stays and *is* the progressive disclosure — `SKILL.md` indexes, a rule loads only when relevant. **The 94KB `AGENTS.md` is deleted:** it is a compiled aggregate of those same rules, so it duplicates every one of them in a single blob that defeats the disclosure it sits next to, and §38 lists `AGENTS.md` assumptions as a cleanup target. Verify before deleting that no rule exists *only* in the compiled file; anything unique gets its own `rules/` entry first. Profile-inherited. |
| `web-design-guidelines` | KEEP + ADJUST | Stays a UI review pass; loses the automatic-phase-5 framing. |
| `web-reader` | KEEP + ADJUST | **Shared / inherited-standard, not Builder-only.** Its main use is Discovery Round 4 and the Artifact — analysing a reference URL into palette, typography, layout rhythm and component patterns. But the need recurs after handoff: a user pointing at a site mid-redesign ("hazlo más como esto") in the generated project needs the same reading, so it ships with every project. Drops `site/` assumptions and the Phase-4 framing. |

### 3.2 Created (§14)

| Skill | Why it must exist |
|---|---|
| `artifact-design` | Owns §6's mandatory interactive Artifact and §15's contract: materialize the approved visual direction for human inspection. No FULL/REFERENCE modes, no image quotas, no page slicing, no imagegen dependency. |
| `atomic-design` | Conceptual only — **no** forced `atoms/`/`molecules/`/`organisms/` directories (§15). Owns reuse-first, component identity, variants, duplication vs. over-abstraction, and the control size scale / molecule inventory / interaction states rescued from `design-guide.md`. |
| `accessibility-audit` | axe + keyboard/focus + forms/dialogs/navigation/dynamic state/reflow. Carries §15's line explicitly: **axe PASS is not accessibility PASS.** |

### 3.3 Absorbed then removed (§14)

| Skill | Where its knowledge goes |
|---|---|
| `design-taste-frontend` (24KB) | Anti-AI-tell rules + metric-based type/spacing → `frontend-design`. Component architecture → `atomic-design`. Motion engine specs → `emil-design-eng`. Its "senior engineer persona" framing is dropped — it competed with the harness for authority. |
| `imagegen-frontend-web` (39KB) | Composition/hierarchy/scale/rhythm/materiality/media direction → `artifact-design`. General design rules → `frontend-design`. Motion-implied language → `emil-design-eng`. The image quotas, page slicing, site packs and art-direction-for-a-generator scaffolding die with it — there is no image tool, and the Artifact replaced the need. |
| `pre-deploy-verification` | E2E-with-disposable-accounts → generated project's E2E stage (§31). Security review → Quality Gate (§32). Domain availability + naming → `vercel-deploy`. Real-HTTP-after-deploy → Post-deploy (§35). §34 names this removal explicitly. |
| `full-output-enforcement` | Completeness rules → generated `builder.md` agent ("no unauthorized TODOs/stubs/mocks", §23) and `reviewer.md`. A skill cannot enforce a behaviour the agent contract should own. |
| `staged-app-builder` | Dependency-ordered phase planning + per-phase verification bar → generated `planner.md` and the task loop (§25). Stack gotchas → the stack profile's notes. `PROJECT-BRIEF.md` checklist mechanics die with the file. |

---

## 4. Created — Builder infrastructure (none of this exists today)

| Path | Source | Purpose |
|---|---|---|
| `builder.config.json` | §3 | `projects_root`, `default_stack_profile`, `schema_version`. Nothing else. |
| `.claude/agents/spec-reviewer.md` | §8 | The only Builder subagent. `SPEC_PASS`/`SPEC_FAIL`, BLOCKER/MAJOR/MINOR. Does not fix, build, deploy or change phase. |
| `config/skill-manifest.json` | §16 | Classifies every skill: builder-only / inherited-standard / profile-inherited / optional. Drives both `create-project` (copy) and `validate-project` (expected set). |
| `config/stack-profiles/next-standard-v1.json` | §10 | Default profile. |
| `config/stack-profiles/react-vite-standard-v1.json` | §10 | Second profile. |
| `templates/common/**` | §12 | Generated `CLAUDE.md`, the three agents, `.workflow/`, spec slots. **No** stack-specific assumptions. |
| `templates/stacks/next-standard-v1/**` | §12 | Real, runnable Next scaffold: package + lock, framework/lint/typecheck/test config, minimal `src/` and `public/`. |
| `templates/stacks/react-vite-standard-v1/**` | §12 | Same for React/Vite. |
| `scripts/create-project` | §18 | Staging dir → compose → deps → git init → baseline commit → move to final target. Refuses to touch an existing target. |
| `scripts/validate-project` | §19 | Structured PASS/FAIL evidence. Repairs nothing. |
| `scripts/reset-builder` | §20 | Deletes exactly `<builder-root>/.builder/current/`. Idempotent. Accepts no path argument. |
| `.builder/` | §5 | Transient; `.builder/current/` gitignored. |

**Script implementation choice:** Node `.mjs`, invoked via `npm run`. §17 leaves the extension open
(`create-project.*`). The primary environment is Windows while the toolchain is npm-based; one Node
implementation runs identically on both and avoids maintaining parallel `.ps1`/`.sh` copies that drift.

**Stack profile honesty (§10):** a profile counts as supported only once its template really installs, lints,
typechecks, builds and smoke-starts. `next-standard-v1` is built and validated first as the default.

**Both profiles are required.** §10 names `next-standard-v1` *and* `react-vite-standard-v1` as the initial
support set, so `react-vite-standard-v1` is not optional and is **not** dropped if it proves awkward to
validate. If it fails validation, the correct outcome is that **the migration is blocked and reported as
incomplete** until the failure is resolved — not a quietly narrowed scope. §10's "do not claim support until
validated" governs what may be *advertised*; it is not licence to delete a required profile. Removing it
would be a scope decision, and that is the human's call, not this migration's.

---

## 5. Legacy residue — the 236 occurrences

Classified, not string-matched (§38):

| Assumption | Where it lives | Disposition |
|---|---|---|
| `site/` as the app root | `CLAUDE.md`, both READMEs, `.gitignore`, 6 docs, 12 skills | **Removed.** §1: the generated project root *is* the repo/app/harness root. |
| `PROJECT-BRIEF.md` | `CLAUDE.md`, `questionnaire.md`, `staged-app-builder`, examples | **Replaced** by the five specs (§7). `PROJECT.md` inherits only stable identity + scope. |
| `feature/<slug>` branch per project | `CLAUDE.md` Phase 3 | **Removed.** §2: one stable Builder repo, no project-per-branch. |
| `integracion` trunk assumptions | `CLAUDE.md` | **Removed** from workflow text. The branch itself remains this repo's trunk. |
| Phases 1–6 + Phase 3.5 | `CLAUDE.md`, 10 skills | **Replaced** by the Builder state machine (§4) and the generated lifecycle (§24). |
| `AGENTS.md` (Next 16 scaffold) | `CLAUDE.md` Phase 3 Step 6 | **Removed** as a Builder concern. §21: no general `AGENTS.md` while Claude-only. The Next-16 `middleware.ts` → `proxy.ts` warning it carried is real and moves into the stack profile's notes. |
| Sandbox `deploy.sh` | `vercel-deploy`, `deployment-guide.md`, `CLAUDE.md` | **Retired.** §15/§34: MCP is the required primary path, no silent CLI fallback. |
| Chrome Bridge as a normal path | `CLAUDE.md` Phase 5 Option 2 | **Demoted** to optional/emergency with explicit human approval. |
| Supabase Full-Stack Extension flow | `CLAUDE.md` | **Dissolved.** Backend is now an ordinary outcome of Discovery Round 3 → `design.md`, not a bolt-on mode. **Its gotchas do not go into a stack profile.** `next-standard-v1` and `react-vite-standard-v1` describe a *frontend framework baseline* — versions, lint/typecheck/test config, architecture conventions — and a Postgres provider's RLS semantics have no business there: it would bind a backend choice to a frontend profile and make every Next project carry Supabase knowledge it may never use. Correct conditional owners instead: **`design.md`** owns this project's backend, tables, auth, RLS and security decisions (§7); the **Quality Gate's conditional block** (§32: "Supabase/RLS, auth/roles") owns verifying them, and only when the product actually uses that provider. The concrete rules that must survive the move: RLS enabled on every table; every `SECURITY DEFINER` function that takes an id authorizes the caller before reading; aggregates across a join double-count and must be checked against hand-computed scratch rows; email confirmation defaults ON with no SMTP, which silently breaks first login. |
| Codex / multi-platform agent templates | `ui-ux-pro-max/templates/platforms/*.json` (14 files) | **Removed.** §38 lists Codex-specific assumptions; this repo is Claude-only. |

---

## 6. Execution order (§39 Phase 3)

1. root `CLAUDE.md` → 2. Builder state/workflow contract → 3. `spec-reviewer.md` → 4. Discovery →
5. Artifact flow → 6. spec templates/contracts → 7. Spec Gate → 8. `builder.config.json` →
9. stack profiles → 10. common generated template → 11. generated agents → 12. generated workflow template →
13. the three scripts → 14. skill inheritance composition → 15. skill migration/rewrite →
16. docs/README cleanup → 17. legacy residue cleanup.

Committed in coherent blocks (§39 Phase 4), never as one large mixed rewrite.

---

## 7. Open items and verification debts

**Resolved before starting**

1. **`artifact-design` naming — verified, no conflict, decision kept.** Project skills override bundled ones
   per current documentation; installed version is past every relevant version gate; no personal-level skill
   exists to outrank it. Full evidence in §0. This was checked rather than assumed precisely because the
   opposite is reported in a closed GitHub issue.

**Conditions that can block the migration**

2. **`react-vite-standard-v1` must validate.** It is a required initial profile (§10). If its template will
   not install/lint/typecheck/build/smoke-start, the migration is **blocked and reported incomplete** — the
   profile is not dropped to make the run finish. See §4.
3. **`docs/` is removed only after per-document confirmation.** Each row in §2 must be checked against the
   destination file that now holds its knowledge. Unmigrated content keeps the directory. See §2.
4. **`vercel-react-best-practices/AGENTS.md` is deleted only after a uniqueness check** — nothing may exist
   solely in the compiled aggregate. See §3.1.

**Verification debts carried into the rebuild**

5. **MCP authorization is unproven.** Both servers in `.mcp.json` currently report as needing authorization.
   This blocks nothing in the Builder (it never deploys), but the generated project's deploy path must verify
   the *specific capability* before use and block rather than fall back. See §1.
6. **Skill-count ceiling.** Project skills are reported to drop silently past ~28. Builder 20, generated
   project 18–19 — under it, but not by much. See §0.

**Not open, just recorded**

7. **`REBUILD-PLAN.md` and this file** stay at the root as migration-time provenance for the §42 audit. They
   are not part of the Builder's runtime contract, and the Builder does not read them at session start.

---

## 8. Addendum — clauses added at approval

Approved as part of the migration contract, alongside `REBUILD-PLAN.md`.

### 8.1 `.mcp.json` ships with every generated project

Every generated repo receives the same standard `.mcp.json`, declaring **both** the Vercel MCP and the
Supabase MCP. It lives in `templates/common/`, so an independent repo has the full toolkit from its first
session. A project that never touches Supabase still keeps its entry — the toolkit is standard, and pruning
it per-project would make the template non-deterministic for no gain.

Responsibilities, split so that no step claims more than it can prove:

| Actor | Does | Explicitly does not |
|---|---|---|
| `create-project` | Copies `.mcp.json` into the new repo. | — |
| `validate-project` | Checks the file exists, parses, declares both servers, and holds no secrets. | **Never attempts to authenticate.** Auth is a human, per-machine act; a validator that tried it would fail for reasons unrelated to whether the repo was generated correctly. |
| Generated-project Orchestrator | Before any operation needing Supabase or Vercel, verifies that MCP is available *and authorized for the specific capability* — a server answering is not a grant. If it is not, stops and asks the human to complete authorization. | **No silent CLI fallback** for remote Vercel operations (§34). An exception needs explicit human approval. |
| Human | Approves/starts the MCP sessions when Claude Code prompts, on first opening the generated repo. | — |

### 8.2 `humanizalo` — principles, not a word blacklist

The legacy skill carries a list of banned Spanish words (`innovador`, `de vanguardia`, `potenciar`,
`robusto`…) and an English one. **The blacklists are not migrated as universal prohibitions.** A blacklist
fails in both directions: it flags legitimate copy (a structural engineer's site may need `robusto` in its
literal sense) and it misses generated text that avoids every listed word.

What migrates is the judgement underneath: natural language, clarity, specificity, attention to context, and
recognising the patterns that actually mark generated text — uniform sentence rhythm, inflated significance,
vague attribution, opinionless prose, the three-item list reflex. Word lists may survive only as *illustrative
examples* of those patterns, never as a rule that fires on a match.

**Subordination is absolute.** `humanizalo` never overrides, and must not contradict:

```
specs · product meaning · brand voice · technical accuracy · legal accuracy · approved SEO
```

Where a rewrite would change a fact, weaken a legal obligation, break an approved keyword, or drift from the
approved voice, the copy stands and the skill defers. This makes it consistent with §13 — skills expand
capability, never authority — and removes the last of the editorial-reviewer framing §15 already stripped.
