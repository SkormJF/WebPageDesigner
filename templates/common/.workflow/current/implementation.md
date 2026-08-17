# Implementation — current evidence
No phase has been implemented. The project starts at `READY_TO_BUILD`.

The Builder overwrites this file for one complete phase or targeted correction. Durable status lives in `tasks.md`; history
lives in git.

```text
PHASE: FOUNDATION | PRODUCT_BUILD | TARGETED_CORRECTION
TASKS: <ids>
STATUS: COMPLETE | PARTIAL | BLOCKED
CANDIDATE_COMMIT: <hash or working-tree marker>
CHANGED: <files/surfaces>
CHECKS: <commands plus observed results>
TRACEABILITY: <REQ/task → evidence>
OUT_OF_SCOPE: <none or items>
```
