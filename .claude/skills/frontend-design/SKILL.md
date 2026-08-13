---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Apache 2.0. Based on Anthropic's frontend-design skill.
---

This skill helps an interface arrive at a direction **on purpose** rather than by default, and then execute
it precisely. It supplies craft and judgement. It carries no workflow and no authority.

## Where the direction comes from

```
Discovery → Artifact → human approval → design-system.md
```

**Once `design-system.md` exists, it decides and this skill executes.** If the approved direction is Inter,
centred, pure black on pure white, perfectly symmetrical, with three accent colours — that is the answer,
and the work here is to build it beautifully. Nothing below overrules an approved contract, and a skill
that "improves" on one is changing a product the human already signed off.

Before that contract exists — during Discovery, while proposing a direction — everything below is live.

**What "anti-generic" means here:** avoiding choices made *by default*, not banning particular styles. A
centred layout chosen because centring was easiest is the problem. A centred layout chosen because the
content is a single column of prose is just correct. The test is always *why*, never *what*.

## Design Direction

When there is a direction to find, find a committed one:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Somewhere real on the range — brutally minimal, maximalist, retro-futuristic, organic, luxury,
  playful, editorial, brutalist, art deco, soft/pastel, industrial. Many flavours; pick one and mean it.
- **Constraints**: Framework, performance, accessibility.
- **Differentiation**: What is the one thing someone will remember?

Bold maximalism and refined minimalism both work. The variable is intentionality, not intensity.

Then implement working code that is production-grade, cohesive, and refined in its details.

## Frontend Aesthetics Guidelines

Everything in this section is a **heuristic for spotting a default**, not a rule. Each `DON'T` names
something that is frequently generated without a reason — which makes it worth a second look, not
forbidden. When the approved direction calls for it, or when you have a reason, do it and do it well.

### Typography
→ *Consult [typography reference](reference/typography.md) for scales, pairing, and loading strategies.*

Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font.

**DO**: Use a modular type scale with fluid sizing (clamp)
**DO**: Vary font weights and sizes to create clear visual hierarchy
**WATCH**: Reaching for Inter, Roboto, Arial, Open Sans or a system stack *because it was the first thing to hand*. Each is an excellent typeface — Inter in particular is a deliberate, defensible choice for dense product UI, and the system stack is the right answer when the first paint matters more than the personality. The question is whether it was chosen or defaulted into
**WATCH**: Monospace as shorthand for "technical" when nothing is actually code or data
**DON'T**: Put large icons with rounded corners above every heading—they rarely add value and make sites look templated

### Color & Theme
→ *Consult [color reference](reference/color-and-contrast.md) for OKLCH, palettes, and dark mode.*

Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

**DO**: Use modern CSS color functions (oklch, color-mix, light-dark) for perceptually uniform, maintainable palettes
**DO**: Tint your neutrals toward your brand hue—even a subtle hint creates subconscious cohesion
**DON'T**: Use gray text on colored backgrounds—it looks washed out; use a shade of the background color instead
**WATCH**: Untinted pure black (#000) and pure white (#fff). A slight tint usually reads warmer and more deliberate — but pure monochrome is a real editorial and brutalist position, and when that is the direction, commit to it rather than softening it into off-grey
**WATCH**: The generated palette — cyan-on-dark, purple-to-blue gradients, neon on black. Common because it is the default output, not because it is wrong
**WATCH**: Gradient text on metrics and headings; usually decorative rather than meaningful
**WATCH**: Landing on dark mode with glowing accents without deciding to. Dark is a strong direction when chosen for the content

### Layout & Space
→ *Consult [spatial reference](reference/spatial-design.md) for grids, rhythm, and container queries.*

Create visual rhythm through varied spacing—not the same padding everywhere.

**DO**: Create visual rhythm through varied spacing—tight groupings, generous separations
**DO**: Use fluid spacing with clamp() that breathes on larger screens
**DON'T**: Wrap everything in cards—not everything needs a container
**DON'T**: Nest cards inside cards—visual noise, flatten the hierarchy
**WATCH**: Identical card grids — same-sized cards with icon + heading + text, repeated endlessly
**WATCH**: The hero metric template — big number, small label, supporting stats, gradient accent
**WATCH**: Uniform spacing everywhere; without rhythm, layouts feel monotonous
**WATCH**: Centring by reflex. Asymmetry and a deliberately broken grid are strong tools, and so is a rigorously centred, symmetrical composition — classical, editorial and luxury directions depend on it. Neither is the default answer; the content and the approved direction decide

### Visual Details
**DO**: Use intentional, purposeful decorative elements that reinforce brand
**DON'T**: Use glassmorphism everywhere—blur effects, glass cards, glow borders used decoratively rather than purposefully
**DON'T**: Use rounded elements with thick colored border on one side—a lazy accent that almost never looks intentional
**DON'T**: Use sparklines as decoration—tiny charts that look sophisticated but convey nothing meaningful
**DON'T**: Use rounded rectangles with generic drop shadows—safe, forgettable, could be any AI output
**DON'T**: Use modals unless there's truly no better alternative—modals are lazy

**DON'T**: Fill an empty section with a remote placeholder image service (`picsum.photos` and friends). A
deployed page that hotlinks a third-party image host carries an uptime and privacy dependency the site owner
never agreed to, and it breaks the day that host rate-limits or disappears. Assets belong in the repository,
served through the project's own image handling. Where there is no real photography, generated SVG, CSS
gradients and geometric patterns carry a design better than generic stock anyway — and cost nothing at
runtime.

### Motion
→ *Consult [motion reference](reference/motion-design.md) for timing, easing, and reduced motion.*

Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

**DO**: Use motion to convey state changes—entrances, exits, feedback
**DO**: Prefer transform and opacity: they are the two properties the compositor can animate without layout or paint, which is why they stay smooth under load
**DO**: For height animations, use grid-template-rows transitions instead of animating height directly
**WATCH**: Animating width, height, padding or margin. Each forces layout every frame. Sometimes it is genuinely the only way to express the change — measure it rather than assume it is fine, and rather than assume it is forbidden
**WATCH**: Bounce and elastic easing. Overused, and dated when applied to everything — but exactly right for a playful direction, and `emil-design-eng` owns the judgement about when

### Interaction
→ *Consult [interaction reference](reference/interaction-design.md) for forms, focus, and loading patterns.*

Make interactions feel fast. Use optimistic UI—update immediately, sync later.

**DO**: Use progressive disclosure—start simple, reveal sophistication through interaction (basic options first, advanced behind expandable sections; hover states that reveal secondary actions)
**DO**: Design empty states that teach the interface, not just say "nothing here"
**DO**: Make every interactive surface feel intentional and responsive
**DON'T**: Repeat the same information—redundant headers, intros that restate the heading
**DON'T**: Make every button primary—use ghost buttons, text links, secondary styles; hierarchy matters

### Responsive
→ *Consult [responsive reference](reference/responsive-design.md) for mobile-first, fluid design, and container queries.*

**DO**: Use container queries (@container) for component-level responsiveness
**DO**: Adapt the interface for different contexts—don't just shrink it
**DON'T**: Hide critical functionality on mobile—adapt the interface, don't amputate it

### UX Writing
→ *Consult [ux-writing reference](reference/ux-writing.md) for labels, errors, and empty states.*

**DO**: Make every word earn its place
**DON'T**: Repeat information users can already see

---

## Starting points, when there is nothing to go on

The `ui-ux-pro-max` skill is the real source here — a searchable corpus of palettes, pairings and styles,
and it should be the first stop. These tables are the fallback for when it is unavailable, and a starting
point to depart from rather than a menu to pick from.

| Sector | Dominant | Accent | Neutrals |
|---|---|---|---|
| Food, hospitality | Terracotta, warm brown | Sage, gold | Cream, warm grey |
| Software, technical | Deep navy, charcoal | Coral, amber | Cool off-white |
| Health, wellbeing | Soft sage, eucalyptus | Warm blush, peach | Warm white |
| Finance, legal | Dark slate, forest | Muted gold, copper | Cool cream |
| Creative, studio | Rich burgundy, deep teal | Hot orange, magenta | Near-black, off-white |
| Education | Ocean blue, indigo | Warm yellow, lime | Light grey, cream |

| Intended feeling | Display | Body |
|---|---|---|
| Elegant, considered | Playfair Display, Cormorant Garamond, EB Garamond | Lora, Source Serif 4 |
| Modern, clean | Space Grotesk, Outfit, Plus Jakarta Sans | DM Sans, Manrope |
| Bold, direct | Syne, Unbounded | Work Sans, Karla, Rubik |
| Warm, approachable | Fredoka, Baloo 2 | Quicksand, Nunito |
| Serious, professional | Instrument Serif, Literata, Fraunces | Atkinson Hyperlegible, IBM Plex Sans |
| Technical, raw | Space Mono, JetBrains Mono | IBM Plex Sans, Geist Sans |

A pairing from a table is a hypothesis, not a decision. If two projects in the same sector end up looking
alike, the table was used as an answer rather than a place to start.

---

## The AI Slop Test

**Critical quality check**: If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, that's the problem.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

Review the `WATCH` and `DON'T` guidelines above — they are the fingerprints of AI-generated work.

These fingerprints move. Each one became a tell because it was briefly the default output of whatever model everyone was using, and the current crop has its own. So treat the list as evidence of a habit, not as the complete set: if a choice arrived because it is what gets generated by default rather than because this specific project called for it, it belongs on the list whether or not it is written above.

And the test runs on the *reason*, not the appearance. An interface that looks like a lot of AI output because the client asked for exactly that, and it was built well, passes. One that looks unusual because a skill told it to break symmetry fails — that is still a default, just a less common one.

---

## When the client asks for something on the list

It happens, and most often with the clients who know the most. Someone who art-directed for a living will
ask for glassmorphism, or a dark page with a glow, or overshoot in the transitions — knowing perfectly well
those are everywhere, and wanting them anyway because done well they still work.

Refusing on the grounds that a list here says no is the wrong answer. So is complying silently.

**The list above is two lists wearing one coat.**

**Taste defaults — the client can overrule these, and it is their product.** Glassmorphism,
dark-with-glow, oversized display type, bounce and overshoot, heavy motion, centred layouts. They are on
the list because they are what gets produced *by default*, not because they are bad in themselves, and a
deliberate argued choice is the opposite of a default. When a client asks for one:

- Say once, briefly, what the risk is — "this reads as generic when it is decoration; it works when it is
  doing something" — then build it as well as it can be built.
- Do not re-litigate it later, and do not quietly water it down while implementing. A half-committed
  version of the thing they asked for is worse than either option.
- Record it as their decision, so a later pass does not "fix" it.
- **Update the project's own checks accordingly.** A rule saying "no glassmorphism" cannot stay as-is on a
  project whose approved direction is a frosted surface — it would fail the build against the client's own
  approved design.

**Real harms — these do not get overruled by taste**, not because a rule forbids them but because they
break the product for actual people:

- **Hiding the system cursor.** A custom cursor that replaces the pointer costs users with motor or vision
  impairments the one affordance they rely on, and it lags on any dropped frame. Offer something that
  *adds* to the cursor instead, disabled under reduced motion and on touch.
- **Motion with no reduced-motion path.** Scroll reveals, parallax, load choreography: all fine, all
  required to have a still version. This costs the client nothing and is rarely contested once explained.
- **Contrast below AA**, focus indicators removed, text baked into images.

The distinction to hold: **the first list is about looking generic, the second is about excluding people.**
Trading the first away for a client's conviction is good service. Trading the second away is not a style
decision, and saying so plainly — once, without moralising — is part of the job.

---

## Implementation Principles

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

Interpret creatively and make choices that feel genuinely designed for *this* context. Where a direction is still being found, do not let every project converge on the same palette, the same faces and the same layout out of habit — variety across projects should come from the projects actually differing, not from rotating through options for its own sake.

Where the direction is already approved, this section stops applying. Two projects that both approved a warm minimal direction are *supposed* to resemble each other, and reaching for novelty to avoid that is how an approved contract gets quietly edited.

Remember: Claude is capable of extraordinary creative work. Don't hold back — show what can truly be created when committing fully to the vision this project actually has.