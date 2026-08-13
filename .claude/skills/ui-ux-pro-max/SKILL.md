---
name: ui-ux-pro-max
description: Front door to a searchable UI/UX corpus — colour palettes by product type, font pairings, style vocabularies, landing structures, chart choices, UX guidelines and icon sets. Query the one domain you need. Use when a design decision needs a grounded starting point rather than a guess.
---

# UI/UX Pro Max

A corpus and a command-line query tool. Nothing more.

This skill has no workflow, no phases and no authority. It does not produce a design system, does not
persist one, and does not decide anything. It answers a narrow question — *what do comparable products
actually use here?* — and hands you the answer to weigh.

---

## What owns what

**`design-system.md` is the project's only visual source of truth.** It records what a human approved,
element by element, from a real artifact. Nothing here overrides it, supplements it, or gets written into a
second file alongside it.

Use this skill **before** that contract exists — during Discovery, when proposing a direction — and after it
exists only for questions it does not answer.

| For | Go to |
|---|---|
| The approved contract for this project | `design-system.md` |
| Whether a direction reads as generic, and the aesthetic rules | `frontend-design` |
| Component identity, reuse, sizes, states | `atomic-design` |
| Building the artifact a human approves | `artifact-design` |
| Grounded starting points from real products | here |

---

## How to query it

One domain at a time. Ask the narrow question.

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [--max-results N]
```

Use `python3` where `python` is not the right name — check which one this machine has before concluding a
query returned nothing.

**Domains:**

| Domain | Answers |
|---|---|
| `color` | Palettes by product type, with foreground/surface/border values already paired |
| `typography` | Font pairings |
| `google-fonts` | The font catalogue itself, for checking a specific family |
| `style` | Style vocabularies and their CSS characteristics |
| `landing` | Landing structures and call-to-action strategies |
| `product` | Conventions by product type |
| `ux` | UX guidelines and anti-patterns |
| `chart` | Chart type selection |
| `icons` | Icon sets |
| `react` | React and Next.js implementation notes |

`--json` returns machine-readable output when you need to pull one field out.

**The corpus is web-only.** The skill came from a cross-platform ancestor and carried React Native, Expo,
SwiftUI and VisionOS material — including a `web` domain that was, row for row, native app guidance
(`Pressable`, `accessibilityLabel`, `SafeAreaView`). The Builder targets Next and React/Vite, so that
material is gone rather than one query away from a web project. Mobile *web* and responsive behaviour are
fully in scope and stayed.

**The tool reads. It does not write.** An earlier version could also generate and persist a
`design-system/MASTER.md` tree from search results — a second visual contract for the same decisions,
produced by a query instead of approved by anyone. That generator and every flag reaching it are gone, so
there is no longer a way to do this by accident.

---

## Reading the results

The corpus reports what comparable products converge on. That is genuinely useful and it is not an answer.

- **A palette row is a starting point, not a decision.** It tells you what a bakery usually looks like,
  which is also why every bakery looks like that. Take the relationships — how the accent sits against the
  surface, how much contrast the foreground carries — and depart from the literal values with intent.
- **Check contrast yourself.** A returned pairing is not a verified one. Measure body text at 4.5:1 and
  large text and UI components at 3:1 before committing to it.
- **A font pairing is a hypothesis.** It has to survive the actual headline length and the actual body copy.
- **Convergence is a warning as much as a signal.** If the corpus says everyone in this sector does the same
  thing, that is precisely the thing a distinctive product might do differently — deliberately, with a
  reason.

When a result and the approved contract disagree, the contract wins and there is nothing to discuss.

---

## What lives here

```
data/       the corpus — one CSV per domain, several megabytes
scripts/    core.py (the BM25 engine) and search.py (the CLI)
```

Every CSV here is reachable through a domain above, and every domain resolves to a CSV. Nothing else is
kept.

Do not read the CSVs directly into context. They are large, and the point of the query tool is that you
never have to.
