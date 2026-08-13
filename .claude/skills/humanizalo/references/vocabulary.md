# Vocabulary — a symptom list, not a rule

**This is not a blacklist and nothing here fires on a match.** These words appear disproportionately in
generated text, which makes them a useful prompt to *look at the sentence* — where the real problem usually
is. The word is often a side effect of the sentence having no opinion or no specific in it.

Two directions to keep in mind:

- **A listed word can be the right word.** A structural engineer's page may need "robust" in its literal
  load-bearing sense; a policy page may need "comprehensive" because it is a defined term. Replacing those
  makes the text less accurate, and accuracy outranks this file.
- **Avoiding every word here proves nothing.** Prose can be clean against this list and still read as
  generated, because the tell is rhythm and absence of a point of view, not vocabulary.

Where a specification, brand voice, legal requirement or approved SEO term calls for one of these words, it
stays. See `SKILL.md` — this skill defers to all of them.

---

## Words that often signal a sentence worth rereading

When one of these shows up, check whether the sentence has a claim, a specific, and a position. Usually the
plainer alternative is better; sometimes the sentence needs restructuring instead.

| Avoid | Use instead |
|-------|-------------|
| additionally | also, and, plus |
| align / align with | match, fit, support |
| commendable | good, solid, strong |
| comprehensive | full, complete, thorough |
| crucial | important, key (sparingly) |
| delve | dig into, explore, look at |
| elevate | raise, improve, lift |
| emphasize / emphasizing | stress, point out, show |
| encompass | include, cover |
| enduring | lasting, long-running |
| enhance | improve, strengthen, boost |
| ensure | make sure |
| foster / fostering | build, encourage, grow |
| furthermore | also, and |
| garner | get, earn, attract |
| harnessing | using |
| highlight / highlighting | show, point out, flag |
| impactful | effective, strong, meaningful |
| in terms of | for, about, regarding |
| interplay | connection, relationship, tension |
| intricate | complex, detailed |
| it is important to note | (cut entirely) |
| key (adjective) | main, central, important |
| landscape | field, situation, world, scene |
| leverage | use |
| meticulous | careful, precise, thorough |
| moreover | also, and |
| multifaceted | complex, varied |
| notably | (cut entirely, or rewrite) |
| nuanced | subtle, complex |
| paramount | critical, top priority |
| pivotal | central, turning-point, key |
| realm | area, field, world |
| robust | strong, solid, reliable |
| seamless / seamlessly | smooth, easy, without friction |
| showcase / showcasing | show, display, demonstrate |
| spearhead | lead |
| subsequently | then, later, after |
| tapestry | (cut or use a concrete noun) |
| testament | proof, evidence, sign |
| transformative | (be specific about what changed) |
| underscore / underscoring | show, stress, reinforce |
| utilize | use |
| valuable | useful, helpful, worth it |
| vibrant | lively, active, colorful |

---

## Copula avoidance (P10)

AI avoids simple "is" and "has" constructions. It uses fancier substitutes that sound stiff.

| AI writes | Human writes |
|-----------|-------------|
| serves as | is |
| stands as | is |
| functions as | is |
| acts as | is |
| represents | is |
| constitutes | is |
| boasts | has |
| features | has |
| possesses | has |
| is home to | has |
| offers | has, gives |

---

## Adverbs that often carry no weight (P11)

Stacked adverbs are a common way a sentence gets longer without getting more specific. When several of these
appear close together, the sentence is usually reaching for emphasis it has not earned — and the fix is
almost always a more concrete noun or verb, not a deletion.

**Intensifiers:** really, very, literally, genuinely, truly, fundamentally, inherently, deeply, incredibly, remarkably, absolutely, definitely, certainly, undoubtedly, undeniably, profoundly

**Softeners:** just, actually, honestly, simply, basically, essentially, virtually, practically, relatively, somewhat, fairly

**Filler adverbs:** inevitably, interestingly, importantly, crucially, significantly, notably, ultimately, effectively, increasingly, arguably

**This is a signal, not a rule.** "Cut anything ending in -ly" is wrong often enough to do real damage:
*only*, *early*, *daily*, *family*, *likely* and *legally* all end in -ly, and softeners frequently carry
the meaning. "Simply add water" is an instruction about difficulty. "We only work with two clients at a
time" is a fact. Removing either changes what the sentence says.

Read the sentence without the adverb. If nothing is lost, it was decoration. If something is lost, it was
doing a job — and where a spec, a legal requirement or the brand's own voice put it there, it stays.

---

## Business jargon (P12)

| Avoid | Use instead |
|-------|-------------|
| navigate (challenges) | handle, deal with, address |
| unpack (an idea) | explain, examine, break down |
| lean into | accept, embrace, commit to |
| landscape (as context) | situation, field, market |
| game-changer | significant, important, big deal |
| double down | commit, increase, push harder |
| deep dive | analysis, close look, examination |
| take a step back | reconsider, rethink |
| moving forward | next, from now, going ahead |
| circle back | return to, revisit, follow up |
| on the same page | aligned, agreed |
| at the end of the day | ultimately (then cut "ultimately" too) |
| level up | improve |
| bandwidth | time, capacity |
| synergy | cooperation, teamwork |
| paradigm shift | change, turning point |
| low-hanging fruit | easy wins, quick fixes |
| north star | goal, guiding principle |
| stakeholder | (name the actual person or group) |
| ecosystem | system, community, network |
| value proposition | benefit, offer, what you get |
| thought leader | expert, specialist |
| best practices | what works, standards |
| scalable | (be specific about what scales and how) |

---

## Filler phrases (P39)

| Filler | Replacement |
|--------|-------------|
| In order to | To |
| Due to the fact that | Because |
| At this point in time | Now |
| The system has the ability to | The system can |
| It is important to note that | (cut entirely) |
| It's worth noting that | (cut entirely) |
| It goes without saying | (then don't say it) |
| For all intents and purposes | (cut entirely) |
| In the event that | If |
| With regard to / With respect to | About, On |
| In light of | Given, Because of |
| On the other hand | But |
| In a world where | (cut entirely) |
| When it comes to | For, About, With |
| At its core | (cut entirely) |
| The reality is | (cut and just state the reality) |
| It should be noted that | (cut entirely) |
| As a matter of fact | (cut entirely) |
| By and large | Mostly, Generally |
| For the most part | Mostly |

---

## Throat-clearing openers (P35)

These phrases delay the point. Cut them and start with the actual content.

- "Here's the thing:"
- "Here's what [X]"
- "Here's why [X]"
- "The uncomfortable truth is"
- "It turns out"
- "The real [X] is"
- "Let me be clear"
- "The truth is"
- "I'll say it again"
- "I'm going to be honest"
- "Can we talk about"
- "Here's what I find interesting"
- "Here's the problem though"
- "I want to talk about"
- "Let's talk about"
- "We need to talk about"

---

## Emphasis crutches (P36)

These try to make a point land harder. They have the opposite effect.

- "Full stop." / "Period."
- "Let that sink in."
- "This matters because"
- "Make no mistake"
- "Here's why that matters"
- "Read that again."
- "I'll say it louder for the people in the back"
- "This. This right here."

---

## Performative emphasis (P38)

Telling the reader something is important or genuine instead of showing it.

- "creeps in"
- "I promise"
- "They exist, I promise"
- "This is genuinely hard"
- "This is what leadership actually looks like"
- "This is what X actually looks like"
- "actually matters"
- "quietly"  (as in "quietly revolutionary")
- "the quiet power of"

---

## Lazy extremes (P13)

Sweeping generalizations that are almost never literally true:

- every, everything, everywhere
- always, all
- never, none, no one
- everyone, everybody
- nobody
- the entire, the whole

**Fix:** Be specific. "Most teams" not "every team." "Rarely" not "never." Or just state the specific case you mean.

---

## Hyphenated word pairs (P14)

AI uses these with perfect consistency. Humans are sloppier. Watch for clusters of:

- cross-functional
- data-driven
- client-facing
- decision-making
- well-known
- high-quality
- real-time
- long-term / short-term
- end-to-end
- results-oriented
- forward-thinking
- purpose-built
- best-in-class
- mission-critical
- thought-provoking
- industry-leading

**Fix:** One or two in a piece is fine. Three or more in close proximity is a tell. Rephrase some: "quality" instead of "high-quality," "known" instead of "well-known."
