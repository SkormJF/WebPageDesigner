---
name: artifact-design
description: Build the interactive artifact that carries a proposed visual direction to a human for approval, element by element. Use in Discovery Round 4, and whenever a visual direction needs to be seen and agreed rather than described.
---

# Artifact Design

The artifact exists to be **approved**, not admired and not shipped. Its whole job is to turn a visual
direction into something a person can look at, argue with, and say yes to — one element at a time.

It is a real page, not a picture of one. That distinction is the reason it exists: a static image cannot
show a hover, a keyboard focus ring, or a disabled control, and those are precisely the decisions that
otherwise go unmade until a component is already written and somebody improvises them per section.

**And what gets approved becomes fact.** The artifact is built from real values, so approving the button
approves its exact colour, radius, height, padding and hover state — already written down.

`design-system.md` is written **from** this artifact: it copies the approved values verbatim. It does not
re-derive them and it does not quietly improve on them. That makes this the one place in the system where a
visual decision is genuinely made — and the reason everything downstream, this skill included, defers to the
contract once it exists.

---

## What it must contain

Enough to approve the **system**, which is not the same as showing every final screen. Include, as the
product warrants:

- **The palette**, in blocks large enough to judge, with their values visible.
- **A type specimen** — a real heading in the heading face, a real paragraph in the body face, at the sizes
  they will actually be.
- **Buttons in every state.** Primary, secondary, quiet. Hover, keyboard focus, disabled — working, because
  they are real CSS.
- **A form field**, with its label, its focus state and its error state.
- **The card or block that will repeat.** The one that appears eleven times, shown once.
- **The section rhythm** — how a page is paced, what alternates, where it breathes.
- **Navigation**, at the width where it changes.
- **The application shell**, when there is one: sign-in, and the frame the panel lives in.
- **Motion**, where motion is part of the proposal.

Use the intended fonts. Self-hosted or downloaded faces are valid and are better than a disclaimer — if the
face genuinely cannot be loaded, say so **on the page, next to the specimen**, and be specific about what is
real and what is approximated. A human who approves lettering they will not receive has approved nothing.

---

## This skill has no aesthetic of its own

The direction comes from Discovery — from what the user said, what they showed you, and what the product
needs. The artifact's job is to render **that** direction faithfully enough to be judged.

It must be able to carry any of these equally well, and favour none of them in advance:

```
minimal · maximal · editorial · corporate · playful · luxury · brutalist
centred · asymmetric · monochrome · colourful · static · motion-heavy
```

If the discovered direction is rigorously centred, symmetrical, monochrome and still, then a lopsided,
colourful, animated artifact is not a better proposal — it is the wrong proposal, and approving it would
commit the product to something nobody asked for. Build what was discovered, at full strength.

## Composition — what makes it worth approving

An artifact that is a tidy grid of swatches is a style guide. It shows the parts and hides the decision.

**Lead with the idea.** Every direction worth approving has one sentence behind it — what it is doing and
why it fits this product. Put that first, then let the page demonstrate it.

**Show the hierarchy the direction actually has, at full strength.** If it is dramatic, let something
dominate and something be quiet. If it is deliberately even and systematic — a Swiss grid, a dense
dashboard — show that evenness convincingly. What must not happen is hierarchy flattening into "everything
medium" by accident, because then there is nothing for the human to approve or reject.

**Show the section rhythm the direction implies**, whether that is strong variation or a steady beat. The
artifact is a promise about how the product will feel to move through.

**Show the real content shape.** Real-length headlines, plausible names, believable numbers. Lorem ipsum
and "Card Title" hide exactly the problems the artifact should surface — the headline that wraps to three
lines, the name that overflows, the price column that does not align.

**Materiality with intent.** Texture, weight and surface treatment that mean something in this product —
whether that means rich material or none at all. Not effects applied because they are available.

**Make the colour structure legible.** However many colours the direction uses, the artifact should make
clear what each one is *for* — which surface dominates, what an accent marks, what stays neutral. A
five-colour palette is fine when each colour has a job; it is a problem when nobody could apply it
consistently afterwards. That is a question about roles, not about count.

---

## The approval conversation

**Element by element. Not "¿te gusta?"**

Present each of these on its own and resolve it before moving to the next:

```
palette · typography · button style · layout and composition
· backgrounds and texture · overall tone · (where they exist) the sign-in and panel shell
```

Each gets its own yes-or-change. **Do not advance while one is unresolved** — a general "looks good" collects
approval for things the human has not actually looked at, and they discover it after the build.

When they ask for a change, make it and **republish to the same URL**. They refresh; no stray links pile up
and there is never a question of which version was approved.

**Record the approved values as they ended up.** Not the proposal, the outcome.

---

## Listen for a need underneath a preference

Some answers are not taste and must not be treated as taste.

"Oscuro no, que luego no veo bien el texto" is a use condition, and it is frequently shared with the
product's audience rather than personal. When something like it appears, adjust — and record it in the
design system **as an accessibility decision, with its reason attached**, so a later polish pass does not
read it as an oversight and undo it.

This is conditional. It applies when the condition actually surfaces, not as a default applied to every
project.

---

## What the artifact must never trade away

The human decides the taste, and there is no house style here to defend. A client who wants a heavily
blurred surface, oversized display type, a centred layout or motion everywhere is making a decision, not a
mistake. Where a choice is one that commonly goes wrong, say the risk once, briefly — then build it as well
as it can be built and record it as their call, so a later pass does not "fix" it.

These are not on that list, because they are not preferences:

- **Contrast below AA.**
- **Focus indicators removed.**
- **Motion with no reduced-motion path.**
- **Text baked into an image.**
- **A custom cursor replacing the system one** — it costs users with motor or vision impairments the one
  affordance they depend on. Offer something that *adds* to the cursor instead, disabled under reduced
  motion and on touch.

The first list is about looking generic. The second is about excluding people, and it is not the client's
to trade away on someone else's behalf. Say so once, plainly, without moralising, and move on.

---

## Publishing

Self-contained: inline the CSS, embed what the page needs, assume no external requests will succeed.

Responsive, because the human will open it on a phone. Wide content scrolls inside its own container; the
page body never scrolls sideways.

Readable in both light and dark, unless the direction deliberately commits to one — in which case paint the
background explicitly rather than inheriting whatever is behind it.
