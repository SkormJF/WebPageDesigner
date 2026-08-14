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

/* A rule that survives a reflow is still the same rule. Reading prose through
   this means a test fails when a contract sentence is deleted or reversed, not
   when a paragraph is rewrapped at a different width. */
const flat = (rel) => read(rel).replace(/\s+/g, " ");

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
    ["generated project", projectHarness, 4],
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
      assert.match(prose, count === 2 ? /Two fixed stops/ : /Four fixed stops/);
    });
  }

  test("B1 and B2 are where they belong", () => {
    const prose = harness.replace(/\s+/g, " ");
    assert.match(prose, /\*\*B1 — after the Artifact is approved\.\*\*[^|]*?phase `PLANNING`/);
    assert.match(prose, /\*\*B2 — after human spec approval\.\*\*[^|]*?`READY_TO_CREATE`/);
    /* B1 exists so Planning does not re-read the artifact's HTML. */
    assert.match(prose, /re-read(ing)? the Artifact's HTML/);
  });

  test("P1 through P4 are where they belong", () => {
    for (const [id, phase] of [
      ["P1", "BUILD_TASKS"],
      ["P2", "LOCAL_PREVIEW"],
      ["P3", "E2E"],
      ["P4", "READY_TO_DEPLOY"],
    ]) {
      assert.match(
        projectHarness,
        new RegExp(`${id}\\s+[^\\n]*→ persist phase ${phase}`),
        `${id} must persist ${phase}`,
      );
    }
    /* P2 leaves no task in flight across the /clear. */
    assert.match(projectHarness, /current_task = null, task_stage = null/);
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

describe("Supabase SSR session contract", () => {
  /* The defect: `foco`'s design.md shipped "Cookies are httpOnly and set
     through `@supabase/ssr`" and "sessions in httpOnly cookies via
     `@supabase/ssr`". Neither holds for the supported browser client, which
     reads the session from `document.cookie` -- so the spec promised something
     no implementation could deliver and no reviewer could verify. It came from
     the Builder leaving the contract unstated, not from a rule that said it,
     which is why the fix is a stated contract and this test is the guard.

     Each pattern below is a form that claim took, or would take again. */
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

  test("the design.md template states the supported contract instead", () => {
    const design = flat("templates/common/specs/design.md");
    for (const line of [
      "Session tokens managed through @supabase/ssr cookies.",
      "Do not store auth tokens in localStorage.",
      "Follow the supported Supabase SSR browser/server cookie pattern.",
      "Do not promise HttpOnly unless a specific supported flow requires it.",
    ]) {
      assert.ok(design.includes(line), `the Security guidance must carry: ${line}`);
    }
    assert.match(design, /reads the session from `document\.cookie`/);
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
    assert.equal(inherited.length, 19, "both current profiles inherit the same 19 skills");
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

  test("both stack templates point their lang attribute at that decision", () => {
    for (const [rel, id] of [
      ["templates/stacks/next-standard-v1/src/app/layout.tsx", "next"],
      ["templates/stacks/react-vite-standard-v1/index.html", "vite"],
    ]) {
      const text = flat(rel);
      assert.match(text, /`lang` must equal PROJECT\.md's `Language tag`/, `${id}: the source of truth is named`);
      assert.match(text, /the template's placeholder/, `${id}: en is declared a placeholder, not a decision`);
    }
  });
});
