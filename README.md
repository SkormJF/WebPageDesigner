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
GENERATED PROJECT    foundation · complete product build · focused reviews · QA · deploy · maintenance
```

The boundary is the point. A factory that also builds the product ends up with neither job done properly.

---

## Requirements

| What | Why |
|---|---|
| **Claude Code** | Runs the Builder |
| **Node.js 20+** | The scripts and the fixed Next template |
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
in a browser. The Builder names the major visual-system decisions — palette, typography, buttons, layout, backgrounds and
tone — and you approve that direction in one gate when nothing is contested. It is a real page rather than a picture, so
hover, focus, states and rhythm can be inspected before they become the visual contract instead of being improvised later.

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

**Twice it will ask you to cut the context** — once the artifact is approved, and once the specs are. A
`CONTEXT CHECKPOINT` appears, the session stops, and you run `/clear` and then `continúa`. Nothing is lost:
everything approved is already on disk and is read back from there. These are fixed stops in the flow, not a
suggestion that depends on how the session is going.

---

## Platform

There is one supported application baseline:

| Platform | Stack | Status |
|---|---|---|
| `next-standard-v1` *(fixed)* | Next.js 16 · React 19 · Tailwind 4 · TypeScript 5 · ESLint | supported |

Planning does **not** choose a framework. Every generated application is Next.js. It chooses only the application
backend mode: `none` for a simple/backend-less project, or `supabase` when the product owns persistent data, Auth,
storage, realtime or database-enforced authorization. External APIs remain integrations. The exact runtime versions live
in the Next template's `package.json` and lockfile.

---

## What a generated project gets

```
project/
├── CLAUDE.md              its own harness contract
├── PROJECT.md  requirements.md  design.md  design-system.md  tasks.md
├── .claude/
│   ├── agents/            planner · builder · reviewer
│   └── skills/            17 standard + 2 Next additions (19 today)
├── .workflow/             phase state + stack-profile.json + compact current evidence
├── .mcp.json              Vercel always; Supabase only when Backend Mode = supabase
├── .claude/settings.json  no automatic model pin
├── src/  public/
└── package.json  package-lock.json
```

The skill set is deterministic: the 17 marked `inherited-standard` plus the fixed Next profile's 2 additions — 19 today. The Builder's own catalogue is 20, and the difference is `chrome-bridge-automation`,
classified `optional`. It is **never** copied automatically. Shipping it by default would turn "requires an
explicit decision" into a sentence in a document, with the skill already sitting in the repository.

Its implementation runs `FOUNDATION → FOUNDATION_REVIEW → PRODUCT_BUILD → BUILD_REVIEW`. Product Build constructs the
complete integrated product without per-task review cycles. The later `LOCAL_PREVIEW`, `VISUAL_QA`, `HUMAN_PREVIEW`, one
final-candidate `E2E`, and `QUALITY_GATE` each own a different question. A failed review receives one targeted correction
and one targeted recheck; a second failure stops for the human. Supabase uses the same scoped MCP for Builder mutations and
generic Reviewer read-only inspection—there is no second DB Reviewer or connection.

The inherited skill library stays available for future features and redesigns. Agents load the full body of a skill on
demand for the current scope rather than walking the catalogue before they work.

---

## The three scripts

```bash
npm run create-project -- --slug <slug>
npm run validate-project -- --slug <slug>
npm run reset-builder -- --yes
```

Exactly three, and they are mechanical only. Nothing here reasons about a product — discovery, planning,
design and review are conversations, and a script that pretended to do them would only be hiding the
judgement it skipped.

`create-project` refuses more than it does: any phase other than `CREATING_PROJECT`, a mismatched slug, a
missing spec, a failed gate, an absent skill, and above all an occupied target — it never overwrites, never
merges, and never invents `<slug>-2`.

The stack is fixed by `builder.config.json`/the Next profile and is not restated as a project choice in `design.md`; neither script accepts a stack selector. Backend Mode (`none` or `supabase`) is read from the approved `design.md`.

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
  stack-profiles/             the fixed Next profile and its Next-specific skills
templates/
  common/                     how every generated project works
  capabilities/supabase/      conditional read-only DB review capability
  stacks/next-standard-v1/    validated, runnable Next baseline
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
