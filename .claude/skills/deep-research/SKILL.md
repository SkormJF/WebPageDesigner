---
name: deep-research
description: Investigate a topic across multiple sources when a decision genuinely depends on external information — an unfamiliar domain, a current fact, a comparison between real options. Proportional to what is at stake. Not a step before writing content.
---

# Research

A capability, not a stage. Nothing loads it automatically and nothing requires it before producing anything.

**Reach for it when a decision depends on information you do not have.** Not when you have enough and could
have more.

---

## When it earns its cost

- The user asked for research, a comparison, or "what do people actually do here".
- There is a **material factual gap** — the product's domain has conventions, regulations or vocabulary that
  guessing would get wrong in a way someone would notice.
- A decision turns on **current** information: a version, a pricing model, a deprecation, an API that moved.
- Two real options need comparing on evidence rather than impression.

## When it does not

- The answer is already known well enough for the decision at hand. Knowing something is not a reason to go
  and confirm it.
- A single search would answer it. Then do a single search — that is not this skill, it is just looking
  something up.
- The stake is low. A placeholder heading does not need three sources.
- The information is inside the project. Specs, code and the approved contract are not researched, they are
  read.

---

## Depth is proportional, always

```
research depth  ∝  importance × uncertainty × how fast the answer goes stale
```

A claim that will appear on a real business's public page, about a regulated trade, deserves real
verification. A word choice does not. Same skill, wildly different effort, and choosing the effort is the
skill.

**Stop when the evidence is sufficient**, not when a quota is met. There is no required number of searches,
no required number of angles, and no obligation to keep going once sources agree and the question is
answered. Continuing past that point spends context to lower confidence in nothing.

If sources disagree, that is a finding worth reporting rather than a problem to resolve by picking one.

---

## Source priority

```
official / primary        the vendor, the standard, the regulator, the source of the fact
documentation / papers    reference material and published research
reputable secondary       established publications with editorial accountability
community                 forums, issues, posts — useful, and weakest
```

Community sources are genuinely valuable for "does this actually work in practice", which official docs
rarely answer honestly. They are the weakest thing to cite for what something *is*.

**Prefer the primary source over an article about the primary source.** Reporting drifts, and it drifts in
the direction of whatever was interesting to write about.

**Check dates.** A confident answer from three years ago about a fast-moving tool is worse than no answer,
because it reads as authoritative.

---

## Reporting

Say what you found, where it came from, and how confident it makes you.

- Cite sources for facts that will end up in the product.
- Separate **what the sources say** from **what you conclude**. They are different, and conflating them is
  how a plausible inference becomes a claim on someone's website.
- Say what remains uncertain. "Three sources agree on X; nothing I found addresses Y" is a more useful
  result than a smoothed-over summary.

**Never edit a specification as a side effect of research.** If research contradicts an approved decision,
that is a finding for the human — surface it, with the evidence, and leave the spec alone.

---

## Not to be confused with `web-reader`

```
web-reader       one URL the user pointed at, read for its design decisions
deep-research    a topic, across several sources, when a decision needs it
```

Different jobs. Analysing a reference site the user likes is `web-reader`, and it is not research.
