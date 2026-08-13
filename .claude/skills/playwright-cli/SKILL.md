---
name: playwright-cli
description: Drive a browser to gather evidence — inspect a running page, reproduce a bug, capture what a screen actually shows, read console and network output. Use for exploration, Visual QA and debugging. Not for writing the project's E2E suite.
allowed-tools: Bash(playwright-cli:*)
---

# Browser evidence

A tool for looking at a running page and finding out what is actually true.

**This is not the E2E suite.** Playwright *Test* owns reproducible end-to-end coverage — specs that live in
the repository and run again next month. This CLI is for the questions that come up once: why does this
render wrong, what does the console say, what does the page look like at 375px.

```
Playwright CLI    exploration · Visual QA · debugging · smoke checks · one-off evidence
Playwright Test   the persistent, reproducible E2E suite
```

Never turn a CLI session into the project's test coverage. If a check is worth repeating, it belongs in a
spec.

---

## Evidence priority

Gather in this order and stop as soon as you have the answer. Each step costs more than the one before, in
time and in context, and most questions are answered by the first two.

```
1. the error or the actual result      what did it return, what does the assertion say
2. a screenshot                        what does it look like right now
3. console and network output          what is failing underneath
4. a trace                             when the failure is sequence-dependent
5. video                               last resort, and rarely the right answer
```

**Do not record video by default.** It is large, slow to produce and slower to read, and it almost never
contains something a screenshot plus the console did not already tell you.

**Snapshots before screenshots for structure.** Each command returns a snapshot of the page — element refs,
text, roles — which is what you need to click something or to check whether an element exists at all. Reach
for a screenshot when the question is genuinely visual.

---

## Working loop

```bash
playwright-cli open http://localhost:3000   # snapshot comes back with element refs
playwright-cli click e15                    # act on refs from the snapshot
playwright-cli fill e5 "user@example.com"
playwright-cli console                      # what broke
playwright-cli network
playwright-cli resize 375 812               # check a width
playwright-cli screenshot --filename=mobile.png
playwright-cli close                        # always
```

Name a screenshot with `--filename` only when the file is part of the result. Otherwise let it auto-name and
stay out of the way.

**Close the browser when done.** A session left open holds a profile and a port, and the next run inherits
whatever state it was left in.

---

## Environment

The CLI defaults to the system Chrome and fails with a distribution error if that is not installed — having
Playwright's bundled browsers is not enough. Install the one it asks for rather than working around it.

If the global binary is unavailable, `npx playwright-cli` runs the same commands.

Do not burn time on a browser-install problem. If it will not resolve in a couple of minutes, say so and get
the evidence another way — a human with the page open answers most visual questions faster than a broken
toolchain will.

---

## Sensitive state

`state-save` writes cookies and local storage — a live session — to a file. Treat it as a credential:

- Keep it out of the repository. The generated `.gitignore` already excludes `.env*`; a saved auth state
  needs the same treatment, and the safest place is a temporary directory outside the project.
- Delete it when the session is over.
- Never commit one, never paste its contents, never write it into a spec or a report.

The same applies to persistent profiles: `--persistent` keeps real browsing state on disk.

---

## References

| File | For |
|---|---|
| `references/session-management.md` | Named sessions and profiles |
| `references/storage-state.md` | Cookies and storage, and the care they need |
| `references/request-mocking.md` | Intercepting and stubbing network calls |
| `references/running-code.md` | Executing Playwright code directly |
| `references/tracing.md` | Traces, for sequence-dependent failures |
| `references/test-generation.md` | Turning an exploration into a real spec |
| `references/video-recording.md` | Video, for the rare case that needs it |
