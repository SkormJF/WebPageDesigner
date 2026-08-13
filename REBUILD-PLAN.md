# REBUILD-PLAN.md

## 0. Purpose

Transform the existing Web Page Designer repository into a **Web Builder / Project Factory**.

The Web Builder does not build complete applications inside itself. Its responsibility is to discover the product, establish and approve the visual direction, produce complete project specifications, review those specifications, obtain explicit human approval, generate a new independent repository, validate the generated repository, hand it off in `READY_TO_BUILD`, and reset itself to `IDLE`.

The generated repository is then opened separately in a fresh Claude Code session and owns implementation, testing, deployment, maintenance and future evolution.

## 1. Non-negotiable architecture

Permanent generated-project root:

```text
C:\SkormJF\Projects\PagesProjects
```

Generated project:

```text
C:\SkormJF\Projects\PagesProjects\<slug>\
```

This path is final. The generated project root is simultaneously the Git repository root, application root and harness root. There is no `site/` directory.

System boundary:

```text
WEB BUILDER
= discovery + visual direction + specifications + repo generation + generation validation

GENERATED PROJECT HARNESS
= implementation + task review + integration + QA + deploy + maintenance
```

No functional product implementation begins inside the Web Builder.

Authority hierarchy:

```text
HARNESS
→ workflow, lifecycle and state transitions

SPECIFICATIONS
→ what the product must become

design-system.md
→ approved visual contract

STACK PROFILE
→ validated technical foundation, versions and architecture conventions

SKILLS
→ specialized knowledge

TOOLS / SCRIPTS
→ mechanical work and evidence
```

Lower layers must not silently override higher layers.

Every legacy element must be classified as `KEEP`, `MOVE`, `REWRITE`, `ABSORB`, `CREATE` or `REMOVE`. Preserve useful knowledge, not obsolete ownership, duplicated workflow or stale structure.

## 2. Final Web Builder repository architecture

```text
web-builder/
├── CLAUDE.md
├── README.md
├── builder.config.json
├── package.json
├── package-lock.json
├── .gitignore
│
├── .claude/
│   ├── agents/
│   │   └── spec-reviewer.md
│   └── skills/
│       └── ...
│
├── config/
│   ├── skill-manifest.json
│   └── stack-profiles/
│       ├── next-standard-v1.json
│       └── react-vite-standard-v1.json
│
├── templates/
│   ├── common/
│   └── stacks/
│       ├── next-standard-v1/
│       └── react-vite-standard-v1/
│
├── scripts/
│   ├── create-project.*
│   ├── validate-project.*
│   └── reset-builder.*
│
└── .builder/
    └── current/
```

Only `.builder/current/` is transient project work and must be gitignored. The Builder has one stable repository and one active Builder project maximum. No project-per-branch model. No generated application lives inside the Builder repository.

## 3. Builder configuration

`builder.config.json` stays intentionally small:

```json
{
  "schema_version": 1,
  "projects_root": "C:\\SkormJF\\Projects\\PagesProjects",
  "default_stack_profile": "next-standard-v1"
}
```

Do not duplicate data that belongs to stack profiles, templates or workflow state.

## 4. Builder state machine

```text
IDLE
→ DISCOVERY
→ PLANNING
→ SPEC_REVIEW
→ AWAITING_APPROVAL
→ READY_TO_CREATE
→ CREATING_PROJECT
→ VALIDATING_PROJECT
→ HANDOFF_COMPLETE
→ RESET
→ IDLE
```

`IDLE` normally means `.builder/current/` does not exist. Claude does not infer phase from conversation. `state.json` is the operational source of truth. Persist state before consequential actions. Only the Builder Orchestrator writes lifecycle state.

## 5. `.builder/current/`

Progressive structure:

```text
.builder/current/
├── state.json
├── discovery.md
├── PROJECT.md
├── requirements.md
├── design.md
├── design-system.md
├── tasks.md
└── artifact/           # temporary only if technically required
```

Not all files exist from the beginning.

During Discovery, keep `state.json`, `discovery.md`, and temporary Artifact files only when needed. During Planning, create the five final specification files.

Minimal state concept:

```json
{
  "schema_version": 1,
  "phase": "DISCOVERY",
  "project_name": "Example",
  "slug": "example",
  "pending_action": null
}
```

Do not duplicate requirements, architecture, visual decisions or review history in state. Derive final target path from `projects_root + slug`.

`discovery.md` represents current approved truth only. It is not a transcript or change log. When a decision changes, replace the previous truth.

Recovery: if `.builder/current/state.json` exists, read project name and phase and offer `CONTINUE` or `ABANDON`. `CONTINUE` loads only the files needed for the current phase. `ABANDON` requires explicit confirmation and then runs `reset-builder`.

## 6. Discovery

Discovery is conversational. Infer answers already available and ask only for unknown, ambiguous or contradictory information. The user remains final authority.

Round 1: product and context — purpose, users, product type, business context, primary objective, major constraints.

Round 2: content, CTA, assets and facts — content requirements, calls to action, supplied assets, claims/factual constraints, language/tone, important copy constraints.

Round 3: functional direction — conceptual flows, roles, permissions, data, backend requirements, integrations, and one representative end-to-end flow when applicable. Do not prematurely design implementation internals.

Round 4: visual direction — mandatory interactive Artifact. It must be representative enough to approve the visual system, not necessarily every final page. Show representative navigation, primary shell/hero, cards, forms, dashboard patterns, buttons, important states, motion where relevant, and responsive behavior. Use intended fonts when feasible; self-hosted/downloaded fonts are valid. Human visual approval is mandatory. Approved Artifact decisions become facts for Planning.

## 7. Specifications

Each datum has one owner.

`PROJECT.md`: stable project identity and high-level scope. Replaces `PROJECT-BRIEF.md`. Do not overload it with all requirements/design/workflow.

`requirements.md`: owns WHAT. Use stable IDs such as `REQ-001`. Use EARS-style wording where useful, not dogmatically.

`design.md`: owns technical HOW: stack profile identity, architecture, routes, modules/features, component inventory, backend, tables, auth, RLS, integrations, security, data flow, and any justified deviation from the standard profile.

`design-system.md`: owns the approved visual contract: typography, color, spacing/rhythm, surfaces, interaction patterns, responsive behavior, media direction, component visual rules and representative states.

`tasks.md`: owns implementation decomposition. Tasks are requirement-linked, dependency-aware, acceptance-oriented and status-bearing. Durable statuses: `PENDING`, `ACTIVE`, `DONE`.

## 8. Spec Gate

Planning ends only when all three conditions pass:

```text
Mechanical Spec Gate PASS
+ Spec Reviewer PASS
+ explicit Human Approval
= READY_TO_CREATE
```

Mechanical Spec Gate checks required files, unresolved critical placeholders, valid IDs, valid requirement-task references, critical orphan requirements and required contract sections.

Dedicated Builder subagent: `.claude/agents/spec-reviewer.md`.

Spec Reviewer checks completeness, consistency, traceability, feasibility and fidelity to approved Discovery/Artifact. Severity: `BLOCKER`, `MAJOR`, `MINOR`. Result: `SPEC_PASS` or `SPEC_FAIL`. Any BLOCKER or MAJOR fails. It does not fix specs, build code, test, deploy, redesign, change phase or invoke other agents. Re-run after material corrections.

## 9. Transversal change policy

When an approved decision changes:

```text
detect scope
→ identify affected artifacts
→ modify only affected sections
→ preserve unrelated approved decisions
→ revalidate changed contract
```

Broad re-review only for structural changes.

## 10. Stack Profiles

Initially support:

```text
next-standard-v1
react-vite-standard-v1
```

Default: `next-standard-v1`.

Do not claim support for more stacks until they have real templates and validation.

Skills do not own universal framework versions. A stack profile points to a validated stack template. Real frozen versions live in `package.json` + lockfile. Old projects do not silently upgrade when a newer profile exists. Future evolution can create `next-standard-v2`, etc.

A profile is supported only after its combination passes applicable install/dev/lint/typecheck/build/tests/Playwright/axe/shadcn/Vercel checks. Exact versions must be verified from current primary documentation when implementing the real profile.

## 11. Standard project architecture

Principle:

```text
feature/domain-first
+ pragmatic clean boundaries
+ conceptual Atomic Design
+ reuse-first
+ no unnecessary abstraction
```

Next conceptual layout:

```text
src/
├── app/
├── features/<feature>/
│   ├── components/
│   ├── hooks/
│   ├── actions/
│   ├── services/
│   ├── schemas/
│   └── types.ts
├── components/
│   ├── ui/
│   └── shared/
├── hooks/
├── lib/
├── services/
└── types/
```

React/Vite uses the same mental model with `app/router`, `app/providers` and `pages` where appropriate.

Do not precreate unnecessary empty directories. Create folders/components when needed and in the correct location.

Boundary rules: app/pages may compose features; features may use shared/ui/lib/services; `components/ui` must not depend on product features; shared components must not hide feature-specific business logic; services must not depend on UI; lib must not depend on features/app; features should not arbitrarily import each other's internals.

Reuse-first: search existing → reuse → extend/variant if same identity → create new only when meaningfully different. Reuse-first does not mean everything must become generic.

## 12. Templates

```text
templates/
├── common/
└── stacks/
    ├── next-standard-v1/
    └── react-vite-standard-v1/
```

Common owns how every generated project works: generated `CLAUDE.md`, Planner/Builder/Reviewer templates, workflow files, spec slots and common harness structure. It must not contain stack-specific React/Next/Vite implementation assumptions.

Stack template owns package/lockfile, framework config, lint/typecheck config, testing config, minimal runnable `src/`, minimal `public/`, and stack-specific configuration. Stack templates must be directly runnable and validated.

During generation, placeholder spec slots are replaced by real approved specs; do not leave duplicate template specs.

## 13. Skill architecture

Skills expand capability, never authority. They must not repeat or override harness workflow, specs, design-system, stack profile or another skill's unique ownership. On disk does not mean loaded in context. Keep operational `SKILL.md` concise and use progressive disclosure for rare/heavy knowledge.

Categories:

```text
BUILDER-ONLY
INHERITED-STANDARD
PROFILE-INHERITED
OPTIONAL / EMERGENCY
```

`create-project` does not choose normal skills ad hoc.

Fixed standard inherited set:

```text
artifact-design
atomic-design
frontend-design
ui-ux-pro-max
humanizalo
deep-research
web-reader
building-components
emil-design-eng
navigation-shell
redesign-existing-projects
web-design-guidelines
playwright-cli
performance-audit
seo-audit
accessibility-audit
vercel-deploy
```

Profile-inherited examples for React/Next:

```text
shadcn-ui
vercel-react-best-practices
```

Optional/emergency:

```text
chrome-bridge-automation
```

Playwright remains first choice. Chrome Bridge is exceptional and requires explicit human approval.

## 14. Final skill migration map

KEEP/ADJUST/REWRITE:

```text
building-components → KEEP + ADJUST
chrome-bridge-automation → KEEP + STRONGLY RESTRICT
 deep-research → KEEP + STRONG REWRITE
emil-design-eng → KEEP + STRONG TRIM
frontend-design → KEEP + ADJUST
humanizalo → KEEP + REWRITE
navigation-shell → KEEP + ADJUST
performance-audit → KEEP + ADJUST
playwright-cli → KEEP + TRIM
redesign-existing-projects → KEEP + ADJUST
seo-audit → KEEP + TRIM
shadcn-ui → KEEP + STRONG TRIM
ui-ux-pro-max → KEEP + STRONG TRIM
vercel-deploy → REWRITE
vercel-react-best-practices → KEEP + TRIM
web-design-guidelines → KEEP + ADJUST
web-reader → KEEP + ADJUST
```

CREATE:

```text
artifact-design
atomic-design
accessibility-audit
```

If `artifact-design` already exists in the migration-time repo, verify/adapt instead of blindly creating a duplicate.

ABSORB/REMOVE:

```text
design-taste-frontend
→ absorb unique design/motion knowledge into correct owners → remove

imagegen-frontend-web
→ absorb useful visual-contract knowledge mainly into artifact-design
→ selected general design knowledge into frontend-design
→ selected motion knowledge into emil-design-eng
→ remove

pre-deploy-verification
→ absorb into E2E / Quality Gate / Vercel deploy / Post-deploy → remove

full-output-enforcement
→ absorb completeness rules into Builder + Reviewer → remove

staged-app-builder
→ absorb useful planning/reuse/verification lessons into new owners → remove
```

Do not copy old skill files wholesale.

## 15. Skill-specific core contracts

`artifact-design`: materialize approved visual direction for human inspection. Keep concept, hierarchy, composition, scale, rhythm, typography discipline, color/materiality, representative components, media direction, responsive behavior, representative interaction and coherence. Remove FULL/REFERENCE legacy modes, image quotas, page slicing, asset packs, mandatory imagegen dependency and old Builder phase logic.

`atomic-design`: conceptual Atomic Design only. Do not force `atoms/`, `molecules/`, `organisms/` directories. Own reuse-first thinking, component identity, variants where appropriate, duplication avoidance, over-abstraction avoidance, and state/responsive/accessibility awareness.

`humanizalo`: applies when user-facing product prose is created/modified: headings, descriptions, CTAs, buttons, form labels/help, errors/success, empty states, onboarding, dashboard copy, FAQs, privacy/policy/terms. Preserve facts, legal obligations, SEO intent and approved brand voice. No editorial score/report mode.

`playwright-cli`: browser interaction/evidence/debugging. Playwright Test remains distinct and primary for reproducible E2E. Evidence priority: error/result → screenshot → console/network → trace → video only as rare last resort.

`accessibility-audit`: axe + keyboard/focus + forms/dialogs/navigation/dynamic state/reflow as relevant. Axe PASS is not accessibility PASS.

`vercel-deploy`: Vercel MCP is the required primary remote path. No silent CLI fallback. Known env vars may be configured when authorized; never invent/persist secret values. Public production routes must not accidentally require Vercel authentication.

## 16. Skill composition

Use a small central distribution source such as `config/skill-manifest.json`, but keep it simple. It classifies each skill as Builder-only, inherited-standard, profile-inherited or optional/emergency.

`create-project` copies fixed inherited standard + selected profile's fixed additions. `validate-project` computes the same expected set and fails on missing required skills or unexpected legacy/extra skills.

The manifest controls physical distribution, not when Claude loads a skill into context.

## 17. Builder mechanical scripts

Exactly three top-level scripts:

```text
scripts/
├── create-project
├── validate-project
└── reset-builder
```

Internal helper modules are allowed only as implementation details. Do not create scripts for reasoning tasks such as discovery, planning, design or review.

## 18. `create-project`

Preconditions: phase `READY_TO_CREATE`, approved specs exist, selected stack profile exists, target does not already exist.

Input: `slug`, `stack_profile`.

Target:

```text
C:\SkormJF\Projects\PagesProjects\<slug>
```

If target exists, STOP. Never overwrite, delete, merge automatically or create `<slug>-2`.

Composition:

```text
COMMON TEMPLATE
+ STACK TEMPLATE
+ INHERITED-STANDARD SKILLS
+ PROFILE-INHERITED SKILLS
+ APPROVED SPECS
= NEW INDEPENDENT PROJECT
```

Use a safe staging directory. Compose full repo, materialize/install declared dependencies as appropriate, initialize Git, create baseline commit, and only expose/move to final target after successful mechanical creation.

Suggested first commit:

```text
chore: initialize project
```

The Web Builder owns only this baseline creation commit. After handoff, the generated project harness owns all future implementation commits.

`create-project` must not change requirements, redesign architecture, alter visual direction, choose a new stack, implement features or rewrite specs. Fail on invalid mechanical assumptions.

## 19. `validate-project`

Purpose: answer only whether the Web Builder generated a valid independent repo ready for a fresh Claude Code session.

Validate location, Git baseline/clean tree, required specs, generated CLAUDE/agents/workflow, initial `READY_TO_BUILD`, deterministic expected skills, stack/profile files, no active legacy residue, and technical scaffold checks such as `npm ci`, lint, typecheck, build and minimal smoke start as applicable.

Do not run full product E2E here. Do not repair anything. Return structured PASS/FAIL evidence.

Legacy residue checks include active references to `site/`, `PROJECT-BRIEF.md`, old project branch flow, `integracion` assumptions, removed skills, old Builder phases, AGENTS assumptions and Codex-specific generated-project assumptions.

## 20. `reset-builder`

Single responsibility:

```text
delete only <builder-root>\.builder\current\
```

Do not accept arbitrary paths. Verify target is exactly Builder's own `.builder/current`. It is idempotent.

Use automatically after successful handoff. Use after ABANDON only after explicit human confirmation. Never touch `C:\SkormJF\Projects\PagesProjects`, templates, skills, config, scripts or generated repos.

## 21. Generated project structure

```text
project/
├── CLAUDE.md
├── PROJECT.md
├── requirements.md
├── design.md
├── design-system.md
├── tasks.md
├── package.json
├── package-lock.json
├── .gitignore
├── .claude/
│   ├── agents/
│   │   ├── planner.md
│   │   ├── builder.md
│   │   └── reviewer.md
│   └── skills/
│       └── ...
├── .workflow/
│   ├── state.json
│   └── current/
│       ├── implementation.md
│       └── review.md
├── src/
└── public/
```

No `site/`. No general `AGENTS.md` while Claude-only.

## 22. Generated project Orchestrator

Main Claude session acts as Orchestrator and does not implement functional code. It reads persisted state first, selects one task at a time, invokes Planner when needed, invokes Builder/Reviewer, owns lifecycle/task state, commits approved work, coordinates integration, Visual QA, Human Preview, E2E, Quality Gate, deployment authorization, Post-deploy, Vault handoff and DONE.

Agents never invoke each other. They always return to Orchestrator.

## 23. Generated project agents

Planner: dormant during normal task execution. Activate for significant new feature, material spec gap, scope change, architecture change or meaningful new work after DONE. It may make technical choices within approved scope. New business/product/visual decisions require human authority.

Builder: one assigned task. Reads minimum context, reuses existing patterns first, implements assigned scope completely, avoids unauthorized TODOs/stubs/mocks, runs relevant local checks, writes implementation evidence and returns. It does not modify specs, change phase, commit, call Reviewer or expand scope.

Reviewer: independent task gate. Checks acceptance, correctness, regressions, maintainability, and relevant security/accessibility/UI concerns. It does not fix code. Use `REVIEW_CONFLICT` when implementation and approved contract genuinely conflict.

## 24. Generated project lifecycle

Initial:

```text
READY_TO_BUILD
```

Lifecycle:

```text
READY_TO_BUILD
→ FOUNDATION
→ BUILD_TASKS
→ INTEGRATION
→ LOCAL_PREVIEW
→ VISUAL_QA
→ HUMAN_PREVIEW
→ E2E
→ QUALITY_GATE
→ READY_TO_DEPLOY
→ HUMAN_DEPLOY_APPROVAL
→ DEPLOY
→ POST_DEPLOY
→ VAULT_WRITE
→ DONE
```

Only Orchestrator writes lifecycle state. Use write-before-act and write-after-result.

## 25. Task loop

Operational stages:

```text
IMPLEMENTING
READY_FOR_REVIEW
CHANGES_REQUESTED
APPROVED
```

Loop:

```text
Orchestrator selects TASK
→ persist ACTIVE / IMPLEMENTING
→ Builder
→ persist result
→ Reviewer
→ PASS?
   ├─ NO → targeted correction → re-review
   └─ YES → APPROVED
→ Orchestrator marks DONE
→ commit approved state
→ next task
```

`HEAD` represents last approved committed state. Unapproved work remains in working diff.

## 26. `.workflow`

Exactly:

```text
.workflow/
├── state.json
└── current/
    ├── implementation.md
    └── review.md
```

No growing history directory. Current docs represent current operational truth. Durable task status lives in `tasks.md`; code history lives in Git.

## 27. Recovery

Fresh session:

```text
user: inicia
→ read CLAUDE.md
→ read .workflow/state.json
→ load minimum files required for current state
→ resume
```

Do not re-read the whole repo by default. Interrupted deployment recovery must inspect observed Vercel state before any retry to avoid duplicate remote operations.

## 28. Model policy

Builder-side preferred policy:

```text
Discovery / Planning / Spec Review → Opus xhigh
Creation / Validation mechanics → Sonnet high
```

Generated project initial preferred policy:

```text
Orchestrator → Sonnet high
Planner → Opus xhigh
Builder → Sonnet xhigh
Reviewer → Sonnet xhigh
Visual QA → Opus xhigh
E2E → Opus xhigh initially
Quality/mechanical checks → Sonnet high + tools/scripts
Deploy/Post-deploy → Sonnet high
```

This is an operational preference and may be revisited if Claude Code model capabilities change materially.

## 29. Foundation, integration and preview

The generated project begins real implementation only after the user opens the new repo in a fresh Claude Code session.

Foundation may establish verified dependencies, tokens, stack baseline, backend connection when required, testing foundation and initial shared primitives within approved specs.

Integration verifies cross-feature behavior, routes, shared state, backend/integration boundaries and product coherence without broad redesign.

Local Preview then Visual QA. Visual QA uses Playwright/browser evidence and compares representative desktop/tablet/mobile/states to `design-system.md`. It may identify mismatch but must not invent a new visual direction.

## 30. Human Preview

Mandatory after Visual QA and before E2E. Human reviews local application. Requested changes trigger targeted correction, affected review/Visual QA and reapproval where needed. Never silently proceed without approval.

## 31. E2E

Use Playwright Test for persistent reproducible E2E. Focus on real agreed flows. Mocks may help local development, but final critical flows should use real system behavior where feasible.

## 32. Quality Gate

Controlled by Orchestrator, not one giant skill.

Always/applicably include lint, typecheck, build, tests, E2E status, accessibility baseline, dependency/security checks, workflow consistency and no unresolved blockers.

Conditional checks: Lighthouse/performance, SEO, Supabase/RLS, auth/roles, public-route behavior, schema/integration checks and project-specific requirements.

Gate verifies the agreed product; it does not redefine it. On failure, make targeted corrections and rerun affected checks; broaden only when structural.

## 33. Performance / SEO / accessibility

Performance: Lighthouse provides evidence; interpret LCP/INP/CLS, bundles, images, fonts, hydration, rerenders and network/runtime bottlenecks. Do not chase perfect scores at the expense of approved design.

SEO: applicability is determined by product intent. Public/organic projects may require indexability, robots, sitemap, canonical, metadata, headings, URLs, structured data, semantic images/links. Private apps may appropriately use minimal SEO/noindex. Do not invent SEO strategy at Quality Gate.

Accessibility: use axe plus keyboard/focus and behavioral checks. Axe PASS does not equal accessibility PASS.

## 34. Deploy readiness and Vercel

Do not keep `pre-deploy-verification` as a skill.

Ready-to-deploy conditions:

```text
Visual QA PASS
Human Preview approved
E2E PASS
Quality Gate PASS
no blockers
workflow consistent
phase = READY_TO_DEPLOY
```

Then require explicit human production deploy approval.

Remote Vercel operations use Vercel MCP as primary path. Verify connection/auth before deploy. Persist external operation before remote action. If MCP unavailable, block; do not silently fallback to CLI. Any exception requires explicit human approval.

Known environment variables may be configured when authorized. Never persist secret values in specs/logs/Vault.

Deployment READY does not equal application verified.

## 35. Post-deploy

Verify actual production behavior: unauthenticated access to public routes, expected app auth on protected routes, critical smoke flow, important integration reachability, final production URL and deployment status. Public routes must not accidentally require Vercel login unless private access was explicitly required.

## 36. Vault bridge

Vault is a separate knowledge system, not a global project harness.

`vault-write`: automatic/final handoff after successful Post-deploy. Write one structured RAW pending document with purpose/scope, requirements summary, final architecture, stack/relevant versions, data model, auth/RLS, routes/modules, design system, important components, decisions, integrations/dependencies, production URL, repo URL, last known commit/hash, general structure, environment variable names only, problems/lessons and final status. Never include secrets. Vault's own harness later organizes/tags/dedupes/links.

`vault-search`: human-triggered only. Project agents must never autonomously query the Vault. Retrieve only narrow relevant excerpts when explicitly requested by the user.

## 37. Builder handoff boundary

```text
READY_TO_CREATE
→ CREATING_PROJECT
→ create-project
→ baseline Git commit
→ VALIDATING_PROJECT
→ validate-project
→ VALIDATION_PASS
→ HANDOFF_COMPLETE
→ report generated repo path
→ reset-builder
→ IDLE
```

Then the user opens:

```text
C:\SkormJF\Projects\PagesProjects\<slug>
```

in VS Code, starts a fresh Claude Code session and says `inicia`. Only then does implementation begin.

## 38. Legacy cleanup targets

Inspect the whole repository for active assumptions involving:

```text
site/
PROJECT-BRIEF.md
project-per-branch flows
integracion branch assumptions
old Builder phases
old generated-project workflows
old QA phase references
removed skill references
AGENTS.md assumptions
Codex-specific instructions
obsolete deployment flows
duplicated QA gates
stale README/docs
obsolete tool dependencies
duplicated skill rules
legacy image-generation methodology
Chrome-bridge normal-path assumptions
```

Do not delete by blind string match; understand context and classify first.

## 39. Migration execution order

Phase 0 — Safety: inspect Git status, preserve existing uncommitted user work, create baseline commit `chore: baseline before web-builder rebuild`. No rebuild edits before baseline.

Phase 1 — Full inspection: root files, CLAUDE, README/docs, questionnaire/discovery material, every skill plus relevant references/data/scripts, package/scripts, MCP config, branch/site assumptions, templates, QA/deploy logic. Do not assume the earlier ZIP and migration-time repo are identical.

Phase 2 — Migration proposal, no edits: produce concrete `KEEP/MOVE/REWRITE/ABSORB/CREATE/REMOVE` map old → new owner. Review against this REBUILD-PLAN before any changes.

Phase 3 — Core rebuild recommended order:

```text
1. root CLAUDE.md
2. Builder state/workflow contract
3. spec-reviewer.md
4. Discovery/questionnaire
5. Artifact flow
6. specification templates/contracts
7. Spec Gate
8. builder config
9. stack profiles
10. common generated-project template
11. generated agents
12. generated workflow template
13. three scripts
14. skill inheritance composition
15. skill migration/rewrite
16. docs/README cleanup
17. legacy residue cleanup
```

Phase 4 — Verify after coherent blocks: inspect diff, verify no contradiction, run relevant checks, commit approved migration progress. Do not combine unrelated large rewrites into one commit.

## 40. Migration skill rules

For every legacy skill: read complete `SKILL.md`; inspect material references/data/scripts; identify unique useful knowledge; classify ownership; preserve only what remains correct; move knowledge to correct owner in condensed form; remove duplicated workflow/authority/version assumptions; delete absorbed skill after destination is verified; verify no active references remain.

`artifact-design` must be reverified in the migration-time repo before creating it, because the repo may have changed since the earlier audit.

## 41. Final migration verification

Builder checks:

```text
stable repo
no generated project inside Builder
no active site/
.builder/current/ gitignored
one-project recovery works
CONTINUE / ABANDON works
Spec Gate works
human approval gate works
exactly three top-level mechanical scripts
projects root correct
stack profiles resolve
templates resolve
skill inheritance deterministic
removed skills no longer referenced
no active old workflow contradictions
```

Generated template checks:

```text
root = repo/app/harness
Git initializes
baseline commit exists
READY_TO_BUILD
required specs present
Planner/Builder/Reviewer present
standard inherited skills present
profile skills correct
removed legacy skills absent
package/lockfile valid
install/lint/typecheck/build/smoke pass
```

## 42. Final audit

After migration, package the rebuilt repo for independent audit. Exclude generated/large/sensitive material such as `node_modules`, `.next`, `dist`, `build`, `coverage`, caches, `.git`, `.env` and secrets. Include harness, templates, skills, scripts, config, package/lockfiles and docs.

Audit against original repository, this REBUILD-PLAN, approved decisions, legacy cleanup targets and generated-project contract. Classify any mismatch as intentional improvement, required technical deviation, migration defect or missing migration. Do not accept unexplained drift.

## 43. Final Factory Test

Builder E2E:

```text
IDLE
→ Discovery rounds
→ interactive Artifact
→ human visual approval
→ Planning
→ specs
→ mechanical Spec Gate
→ Spec Reviewer
→ human spec approval
→ READY_TO_CREATE
→ create target project
→ baseline commit
→ validate generated project
→ HANDOFF_COMPLETE
→ reset-builder
→ IDLE
```

Use a real test target under `C:\SkormJF\Projects\PagesProjects\<test-slug>`.

Then open the generated repo in a fresh VS Code / Claude Code session and say `inicia`.

Verify generated lifecycle:

```text
READY_TO_BUILD
→ FOUNDATION
→ BUILD_TASKS
→ INTEGRATION
→ LOCAL_PREVIEW
→ VISUAL_QA
→ HUMAN_PREVIEW
→ E2E
→ QUALITY_GATE
→ READY_TO_DEPLOY
→ HUMAN_DEPLOY_APPROVAL
→ DEPLOY
→ POST_DEPLOY
→ VAULT_WRITE
→ DONE
```

The pilot is the proof that the architecture works.

## 44. Context and token discipline

Goal: reduce unnecessary context consumption without promising a fixed token reduction before measurement.

Use state-first recovery, minimum file loading, one task at a time, isolated agents, dormant Planner, on-demand skills, progressive disclosure, no growing workflow-history Markdown, scripts for mechanical work and compact current operational files.

Use `/compact` at safe boundaries when useful. A safe boundary is after Reviewer PASS, state persisted, approved task committed and current operational docs reset. Use `/clear` when a fresh session is appropriate. Measure actual context/token behavior during the Factory Test before making quantitative claims.

## 45. Definition of rebuild complete

The rebuild is complete only when:

```text
1. migrated Web Builder matches this architecture
2. legacy conflicts are removed or intentionally documented
3. stack profiles/templates are validated
4. skills have final ownership with no major duplication
5. create-project works safely
6. validate-project proves generated repo is ready
7. reset-builder safely returns Builder to IDLE
8. generated repo starts independently with "inicia"
9. generated project harness can complete its lifecycle
10. final audit finds no unexplained drift
```

Until the Factory Test passes, the rebuild is structurally complete but not operationally proven.
