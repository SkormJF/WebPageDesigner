---
name: atomic-design
description: Component identity, reuse-first thinking, variants, and the size and state scales that keep an interface consistent. Conceptual only — it does not impose atoms/molecules/organisms directories. Use when planning a component inventory, writing a shared component, or reviewing one for duplication or over-abstraction.
---

# Atomic Design

Conceptual, not structural. **Do not create `atoms/`, `molecules/` and `organisms/` directories.** Sorting
files by abstraction level tells you nothing about where a thing is used and forces a judgement call —
"is a search field a molecule or an organism?" — that has no correct answer and no consequence either way.

What survives from the idea is the useful part: some things are indivisible, some things are built from
them, and knowing which is which changes where a decision belongs.

Components live where their feature lives. Shared ones live in `components/ui` (no product knowledge) and
`components/shared` (product knowledge, used in several places).

---

## Reuse first, but not at any cost

```
search for what exists
  → reuse it if it fits
  → extend it, or add a variant, if the identity is the same and only presentation differs
  → create something new only when it is meaningfully different
```

**The failure runs in both directions**, and only one of them is commonly guarded against.

Duplicating is visible: three copies of the same card, drifting apart. Everyone recognises it.

Forcing new work through an ill-fitting abstraction is invisible: one component with nine props, four of
which are booleans that turn parts of it off. It looks like reuse. It is harder to undo than the duplication
would have been, because unpicking it means understanding every call site at once.

The test is **identity**, not appearance. Two things that look alike and mean different things are two
components. Two things that look different and mean the same thing are one component with a variant.

---

## Name the repeats before writing the first one

A reference image, a mockup, or an approved artifact only ever shows **one instance** of a block. One
service card. One page header. One table row. It never says that the same block is about to appear eleven
times.

So before building, read the section list and name every block that will clearly repeat three or more
times, with its component name and rough anatomy:

```
ServiceCard    icon, title, description       4x in Features
PageHeader     title + optional action        every panel screen
FormField      label + control + error slot    every form
```

This is the extraction threshold — "stop at the third occurrence" — applied one step earlier. Deciding it
before the first copy exists costs nothing. Noticing it after the third copy has drifted costs a
reconciliation across three files where each has picked up a slightly different padding.

---

## The size scale

**What matters is that there is a scale, not what the numbers are.**

Pick a small number of control heights — two is usually enough — and assign them **to the component variants
themselves**, so no call site ever needs a height override. A typical pairing is a compact tier around 32px
for secondary and inline actions, and a standard tier around 44px for form fields and primary actions. That
is a common starting point, not a law.

**The real numbers come from the approved contract.** `design-system.md` records what a human approved from
a real artifact, and it decides. So do the things it was decided against: the platform, the interaction
model, the information density, whether the product is touch-first, and what accessibility the audience
actually needs. A dense data tool and a phone-first booking flow have no business sharing a number just
because a skill file suggested one.

**Why fix it up front at all:** a component's declared default height is not what pages end up using unless
it was chosen against real content. Otherwise every call site quietly overrides it, and the same final
height arrives via a different padding and font-size combination in each file depending on which override
path it took. At a dozen occurrences that stops being a one-line fix. The discipline is *one declared value
per tier*, whatever the values are.

**On touch targets, two numbers get confused in both directions.** 24×24 CSS px is the WCAG 2.2 AA
requirement; 44×44 is AAA. So a ~44px tier clears AAA and a ~32px tier is comfortably AA-compliant — a
compact control is not a violation, and inflating every control to 44px flattens the hierarchy the scale
exists to create.

That said, **accessibility outranks the hierarchy**, not the other way round. If a real audience needs
larger targets — a product for people with motor impairments, a kiosk, an audience the human told you about
— the sizes go up and the scale is rebuilt around that. Record it in `design-system.md` with its reason, so
a later pass reads it as a decision rather than an inconsistency.

Where a target must genuinely be small — a dense table, a toolbar icon — grow the hit area with padding
beyond the visual box before shrinking the box. Sufficient spacing between targets is also a documented way
to meet the criterion.

Apply the same "one value, everywhere" discipline to **border radius** (from the token scale, never an
arbitrary value at a call site) and to **small-label text size** (one value for every badge and tag, not
each settling on its own close-but-different number).

---

## The state scale

A mockup shows a control's default look. It cannot show hover, focus, disabled or error, because those only
exist at interaction time. Left undeclared, each section invents its own version and they drift exactly the
way undeclared sizes do.

Fix these once, on the component:

| State | What it needs |
|---|---|
| Hover | A change that is visible without being loud |
| Focus | A ring for keyboard navigation, using `:focus-visible` |
| Active | Pressed feedback |
| Disabled | Reduced emphasis, no pointer events, and still readable |
| Loading | Same dimensions as the resting state, so nothing jumps |
| Error | On form fields: border, text colour, and a fixed place for the message |

**A focus indicator may be replaced with a better one. It may never be removed.**

---

## Composition over configuration

When a component starts accumulating booleans that switch parts of it on and off, it wants to be composed
rather than configured.

```
Configured    <Card title showImage showFooter footerAlign="right" compact />
Composed      <Card><Card.Image /><Card.Body /><Card.Footer /></Card>
```

The composed version has no combinations to test and no prop that only makes sense when another prop is
set. It is also longer at the call site, which is the trade — take it when the number of meaningful
combinations is growing, not on principle.

---

## What to check in review

- Is this the third copy of something? Extract it.
- Is this abstraction earning its keep, or is it one component pretending to be four?
- Does every control's height come from a declared variant, not from the call site?
- Do colour, spacing and radius come from tokens, with no literal values in the component?
- Are all the declared states present, including the ones that are tedious to build?
- Does the component know something about the product that a `components/ui` component should not?
