import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseBackendMode, composeBackendCapability, expectedSkills } from "../scripts/lib/common.mjs";
import { runSpecGate } from "../scripts/lib/spec-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const json = (rel) => JSON.parse(read(rel));
const flat = (rel) => read(rel).replace(/\s+/g, " ");

function makeSpecs({ tasks, design, backend = "none" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "v9-spec-"));
  const designText = design ?? `# Design
## Architecture
No deviations.
## Routes
| Route | Access | Purpose | Requirements |
|---|---|---|---|
| \`/\` | public | Entry | REQ-001 |
## Backend
**Mode:** ${backend}
## Human platform actions
| ID | Human-only action | Before phase | Completion proof |
|---|---|---|---|
| — | None | — | — |
## Security
Server enforcement.
`;
  const taskText = tasks ?? `# Tasks
## Dependency order
TASK-001 -> TASK-002
## Phase ownership
FOUNDATION then PRODUCT_BUILD.
## Implementation tasks
| ID | Task | Requirements | Depends on | Phase | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | Establish baseline | REQ-001 | — | FOUNDATION | HIGH | Pinned build succeeds. | PENDING |
| TASK-002 | Deliver product | REQ-001 | TASK-001 | PRODUCT_BUILD | HIGH | Entry flow works. | PENDING |
`;
  const files = {
    "PROJECT.md": "# Project\n## Identity\nX\n## What this is\nX\n## Scope\nX\n## Decisions in force\nX\n",
    "requirements.md": "# Requirements\n## Functional requirements\n| ID | Requirement |\n|---|---|\n| REQ-001 | The product MUST have an entry flow. |\n## Non-functional requirements\nX\n",
    "design.md": designText,
    "design-system.md": "# DS\n## Approval\nX\n## Color\nX\n## Typography\nX\n## Interaction states\nX\n## Responsive behaviour\n| Breakpoint | Width | What changes |\n|---|---|---|\n| Mobile | 0-639 | Compact |\n| Tablet | 640-1023 | Medium |\n| Desktop | 1024+ | Full |\n",
    "tasks.md": taskText,
  };
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}

function gate(options) {
  const dir = makeSpecs(options);
  try { return runSpecGate(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test("backend mode parser accepts only none and supabase", () => {
  assert.equal(parseBackendMode("## Backend\n**Mode:** none"), "none");
  assert.equal(parseBackendMode("## Backend\n**Mode:** supabase"), "supabase");
  assert.equal(parseBackendMode("## Backend\n**Mode:** firebase"), "unsupported:firebase");
});

test("V9 keeps one fixed versioned stack profile", () => {
  const config = json("builder.config.json");
  const profile = json("config/stack-profiles/next-standard-v1.json");
  assert.equal(config.stack_profile, "next-standard-v1");
  assert.equal(profile.schema_version, 2);
  assert.equal(profile.validated.pinned.next, "16.3.0");
  assert.equal(profile.request_boundary.file, "src/proxy.ts");
  assert.equal(profile.request_boundary.export, "proxy");
  assert.deepEqual(profile.request_boundary.forbidden_files, ["middleware.ts", "src/middleware.ts"]);
  assert.equal(profile.runtime_contract.package_manager, "npm");
  assert.equal(profile.runtime_contract.deployment, "vercel");
  assert.deepEqual(profile.capability_packages.supabase, {
    "@supabase/ssr": "0.7.0",
    "@supabase/supabase-js": "2.57.4",
  });
  assert.match(profile.implementation_contract.dependency_policy, /exact versions/i);
});

test("Planning and Spec Review must consume the Stack Profile", () => {
  const harness = flat("CLAUDE.md");
  const reviewer = flat(".claude/agents/spec-reviewer.md");
  assert.match(harness, /PLANNING.*fixed Stack Profile/i);
  assert.match(harness, /SPEC_REVIEW.*Stack Profile/i);
  assert.match(reviewer, /config\/stack-profiles\/next-standard-v1\.json/);
  assert.match(reviewer, /src\/proxy\.ts.*exporting `proxy`/i);
});

test("valid two-phase specifications pass the mechanical gate", () => {
  assert.equal(gate().pass, true);
});

test("Spec Gate rejects legacy middleware and missing root route", () => {
  const design = `# Design
## Architecture
Use src/middleware.ts.
## Routes
| Route | Access | Purpose | Requirements |
|---|---|---|---|
| \`/app\` | authenticated | App | REQ-001 |
## Backend
**Mode:** none
## Human platform actions
| ID | Human-only action | Before phase | Completion proof |
|---|---|---|---|
| — | None | — | — |
## Security
Server enforcement.
`;
  const result = gate({ design });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => /middleware\.ts is forbidden/.test(f.message)));
  assert.ok(result.findings.some((f) => /root route/.test(f.message)));
});

test("Spec Gate rejects responsive gaps like the FocoV5 641-859 defect", () => {
  const dir = makeSpecs();
  try {
    const file = path.join(dir, "design-system.md");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("640-1023", "860-1023"));
    const result = runSpecGate(dir);
    assert.ok(result.findings.some((f) => /responsive ranges are not contiguous/.test(f.message)));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("Spec Gate requires both Foundation and Product Build", () => {
  const tasks = `# Tasks
## Dependency order
TASK-001
## Phase ownership
FOUNDATION then PRODUCT_BUILD.
## Implementation tasks
| ID | Task | Requirements | Depends on | Phase | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | Establish baseline | REQ-001 | — | FOUNDATION | HIGH | Build succeeds. | PENDING |
`;
  const result = gate({ tasks });
  assert.ok(result.findings.some((f) => /fixed phase PRODUCT_BUILD has no task/.test(f.message)));
});

test("Spec Gate rejects lifecycle gates disguised as tasks", () => {
  const tasks = `# Tasks
## Dependency order
TASK-001 -> TASK-002
## Phase ownership
FOUNDATION then PRODUCT_BUILD.
## Implementation tasks
| ID | Task | Requirements | Depends on | Phase | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | Establish baseline | REQ-001 | — | FOUNDATION | HIGH | Build succeeds. | PENDING |
| TASK-002 | Run Visual QA and full E2E suite | REQ-001 | TASK-001 | PRODUCT_BUILD | HIGH | Quality Gate passes. | PENDING |
`;
  const result = gate({ tasks });
  assert.ok(result.findings.some((f) => /Visual QA is a whole-product lifecycle phase/.test(f.message)));
  assert.ok(result.findings.some((f) => /standalone E2E-suite work/.test(f.message)));
  assert.ok(result.findings.some((f) => /Quality Gate is a whole-product lifecycle phase/.test(f.message)));
});

test("Spec Gate enforces initial status, real dependencies and acyclic direction", () => {
  const tasks = `# Tasks
## Dependency order
TASK-001 -> TASK-002
## Phase ownership
FOUNDATION then PRODUCT_BUILD.
## Implementation tasks
| ID | Task | Requirements | Depends on | Phase | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | Establish baseline | REQ-001 | TASK-002 | FOUNDATION | HIGH | Build succeeds. | ACTIVE |
| TASK-002 | Deliver product | REQ-001 | TASK-001 | PRODUCT_BUILD | HIGH | Flow works. | PENDING |
`;
  const result = gate({ tasks });
  assert.ok(result.findings.some((f) => /must start PENDING/.test(f.message)));
  assert.ok(result.findings.some((f) => /depends on later-phase/.test(f.message)));
  assert.ok(result.findings.some((f) => /dependency cycle/.test(f.message)));
});

test("Spec Gate requires scratch cleanup with no-residue proof", () => {
  const tasks = `# Tasks
## Dependency order
TASK-001 -> TASK-002
## Phase ownership
FOUNDATION then PRODUCT_BUILD.
## Implementation tasks
| ID | Task | Requirements | Depends on | Phase | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | Establish baseline | REQ-001 | — | FOUNDATION | HIGH | Build succeeds. | PENDING |
| TASK-002 | Test with two disposable users | REQ-001 | TASK-001 | PRODUCT_BUILD | HIGH | Create two test users and check isolation. | PENDING |
`;
  assert.ok(gate({ tasks, backend: "supabase" }).findings.some((f) => /without explicit cleanup/.test(f.message)));
});

test("human-only actions block a fixed phase, not a build group", () => {
  const design = `# Design
## Architecture
No deviations.
## Routes
| Route | Access | Purpose | Requirements |
|---|---|---|---|
| \`/\` | public | Entry | REQ-001 |
## Backend
**Mode:** supabase
## Human platform actions
| ID | Human-only action | Before phase | Completion proof |
|---|---|---|---|
| HPA-001 | Configure SMTP | FOUNDATION | Human confirmation |
## Security
Server enforcement.
`;
  assert.equal(gate({ design, backend: "supabase" }).pass, true);
});

test("generated lifecycle has one technical review after each complete build phase", () => {
  const harness = flat("templates/common/CLAUDE.md");
  assert.match(harness, /FOUNDATION → FOUNDATION_REVIEW → PRODUCT_BUILD → BUILD_REVIEW/);
  assert.match(harness, /BUILD_REVIEW → LOCAL_PREVIEW → VISUAL_QA → HUMAN_PREVIEW/);
  assert.match(harness, /HUMAN_PREVIEW → E2E → QUALITY_GATE → READY_TO_DEPLOY/);
  assert.doesNotMatch(harness, /→ BUILD_TASKS|→ INTEGRATION/);
});

test("Build Review, Local Preview, Visual QA and E2E have non-overlapping ownership", () => {
  const harness = flat("templates/common/CLAUDE.md");
  assert.match(harness, /BUILD_REVIEW.*does not redesign specs, perform Visual QA or run the full E2E suite/i);
  assert.match(harness, /LOCAL_PREVIEW.*operational checkpoint only/i);
  assert.match(harness, /VISUAL_QA.*overlap.*clipping.*overflow/i);
  assert.match(harness, /E2E.*Auth, CRUD, permissions.*not comprehensive visual judgement/i);
  assert.match(harness, /QUALITY_GATE.*do not rerun it/i);
});

test("review loops are capped at one correction and one targeted recheck", () => {
  const harness = flat("templates/common/CLAUDE.md");
  const reviewer = flat("templates/common/.claude/agents/reviewer.md");
  assert.match(harness, /ROUND 1 FAIL.*TARGETED ROUND 2 PASS.*TARGETED ROUND 2 FAIL.*STOP/i);
  assert.match(reviewer, /Round 2 checks only prior findings, correction diff and minimum affected regression/i);
  assert.match(reviewer, /MINOR alone does not trigger correction/i);
});

test("Spec PASS freezes specifications", () => {
  const harness = flat("CLAUDE.md");
  assert.match(harness, /After `SPEC_PASS`, specs are frozen/i);
  assert.match(harness, /Never apply MINOR edits silently/i);
});

test("generated roles are Builder, Reviewer and dormant Planner only", () => {
  const agents = fs.readdirSync(path.join(ROOT, "templates/common/.claude/agents")).sort();
  assert.deepEqual(agents, ["builder.md", "planner.md", "reviewer.md"]);
  assert.equal(fs.existsSync(path.join(ROOT, "templates/capabilities/supabase/.claude/agents/db-reviewer.md")), false);
  assert.match(flat("templates/common/.claude/agents/planner.md"), /not part of the initial build/i);
  assert.match(flat("templates/common/.claude/agents/planner.md"), /PRESERVED_CONTRACTS/);
});

test("no generated agent or project settings pin a model", () => {
  for (const rel of [
    "templates/common/.claude/agents/builder.md",
    "templates/common/.claude/agents/reviewer.md",
    "templates/common/.claude/agents/planner.md",
    ".claude/agents/spec-reviewer.md",
  ]) {
    assert.doesNotMatch(read(rel), /^model:|^effort:/m);
  }
  assert.deepEqual(json("templates/common/.claude/settings.json"), {});
  assert.match(flat("CLAUDE.md"), /never selects or pins a model/i);
});

test("Supabase composes one capability and no DB reviewer", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "v9-compose-"));
  try {
    fs.mkdirSync(path.join(dir, ".claude", "agents"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "templates/common/.claude/agents/builder.md"), path.join(dir, ".claude/agents/builder.md"));
    fs.copyFileSync(path.join(ROOT, "templates/common/.claude/agents/reviewer.md"), path.join(dir, ".claude/agents/reviewer.md"));
    fs.copyFileSync(path.join(ROOT, "templates/common/.mcp.json"), path.join(dir, ".mcp.json"));
    assert.deepEqual(composeBackendCapability(dir, "supabase"), { supabase: true });
    assert.equal(fs.existsSync(path.join(dir, ".claude/capabilities/supabase.md")), true);
    assert.equal(fs.existsSync(path.join(dir, ".claude/agents/db-reviewer.md")), false);
    const mcp = JSON.parse(fs.readFileSync(path.join(dir, ".mcp.json")));
    assert.ok(mcp.mcpServers.supabase);
    assert.match(fs.readFileSync(path.join(dir, ".claude/agents/builder.md"), "utf8"), /mcp__supabase/);
    assert.match(fs.readFileSync(path.join(dir, ".claude/agents/reviewer.md"), "utf8"), /mcp__supabase/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("generic Reviewer owns read-only Supabase Foundation review", () => {
  const reviewer = flat("templates/common/.claude/agents/reviewer.md");
  const capability = flat("templates/capabilities/supabase/.claude/capabilities/supabase.md");
  assert.match(reviewer, /same scoped Supabase MCP read-only/i);
  assert.match(capability, /generic Reviewer reuses it read-only/i);
  assert.match(capability, /does not apply migrations, create fixtures, change settings/i);
});

test("fresh workflow state is phase-review centric and evidence-aware", () => {
  const state = json("templates/common/.workflow/state.json");
  assert.equal(state.schema_version, 5);
  assert.equal(state.phase, "READY_TO_BUILD");
  assert.deepEqual(state.active_tasks, []);
  assert.equal(state.review_round, 0);
  assert.equal(state.correction_round, 0);
  assert.equal(state.pending_action, null);
  assert.equal(state.external_operation, null);
  assert.ok(state.evidence.foundation_review === null && state.evidence.quality_gate === null);
  assert.equal("current_group" in state, false);
  assert.equal("global_round" in state, false);
});

test("create-project copies the versioned Stack Profile into generated repositories", () => {
  const script = read("scripts/create-project.mjs");
  assert.match(script, /\.workflow.*stack-profile\.json/s);
  assert.match(script, /fs\.copyFileSync\(path\.join\(paths\.stackProfiles/);
});

test("validate-project enforces V9 composition and no model pin", () => {
  const validator = read("scripts/validate-project.mjs");
  assert.match(validator, /No dedicated DB reviewer is generated/);
  assert.match(validator, /Generic Reviewer receives the same scoped Supabase MCP/);
  assert.match(validator, /Versioned stack contract present/);
  assert.match(validator, /byte-equivalent to configured profile/);
  assert.match(validator, /Request boundary is machine-readable/);
  assert.match(validator, /Project settings do not pin a model/);
  assert.match(validator, /schema_version === 5/);
});

test("four context checkpoints occur only at durable boundaries", () => {
  const harness = flat("templates/common/CLAUDE.md");
  for (const pair of [
    ["P1", "FOUNDATION_REVIEW PASS → PRODUCT_BUILD"],
    ["P2", "BUILD_REVIEW PASS → LOCAL_PREVIEW"],
    ["P3", "HUMAN_PREVIEW approved → E2E"],
    ["P4", "QUALITY_GATE PASS → READY_TO_DEPLOY"],
  ]) {
    assert.match(harness, new RegExp(pair[0] + " " + pair[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(harness, /no task, review, correction, pending human action or remote operation is in flight/i);
});

test("Product Build is continuous and integration is not a separate phase", () => {
  const tasks = flat("templates/common/specs/tasks.md");
  const builder = flat("templates/common/.claude/agents/builder.md");
  assert.match(tasks, /It does not stop for task-by-task reviews/i);
  assert.match(tasks, /Integration is part of building the product, not a separate phase/i);
  assert.match(builder, /complete assigned phase.*not one task\/review cycle/i);
});

test("global E2E runs once and Quality Gate consumes its evidence", () => {
  const harness = flat("templates/common/CLAUDE.md");
  assert.match(harness, /run the persistent Playwright critical-path suite once for the unchanged candidate/i);
  assert.match(harness, /QUALITY_GATE.*consume current E2E PASS; do not rerun it/i);
  assert.match(harness, /Any code change invalidates affected evidence/i);
});

test("Planner protects unaffected contracts and chooses minimum re-entry", () => {
  const planner = flat("templates/common/.claude/agents/planner.md");
  const harness = flat("templates/common/CLAUDE.md");
  assert.match(planner, /PRESERVED_CONTRACTS/);
  assert.match(planner, /REENTRY: FOUNDATION \| PRODUCT_BUILD/);
  assert.match(harness, /actual spec\/code diff stays inside declared scope/i);
});

test("skill distribution remains slim and deterministic", () => {
  assert.equal(expectedSkills("next-standard-v1").length, 19);
  const profile = json("config/stack-profiles/next-standard-v1.json");
  assert.deepEqual(profile.profile_skills, ["shadcn-ui", "vercel-react-best-practices"]);
});

test("always-on harness files remain below 200 lines", () => {
  for (const rel of ["CLAUDE.md", "templates/common/CLAUDE.md"]) {
    assert.ok(read(rel).split(/\r?\n/).length <= 200, rel);
  }
});

test("central V9 contracts contain no retired phases or DB review gate", () => {
  for (const rel of [
    "CLAUDE.md",
    "templates/common/CLAUDE.md",
    "templates/common/specs/tasks.md",
    "scripts/lib/spec-gate.mjs",
  ]) {
    const text = read(rel);
    assert.doesNotMatch(text, /\bDB_REVIEW\b/, rel);
    assert.doesNotMatch(text, /\bBUILD_TASKS\b/, rel);
    assert.doesNotMatch(text, /\bINTEGRATION\b/, rel);
  }
});
