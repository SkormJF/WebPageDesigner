/**
 * Core contract invariants.
 *
 *   node --test tests/core-contract.test.mjs
 *
 * node:test and node:assert only -- no framework, no dependency, and not a
 * fourth top-level script. These are the properties of the Builder that have
 * broken before or would break silently: the phase a creation runs at, what the
 * who owns the fixed stack, who owns profile skills,
 * what a generated project starts as, and two contract sentences that were
 * factually wrong.
 *
 * Where a test reads prose, it reads the sentence that carries the rule. That is
 * deliberate: these documents *are* the contract, and a rule silently deleted
 * from one is exactly the regression worth catching.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { parseBackendMode, composeBackendCapability, expectedSkills } from "../scripts/lib/common.mjs";
import { runSpecGate } from "../scripts/lib/spec-gate.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

/* A rule that survives a reflow is still the same rule. Reading prose through
   this means a test fails when a contract sentence is deleted or reversed, not
   when a paragraph is rewrapped at a different width. */
const flat = (rel) => read(rel).replace(/\s+/g, " ");

const PROFILES = ["next-standard-v1"];

/* ------------------------------------------------------------------ */

describe("parseBackendMode", () => {
  test("parses the two supported modes", () => {
    assert.equal(parseBackendMode("## Backend\n\n**Mode:** none\n"), "none");
    assert.equal(parseBackendMode("## Backend\n\n**Mode:** `supabase`\n"), "supabase");
  });

  test("reports an unsupported explicit mode instead of silently falling back", () => {
    assert.equal(parseBackendMode("## Backend\n\n**Mode:** firebase\n"), "unsupported:firebase");
  });

  test("an unfilled template is not a backend decision", () => {
    assert.equal(parseBackendMode(read("templates/common/specs/design.md")), null);
  });
});

/* ------------------------------------------------------------------ */

describe("skill distribution", () => {
  const manifest = readJson("config/skill-manifest.json");
  const byDistribution = (kind) =>
    Object.entries(manifest.skills)
      .filter(([, entry]) => entry.distribution === kind)
      .map(([name]) => name);

  test("the catalogue is 17 standard + 2 profile-inherited + 1 optional = 20", () => {
    assert.equal(byDistribution("inherited-standard").length, 17);
    assert.equal(byDistribution("profile-inherited").length, 2);
    assert.equal(byDistribution("optional").length, 1);
    assert.equal(Object.keys(manifest.skills).length, 20);
  });

  for (const id of PROFILES) {
    test(`${id} expects 19 skills`, () => {
      const expected = expectedSkills(id);
      assert.equal(expected.length, 19);
      assert.equal(new Set(expected).size, 19, "no duplicates");
    });

    test(`${id} inherits no optional skill`, () => {
      const expected = expectedSkills(id);
      for (const optional of byDistribution("optional")) {
        assert.ok(
          !expected.includes(optional),
          `${optional} is optional and must reach a project only through an explicit decision`,
        );
      }
      assert.ok(!expected.includes("chrome-bridge-automation"));
    });

    test(`${id} takes exactly the profile_skills it declares`, () => {
      const profile = readJson(`config/stack-profiles/${id}.json`);
      assert.ok(Array.isArray(profile.profile_skills), "the profile owns profile_skills");
      const expected = expectedSkills(id);
      for (const skill of profile.profile_skills) {
        assert.equal(manifest.skills[skill].distribution, "profile-inherited");
        assert.ok(expected.includes(skill));
      }
      const takenProfileSkills = byDistribution("profile-inherited").filter((s) => expected.includes(s));
      assert.deepEqual(takenProfileSkills.sort(), [...profile.profile_skills].sort());
    });

    test(`${id} names only skills that exist on disk`, () => {
      for (const skill of expectedSkills(id)) {
        assert.ok(
          fs.existsSync(path.join(ROOT, ".claude", "skills", skill, "SKILL.md")),
          `${skill} has no SKILL.md`,
        );
      }
    });
  }

  test("the manifest classifies and does not also name recipients", () => {
    for (const [name, entry] of Object.entries(manifest.skills)) {
      assert.ok(!("profiles" in entry), `${name}: profile ownership belongs to the stack profile alone`);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("Spec Gate enforces fixed phases, capabilities, gates and dependency shape", () => {
  const makeSpecs = (tasksText, backendMode = "none", requirementsText = null) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wpd-spec-groups-"));
    const files = {
      "PROJECT.md": "# Project\n\n## Identity\nX\n\n## What this is\nX\n\n## Scope\nX\n\n## Decisions in force\nX\n",
      "requirements.md": requirementsText ?? "# Requirements\n\n## Functional requirements\n| ID | Priority | Requirement |\n|---|---|---|\n| REQ-001 | MUST | The system shall work. |\n\n## Non-functional requirements\nNone.\n",
      "design.md": `# Design\n\n## Architecture\nX\n\n- **Baseline deviations:** none\n\n## Routes\nX\n\n## Backend\n**Mode:** ${backendMode}\n\n## Security\nX\n`,
      "design-system.md": "# DS\n\n## Approval\nX\n\n## Color\nX\n\n## Typography\nX\n\n## Interaction states\nX\n",
      "tasks.md": tasksText,
    };
    for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), value);
    return dir;
  };

  const validTasks = `# Tasks

## Dependency order
TASK-001 -> TASK-002 -> TASK-003

## Build groups
| Group | Phase | Purpose | Capability | Gate | Clear after |
|---|---|---|---|---|---|
| FOUNDATION | FOUNDATION | baseline | BASE | AUTO | NO |
| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |
| INTEGRATION | INTEGRATION | wiring | BASE | REVIEW | NO |

### Fixed phase ownership
FOUNDATION shared prerequisites. BUILD_TASKS features. INTEGRATION wiring.

## Foundation
| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-001 | Baseline | REQ-001 | — | FOUNDATION | LOW | Build succeeds. | PENDING |

## Features
| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-002 | Feature outcome | REQ-001 | TASK-001 | BUILD-01 | MEDIUM | Feature works. | PENDING |

## Integration
| ID | Task | Requirements | Depends on | Group | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-003 | Integrated outcome | REQ-001 | TASK-002 | INTEGRATION | MEDIUM | Integrated flow works. | PENDING |
`;

  const run = (tasks, backend = "none") => {
    const dir = makeSpecs(tasks, backend);
    try {
      return runSpecGate(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };

  test("accepts one valid group in each fixed phase", () => {
    assert.equal(run(validTasks).pass, true);
  });

  test("rejects a missing fixed phase", () => {
    const bad = validTasks
      .replace("| INTEGRATION | INTEGRATION | wiring | BASE | REVIEW | NO |\n", "")
      .replace("| TASK-003 | Integrated outcome | REQ-001 | TASK-002 | INTEGRATION | MEDIUM | Integrated flow works. | PENDING |\n", "");
    const result = run(bad);
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((f) => /fixed phase INTEGRATION has no declared build group/.test(f.message)));
  });

  test("rejects unknown capability and gate", () => {
    const bad = validTasks.replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
      "| BUILD-01 | BUILD_TASKS | features | MAGIC | SURPRISE | NO |");
    const result = run(bad);
    assert.ok(result.findings.some((f) => /invalid Capability MAGIC/.test(f.message)));
    assert.ok(result.findings.some((f) => /invalid Gate SURPRISE/.test(f.message)));
  });

  test("AUTO is all-LOW only", () => {
    const bad = validTasks.replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
      "| BUILD-01 | BUILD_TASKS | features | BASE | AUTO | NO |");
    const result = run(bad);
    assert.ok(result.findings.some((f) => /contains non-LOW work and cannot use Gate AUTO/.test(f.message)));
  });

  test("SUPABASE capability is impossible on Backend Mode none", () => {
    const bad = validTasks.replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
      "| BUILD-01 | BUILD_TASKS | features | SUPABASE | REVIEW | NO |");
    const result = run(bad, "none");
    assert.ok(result.findings.some((f) => /requires Capability SUPABASE.*Backend Mode is not supabase/.test(f.message)));
  });

  test("DB_REVIEW requires SUPABASE capability and CRITICAL work", () => {
    const noCapability = validTasks.replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
      "| BUILD-01 | BUILD_TASKS | features | BASE | DB_REVIEW | NO |");
    let result = run(noCapability, "supabase");
    assert.ok(result.findings.some((f) => /uses Gate DB_REVIEW but Capability is not SUPABASE/.test(f.message)));

    const noCritical = validTasks.replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
      "| BUILD-01 | BUILD_TASKS | features | SUPABASE | DB_REVIEW | NO |");
    result = run(noCritical, "supabase");
    assert.ok(result.findings.some((f) => /uses Gate DB_REVIEW but contains no CRITICAL task/.test(f.message)));
  });

  test("accepts a correctly scoped critical Supabase group", () => {
    const good = validTasks
      .replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
        "| BUILD-01 | BUILD_TASKS | features | SUPABASE | DB_REVIEW | NO |")
      .replace("| TASK-002 | Feature outcome | REQ-001 | TASK-001 | BUILD-01 | MEDIUM |",
        "| TASK-002 | Feature outcome | REQ-001 | TASK-001 | BUILD-01 | CRITICAL |");
    assert.equal(run(good, "supabase").pass, true);
  });

  test("rejects global E2E ceremony leaked into an Integration task", () => {
    const bad = validTasks.replace(
      "| TASK-003 | Integrated outcome | REQ-001 | TASK-002 | INTEGRATION | MEDIUM | Integrated flow works. | PENDING |",
      "| TASK-003 | The end-to-end suite covers the critical paths | REQ-001 | TASK-002 | INTEGRATION | MEDIUM | The E2E suite runs green and is verified by breaking it once. | PENDING |",
    );
    const result = run(bad);
    assert.ok(result.findings.some((f) => /standalone E2E-suite work belongs to lifecycle phase E2E/.test(f.message)));
    assert.ok(result.findings.some((f) => /deliberately breaking a test is not task acceptance/.test(f.message)));
  });

  test("allows Playwright spec authoring without a global E2E pass inside the task", () => {
    const good = validTasks.replace(
      "| TASK-003 | Integrated outcome | REQ-001 | TASK-002 | INTEGRATION | MEDIUM | Integrated flow works. | PENDING |",
      "| TASK-003 | Persistent Playwright specs cover the integrated critical paths | REQ-001 | TASK-002 | INTEGRATION | MEDIUM | Playwright discovers the authored specs and one focused route spec can run locally; the full suite is deferred to lifecycle E2E. | PENDING |",
    );
    assert.equal(run(good).pass, true);
  });

  test("rejects Supabase Auth/control-plane settings inside DB_REVIEW", () => {
    const bad = validTasks
      .replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
        "| BUILD-01 | BUILD_TASKS | features | SUPABASE | DB_REVIEW | NO |")
      .replace("| TASK-002 | Feature outcome | REQ-001 | TASK-001 | BUILD-01 | MEDIUM | Feature works. | PENDING |",
        "| TASK-002 | The project's authentication is configured for email sign-up | REQ-001 | TASK-001 | BUILD-01 | CRITICAL | Email confirmation is disabled and signup establishes a session immediately. | PENDING |");
    const result = run(bad, "supabase");
    assert.ok(result.findings.some((f) => /TASK-002 places Supabase Auth\/project\/control-plane configuration inside DB_REVIEW/.test(f.message)));
  });

  test("Clear after YES is allowed at most once and only in BUILD_TASKS", () => {
    const outside = validTasks.replace("| FOUNDATION | FOUNDATION | baseline | BASE | AUTO | NO |",
      "| FOUNDATION | FOUNDATION | baseline | BASE | AUTO | YES |");
    let result = run(outside);
    assert.ok(result.findings.some((f) => /requests Clear after = YES outside BUILD_TASKS/.test(f.message)));

    const twice = validTasks
      .replace("| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | NO |",
        "| BUILD-01 | BUILD_TASKS | features | BASE | REVIEW | YES |\n| BUILD-02 | BUILD_TASKS | more | BASE | AUTO | YES |")
      .replace("## Integration\n", `| TASK-004 | More build work | REQ-001 | TASK-001 | BUILD-02 | LOW | More works. | PENDING |\n\n## Integration\n`);
    result = run(twice);
    assert.ok(result.findings.some((f) => /more than one BUILD_TASKS group requests Clear after = YES/.test(f.message)));
  });

  test("every task must start PENDING", () => {
    const bad = validTasks.replace("| Integrated flow works. | PENDING |", "| Integrated flow works. | ACTIVE |");
    const result = run(bad);
    assert.ok(result.findings.some((f) => /TASK-003 must start PENDING/.test(f.message)));
  });

  test("rejects undeclared and backward-across-phase dependencies", () => {
    const undeclared = validTasks.replace("| TASK-002 | Feature outcome | REQ-001 | TASK-001 |",
      "| TASK-002 | Feature outcome | REQ-001 | TASK-999 |");
    let result = run(undeclared);
    assert.ok(result.findings.some((f) => /TASK-002 depends on undeclared task TASK-999/.test(f.message)));

    const backward = validTasks.replace("| TASK-001 | Baseline | REQ-001 | — |",
      "| TASK-001 | Baseline | REQ-001 | TASK-003 |");
    result = run(backward);
    assert.ok(result.findings.some((f) => /TASK-001 in FOUNDATION depends on later-phase TASK-003 in INTEGRATION/.test(f.message)));
  });

  test("rejects dependency cycles", () => {
    const bad = validTasks
      .replace("| TASK-001 | Baseline | REQ-001 | — |", "| TASK-001 | Baseline | REQ-001 | TASK-002 |")
      .replace("| TASK-002 | Feature outcome | REQ-001 | TASK-001 |", "| TASK-002 | Feature outcome | REQ-001 | TASK-001 |");
    const result = run(bad);
    assert.ok(result.findings.some((f) => /dependency cycle detected/.test(f.message)));
  });
});

/* ------------------------------------------------------------------ */

describe("generated project starting state", () => {
  const state = readJson("templates/common/.workflow/state.json");

  test("phase is READY_TO_BUILD", () => {
    assert.equal(state.phase, "READY_TO_BUILD");
  });

  test("nothing is in flight", () => {
    for (const field of ["current_group", "group_stage", "pending_action", "external_operation"]) {
      assert.ok(field in state, `${field} is missing from the schema`);
      assert.equal(state[field], null, `${field} must start null`);
    }
    assert.deepEqual(state.active_tasks, []);
    assert.equal(state.review_round, 0);
    assert.equal(state.global_round, 0);
    assert.equal(state.schema_version, 3);
  });
});

/* ------------------------------------------------------------------ */

describe("creation lifecycle", () => {
  const script = read("scripts/create-project.mjs");
  const harness = read("CLAUDE.md");

  test("create-project runs at CREATING_PROJECT", () => {
    assert.match(script, /state\.phase\s*!==\s*"CREATING_PROJECT"/);
  });

  test("create-project no longer demands READY_TO_CREATE", () => {
    assert.doesNotMatch(
      script,
      /state\.phase\s*!==\s*"READY_TO_CREATE"/,
      "write-before-act persists CREATING_PROJECT, so that guard can only be satisfied by skipping the write",
    );
  });

  test("create-project never writes lifecycle state", () => {
    assert.doesNotMatch(script, /writeJson\(\s*statePath/);
    assert.doesNotMatch(script, /state\.phase\s*=[^=]/);
  });

  test("the harness states the same precondition as the script", () => {
    assert.match(harness, /Preconditions: phase is `CREATING_PROJECT`/);
    assert.doesNotMatch(harness, /Preconditions: phase is `READY_TO_CREATE`/);
  });

  test("the harness handoff chain is READY_TO_CREATE -> CREATING_PROJECT -> create-project", () => {
    assert.match(harness, /READY_TO_CREATE → CREATING_PROJECT → create-project/);
  });
});

/* ------------------------------------------------------------------ */

describe("fixed platform ownership", () => {
  const harness = read("CLAUDE.md");
  const config = readJson("builder.config.json");

  test("builder.config fixes Next as the only stack", () => {
    assert.equal(config.stack_profile, "next-standard-v1");
    assert.ok(!("default_stack_profile" in config));
    assert.deepEqual(
      fs.readdirSync(path.join(ROOT, "config", "stack-profiles")).filter((f) => f.endsWith(".json")),
      ["next-standard-v1.json"],
    );
  });

  test("design.md does not duplicate the Factory-owned stack", () => {
    const design = read("templates/common/specs/design.md");
    assert.doesNotMatch(design, /## Stack profile|\*\*Profile:\*\*/i);
    assert.match(design, /Baseline deviations/);
    assert.match(harness, /Platform is not a Discovery question/i);
    assert.match(harness, /Do not ask the user to select a framework/i);
    assert.match(harness, /single owner.*validated Next baseline/i);
  });

  test("state.json carries no profile", () => {
    const blocks = [...harness.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);
    const stateBlock = blocks.find((b) => b.includes('"phase"'));
    assert.ok(stateBlock, "the state.json example is missing from CLAUDE.md");
    for (const key of Object.keys(JSON.parse(stateBlock))) {
      assert.doesNotMatch(key, /profile/i, `state.json must not carry ${key}`);
    }
  });

  test("PROJECT.md does not restate the stack", () => {
    const project = read("templates/common/specs/PROJECT.md");
    assert.doesNotMatch(project, /^\s*[-*]\s*\*\*Profile:\*\*/m);
  });

  test("both scripts reject the removed --profile selector and use the fixed config", () => {
    for (const rel of ["scripts/create-project.mjs", "scripts/validate-project.mjs"]) {
      const source = read(rel);
      assert.match(source, /--profile no longer exists/);
      assert.match(source, /config\.stack_profile/);
      assert.doesNotMatch(source, /config\.default_stack_profile/);
      assert.doesNotMatch(source, /readDeclaredProfile|parseDeclaredProfile|PROFILE_MISMATCH/);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("agent ownership and Next harness integrity", () => {
  test("the Factory has only spec-reviewer; Planner belongs to generated projects", () => {
    const factoryAgents = fs.readdirSync(path.join(ROOT, ".claude", "agents")).filter((name) => name.endsWith(".md")).sort();
    const generatedAgents = fs.readdirSync(path.join(ROOT, "templates/common/.claude/agents")).filter((name) => name.endsWith(".md")).sort();
    assert.deepEqual(factoryAgents, ["spec-reviewer.md"]);
    assert.deepEqual(generatedAgents, ["builder.md", "planner.md", "reviewer.md"]);
  });

  test("Next cannot rewrite the repository-owned CLAUDE.md", () => {
    const config = read("templates/stacks/next-standard-v1/next.config.ts");
    const profile = flat("config/stack-profiles/next-standard-v1.json");
    const harness = flat("templates/common/CLAUDE.md");
    assert.match(config, /agentRules:\s*false/);
    assert.match(profile, /agent-rule generation is disabled/i);
    assert.match(harness, /node_modules\/next\/dist\/docs/);
  });

  test("the inherited Planner is dormant during initial build and re-enters fixed phases only after approved future work", () => {
    const planner = flat("templates/common/.claude/agents/planner.md");
    const harness = flat("templates/common/CLAUDE.md");
    assert.match(planner, /not part of the initial build loop/i);
    assert.match(planner, /REENTRY: FOUNDATION \| BUILD_TASKS/);
    assert.match(harness, /`DONE` is stable until the human requests meaningful new work/i);
    assert.match(harness, /re-enter FOUNDATION only for backend\/platform\/shared-baseline prerequisites/i);
  });

  test("review agents have mechanical turn ceilings in addition to orchestration ceilings", () => {
    const specReviewer = read(".claude/agents/spec-reviewer.md");
    const reviewer = read("templates/common/.claude/agents/reviewer.md");
    const dbReviewer = read("templates/capabilities/supabase/.claude/agents/db-reviewer.md");
    assert.match(specReviewer, /^maxTurns:\s*24$/m);
    assert.match(reviewer, /^maxTurns:\s*18$/m);
    assert.match(dbReviewer, /^maxTurns:\s*24$/m);
    assert.match(flat("templates/common/CLAUDE.md"), /Maximum \*\*two Reviewer runs per group\*\*/i);
  });

  test("Spec Reviewer treats over-fragmentation as a real planning defect", () => {
    const reviewer = flat(".claude/agents/spec-reviewer.md");
    assert.match(reviewer, /groups first, tasks second/i);
    assert.match(reviewer, /one-task LOW groups/i);
    assert.match(reviewer, /MAJOR efficiency defect/i);
  });
});

/* ------------------------------------------------------------------ */

describe("handoff recovery", () => {
  const harness = read("CLAUDE.md");
  const validator = read("scripts/validate-project.mjs");

  test("CREATING_PROJECT branches on whether the target exists", () => {
    assert.match(harness, /target does NOT exist[\s\S]*safe to re-run create-project/);
    assert.match(harness, /target DOES exist[\s\S]*do NOT re-run create-project[\s\S]*persist VALIDATING_PROJECT/);
  });

  test("VALIDATING_PROJECT re-runs the full validator, with no partial pass", () => {
    assert.match(harness, /VALIDATION_PASS → persist HANDOFF_COMPLETE/);
    assert.match(harness, /VALIDATION_FAIL → stay blocked/);
    assert.match(harness, /no partial pass/i);
  });

  test("HANDOFF_COMPLETE resets and regenerates nothing", () => {
    assert.match(harness, /`HANDOFF_COMPLETE`\.[\s\S]*reset-builder[\s\S]*Regenerate nothing/);
  });

  test("the validator proves the target is this project's, mid-handoff only", () => {
    assert.match(validator, /\["CREATING_PROJECT",\s*"VALIDATING_PROJECT"\]/);
    assert.match(validator, /activeState\.slug === args\.slug/);
    assert.match(validator, /Generated specifications match the active approved specifications/);
    assert.match(validator, /\.equals\(fs\.readFileSync\(generated\)\)/);
  });

  test("the validator still repairs nothing", () => {
    assert.doesNotMatch(validator, /copyFileSync|fs\.writeFileSync|rmSync/);
  });

  /* Byte-for-byte identity holds only because a specification reaching creation
     carries no [PROJECT_NAME] for substituteTokens to rewrite. */
  test("the Spec Gate rejects [PROJECT_NAME] in a specification", () => {
    assert.match(read("scripts/lib/spec-gate.mjs"), /\\\[PROJECT_NAME\\\]/);
    assert.match(read("scripts/create-project.mjs"), /runSpecGate\(\)/);
  });
});

/* ------------------------------------------------------------------ */

describe("Supabase MCP scoping", () => {
  const projectHarness = read("templates/capabilities/supabase/.claude/capabilities/supabase.md");

  test("the pending action carries project_ref", () => {
    const block = projectHarness.match(/```json\n([\s\S]*?)```/g)?.find((b) => b.includes("RESTART_FOR_SUPABASE_MCP_SCOPE"));
    assert.ok(block, "the RESTART_FOR_SUPABASE_MCP_SCOPE example is missing");
    const parsed = JSON.parse(block.replace(/```json\n/, "").replace(/```$/, ""));
    assert.equal(parsed.pending_action.type, "RESTART_FOR_SUPABASE_MCP_SCOPE");
    assert.ok(parsed.pending_action.project_ref, "project_ref is mandatory in the record");
  });

  test("project_ref is stated as mandatory, not optional", () => {
    assert.match(projectHarness, /`project_ref` is mandatory in that record/);
    assert.doesNotMatch(projectHarness, /only if you need it there/);
  });

  test("recovery compares the expected ref against the one on disk", () => {
    assert.match(projectHarness, /expected_ref\s*=\s*pending_action\.project_ref/);
    assert.match(projectHarness, /disk_ref/);
    assert.match(projectHarness, /expected_ref != disk_ref[\s\S]*stay blocked/);
  });

  test("pending_action is not cleared before identity is verified", () => {
    assert.match(projectHarness, /prove identity, not connectivity/);
    assert.match(projectHarness, /PASS → pending_action = null/);
    assert.match(projectHarness, /never cleared on the way in/);
  });

  test("the base .mcp.json stays Vercel-only until Supabase is selected", () => {
    const mcp = readJson("templates/common/.mcp.json");
    assert.ok(mcp.mcpServers.vercel, "the Vercel entry always ships");
    assert.ok(!mcp.mcpServers.supabase, "Supabase is composed only for Backend Mode supabase");
  });
});

/* ------------------------------------------------------------------ */

describe("always-on context budget", () => {
  /* Both harnesses are loaded on every single session, so their size is a
     running cost rather than a style question. The target is 200 lines each,
     and it is the target rather than whatever the files happen to measure:
     when the content did not fit, the fix was extracting specialist HOW to the
     skill that owns it, never raising the ceiling. Lowering these after a
     further real reduction is the point; raising them is not. */
  const CEILING = 200;

  for (const rel of ["CLAUDE.md", "templates/common/CLAUDE.md"]) {
    test(`${rel} stays under ${CEILING} lines`, () => {
      const lines = read(rel).split(/\r?\n/).length;
      assert.ok(lines <= CEILING, `${rel} is ${lines} lines, over the ${CEILING}-line ceiling`);
    });

    /* A file compressed by writing 400-character lines has moved the cost, not
       removed it. Tables carry long rows legitimately; prose does not. */
    test(`${rel} is not compressed into giant lines`, () => {
      const offenders = read(rel)
        .split(/\r?\n/)
        .map((line, i) => [i + 1, line])
        .filter(([, line]) => line.length > 200);
      assert.deepEqual(offenders, []);
    });
  }
});

/* ------------------------------------------------------------------ */

describe("/clear checkpoints are the only compaction policy", () => {
  /* Two policies for the same problem is one policy too many: a harness that
     both compacts at safe boundaries and stops at fixed checkpoints leaves the
     model to pick, and the checkpoint is the one recovery is designed around.
     `/compact` remains a capability the user has; it is not harness policy.
     Prose describing a *skill's* own subject (a "compact" control tier) is not
     an instruction to compact, hence the word-boundary slash. */
  for (const rel of ["CLAUDE.md", "templates/common/CLAUDE.md"]) {
    test(`${rel} never instructs /compact`, () => {
      assert.doesNotMatch(read(rel), /\/compact\b/i);
    });
  }

  test("the checkpoint, not compaction, is what closes a macro-phase", () => {
    for (const rel of ["CLAUDE.md", "templates/common/CLAUDE.md"]) {
      assert.match(flat(rel), /do not ask for `\/clear` yet/, `${rel} keeps the /clear checkpoint`);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("Artifact approval costs one turn when nothing is contested", () => {
  const harness = flat("CLAUDE.md");
  const skill = flat(".claude/skills/artifact-design/SKILL.md");

  /* Approving palette, then typography, then buttons, each in its own turn,
     spent a Discovery round on a direction nobody was arguing about. One
     question is only honest if the decisions behind it were named first, so
     both halves are asserted together -- dropping the naming would turn this
     into the "¿te gusta?" the contract has always forbidden. */
  test("the harness asks once, after naming the decisions", () => {
    assert.match(harness, /One approval turn when nothing is contested/);
    assert.match(harness, /name the major visual decisions/);
    assert.match(harness, /\[ Aprobar dirección visual \] \[ Quiero cambios \]/);
  });

  test("the skill states the same contract", () => {
    assert.match(skill, /One approval turn when nothing is contested/);
    assert.match(skill, /Naming the decisions is what separates\s+one honest question from "¿te gusta\?"/);
  });

  test("a contested element still gets its own question", () => {
    assert.match(harness, /a genuinely ambiguous element still earns its own/);
    assert.match(skill, /Ask about the one element that is genuinely\s+ambiguous/);
  });

  test("human approval is still required, and changes republish to the same URL", () => {
    assert.match(skill, /republish to the same URL/);
    assert.match(harness, /republished to the same URL/);
  });
});

/* ------------------------------------------------------------------ */

describe("specification templates stay affordable to load", () => {
  /* Every one of these is read during Planning, immediately after the B1
     `/clear`, so their instructional text is a cost paid at the worst moment.
     What is measured is the guidance -- SLOT comments and prose rules -- and
     not the tables, headings and [TBD] scaffolding, which are the structure a
     spec is written into rather than text explaining how to write it. */
  const SPECS = ["PROJECT.md", "requirements.md", "design.md", "design-system.md", "tasks.md"];
  const words = (s) => s.split(/\s+/).filter(Boolean).length;

  const instructionWords = (text) => {
    const slots = (text.match(/<!--[\s\S]*?-->/g) ?? []).join(" ");
    let fenced = false;
    let prose = 0;
    for (const line of text.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
      if (/^```/.test(line)) fenced = !fenced;
      else if (!fenced && line.trim() && !/^#/.test(line) && !/^\s*\|/.test(line) && !/^---/.test(line)) {
        prose += words(line);
      }
    }
    return words(slots) + prose;
  };

  test("the combined instructional footprint stays under 2500 words", () => {
    const report = SPECS.map((f) => {
      const text = read(`templates/common/specs/${f}`);
      return { file: f, total: words(text), instructions: instructionWords(text) };
    });
    const combined = report.reduce((n, r) => n + r.instructions, 0);

    /* Reported, not just asserted: a regression here is gradual, and the
       per-file numbers say which template drifted. */
    for (const r of report) {
      console.log(`    ${r.file.padEnd(20)} ${String(r.instructions).padStart(4)} instruction words  (${r.total} total)`);
    }
    console.log(`    ${"COMBINED".padEnd(20)} ${String(combined).padStart(4)} instruction words`);

    assert.ok(combined <= 2500, `templates carry ${combined} instruction words, over the 2500 ceiling`);
  });
});

/* ------------------------------------------------------------------ */

describe("Artifact is only a visual approval instrument", () => {
  const harness = flat("CLAUDE.md");
  const skill = flat(".claude/skills/artifact-design/SKILL.md");

  test("the harness scopes it to Round 4 visual approval", () => {
    assert.match(harness, /R4's approval instrument, and nothing else/);
    assert.match(harness, /\*\*Never for anything else\*\*/);
  });

  test("the harness names the report-shaped uses it is not for", () => {
    for (const forbidden of ["SPEC_PASS", "deploy approval", "check lists", "operational documents"]) {
      assert.ok(harness.includes(forbidden), `the exclusion list must name ${forbidden}`);
    }
  });

  test("the skill states the same exclusion", () => {
    assert.match(skill, /## The one thing this is for/);
    assert.match(skill, /Discovery Round 4/);
    assert.match(skill, /An artifact is \*\*never\*\* the vehicle for a report/);
  });

  test("what is approved is a named system, not every CSS literal", () => {
    assert.match(harness, /not every CSS literal/);
    assert.match(skill, /Build it from a small named system, not from literals/);
    assert.match(skill, /Never produce an inventory of every `margin`, `padding` and `gap`/);
    assert.match(skill, /LOCAL IMPLEMENTATION DETAIL → stays local/);
    /* A 4px grid is one product's answer, not the system's. */
    assert.match(skill, /No universal 4px grid is imposed/);
  });

  test("no accessibility claim without a measurement", () => {
    assert.match(skill, /Do not claim accessibility you have not measured/);
    assert.match(skill, /UNVERIFIED/);
    assert.match(skill, /Do not run a full accessibility audit during Discovery/);
    assert.match(harness, /no accessibility claim is made without a real measurement/);
  });

  test("it is transient, and nobody spends a turn deleting it", () => {
    assert.match(harness, /until `reset-builder` removes it/);
    assert.match(harness, /never copied into the generated project/);
    assert.match(skill, /do not spend a turn deleting it/i);
  });

  test("create-project copies specifications, never the artifact directory", () => {
    const script = read("scripts/create-project.mjs");
    assert.doesNotMatch(script, /artifact/i, "the artifact directory must never reach a generated project");
  });
});

/* ------------------------------------------------------------------ */

describe("Artifact approval does not contractualise every CSS literal", () => {
  const skill = flat(".claude/skills/artifact-design/SKILL.md");
  const harness = flat("CLAUDE.md");

  test("approval covers the named system, tokens and component contracts", () => {
    assert.match(skill, /Artifact approval → the named visual system/);
    assert.match(skill, /→ global and reusable tokens/);
    assert.match(skill, /→ explicit component contracts/);
    assert.match(skill, /→ NOT every local detail promoted to a global token/);
  });

  test("a local detail stays local and does not become a global token", () => {
    assert.match(skill, /LOCAL IMPLEMENTATION DETAIL → stays local, and does not become a global token/);
    assert.match(skill, /Never produce an inventory of every `margin`, `padding` and `gap`/);
    assert.match(skill, /approving the page is not approving each `padding`, `margin` and `gap`/);
    assert.match(harness, /not every CSS literal/);
  });

  /* The contradiction this replaced: the skill promised approval of "its exact
     colour, radius, height, padding" and a `verbatim` copy of every value, then
     three sections later forbade the literal inventory that would require. Each
     pattern below is a form the absolute rule took, or would take again. */
  test("no absolute turns each literal into an approved clause", () => {
    for (const absolute of [
      /approves its exact colour, radius, height, padding/i,
      /copies the approved values verbatim/i,
      /copy(?:ing|ies)? (?:all|every) (?:the )?internal values/i,
      /every `?padding`?, `?margin`? and `?gap`? (?:is|are|becomes?) (?:approved|a token)/i,
      /each (?:CSS )?literal (?:is|becomes) (?:approved|a token|contractual)/i,
    ]) {
      assert.doesNotMatch(skill, absolute, `artifact-design must not restate: ${absolute}`);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("token policy allows component-local spacing", () => {
  /* One contract, stated in the four places that enforce it. Colour and radius
     belong to the system; so does spacing that is reused or lays a page out.
     Spacing internal to one component is an implementation detail until
     `design-system.md` says otherwise -- and the override that changes identity
     is the finding, not the literal. */
  const FILES = [
    "templates/common/.claude/agents/builder.md",
    "templates/common/.claude/agents/reviewer.md",
    ".claude/skills/building-components/SKILL.md",
    ".claude/skills/atomic-design/SKILL.md",
  ];

  /* Each of these shipped in one of the four files and contradicted the
     contract by forbidding every literal outright. */
  const ABSOLUTES = [
    /never a literal value on a call site/i,
    /never a literal spacing value/i,
    /no literal values on call sites/i,
    /no literal values in the component/i,
    /never a literal colour, radius or spacing value/i,
    /colours, radii and spacing come from tokens/i,
    /tokens used for colour, spacing and radius/i,
    /all spacing must come from tokens/i,
  ];

  /* These read whole documents, so a plain assert.match would print the entire
     file on failure and bury the reason. The message is the finding. */
  const has = (text, re, msg) => assert.ok(re.test(text), msg);
  const lacks = (text, re, msg) => assert.ok(!re.test(text), msg);

  for (const rel of FILES) {
    const text = flat(rel);

    test(`${rel} permits component-local internal spacing`, () => {
      has(
        text,
        /spacing internal to a single component may stay local where `design-system\.md` allows it/i,
        `${rel} must allow component-local spacing under the approved contract`,
      );
    });

    test(`${rel} keeps design-system.md as the authority`, () => {
      has(
        text,
        /changes identity or contradicts `design-system\.md`/i,
        `${rel} must still catch the override that breaks the approved contract`,
      );
      has(
        text,
        /colours? and radi(?:i|us) (?:come )?from the system tokens/i,
        `${rel} must keep colour and radius on the system tokens`,
      );
      has(text, /reusable or layout spacing/i, `${rel} must keep reusable and layout spacing on tokens`);
    });

    test(`${rel} states no absolute that forbids every literal`, () => {
      for (const absolute of ABSOLUTES) {
        lacks(text, absolute, `${rel} must not restate the absolute rule: ${absolute}`);
      }
    });
  }

  /* Loosening the token rule must not loosen reuse-first. */
  test("reuse-first and the declared scales survive", () => {
    const atomic = flat(".claude/skills/atomic-design/SKILL.md");
    assert.match(atomic, /## Reuse first, but not at any cost/);
    assert.match(atomic, /Is this the third copy of something\? Extract it\./);
    assert.match(atomic, /Does every control's height come from a declared variant, not from the call site\?/);
    for (const rel of ["templates/common/.claude/agents/builder.md", "templates/common/.claude/agents/reviewer.md"]) {
      assert.match(flat(rel), /control heights? (?:come )?from (?:the )?declared variants?/i, `${rel} keeps the size scale`);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("RESET is a phase, not a step that gets skipped", () => {
  const harness = flat("CLAUDE.md");
  const script = read("scripts/reset-builder.mjs");

  test("the state machine still declares RESET", () => {
    assert.match(harness, /HANDOFF_COMPLETE → RESET → IDLE/);
  });

  test("the handoff chain passes through RESET before deleting anything", () => {
    assert.match(harness, /HANDOFF_COMPLETE → RESET → reset-builder --yes → IDLE/);
    assert.doesNotMatch(
      harness,
      /HANDOFF_COMPLETE → reset-builder/,
      "HANDOFF_COMPLETE must persist RESET first -- the phase is declared, so it is never skipped",
    );
  });

  test("HANDOFF_COMPLETE persists RESET, and RESET is what runs the reset", () => {
    assert.match(harness, /\*\*`HANDOFF_COMPLETE`\.\*\*[^*]*then persist `RESET`/);
    assert.match(harness, /\*\*`RESET`\.\*\* Run `reset-builder --yes` and go `IDLE`/);
  });

  test("ABANDON confirms, persists RESET, then resets", () => {
    assert.match(harness, /confirm, persist `RESET`, then run `reset-builder --yes`/);
  });

  /* The script exits 1 without --yes while the directory exists, so a harness
     sentence that omits the flag describes a call that cannot succeed. */
  test("no reset-builder invocation in the harness omits --yes", () => {
    const invocations = [...harness.matchAll(/[Rr]un `reset-builder([^`]*)`/g)].map((m) => m[1]);
    assert.ok(invocations.length >= 2, "the harness must say how reset-builder is invoked");
    for (const args of invocations) {
      assert.match(args, /--yes/, `"run \`reset-builder${args}\`" would exit 1 with .builder/current/ present`);
    }
    assert.match(harness, /refuses to delete without `--yes`/);
  });

  test("the script still requires --yes and takes no path", () => {
    assert.match(script, /if \(!args\.yes\)/);
    assert.match(script, /process\.exit\(1\)/);
    assert.doesNotMatch(script, /args\._\[0\]|args\.target|args\.path/);
  });
});

/* ------------------------------------------------------------------ */

describe("context checkpoints", () => {
  const harness = read("CLAUDE.md");
  const projectHarness = read("templates/common/CLAUDE.md");
  const checkpointBlock = (text) =>
    (text.match(/```\nCONTEXT CHECKPOINT\n[\s\S]*?```/) ?? [""])[0];

  for (const [label, text, count] of [
    ["Builder", harness, 2],
    ["generated project", projectHarness, 5],
  ]) {
    const prose = text.replace(/\s+/g, " ");

    test(`the ${label} prints the fixed checkpoint format`, () => {
      const block = checkpointBlock(text);
      assert.ok(block, `${label}: the CONTEXT CHECKPOINT block is missing`);
      for (const line of ["✓ Estado persistido", "✓ Decisiones persistidas", "✓ Siguiente fase:", "1. /clear", "2. continúa"]) {
        assert.ok(block.includes(line), `${label}: the checkpoint block must contain "${line}"`);
      }
    });

    test(`the ${label} stops there rather than continuing`, () => {
      assert.match(prose, /\*\*STOP\*\*, without continuing into the next phase/);
      assert.match(prose, /you never run `\/clear` yourself/i);
    });

    test(`the ${label} persists everything durable before asking for /clear`, () => {
      assert.match(prose, /do not ask for `\/clear` yet/);
    });

    test(`the ${label} declares ${count} fixed stops`, () => {
      assert.match(prose, count === 2 ? /Two fixed stops/ : /Five fixed stops/);
    });
  }

  test("B1 and B2 are where they belong and carry no pending action", () => {
    const prose = harness.replace(/\s+/g, " ");
    assert.match(prose, /\*\*B1 — after the Artifact is approved\.\*\*[^|]*?phase `PLANNING`[^|]*?`pending_action = null`/);
    assert.match(prose, /\*\*B2 — after human spec approval\.\*\*[^|]*?`READY_TO_CREATE`[^|]*?`pending_action = null`/);
    assert.match(prose, /re-read(ing)? the Artifact's HTML/);
  });

  test("P1 through P5 are where they belong", () => {
    for (const [id, phase] of [
      ["P1", "BUILD_TASKS"],
      ["P2", "INTEGRATION"],
      ["P3", "LOCAL_PREVIEW"],
      ["P4", "E2E"],
      ["P5", "READY_TO_DEPLOY"],
    ]) {
      assert.match(projectHarness, new RegExp(`${id}\\s+[^\\n]*→ persist phase ${phase}`), `${id} must persist ${phase}`);
    }
  });

  test("a generated-project /clear boundary has no work or operation in flight", () => {
    const prose = projectHarness.replace(/\s+/g, " ");
    for (const expected of [
      "current_group = null",
      "group_stage = null",
      "active_tasks = []",
      "review_round = 0",
      "global_round = 0",
      "pending_action = null",
      "external_operation = null",
    ]) {
      assert.ok(prose.includes(expected), `safe checkpoint must require ${expected}`);
    }
    assert.match(prose, /last completed group approved and committed/);
    assert.match(prose, /next lifecycle phase already persisted/);
  });

  test("Supabase scope restart is explicitly not a /clear checkpoint", () => {
    const prose = projectHarness.replace(/\s+/g, " ");
    assert.match(prose, /operational restart, not `\/clear`/i);
    assert.match(prose, /RESTART REQUIRED — Supabase MCP scope changed/);
    assert.match(prose, /never a CONTEXT CHECKPOINT/i);
  });
});

/* ------------------------------------------------------------------ */

describe("phases are never skipped", () => {
  for (const rel of ["CLAUDE.md", "templates/common/CLAUDE.md"]) {
    test(`${rel} forbids skipping a transient-looking phase`, () => {
      assert.match(flat(rel), /Never skip a declared enum phase because it appears transient/);
    });
  }

  test("READY_TO_CREATE is a persisted phase, not a formality", () => {
    const harness = flat("CLAUDE.md");
    assert.match(harness, /= READY_TO_CREATE/);
    assert.match(harness, /persist `READY_TO_CREATE` and stop at checkpoint \*\*B2\*\*/);
    assert.match(harness, /READY_TO_CREATE → CREATING_PROJECT → create-project/);
  });
});

/* ------------------------------------------------------------------ */

describe("Spec Reviewer cannot loop", () => {
  const harness = flat("CLAUDE.md");
  const reviewer = flat(".claude/agents/spec-reviewer.md");

  test("the harness caps automatic runs at two", () => {
    assert.match(harness, /Maximum 2 automatic Spec Reviewer runs/);
    assert.match(harness, /There is no third automatic pass/);
    assert.match(harness, /STOP and bring the consolidated/);
  });

  test("MINOR alone does not fail", () => {
    assert.match(harness, /MINOR only\s+→ does not block/);
    assert.match(harness, /it never triggers another review chain/);
    assert.match(reviewer, /\*\*MINOR findings alone never fail the specs\*\*/);
  });

  test("BLOCKER and MAJOR still fail", () => {
    assert.match(harness, /BLOCKER or MAJOR → SPEC_FAIL/);
    assert.match(reviewer, /Any BLOCKER or any MAJOR means `SPEC_FAIL`/);
  });

  test("the Spec Reviewer checks gate reviewability, not only risk labels", () => {
    const reviewer = flat(".claude/agents/spec-reviewer.md");
    assert.match(reviewer, /MAJOR reviewability defect/i);
    assert.match(reviewer, /Auth\/project settings/i);
    assert.match(reviewer, /full suite executes only after Human Preview/i);
  });

  test("the second Spec Reviewer run does not hunt unrelated MINOR findings", () => {
    const reviewer = flat(".claude/agents/spec-reviewer.md");
    assert.match(reviewer, /Do not hunt for unrelated new MINOR findings on the second pass/i);
  });

  test("the second run does not raise the standard", () => {
    assert.match(reviewer, /there is no third automatic run/);
    assert.match(reviewer, /You do \*\*not\*\* raise the standard, reinterpret the approved Artifact, widen scope/);
    assert.match(harness, /it does not raise the standard, reinterpret the approved Artifact/);
  });

  test("everything findable is reported in the first pass", () => {
    assert.match(reviewer, /\*\*Find everything in one pass\.\*\*/);
  });
});

/* ------------------------------------------------------------------ */

describe("specifications stay product-scoped", () => {
  const tasks = flat("templates/common/specs/tasks.md");
  const requirements = flat("templates/common/specs/requirements.md");
  const harness = flat("CLAUDE.md");

  test("the tasks template does not prescribe a QA task block", () => {
    assert.doesNotMatch(
      read("templates/common/specs/tasks.md"),
      /^##\s+Quality\s*$/m,
      "a Quality section invites TASK-9xx audit rows",
    );
    assert.match(tasks, /## What does NOT get a task/);
    assert.match(tasks, /no `TASK-9xx` quality block/);
    for (const gate of ["VISUAL_QA", "E2E", "QUALITY_GATE"]) {
      assert.ok(tasks.includes(gate), `the template must name the ${gate} gate that already covers it`);
    }
  });

  test("the harness says the same thing to whoever writes tasks.md", () => {
    assert.match(harness, /a \*\*global audit belongs to its later gate\*\*/);
    assert.match(harness, /no `TASK-9xx` QA block is generated/);
  });

  test("the requirements template excludes harness work", () => {
    assert.match(requirements, /Harness work is not a requirement/);
    assert.match(requirements, /could this project be built correctly and still miss this\?/i);
  });

  test("the harness scopes requirements to the product", () => {
    assert.match(harness, /Requirements are \*\*product\*\* scope/);
  });

  test("design-system.md holds durable truth, not a literal inventory", () => {
    const ds = flat("templates/common/specs/design-system.md");
    assert.match(ds, /no inventory of every CSS literal/);
    assert.match(ds, /No draft history/);
    assert.match(ds, /Write `UNVERIFIED` for anything that was not measured/);
  });
});

/* ------------------------------------------------------------------ */

describe("Reviewer contract", () => {
  const reviewer = read("templates/common/.claude/agents/reviewer.md");
  const tools = reviewer
    .match(/^tools:\s*(.+)$/m)[1]
    .split(",")
    .map((t) => t.trim());

  test("no Write, no Edit", () => {
    assert.ok(!tools.includes("Write"));
    assert.ok(!tools.includes("Edit"));
  });

  test("Bash is granted", () => {
    assert.ok(tools.includes("Bash"));
  });

  test("with Bash granted, it does not claim to be read-only by tool grant", () => {
    assert.doesNotMatch(
      reviewer,
      /read-only by tool grant/,
      "Bash can mutate the filesystem; read-only here is a contract, not an enforced sandbox",
    );
    assert.match(reviewer, /read-only by contract/);
    assert.match(reviewer, /not a technical sandbox/);
  });

  test("independence means minimum falsifying evidence, not Builder duplication", () => {
    assert.match(reviewer, /not to reproduce the Builder's investigation/);
    assert.match(reviewer, /smallest independent check that could falsify/i);
    assert.match(reviewer, /STOP RULE/);
    assert.match(reviewer, /Do not start an extra "final look"/);
  });

  test("round two is finding-driven and there is no third automatic review", () => {
    assert.match(reviewer, /at most two automatic review runs/i);
    assert.match(reviewer, /prior BLOCKER\/MAJOR/);
    assert.match(reviewer, /minimum regression/i);
    assert.match(reviewer, /stops automatic cycling/i);
  });

  test("Reviewer returns evidence instead of writing the review file", () => {
    assert.match(reviewer, /Return exactly this structured verdict/);
    assert.match(reviewer, /Orchestrator persists it verbatim/);
    assert.match(reviewer, /do not fix code, write project files/i);
  });
});

describe("DB Reviewer capability is live but read-only", () => {
  const reviewer = read("templates/capabilities/supabase/.claude/agents/db-reviewer.md");

  test("scopes its own Supabase MCP to the generated project's ref", () => {
    assert.match(reviewer, /project_ref=__UNSCOPED_UNTIL_FOUNDATION__/);
    assert.match(reviewer, /read_only=true/);
    assert.match(reviewer, /features=database,debugging,docs/);
  });

  test("does not recreate write-based Builder verification", () => {
    assert.match(reviewer, /Builder owns mutation-based verification/i);
    assert.match(reviewer, /do \*\*not\*\* create a second write path/i);
    assert.match(reviewer, /return `REVIEW_CONFLICT` immediately/i);
  });
});

/* ------------------------------------------------------------------ */

/** Every Markdown instruction the Builder writes or ships, walked once. */
const instructionDocs = () => {
  const found = [];
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (entry.name.endsWith(".md")) found.push(child);
    }
  };
  walk("templates");
  walk(".claude");
  return ["CLAUDE.md", ...found];
};

describe("SPEC_PASS minor cleanup stays mechanical", () => {
  const harness = flat("CLAUDE.md");

  test("minor clarifications after SPEC_PASS do not trigger a third reviewer", () => {
    assert.match(harness, /rerun \*\*only the mechanical Spec Gate plus an exact diff sanity check\*\*/i);
    assert.match(harness, /never call a third Spec Reviewer/i);
  });
});

/* ------------------------------------------------------------------ */

describe("generated build groups replace per-task agent cycles", () => {
  const harness = flat("templates/common/CLAUDE.md");
  const builder = flat("templates/common/.claude/agents/builder.md");
  const planner = flat("templates/common/.claude/agents/planner.md");
  const tasks = flat("templates/common/specs/tasks.md");

  test("tasks stay traceable without becoming agent cycles", () => {
    assert.match(harness, /A task is not an agent cycle/i);
    assert.match(builder, /\*\*one assigned build group\*\*, not one task/i);
    assert.match(tasks, /Task != agent cycle/i);
  });

  test("fixed phases are owned by the harness, not Planning", () => {
    assert.match(harness, /These phases are fixed by the harness\. Planning never invents lifecycle phases/i);
    for (const phase of ["FOUNDATION", "BUILD_TASKS", "INTEGRATION"]) {
      assert.ok(tasks.includes(`**${phase}**`), `${phase} ownership must be explained in tasks.md`);
    }
    assert.match(planner, /You never invent a phase/i);
  });

  test("groups declare capability separately from review gate", () => {
    const taskDoc = read("templates/common/specs/tasks.md");
    assert.match(taskDoc, /\| Group \| Phase \| Purpose \| Capability \| Gate \| Clear after \|/);
    assert.match(taskDoc, /\| ID \| Task \| Requirements \| Depends on \| Group \| Risk \| Acceptance \| Status \|/);
    assert.match(tasks, /Capability.*Gate.*separate on purpose/i);
    assert.match(tasks, /BASE.*SUPABASE/i);
  });

  test("gate routing is automatic and proportional", () => {
    assert.match(harness, /AUTO.*no Reviewer/i);
    assert.match(harness, /REVIEW.*generic Reviewer/i);
    assert.match(harness, /DB_REVIEW.*db-reviewer/i);
    assert.match(harness, /Capability gate before dispatch/i);
    assert.match(harness, /user never selects an internal agent/i);
  });

  test("Orchestrator coordinates build groups but owns global lifecycle gates", () => {
    assert.match(harness, /coordination during build groups; owner of global lifecycle gates/i);
    assert.match(harness, /do \*\*not\*\*\s+rerun Builder commands/i);
    for (const phase of ["LOCAL_PREVIEW", "VISUAL_QA", "E2E", "QUALITY_GATE", "DEPLOY", "POST_DEPLOY"]) {
      assert.ok(harness.includes(phase), `${phase} must have an explicit global owner`);
    }
    assert.match(harness, /global-gate defect is routed back to Builder as a targeted correction/i);
  });

  test("review loops are capped and round two is targeted", () => {
    assert.match(harness, /Maximum \*\*two Reviewer runs per group\*\*/i);
    assert.match(harness, /ROUND 2.*correction diff.*minimum affected regression/i);
    assert.match(harness, /no third automatic review/i);
  });

  test("E2E is a single final-candidate whole-product phase, not a task loop", () => {
    assert.match(harness, /not E2E after every task/i);
    assert.match(harness, /full Playwright suite runs only in lifecycle phase `E2E`/i);
    assert.match(harness, /There is no planned duplicate full-suite run/i);
    assert.match(harness, /consume the recorded E2E PASS rather than rerunning the full suite/i);
    assert.match(harness, /while phase remains\s+`QUALITY_GATE`, rerun the full E2E suite for the changed candidate/i);
    assert.doesNotMatch(harness, /returns? to `?E2E`?/i);
  });

  test("global gate corrections are Builder-routed and capped", () => {
    assert.match(harness, /Persist `global_round = 1`/i);
    assert.match(harness, /One second targeted correction is allowed with `global_round = 2`/i);
    assert.match(harness, /if the same global phase still cannot pass, STOP and ask the human/i);
    assert.match(builder, /targeted global-gate correction/i);
  });

  test("post-deploy smoke failures stop instead of auto-redeploying", () => {
    assert.match(harness, /post-deploy smoke check fails/i);
    assert.match(harness, /STOP for the human/i);
    assert.match(harness, /never auto-redeploy/i);
  });

  test("the generated lifecycle has no orphan VAULT_WRITE phase", () => {
    assert.doesNotMatch(harness, /VAULT_WRITE/);
    assert.match(harness, /DEPLOY → POST_DEPLOY → DONE/);
  });
});

/* ------------------------------------------------------------------ */

describe("generated project model routing is mechanical by default", () => {
  const settings = readJson("templates/common/.claude/settings.json");

  test("main session starts on Sonnet/high", () => {
    assert.equal(settings.model, "sonnet");
    assert.equal(settings.effortLevel, "high");
  });

  test("base settings carry no Supabase scope until a Supabase project is composed", () => {
    assert.ok(!("SUPABASE_PROJECT_REF" in (settings.env ?? {})));
  });
});

describe("Supabase RLS baseline avoids rediscovering the Foco init-plan advisory", () => {
  test("the conditional capability teaches the optimized auth.uid form", () => {
    const capability = fs.readFileSync(
      path.join(ROOT, "templates/capabilities/supabase/.claude/capabilities/supabase.md"),
      "utf8",
    );
    assert.match(capability, /\(select auth\.uid\(\)\)/);
    assert.match(capability, /keep the same optimized form in `design\.md`/i);
  });

  test("design.md asks Planning to make the optimized policy part of the approved contract", () => {
    const design = fs.readFileSync(path.join(ROOT, "templates/common/specs/design.md"), "utf8");
    assert.match(design, /\(select auth\.uid\(\)\)/);
    assert.match(design, /spec already matches the policy/i);
  });
});

describe("Supabase capability is composed only when Backend Mode requires it", () => {
  test("the common project baseline is Vercel-only", () => {
    const mcp = readJson("templates/common/.mcp.json");
    const builder = read("templates/common/.claude/agents/builder.md");
    assert.deepEqual(Object.keys(mcp.mcpServers).sort(), ["vercel"]);
    assert.doesNotMatch(builder, /mcp__supabase/, "backend-less projects must not carry a dead Supabase Builder tool");
    assert.ok(!fs.existsSync(path.join(ROOT, "templates/common/.claude/agents/db-reviewer.md")));
  });

  test("the conditional capability carries the read-only DB reviewer", () => {
    const rel = "templates/capabilities/supabase/.claude/agents/db-reviewer.md";
    assert.ok(fs.existsSync(path.join(ROOT, rel)));
    assert.ok(fs.existsSync(path.join(ROOT, "templates/capabilities/supabase/.claude/capabilities/supabase.md")));
    const body = flat(rel);
    assert.match(body, /read_only=true/);
    assert.match(body, /project_ref=__UNSCOPED_UNTIL_FOUNDATION__/);
  });

  test("the DB reviewer explicitly rejects Auth/control-plane work", () => {
    const body = flat("templates/capabilities/supabase/.claude/agents/db-reviewer.md");
    assert.match(body, /Auth\/project settings.*outside this reviewer's feature groups/i);
    assert.match(body, /return `REVIEW_CONFLICT` immediately/i);
  });

  test("backend mode none leaves the staged project Vercel-only", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wpd-backend-none-"));
    try {
      fs.mkdirSync(path.join(dir, ".claude", "agents"), { recursive: true });
      fs.writeFileSync(path.join(dir, ".mcp.json"), read("templates/common/.mcp.json"));
      fs.writeFileSync(path.join(dir, ".claude", "settings.json"), read("templates/common/.claude/settings.json"));
      fs.writeFileSync(path.join(dir, ".claude", "agents", "builder.md"), read("templates/common/.claude/agents/builder.md"));
      assert.deepEqual(composeBackendCapability(dir, "none"), { supabase: false });
      assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join(dir, ".mcp.json"))).mcpServers), ["vercel"]);
      assert.doesNotMatch(fs.readFileSync(path.join(dir, ".claude", "agents", "builder.md"), "utf8"), /mcp__supabase/);
      assert.ok(!fs.existsSync(path.join(dir, ".claude", "agents", "db-reviewer.md")));
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test("backend mode supabase composes MCP, reviewer scope and DB reviewer", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wpd-backend-supabase-"));
    try {
      fs.mkdirSync(path.join(dir, ".claude", "agents"), { recursive: true });
      fs.writeFileSync(path.join(dir, ".mcp.json"), read("templates/common/.mcp.json"));
      fs.writeFileSync(path.join(dir, ".claude", "settings.json"), read("templates/common/.claude/settings.json"));
      fs.writeFileSync(path.join(dir, ".claude", "agents", "builder.md"), read("templates/common/.claude/agents/builder.md"));
      assert.deepEqual(composeBackendCapability(dir, "supabase"), { supabase: true });
      const mcp = JSON.parse(fs.readFileSync(path.join(dir, ".mcp.json")));
      const settings = JSON.parse(fs.readFileSync(path.join(dir, ".claude", "settings.json")));
      const builder = fs.readFileSync(path.join(dir, ".claude", "agents", "builder.md"), "utf8");
      const dbReviewer = fs.readFileSync(path.join(dir, ".claude", "agents", "db-reviewer.md"), "utf8");
      assert.equal(mcp.mcpServers.supabase.url, "https://mcp.supabase.com/mcp");
      assert.ok(!("SUPABASE_PROJECT_REF" in (settings.env ?? {})));
      assert.match(builder, /^tools:.*mcp__supabase/m);
      assert.match(dbReviewer, /project_ref=__UNSCOPED_UNTIL_FOUNDATION__/);
      assert.ok(fs.existsSync(path.join(dir, ".claude", "agents", "db-reviewer.md")));
      assert.ok(fs.existsSync(path.join(dir, ".claude", "capabilities", "supabase.md")));
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test("the Spec Gate rejects DB_REVIEW when Backend Mode is not supabase", () => {
    assert.match(read("scripts/lib/spec-gate.mjs"), /DB_REVIEW.*backendMode !== "supabase"/s);
  });

  test("the generated-project validator enforces the same capability shape", () => {
    const validator = read("scripts/validate-project.mjs");
    assert.match(validator, /Supabase capability contract present/);
    assert.match(validator, /Backend-less Builder carries no Supabase MCP tool/);
    assert.match(validator, /Builder receives the writable Supabase MCP tool only for this backend/);
  });
});

describe("Tailwind source roots exclude harness and specifications", () => {
  const cases = [
    { id: "next-standard-v1", css: "templates/stacks/next-standard-v1/src/app/globals.css", roots: ["src"] },
  ];

  for (const item of cases) {
    test(`${item.id} disables repository-wide source discovery`, () => {
      const css = read(item.css);
      assert.match(css, /@import "tailwindcss" source\(none\);/);
      assert.match(css, /@source/);
      assert.doesNotMatch(css, /@source[^;]*(?:\.claude|\.workflow|PROJECT\.md|requirements\.md|design\.md|tasks\.md)/);
    });

    test(`${item.id} profile declares the same application source roots`, () => {
      const profile = readJson(`config/stack-profiles/${item.id}.json`);
      assert.equal(profile.styling.engine, "tailwind-v4");
      assert.deepEqual(profile.styling.source_roots, item.roots);
    });
  }

  test("the token skill teaches static emission without making docs a source", () => {
    const tokens = flat(".claude/skills/building-components/references/design-tokens.mdx");
    assert.match(tokens, /source\(none\).*@source/);
    assert.match(tokens, /@theme static/);
    assert.match(tokens, /@theme inline/);
    assert.match(tokens, /specs and reference Markdown must never become production CSS inputs/i);
  });
});

describe("Supabase SSR session contract", () => {
  /* Two defects, one produced by the fix for the other.

     First, `foco`'s design.md shipped "Cookies are httpOnly and set through
     `@supabase/ssr`" and "sessions in httpOnly cookies via `@supabase/ssr`" --
     a promise the supported browser client does not keep and no reviewer could
     verify. The fix stated a contract; the contract then overshot, handing the
     @supabase/ssr cookie pattern to *any* project that touched Supabase. That
     is wrong for Supabase used only as a database, and for Supabase Auth
     without an SSR architecture. The vendor does not decide the
     session mechanism -- the approved architecture does.

     So these tests guard the behaviour on both sides: no blanket HttpOnly, and
     no @supabase/ssr contract without the condition that earns it. They read
     the load-bearing terms, not one exact sentence.

     Each pattern below is a form the HttpOnly claim took, or would take again. */
  const IMPOSITIONS = [
    /cookies?\s+(?:are|is|must be|should be|will be)\s+http-?only/i,
    /http-?only\s+(?:session\s+)?cookies?\s+(?:via|through|with|set by|from)\s+`?@supabase\/ssr/i,
    /sessions?\s+in\s+http-?only\s+cookies?/i,
    /supabase\s+ssr\s+cookies?\s*=\s*http-?only/i,
    /http-?only\s*(?:=|:)\s*(?:true|required|mandatory)/i,
    /(?:must|should|always)\s+(?:be\s+)?set\s+http-?only/i,
  ];

  /* Scoped to documents that talk about Supabase. `playwright-cli` documents
     Playwright's own cookie API and legitimately writes `httpOnly: true` in a
     code sample; that is a browser-automation fact, not a session rule for
     this stack, and a path exclusion would be a blunter instrument than
     asking whether the document is about Supabase at all. */
  const supabaseDocs = instructionDocs().filter((rel) => /supabase/i.test(read(rel)));

  test("some instruction actually discusses Supabase", () => {
    assert.ok(supabaseDocs.length > 0, "the scan would be vacuous with nothing to scan");
  });

  for (const rel of supabaseDocs) {
    test(`${rel} does not impose HttpOnly as the @supabase/ssr rule`, () => {
      const text = flat(rel);
      for (const imposition of IMPOSITIONS) {
        assert.ok(
          !imposition.test(text),
          `${rel} states an HttpOnly rule @supabase/ssr does not keep: ${imposition}`,
        );
      }
    });
  }

  /* The generalisation was a mention with nothing governing it. Wherever an
     instruction names the library, the condition has to be within reach. */
  for (const rel of supabaseDocs) {
    test(`${rel} never states the @supabase/ssr contract unconditionally`, () => {
      const text = flat(rel);
      for (const hit of text.matchAll(/@supabase\/ssr/g)) {
        const near = text.slice(Math.max(0, hit.index - 400), hit.index + 200);
        assert.match(
          near,
          /\bIF\b|\bELSE\b|\bif the\b|only (?:when|if)|approved architecture/i,
          `${rel} names @supabase/ssr with no condition governing it: "${near}"`,
        );
      }
    });
  }

  const design = () => flat("templates/common/specs/design.md");

  test("Supabase alone does not choose the session mechanism", () => {
    assert.match(design(), /Choosing Supabase does not by itself choose a session mechanism/i);
    assert.match(design(), /`?## Architecture`?\s*does/i);
  });

  test("the IF branch carries the four behaviours the SSR architecture owes", () => {
    const text = design();
    assert.match(text, /\bIF\b[^.]{0,60}approved architecture[^.]{0,30}@supabase\/ssr/i);
    assert.match(text, /supported @supabase\/ssr cookie pattern/i);
    assert.match(text, /(?:do not|never)\s+store auth tokens in localStorage/i);
    assert.match(text, /(?:do not|never)\s+impose HttpOnly as a blanket rule/i);
    assert.match(text, /browser\/server session flow/i);
  });

  test("the ELSE branch hands the decision back to the architecture", () => {
    const text = design();
    assert.match(text, /\bELSE\b/);
    assert.match(text, /(?:do not|never)\s+inject an @supabase\/ssr cookie contract/i);
    assert.match(text, /auth\/session model the approved architecture defines/i);
  });

  /* Next stays fixed, but Supabase still does not imply one session architecture. */
  test("the excluded Supabase architectures are named, not left to inference", () => {
    const text = design();
    for (const [label, pattern] of [
      ["Supabase as a database only", /(?:only as a database|database only)/i],
      ["Supabase Auth without SSR", /supabase auth without[^.]{0,30}\bssr\b/i],
    ]) {
      assert.match(text, pattern, `the ELSE branch must name ${label}`);
    }
  });

  /* `document.cookie` is one library's internal, not a spec requirement, and
     localStorage was never the alternative -- both were read that way. */
  const LIBRARY_INTERNALS = [
    /(?:must|should|has to|have to|is required to|requires?)\s+(?:[^.]{0,60}\s)?document\.cookie/i,
    /(?<!\b(?:not|never|avoid|avoids|avoiding)\s)(?:store|keep|persist|save)\s+(?:the\s+)?(?:auth|authentication|session|access)\s+tokens?\s+in\s+localstorage/i,
  ];

  for (const rel of supabaseDocs) {
    test(`${rel} requires no library internal`, () => {
      const text = flat(rel);
      for (const internal of LIBRARY_INTERNALS) {
        assert.ok(!internal.test(text), `${rel} turns an implementation detail into a rule: ${internal}`);
      }
    });
  }

  test("the design.md template hardcodes no document.cookie requirement", () => {
    assert.doesNotMatch(design(), /document\.cookie/);
  });

  /* The claim also reached the Integrations table, where a second version of
     the same datum could diverge from the first. */
  test("the session mechanism has one owner in the template", () => {
    assert.match(
      flat("templates/common/specs/design.md"),
      /Auth method names the credential this project presents, not the session mechanism/,
    );
  });
});

/* ------------------------------------------------------------------ */

describe("inherited skills carry no Builder operational dependency", () => {
  /* A skill copied into a generated project is read there, in a repository
     that has no `.builder/`, none of the three Builder scripts and no Builder
     run to be "the rest of" -- so an instruction naming any of them is not
     merely irrelevant, it is unfollowable. `artifact-design` shipped three.

     Builder-only skills are exempt by definition; these are the ones that
     travel. */
  const inherited = [...new Set(PROFILES.flatMap((id) => expectedSkills(id)))].sort();

  const OPERATIONAL = [
    { label: "the Builder's private state directory", re: /\.builder\b/ },
    { label: "a Builder script that is never shipped", re: /\b(?:reset-builder|create-project|validate-project|spec-gate)\b/ },
    { label: "the Builder run as a scope", re: /Builder run/i },
  ];

  const skillFiles = (skill) => {
    const found = [];
    const walk = (rel) => {
      for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
        const child = `${rel}/${entry.name}`;
        if (entry.isDirectory()) walk(child);
        else if (entry.name.endsWith(".md")) found.push(child);
      }
    };
    walk(`.claude/skills/${skill}`);
    return found;
  };

  test("the inherited set is non-empty and matches the manifest", () => {
    assert.equal(inherited.length, 19, "the fixed Next profile inherits exactly 19 skills");
  });

  for (const skill of inherited) {
    test(`${skill} is readable in a generated project`, () => {
      for (const rel of skillFiles(skill)) {
        const text = read(rel);
        for (const { label, re } of OPERATIONAL) {
          const hit = text.match(re);
          assert.ok(
            !hit,
            `${rel} names ${label} ("${hit?.[0]}") -- a generated project has no such thing`,
          );
        }
      }
    });
  }

  /* Provenance is not a contract. A generated project keeps its visual
     contract because `design-system.md` holds the values, not because anyone
     can still open the artifact that produced them. */
  test("design-system.md alone carries the visual contract", () => {
    const skill = flat(".claude/skills/artifact-design/SKILL.md");
    assert.match(skill, /`design-system\.md` has to stand on its own/);
    assert.match(skill, /without opening the artifact, without its URL/);
    assert.match(skill, /provenance is not a contract/i);
    assert.match(skill, /record the approved values there, never a pointer to where they can be seen/);
  });
});

/* ------------------------------------------------------------------ */

describe("the generated language check compares a value", () => {
  /* `expect(lang).toBeTruthy()` passed on the stack template's own
     `lang="en"`, so a Spanish product shipped an English document and the
     smoke suite reported PASS. Presence is not the property worth asserting;
     equality with the approved tag is. */
  const SMOKE = PROFILES.map((id) => `templates/stacks/${id}/e2e/smoke.spec.ts`);

  /* The regex is lifted out of the spec rather than restated, so what is
     exercised below is the parser that will actually run. */
  const langPattern = (source) => {
    const literal = source.match(/spec\.match\((\/.+\/m)\)/);
    assert.ok(literal, "the smoke spec must read the tag out of PROJECT.md with a regex literal");
    return new RegExp(literal[1].slice(1, -2), "m");
  };

  for (const rel of SMOKE) {
    const source = read(rel);

    test(`${rel} asserts the approved tag, not truthiness`, () => {
      assert.doesNotMatch(
        source,
        /getAttribute\(\s*['"]lang['"]\s*\)[\s\S]{0,200}?toBeTruthy/,
        "a truthy check cannot fail on the wrong language, which is the only failure that matters",
      );
      assert.match(source, /approvedLanguageTag\(\s*testInfo\.config\.rootDir\s*\)/);
      assert.match(source, /\.toBe\(expected\)/);
    });

    test(`${rel} reads the tag from PROJECT.md rather than restating it`, () => {
      assert.match(source, /readFileSync\(\s*path\.join\(\s*rootDir\s*,\s*['"]PROJECT\.md['"]\s*\)/);
      assert.match(source, /Language tag/);
    });

    test(`${rel} fails loudly when the tag was never decided`, () => {
      const re = langPattern(source);
      assert.equal(
        re.exec(read("templates/common/specs/PROJECT.md")),
        null,
        "an unfilled [TBD] must not parse as a language tag",
      );
      assert.match(source, /throw new Error\(/);
    });

    test(`${rel} parses a real tag, plain or backticked`, () => {
      const re = langPattern(source);
      for (const [line, expected] of [
        ["- **Language tag:** es", "es"],
        ["- **Language tag:** `es-MX`", "es-MX"],
        ["- **Language tag:** en", "en"],
      ]) {
        assert.equal(re.exec(line)?.[1], expected, `failed to parse: ${line}`);
      }
    });
  }

  test("PROJECT.md owns the tag, and says why it is load-bearing", () => {
    const project = read("templates/common/specs/PROJECT.md");
    assert.match(project, /^-\s\*\*Language tag:\*\*/m);
    assert.match(flat("templates/common/specs/PROJECT.md"), /asserts `<html lang>` equals it/);
  });

  test("the foundation task that sets it is named where tasks are written", () => {
    assert.match(flat("templates/common/specs/tasks.md"), /the document `lang` must carry PROJECT\.md's `Language tag`/);
  });

  test("the Next template points its lang attribute at that decision", () => {
    const rel = "templates/stacks/next-standard-v1/src/app/layout.tsx";
    const text = flat(rel);
    assert.match(text, /`lang` must equal PROJECT\.md's `Language tag`/, "the source of truth is named");
    assert.match(text, /the template's placeholder/, "en is declared a placeholder, not a decision");
  });
});
