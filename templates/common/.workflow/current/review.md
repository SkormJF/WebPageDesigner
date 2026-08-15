# Review — current build group

No build group has been reviewed yet. This project is at `READY_TO_BUILD`.

The Orchestrator overwrites this file with the Reviewer's returned verdict only when the group's risk requires review.
It holds the current gate only; git holds history. LOW groups legitimately have no Reviewer pass.

---

<!-- The Orchestrator persists the Reviewer's returned shape:

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

-->
