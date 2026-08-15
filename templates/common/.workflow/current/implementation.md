# Implementation — current build/correction evidence

No build group or global-gate correction has been implemented yet. This project is at `READY_TO_BUILD`.

The Builder overwrites this file per assigned build group or targeted global-gate correction. It is compact recovery
evidence, not a progress diary. Durable task status lives in `tasks.md`; code history lives in git.

---

<!-- Build-group shape:

GROUP: <id> — <name>
PHASE: FOUNDATION | BUILD_TASKS | INTEGRATION
CAPABILITY: BASE | SUPABASE
GATE: AUTO | REVIEW | DB_REVIEW
TASKS: TASK-xxx, TASK-yyy
STATUS: COMPLETE | PARTIAL

CHANGED
<short file/surface summary>

CHECKS
<check -> actual result; final cleaned state only>

CRITICAL EVIDENCE
<only the risk-specific evidence that matters, or "none">

OUT OF SCOPE
<finding -> routed task/group, or "none">

Targeted global-gate correction shape:

GLOBAL_PHASE: LOCAL_PREVIEW | VISUAL_QA | E2E | QUALITY_GATE
GLOBAL_ROUND: 1 | 2
OWNER_SURFACE: <existing group/task ids>
STATUS: COMPLETE | PARTIAL
CHANGED: <concise>
CHECKS: <focused correction evidence only>
-->
