---
name: redesign-existing-projects
description: Audit an interface that already exists and improve it inside the approved contract — separate what is broken from what merely differs from your taste, then fix the first kind within the task you were given. Use when a task calls for improving something that already exists, never as licence to modernize the rest of the product.
---

# Redesign

## Scope, before anything else

This skill improves **the surface in front of you**, inside the task you were given and the contract that
was approved. It is not a mandate to modernize a product.

```
local redesign, inside the current task
  → allowed, within the approved contract

material or global redesign
  → STOP
  → Orchestrator → Planner
  → Artifact, if the visual contract itself changes
  → human approval
```

**`design-system.md` outranks everything in this file.** Where the approved contract states a typeface, a
palette, a radius, a control height or a motion register, that is the answer — and this skill's job becomes
executing it well, not proposing something better.

Three rules govern everything below:

- **Preserve functional invariants.** A redesign that changes what something does is not a redesign.
- **Reuse before replace.** Extend the existing component before introducing a new one.
- **No opportunistic redesign.** Touching a page to fix its spacing is not permission to restyle its
  neighbours, swap its font, or replace a working component that merely looks dated to you.

## The only distinction that matters

Everything you notice falls into one of three buckets, and what you may do about it depends entirely on
which one it is.

| | What it is | What you do |
|---|---|---|
| **Broken** | It fails at its job: unreachable by keyboard, invisible focus, unreadable contrast, a dead link, a state that was never built, a layout that breaks at 375px. | Fix it inside the task. |
| **Drifted** | It contradicts `design-system.md`: a literal hex where a token belongs, a one-off control height, a missing declared state. | Fix it inside the task. The contract already decided. |
| **Different** | It works, it honours the contract, and you would have done it another way. | **Leave it.** Say so if it is worth saying, once, and move on. |

The third row is where this skill used to do damage. An interface being generic is not the same as an
interface being broken, and "I would have picked another typeface" is not a finding — it is a preference
about a decision a human already made from a real artifact.

## How this works

1. **Scan** — read the code. Identify the framework, the styling method, and the patterns already in use.
2. **Read the contract** — `design-system.md` for what was approved, the task for what you were asked to do.
3. **Sort what you find** into broken / drifted / different, with locations.
4. **Check scope** — anything material or beyond the current task stops here and goes to the Orchestrator.
5. **Fix the first two buckets** with targeted changes working inside the existing stack. Never a rewrite.

## Where weaknesses actually cluster

Signals worth checking, not orders to carry out. Each one is a place to look; whether it is broken, drifted
or merely different is the judgement you have to make on the spot.

### States and interaction

The richest source of real findings, and the most often genuinely missing. Existing interfaces routinely
have a default appearance and nothing else.

- Hover, active, disabled, loading, empty and error states — present, or only imagined?
- Focus indicators: visible, and never removed. If `outline: none` appears with no replacement, that is
  broken, not a matter of taste.
- Buttons that link to `#`, forms with no validation feedback, an empty list with no empty state, a dialog
  with no way back.
- Transitions that were declared in the contract and never implemented.

### Contract compliance

- Literal colour, radius, spacing or shadow values on call sites where tokens exist.
- One-off control heights instead of the declared tier.
- A component styled differently in two places for no stated reason.
- Animation with no `prefers-reduced-motion` path.

### Structure and rhythm

- Content measure — very long lines are a real readability problem, not a stylistic one.
- Inconsistent padding where a spacing scale exists.
- Alignment across side-by-side elements: titles, prices and buttons landing at different heights read as
  broken to most people, because it usually is.
- Behaviour at the contract's declared breakpoints — horizontal scroll at 375px is a defect.
- `100vh` on mobile, where `100dvh` is what was meant.

### Semantics and code health

- `div` where a landmark element belongs, heading levels that skip, images whose `alt` says nothing.
- Arbitrary `z-index` values instead of a scale.
- Commented-out dead code and debug artifacts.
- Imports of packages that are not in `package.json`.

### Content placeholders

Lorem ipsum, `John Doe`, `Acme Corp`, a repeated avatar, identical dates on every post. These are unfinished
work rather than design opinions, and they are in scope when the task covers that surface.

For the copy itself — tone, phrasing, whether it reads as machine-written — that belongs to `humanizalo`,
subordinate to `requirements.md` as always.

## Fix priority

Where several genuine findings compete for one task's attention, this order gives the highest payoff at the
lowest risk. It is a triage aid, not a checklist to execute.

1. **Missing interaction states** — almost always the largest real improvement.
2. **Spacing and rhythm** — inconsistent padding and a missing scale read as unfinished.
3. **Layout** — measure, alignment, grid, where the eye goes first.
4. **Contrast and colour application** — within the approved palette.
5. **Typography scale** — sizes and weights, within the approved faces.
6. **Component consistency** — the same block behaving the same way everywhere.

**Typography and palette themselves are not on this list**, and that is deliberate. Swapping a typeface or
recolouring an interface changes the approved visual contract. If the contract is wrong, that goes to the
human through the Planner — it is not a redesign task's decision, however obvious the improvement looks.

## What this skill never does on its own initiative

Each of these was a standing instruction in an older version of this guidance, and each one changes a
product without anybody deciding to:

- **Swap the typeface** — including replacing Inter because it is common.
- **Desaturate or re-tint the palette** across the interface.
- **Reduce everything to a single accent colour.**
- **Add grain, noise or texture overlays** that nobody asked for.
- **Break a centred or symmetrical layout** into asymmetry as a matter of taste.
- **Change the grid** where the existing one works.
- **Impose spring physics** or any other motion register over the approved one.
- **Modernize surfaces** — glassmorphism, tinted shadows, spotlight borders — outside the task's scope.
- **Replace a working component** because a more fashionable pattern exists.

Any of these may be exactly right. As a **proposal**, with a reason, to the human who owns the contract.

## Where the rest of this knowledge lives

This skill deliberately no longer carries an aesthetic catalogue. Those decisions have owners:

| For | Go to |
|---|---|
| Whether a direction reads as generic, and the aesthetic judgement behind it | `frontend-design` |
| Motion — springs, stagger, easing, whether it should animate at all | `emil-design-eng` |
| Component identity, variants, reuse, size and state scales | `atomic-design` |
| Keyboard, focus, contrast and the barriers axe cannot see | `accessibility-audit` |
| How the copy reads | `humanizalo` |
| The approved contract for this project | `design-system.md` |

## Rules

- Work with the existing stack. Do not migrate frameworks or styling libraries.
- Do not break existing functionality. Verify after every change.
- Check the project's dependencies before importing anything new.
- Check a styling library's actual version before touching its configuration.
- Keep changes reviewable and focused. A reviewer who cannot tell which change caused which effect cannot
  approve either.
