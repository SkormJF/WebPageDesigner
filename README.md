> **[Léelo en español (README.es.md)](README.es.md)**

# Web Builder — Project Factory

This repository does not build products. It **specifies** them, then generates the repository that builds
them.

You describe what you want. It runs discovery, gets the visual direction approved on a real interactive
page, writes five complete specifications, has them reviewed by an independent agent, asks for your
approval, and then generates a **new, independent repository** — with its own git history, its own harness,
its own agents and its own skills.

You open that repository in a fresh Claude Code session, say `inicia`, and implementation starts there.

```
WEB BUILDER          discovery · visual direction · specifications · generation · validation
GENERATED PROJECT    implementation · review · integration · QA · deploy · maintenance
```

The boundary is the point. A factory that also builds the product ends up with neither job done properly.

---

## Requirements

| What | Why |
|---|---|
| **Claude Code** | Runs the Builder |
| **Node.js 20+** | The scripts and both stack templates |
| **Git** | Every generated project starts as a repository |

Generated projects land in `C:\SkormJF\Projects\PagesProjects\<slug>`, configured in
[`builder.config.json`](builder.config.json).

---

## Running it

Open this repository in Claude Code and describe what you want built. That is the whole interface.

What happens, in order:

```
IDLE → DISCOVERY → PLANNING → SPEC_REVIEW → AWAITING_APPROVAL → READY_TO_CREATE
     → CREATING_PROJECT → VALIDATING_PROJECT → HANDOFF_COMPLETE → RESET → IDLE
```

**Discovery** is a conversation in four rounds — what the product is, what it says, how it behaves (only
when it has real functionality), and how it looks. The last round ends with an interactive artifact you open
in a browser and approve **element by element**: palette, typography, buttons, layout, backgrounds, tone.
Not a picture of a design — a real page, so hover, focus and disabled states are decisions you actually make
rather than ones somebody improvises later.

**Planning** turns that into five specifications, each owning exactly one thing:

| File | Owns |
|---|---|
| `PROJECT.md` | Identity and scope |
| `requirements.md` | What the product must do |
| `design.md` | How, technically |
| `design-system.md` | The approved visual contract |
| `tasks.md` | The work, decomposed and traceable |

**The gate** is three conditions, and all three must pass:

```
Mechanical Spec Gate  +  Spec Reviewer  +  your explicit approval  =  READY_TO_CREATE
```

The mechanical half checks structure — files, IDs, references, placeholders. The
[Spec Reviewer](.claude/agents/spec-reviewer.md) is a separate agent that checks whether the specs are
*right*: complete, consistent, traceable, feasible, and faithful to what you actually approved. It reports
and never fixes.

**Generation** composes the new repository, installs its dependencies, makes one baseline commit, validates
the result, and tells you the path.

---

## Stack profiles

| Profile | Stack | Status |
|---|---|---|
| `next-standard-v1` *(default)* | Next.js 16 · React 19 · Tailwind 4 · TypeScript 5 · ESLint | supported |
| `react-vite-standard-v1` | React 19 · Vite 8 · react-router 8 · Tailwind 4 · TypeScript 6 · oxlint | supported |

A profile counts as supported only once its template really installs, lints, typechecks, builds and passes
its Playwright and axe specs. Both did, on this machine, on the date recorded in each profile. The exact
versions live in each template's `package.json` and lockfile — those are the authority, not this table.

---

## What a generated project gets

```
project/
├── CLAUDE.md              its own harness contract
├── PROJECT.md  requirements.md  design.md  design-system.md  tasks.md
├── .claude/
│   ├── agents/            planner · builder · reviewer
│   └── skills/            17 standard + the profile's additions (19 today)
├── .workflow/             state.json + current/
├── .mcp.json              Vercel + Supabase
├── src/  public/
└── package.json  package-lock.json
```

The skill set is deterministic: the 17 marked `inherited-standard` plus whatever the chosen profile adds —
19 for both profiles today. The Builder's own catalogue is 20, and the difference is `chrome-bridge-automation`,
classified `optional`. It is **never** copied automatically. Shipping it by default would turn "requires an
explicit decision" into a sentence in a document, with the skill already sitting in the repository.

Its own lifecycle runs from `READY_TO_BUILD` to `DONE`, one task at a time, each implemented by a Builder
agent and gated by an independent Reviewer before anything is committed. `HEAD` is always the last approved
state.

Agents load skills through the `Skill` tool when a task needs one. Nothing is preloaded.

---

## The three scripts

```bash
npm run create-project -- --slug <slug> [--profile <id>]
npm run validate-project -- --slug <slug>
npm run reset-builder -- --yes
```

Exactly three, and they are mechanical only. Nothing here reasons about a product — discovery, planning,
design and review are conversations, and a script that pretended to do them would only be hiding the
judgement it skipped.

`create-project` refuses more than it does: any phase other than `CREATING_PROJECT`, a mismatched slug, a
missing spec, a failed gate, an absent skill, and above all an occupied target — it never overwrites, never
merges, and never invents `<slug>-2`.

The stack profile is read from the approved `design.md`. `--profile` on either script is an assertion, not a
selector: it may confirm what `design.md` says and it may not overrule it.

`validate-project` proves and repairs nothing. A validator that fixed what it found could not tell you what
was broken.

`reset-builder` deletes exactly one directory and takes no path argument.

---

## Repository layout

```
.claude/
  agents/spec-reviewer.md     the Builder's only subagent
  skills/                     20 skills, the distribution source
config/
  skill-manifest.json         classifies how each skill is distributed
  stack-profiles/             the two profiles, each owning its own profile_skills
templates/
  common/                     how every generated project works
  stacks/                     validated, runnable stack baselines
scripts/                      create · validate · reset
tests/                        the core contract, as node --test invariants
.builder/current/             the active project (gitignored)
```

[`CLAUDE.md`](CLAUDE.md) is the operating contract; this README describes it and never overrides it.
[`tests/core-contract.test.mjs`](tests/core-contract.test.mjs) holds the invariants that must not regress —
run it with `node --test tests/core-contract.test.mjs`.

---

## License

All rights reserved — see [LICENSE](LICENSE). Private project, not licensed for redistribution.

Created by [@Soyenriquerocha](https://github.com/Soyenriquerocha) / [Tododeia](https://tododeia.com)
