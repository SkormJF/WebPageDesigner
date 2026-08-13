---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Apache 2.0. Based on Anthropic's frontend-design skill. See NOTICE.md for attribution.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Design Direction

Commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### Typography
→ *Consult [typography reference](reference/typography.md) for scales, pairing, and loading strategies.*

Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font.

**DO**: Use a modular type scale with fluid sizing (clamp)
**DO**: Vary font weights and sizes to create clear visual hierarchy
**DON'T**: Use overused fonts—Inter, Roboto, Arial, Open Sans, system defaults
**DON'T**: Use monospace typography as lazy shorthand for "technical/developer" vibes
**DON'T**: Put large icons with rounded corners above every heading—they rarely add value and make sites look templated

### Color & Theme
→ *Consult [color reference](reference/color-and-contrast.md) for OKLCH, palettes, and dark mode.*

Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

**DO**: Use modern CSS color functions (oklch, color-mix, light-dark) for perceptually uniform, maintainable palettes
**DO**: Tint your neutrals toward your brand hue—even a subtle hint creates subconscious cohesion
**DON'T**: Use gray text on colored backgrounds—it looks washed out; use a shade of the background color instead
**DON'T**: Use pure black (#000) or pure white (#fff)—always tint; pure black/white never appears in nature
**DON'T**: Use the AI color palette: cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds
**DON'T**: Use gradient text for "impact"—especially on metrics or headings; it's decorative rather than meaningful
**DON'T**: Default to dark mode with glowing accents—it looks "cool" without requiring actual design decisions

### Layout & Space
→ *Consult [spatial reference](reference/spatial-design.md) for grids, rhythm, and container queries.*

Create visual rhythm through varied spacing—not the same padding everywhere. Embrace asymmetry and unexpected compositions. Break the grid intentionally for emphasis.

**DO**: Create visual rhythm through varied spacing—tight groupings, generous separations
**DO**: Use fluid spacing with clamp() that breathes on larger screens
**DO**: Use asymmetry and unexpected compositions; break the grid intentionally for emphasis
**DON'T**: Wrap everything in cards—not everything needs a container
**DON'T**: Nest cards inside cards—visual noise, flatten the hierarchy
**DON'T**: Use identical card grids—same-sized cards with icon + heading + text, repeated endlessly
**DON'T**: Use the hero metric layout template—big number, small label, supporting stats, gradient accent
**DON'T**: Center everything—left-aligned text with asymmetric layouts feels more designed
**DON'T**: Use the same spacing everywhere—without rhythm, layouts feel monotonous

### Visual Details
**DO**: Use intentional, purposeful decorative elements that reinforce brand
**DON'T**: Use glassmorphism everywhere—blur effects, glass cards, glow borders used decoratively rather than purposefully
**DON'T**: Use rounded elements with thick colored border on one side—a lazy accent that almost never looks intentional
**DON'T**: Use sparklines as decoration—tiny charts that look sophisticated but convey nothing meaningful
**DON'T**: Use rounded rectangles with generic drop shadows—safe, forgettable, could be any AI output
**DON'T**: Use modals unless there's truly no better alternative—modals are lazy

### Motion
→ *Consult [motion reference](reference/motion-design.md) for timing, easing, and reduced motion.*

Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

**DO**: Use motion to convey state changes—entrances, exits, feedback
**DO**: Use exponential easing (ease-out-quart/quint/expo) for natural deceleration
**DO**: For height animations, use grid-template-rows transitions instead of animating height directly
**DON'T**: Animate layout properties (width, height, padding, margin)—use transform and opacity only
**DON'T**: Use bounce or elastic easing—they feel dated and tacky; real objects decelerate smoothly

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

Review the DON'T guidelines above—they are the fingerprints of AI-generated work.

These fingerprints move. Each one became a tell because it was briefly the default output of whatever model everyone was using, and the current crop has its own. So treat the list as evidence of a habit, not as the complete set: if a choice arrived because it is what gets generated by default rather than because this specific project called for it, it belongs on the list whether or not it is written above.

---

## When the client asks for something on the DON'T list

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

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices across generations.

Remember: Claude is capable of extraordinary creative work. Don't hold back—show what can truly be created when thinking outside the box and committing fully to a distinctive vision.