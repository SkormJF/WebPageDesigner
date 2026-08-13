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
| `react`, `web` | Implementation notes for those targets |

`--json` returns machine-readable output when you need to pull one field out.

**On `--stack`:** the flag exists but the corpus only carries React Native data, a leftover from where this
skill came from. It is not useful here. Ignore it.

**Do not use `--design-system`, `--persist` or `--page`.** They generate and write a `design-system/MASTER.md`
tree — a second, competing source of visual truth, produced by a search rather than approved by a human.
This project has exactly one visual contract and a human approved it.

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
data/       the corpus — CSVs by domain, several megabytes
scripts/    the query tool
```

Do not read the CSVs directly into context. They are large, and the point of the query tool is that you
never have to.
