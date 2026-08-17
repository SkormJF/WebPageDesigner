# Review — current evidence
No review or global-gate correction has run. The project starts at `READY_TO_BUILD`.

The Orchestrator overwrites this file with the current Reviewer verdict or one failed global-gate finding set.

```text
PHASE: FOUNDATION_REVIEW | BUILD_REVIEW | LOCAL_PREVIEW | VISUAL_QA | E2E | QUALITY_GATE
ROUND: 1 | 2
VERDICT: REVIEW_PASS | CHANGES_REQUESTED | REVIEW_CONFLICT | CORRECTION_REQUIRED
CANDIDATE_COMMIT: <hash>
FINDINGS: <severity + evidence + consequence, or none>
CHECKS: <independent evidence>
TRACEABILITY: <contracts covered/unverified>
```
