---
name: humanizalo
description: Make user-facing product prose read as though a person wrote it — headings, descriptions, calls to action, labels, help text, errors, empty states, onboarding and policy copy. Use when writing or revising any text a user will read. Subordinate to the specifications, brand voice, technical and legal accuracy, and approved SEO.
---

# Humanízalo

Generated prose has a sound. Not a vocabulary — a **sound**: every sentence the same length, every claim
inflated a notch, every list three items long, and nobody behind any of it. Readers recognise it before
they can say why, and on a real business's page it costs trust that the business earned somewhere else.

This skill is about the sound. It is not a word filter.

---

## What this applies to

User-facing product prose: headings, descriptions, calls to action, button labels, form labels and help
text, error and success messages, empty states, onboarding, dashboard copy, FAQs, and privacy, policy and
terms pages.

Not: code comments, commit messages, specifications, or anything in the harness. Those are written for
people who need precision more than voice.

---

## What this never overrides

```
specifications · product meaning · brand voice
technical accuracy · legal accuracy · approved SEO
```

If a rewrite would change a fact, weaken a legal obligation, drop an approved keyword, or drift from the
voice the human agreed to — **the copy stands and this skill defers.** Say what you would have changed and
why, then leave it.

This is not a caveat. It is the boundary that makes the skill safe to run automatically. A copy editor with
authority over the spec is not a copy editor.

Legal and policy text especially: required wording is required. Prose that reads stiffly because a
regulator requires it is not a defect.

---

## The patterns that actually mark generated text

### No one is behind it

The single largest tell. Text with no opinion, no preference, no willingness to say that one thing is
better than another. It describes without committing.

```
Before   Ofrecemos soluciones de encuadernación adaptadas a cada necesidad.
After    Encuadernamos a mano. Tarda más y dura décadas.
```

Have a position. Say what you do not do. Name the trade-off.

### Uniform rhythm

Every sentence the same length is the most detectable structural signature there is, and the easiest to fix.

Vary it. Short, blunt lines. Then a longer one that takes its time and earns the space by carrying something
the short one could not. Then short again.

Read it aloud. If it has one tempo, it is not finished.

### Inflated significance

"Marks a pivotal moment", "a testament to", "in today's landscape", "revolutionise". The claim is bigger
than the thing.

Scale the language to the fact. A bakery that has been open fifteen years should say it has been open
fifteen years — that is more impressive than "a legacy of excellence" and it has the advantage of being
checkable.

### Vagueness where a specific belongs

"Experts say", "many believe", "a variety of options", "industry-leading".

A number, a name, a date. "Doce alumnos entraron al conservatorio" beats every adjective available.

### The rule of three, reflexively

"Whether you're a X, a Y, or a Z." Three-item lists everywhere, because three feels balanced. Sometimes the
answer is two items. Sometimes it is one, stated flatly.

### Hedged into meaninglessness

"It's worth noting that", "generally speaking", "can help to". Cut the hedge or drop the claim. A sentence
that will not commit is not carrying anything.

### Filler openings

"In a world where…", "When it comes to…", "Let's dive into…". Start at the first real word. The opening
sentence is almost always deletable.

---

## References

Loaded on demand. Neither is needed to write well — they are for when a draft reads wrong and you want to
name why.

| File | For |
|---|---|
| `references/vocabulary.md` | Words and formatting habits that appear disproportionately in generated text |
| `references/structures.md` | Sentence and paragraph shapes that give it away — binary contrasts, negative listing, false agency, synonym cycling, rhythm |

## Words

`references/vocabulary.md` lists words that appear disproportionately in generated text, with plainer
alternatives.

**Use it as a symptom list, never as a rule that fires on a match.** A word on that list is a prompt to look
at the sentence — usually the sentence is doing something else wrong and the word is a side effect. A
structural engineer's site may need *robusto* in its literal load-bearing sense; a legal page may need
*comprehensive* because that is the defined term. Replacing those makes the text worse and less accurate.

The reverse also holds, and matters more: prose can avoid every listed word and still be unmistakably
generated, because the sound comes from rhythm and absence of opinion, not from vocabulary.

---

## Writing in Spanish

Most output here is Spanish, and its generated register has its own habits: heavy nominalisation
(*la realización de*), impersonal constructions where a person would use *nosotros*, and a formal distance
that reads as a press release rather than a business talking to its customers.

Prefer verbs to nominalisations. Use first person when it fits — "Trabajamos con…" is a human sentence and
"Nuestra empresa se dedica a la prestación de…" is not. Match the register the human uses when they talk
about their own work.

---

## Checking your own draft

Reading it back is not enough — you wrote it, so it sounds right to you. Ask instead:

1. **What does this claim that could be checked?** If nothing, it says nothing.
2. **Where is the opinion?** If there is none, add one or cut the paragraph.
3. **What are the sentence lengths?** Count them. If they cluster, break the pattern.
4. **What would this business say out loud to a customer standing in front of them?** Write that.
5. **What did I remove that mattered?** Then put it back — see the boundary above.

If a pass makes text shorter, more specific and more opinionated, it worked. If it only makes it shorter,
check that a fact did not leave with the words.
