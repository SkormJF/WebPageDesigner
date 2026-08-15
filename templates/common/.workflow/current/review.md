# Review — current gate evidence

No build-group or global-gate review has run yet. This project is at `READY_TO_BUILD`.

The Orchestrator overwrites this file with either a Reviewer verdict for the current build group or compact findings from a
whole-product lifecycle gate that needs a targeted Builder correction. It holds current truth only; git holds history.

---

<!-- Build-group review shape:

GROUP: <id>
PHASE: FOUNDATION | BUILD_TASKS | INTEGRATION
CAPABILITY: BASE | SUPABASE
GATE: REVIEW | DB_REVIEW
ROUND: 1 | 2
VERDICT: REVIEW_PASS | CHANGES_REQUESTED | REVIEW_CONFLICT

FINDINGS
<severity, file:line/evidence, consequence; or "none">

CHECKS
<minimum independent checks actually run>

SUMMARY
<2-4 sentences>

Global-gate correction shape:

GLOBAL_PHASE: LOCAL_PREVIEW | VISUAL_QA | E2E | QUALITY_GATE
GLOBAL_ROUND: 1 | 2
VERDICT: CORRECTION_REQUIRED
OWNER_SURFACE: <existing group/task ids>
FINDINGS: <compact concrete findings>
CHECKS: <failed gate evidence>
-->
