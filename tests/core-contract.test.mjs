/**
 * Core contract invariants.
 *
 *   node --test tests/core-contract.test.mjs
 *
 * node:test and node:assert only -- no framework, no dependency, and not a
 * fourth top-level script. These are the properties of the Builder that have
 * broken before or would break silently: the phase a creation runs at, what the
 * profile parser accepts, who owns the stack profile, who owns profile skills,
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
import { fileURLToPath } from "node:url";

import { parseApprovedProfile, expectedSkills } from "../scripts/lib/common.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

const PROFILES = ["next-standard-v1", "react-vite-standard-v1"];

/* ------------------------------------------------------------------ */

describe("parseApprovedProfile", () => {
  const section = [
    "## Stack profile",
    "",
    "- **Profile:** next-standard-v1",
    '- **Deviations from the profile:** none',
    "",
  ].join("\n");

  const preamble = ["# DESIGN — Example", "", "## Identity", "", "Some prose.", ""].join("\n");
  const trailing = ["## Architecture", "", "More prose.", ""].join("\n");

  test("section in the middle of the document", () => {
    assert.equal(parseApprovedProfile(preamble + section + trailing), "next-standard-v1");
  });

  test("section first in the document", () => {
    assert.equal(parseApprovedProfile(section + trailing), "next-standard-v1");
  });

  /* The old parser closed the section with `(?=^##\s|\Z)`. JavaScript has no
     \Z -- it is an identity escape for the letter Z -- so a document whose Stack
     profile section ran to the end parsed as null unless a literal Z happened to
     appear later. Neither text below contains one. */
  test("section last, with a final newline", () => {
    assert.equal(parseApprovedProfile(preamble + section), "next-standard-v1");
  });

  test("section last, without a final newline", () => {
    assert.equal(parseApprovedProfile((preamble + section).trimEnd()), "next-standard-v1");
  });

  test("CRLF line endings", () => {
    const crlf = (preamble + section + trailing).replace(/\n/g, "\r\n");
    assert.equal(parseApprovedProfile(crlf), "next-standard-v1");
  });

  test("backticked value", () => {
    assert.equal(
      parseApprovedProfile("## Stack profile\n\n- **Profile:** `react-vite-standard-v1`\n"),
      "react-vite-standard-v1",
    );
  });

  test("a deeper heading does not close the section", () => {
    const doc = "## Stack profile\n\n### Rationale\n\ntext\n\n- **Profile:** next-standard-v1\n";
    assert.equal(parseApprovedProfile(doc), "next-standard-v1");
  });

  test("[TBD] is not a decision", () => {
    assert.equal(parseApprovedProfile(preamble + "## Stack profile\n\n- **Profile:** [TBD]\n"), null);
  });

  test("missing section", () => {
    assert.equal(parseApprovedProfile(preamble + trailing), null);
  });

  test("a Profile line outside the section is ignored", () => {
    assert.equal(parseApprovedProfile("## Notes\n\n- **Profile:** sneaky-v9\n"), null);
  });

  test("non-string input", () => {
    assert.equal(parseApprovedProfile(undefined), null);
    assert.equal(parseApprovedProfile(null), null);
  });

  test("the shipped design.md template is unfilled, not a decision", () => {
    assert.equal(parseApprovedProfile(read("templates/common/specs/design.md")), null);
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

describe("generated project starting state", () => {
  const state = readJson("templates/common/.workflow/state.json");

  test("phase is READY_TO_BUILD", () => {
    assert.equal(state.phase, "READY_TO_BUILD");
  });

  test("nothing is in flight", () => {
    for (const field of ["current_task", "task_stage", "pending_action", "external_operation"]) {
      assert.ok(field in state, `${field} is missing from the schema`);
      assert.equal(state[field], null, `${field} must start null`);
    }
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

describe("stack profile ownership", () => {
  const harness = read("CLAUDE.md");

  test("design.md is the only owner", () => {
    assert.match(harness, /approved profile lives in `design\.md` and nowhere else/);
  });

  test("state.json carries no profile", () => {
    const blocks = [...harness.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);
    const stateBlock = blocks.find((b) => b.includes('"phase"'));
    assert.ok(stateBlock, "the state.json example is missing from CLAUDE.md");
    for (const key of Object.keys(JSON.parse(stateBlock))) {
      assert.doesNotMatch(key, /profile/i, `state.json must not carry ${key}`);
    }
  });

  test("PROJECT.md does not restate it", () => {
    const project = read("templates/common/specs/PROJECT.md");
    assert.doesNotMatch(project, /^\s*[-*]\s*\*\*Profile:\*\*/m);
  });

  test("both scripts treat --profile as an assertion", () => {
    for (const rel of ["scripts/create-project.mjs", "scripts/validate-project.mjs"]) {
      const source = read(rel);
      assert.match(source, /readApprovedProfile\(/, `${rel} must read the approved profile`);
      assert.match(source, /PROFILE_MISMATCH/, `${rel} must fail on a mismatched assertion`);
      /* Prose about default_stack_profile is fine -- including the prose that
         explains why it is not consulted. Reading the loaded config's field is
         what must not appear, hence the lookbehind. */
      assert.doesNotMatch(
        source,
        /(?<![\w.])config\.default_stack_profile|config\["default_stack_profile"\]/,
        `${rel} must not fall back to the Planning-time default`,
      );
      assert.doesNotMatch(
        source,
        /args\.profile\s*(\?\?|\|\|)/,
        `${rel} must not let the CLI supply the profile`,
      );
    }
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
  const projectHarness = read("templates/common/CLAUDE.md");

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

  test("the shipped .mcp.json stays generic", () => {
    const mcp = readJson("templates/common/.mcp.json");
    assert.equal(mcp.mcpServers.supabase.url, "https://mcp.supabase.com/mcp");
    assert.ok(mcp.mcpServers.vercel, "the Vercel entry ships too");
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
});
