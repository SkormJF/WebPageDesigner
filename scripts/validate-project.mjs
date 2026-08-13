#!/usr/bin/env node
/**
 * validate-project — prove a generated repository is ready for a fresh session.
 *
 *   node scripts/validate-project.mjs --slug <slug> [--profile <id>]
 *
 * It answers one question and nothing else: did the Builder generate a valid
 * independent repository?
 *
 * It does not run product E2E, does not authenticate MCP servers, and repairs
 * nothing. A validator that fixes what it finds cannot tell you what was
 * broken.
 *
 * There is one PASS and one way to reach it. Every check runs, every time --
 * structure, git, specs, harness, skills, stack, npm ci, lint, typecheck, build
 * and smoke start. No --quick, no partial or soft pass: a VALIDATION_PASS that
 * could mean "most of it" is worth nothing to whoever reads it.
 *
 * The target is derived from --slug against builder.config.projects_root and
 * cannot be supplied directly. npm install, a build and a server start are not
 * things to point at an arbitrary directory.
 *
 * While a Builder handoff is in flight -- .builder/current/state.json naming this
 * slug at CREATING_PROJECT or VALIDATING_PROJECT -- it additionally compares the
 * five generated specifications against the approved ones, so a recovery cannot
 * mistake somebody else's repository at the same path for its own output. With no
 * active Builder project, validation of an independent repository does not depend
 * on .builder/current at all.
 *
 * Exit 0 on PASS, 1 on FAIL.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync, execFileSync, spawn } from "node:child_process";
import http from "node:http";
import {
  paths,
  SPEC_FILES,
  ui,
  abort,
  readJson,
  loadConfig,
  loadProfile,
  expectedSkills,
  listFiles,
  parseArgs,
  describeExecFailure,
  resolveProjectTarget,
  readApprovedProfile,
} from "./lib/common.mjs";

const args = parseArgs(process.argv.slice(2));
const config = loadConfig();

for (const removed of ["quick", "path"]) {
  if (removed in args) {
    abort(
      `--${removed} no longer exists.`,
      removed === "quick"
        ? "There is one validation and one PASS. Run it in full: node scripts/validate-project.mjs --slug <slug>"
        : "Pass --slug <slug>; the target is derived from builder.config.projects_root.",
    );
  }
}

/* Derived, never supplied. The old form accepted --path and then checked it with
   startsWith afterwards, which is a fragile way to decide where npm ci, a build
   and a server start are allowed to run. */
const target = resolveProjectTarget(args.slug, config);

if (!fs.existsSync(target)) abort(`No such directory: ${target}`);

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  if (ok) ui.pass(name);
  else {
    ui.fail(name);
    if (detail) ui.detail(detail);
  }
  return ok;
};

const exists = (rel) => fs.existsSync(path.join(target, rel));
const read = (rel) => fs.readFileSync(path.join(target, rel), "utf8");

/* ---------- location ---------- */

ui.step(`Validating ${target}`);

/* The target is resolved from the slug against projects_root, so location is
   guaranteed by construction rather than asserted after the fact. What is still
   worth checking is that projects_root itself has not been pointed inside the
   Builder, which would defeat the boundary no matter how the path was derived. */
check(
  "Projects root is outside the Builder repository",
  !path.resolve(config.projects_root).startsWith(path.resolve(paths.builderCurrent, "..", "..")),
  `builder.config.json points projects_root at ${config.projects_root}, which is inside the Builder.`,
);

/* ---------- git baseline ---------- */

ui.step("Git");

const hasGit = check("Git repository initialized", exists(".git"));

if (hasGit) {
  const git = (...a) => execFileSync("git", a, { cwd: target, encoding: "utf8" }).trim();

  let log = "";
  try {
    log = git("log", "--oneline");
  } catch {
    log = "";
  }
  const commits = log ? log.split(/\r?\n/) : [];
  check(
    "Exactly one baseline commit",
    commits.length === 1 && /chore: initialize project/.test(commits[0]),
    `Found ${commits.length} commit(s): ${commits.join(" | ") || "none"}`,
  );

  const status = git("status", "--porcelain");
  check("Working tree is clean", status === "", status.split(/\r?\n/).slice(0, 8).join(" | "));

  const tracked = git("ls-files").split(/\r?\n/).filter(Boolean);
  check(
    "No dependencies or env files tracked",
    !tracked.some((f) => f.startsWith("node_modules/") || /(^|\/)\.env/.test(f)),
    "node_modules or an env file is in the baseline commit.",
  );
  check(
    "No AGENTS.md tracked",
    !tracked.includes("AGENTS.md"),
    "This project is Claude-only; CLAUDE.md is its harness contract and a second agent-instruction file competes with it.",
  );
}

/* ---------- specifications ---------- */

ui.step("Specifications");

for (const spec of SPEC_FILES) {
  check(`${spec} present`, exists(spec));
}

const specPlaceholders = SPEC_FILES.filter(
  (s) => exists(s) && /\[TBD|<!--\s*SLOT:|\[PROJECT_NAME\]/.test(read(s)),
);
check(
  "Specifications carry no unresolved placeholders",
  specPlaceholders.length === 0,
  specPlaceholders.length ? `Still templated: ${specPlaceholders.join(", ")}` : undefined,
);

/* ---------- identity against an active Builder handoff ---------- */

/* Only while a Builder handoff is actually in flight. A generated repository is
   independent, and validating one on a machine whose Builder is IDLE must not
   depend on .builder/current existing at all.

   But during CREATING_PROJECT or VALIDATING_PROJECT the recovery path may find a
   directory already sitting at the target, and "it looks like a project" is not
   evidence that it is *this* project. Comparing the five specifications byte for
   byte distinguishes a target this handoff published from a path conflict with
   somebody else's repository -- which is the difference between continuing a
   handoff and validating a stranger.

   The comparison is byte for byte because create-project copies the specs
   verbatim and the Spec Gate refuses a specification still carrying
   [PROJECT_NAME], so token substitution has nothing to rewrite inside them. If
   that ever stops being true, this check has to learn about it.

   It reports. It does not repair, copy or delete. */
const activeStateFile = path.join(paths.builderCurrent, "state.json");
if (fs.existsSync(activeStateFile)) {
  const activeState = readJson(activeStateFile);
  const midHandoff = ["CREATING_PROJECT", "VALIDATING_PROJECT"].includes(activeState.phase);

  if (midHandoff && activeState.slug === args.slug) {
    ui.step(`Identity against the active Builder project (${activeState.phase})`);

    const differing = [];
    for (const spec of SPEC_FILES) {
      const approved = path.join(paths.builderCurrent, spec);
      const generated = path.join(target, spec);
      if (!fs.existsSync(approved)) differing.push(`${spec} (absent from .builder/current)`);
      else if (!fs.existsSync(generated)) differing.push(`${spec} (absent from the target)`);
      else if (!fs.readFileSync(approved).equals(fs.readFileSync(generated))) differing.push(spec);
    }

    check(
      "Generated specifications match the active approved specifications",
      differing.length === 0,
      differing.length
        ? `Generated specifications do not match active approved specifications: ${differing.join(", ")}. ` +
          `Nothing was repaired, copied or deleted. ${target} may belong to a different project.`
        : undefined,
    );
  }
}

/* ---------- harness ---------- */

ui.step("Harness");

check("CLAUDE.md present", exists("CLAUDE.md"));
for (const agent of ["planner", "builder", "reviewer"]) {
  check(`.claude/agents/${agent}.md present`, exists(`.claude/agents/${agent}.md`));
}

const hasState = check(".workflow/state.json present", exists(".workflow/state.json"));
if (hasState) {
  const state = readJson(path.join(target, ".workflow", "state.json"));
  check(
    "Initial phase is READY_TO_BUILD",
    state.phase === "READY_TO_BUILD",
    `phase = ${state.phase}`,
  );
  check(
    "Project name substituted into state",
    typeof state.project === "string" && !state.project.includes("[PROJECT_NAME]"),
    `project = ${state.project}`,
  );

  /* A fresh repository has nothing in flight. A non-null field here would mean
     the template shipped a half-finished operation as someone's starting point. */
  const idleFields = ["current_task", "task_stage", "pending_action", "external_operation"];
  const notIdle = idleFields.filter((f) => state[f] !== null);
  check(
    "Operational fields start null",
    notIdle.length === 0,
    notIdle.map((f) => `${f} = ${JSON.stringify(state[f])}`).join(", "),
  );

  check(
    "external_operation is present in the schema",
    "external_operation" in state,
    "Without it there is no record that a remote operation was in flight, and recovery cannot tell an interrupted deploy from one that never started.",
  );
}

check(".workflow/current/implementation.md present", exists(".workflow/current/implementation.md"));
check(".workflow/current/review.md present", exists(".workflow/current/review.md"));

check(
  "No .workflow history directory",
  !exists(".workflow/history"),
  "Current documents hold current truth; git holds the past.",
);

/* ---------- MCP ---------- */

ui.step("MCP");

const hasMcp = check(".mcp.json present", exists(".mcp.json"));
if (hasMcp) {
  let mcp = null;
  try {
    mcp = JSON.parse(read(".mcp.json"));
  } catch (error) {
    check(".mcp.json is valid JSON", false, error.message);
  }
  if (mcp) {
    check(".mcp.json is valid JSON", true);
    const servers = Object.keys(mcp.mcpServers ?? {});
    check(
      "Declares both Vercel and Supabase",
      servers.includes("vercel") && servers.includes("supabase"),
      `Declared: ${servers.join(", ") || "none"}`,
    );
    /* Structure and absence of secrets only. Authentication is a human,
       per-machine act -- a validator that attempted it would fail for reasons
       unrelated to whether the repository was generated correctly. */
    const raw = read(".mcp.json");
    check(
      "Holds no secrets",
      !/(token|secret|key|password|bearer)\s*"?\s*:/i.test(raw),
      "A credential-shaped field is present in .mcp.json.",
    );
  }
}

/* ---------- skills ---------- */

ui.step("Skills");

/* The project's own design.md owns its stack profile, exactly as it does at
   creation. --profile asserts that value and cannot replace it, and
   default_stack_profile is a Planning-time proposal that has no business
   deciding what an already-generated project is. */
const approvedProfile = readApprovedProfile(target);
if (!approvedProfile) {
  abort(
    "The generated project's design.md does not state a stack profile.",
    'Expected "- **Profile:** <id>" under "## Stack profile". Without it there is nothing to validate against.',
  );
}
if (args.profile && args.profile !== true && args.profile !== approvedProfile) {
  ui.fail(`VALIDATION_FAIL — code: PROFILE_MISMATCH`);
  ui.detail(
    `--profile "${args.profile}" does not match the profile in the project's design.md ("${approvedProfile}").`,
  );
  process.exit(1);
}

const profile = loadProfile(approvedProfile);
const expected = expectedSkills(profile.id);
const skillsDir = path.join(target, ".claude", "skills");
const actual = fs.existsSync(skillsDir)
  ? fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

const missing = expected.filter((s) => !actual.includes(s));
const extra = actual.filter((s) => !expected.includes(s));

check(
  `Expected skill set for ${profile.id} (${expected.length})`,
  missing.length === 0 && extra.length === 0,
  [missing.length ? `missing: ${missing.join(", ")}` : "", extra.length ? `unexpected: ${extra.join(", ")}` : ""]
    .filter(Boolean)
    .join(" | "),
);

const skillsWithoutBody = actual.filter(
  (s) => !fs.existsSync(path.join(skillsDir, s, "SKILL.md")),
);
check(
  "Every copied skill has a SKILL.md",
  skillsWithoutBody.length === 0,
  skillsWithoutBody.join(", "),
);

/* Stated separately from the set comparison above, even though the set already
   implies it. An optional skill arriving by default is the specific failure
   worth naming in the output -- "unexpected: chrome-bridge-automation" buried in
   a diff is easy to read past. */
const optionalSkills = Object.entries(
  readJson(paths.skillManifest).skills,
).flatMap(([name, entry]) => (entry.distribution === "optional" ? [name] : []));
const optionalPresent = optionalSkills.filter((s) => actual.includes(s));
check(
  "No optional/emergency skill inherited by default",
  optionalPresent.length === 0,
  optionalPresent.length
    ? `${optionalPresent.join(", ")} must reach a project only through an explicit decision`
    : undefined,
);

/* ---------- legacy residue ---------- */

ui.step("Legacy residue");

const RESIDUE = [
  { label: "site/ as an application root", re: /(^|[^\w/])site\/(src|public|package\.json)/ },
  { label: "PROJECT-BRIEF.md", re: /PROJECT-BRIEF\.md/ },
  { label: "feature/<slug> branch workflow", re: /feature\/\[projectSlug\]|git checkout -b feature\// },
  { label: "integracion trunk assumption", re: /\bintegracion\b/ },
  { label: "old Builder phase numbering", re: /Phase [1-6](\.5)?:/ },
  { label: "sandbox deploy script", re: /vercel-deploy\/scripts\/deploy\.sh/ },
];

const scanned = listFiles(target).filter(
  (f) =>
    /\.(md|json|ts|tsx|js|jsx|mjs|css|html)$/i.test(f) &&
    !f.startsWith("node_modules/") &&
    !f.startsWith(".git/") &&
    !f.startsWith(".claude/skills/"),
);

const residueHits = [];
for (const rel of scanned) {
  const text = fs.readFileSync(path.join(target, rel), "utf8");
  for (const { label, re } of RESIDUE) {
    if (re.test(text)) residueHits.push(`${rel}: ${label}`);
  }
}
check(
  "No active legacy assumptions in project files",
  residueHits.length === 0,
  residueHits.slice(0, 10).join(" | "),
);

/* ---------- technical scaffold ---------- */

{
  ui.step("Technical scaffold");
  const run = (label, command) => {
    try {
      execSync(command, { cwd: target, stdio: "pipe" });
      return check(label, true);
    } catch (error) {
      return check(label, false, describeExecFailure(error).split(/\r?\n/).slice(-6).join(" | "));
    }
  };

  run("npm ci", "npm ci");
  run("lint", "npm run lint");
  run("typecheck", "npm run typecheck");
  const built = run("build", "npm run build");

  /* ---------- smoke start ---------- */

  /* A build that succeeds proves the code compiles. It does not prove the
     scaffold serves anything -- a project can build cleanly and 404 every
     route, which is exactly the failure mode this catches. Scaffold only:
     nothing here says the product is correct. */
  if (!profile.smoke) {
    check("Smoke start", false, `Profile ${profile.id} declares no smoke configuration.`);
  } else if (!built) {
    check("Smoke start", false, "Skipped -- the build failed, so there is nothing to serve.");
  } else {
    const port = Number(args.port ?? 43117);
    const command = profile.smoke.command.replaceAll("{port}", String(port));
    const url = profile.smoke.url.replaceAll("{port}", String(port));
    const expected = profile.smoke.expect_status ?? 200;

    const server = spawn(command, {
      cwd: target,
      shell: true,
      stdio: "ignore",
      windowsHide: true,
      /* Own process group off Windows, so the whole tree can be signalled at
         once. On Windows taskkill /T does the same job. */
      detached: process.platform !== "win32",
    });

    let outcome;
    try {
      const status = await waitForStatus(url, 90_000, server);
      outcome =
        status === expected
          ? { ok: true }
          : { ok: false, detail: `${url} answered ${status}, expected ${expected}` };
    } catch (error) {
      outcome = { ok: false, detail: `${url}: ${error.message}` };
    } finally {
      killTree(server);
    }

    check(`Smoke start (${url} -> ${expected})`, outcome.ok, outcome.detail);
  }
}

/* ---------- verdict ---------- */

const failed = results.filter((r) => !r.ok);
console.log("");
if (failed.length === 0) {
  ui.pass(`VALIDATION_PASS — ${results.length} checks, 0 failures`);
  console.log(`\n  ${target}\n\n  Open it in a fresh Claude Code session and say "inicia".\n`);
  process.exit(0);
}

ui.fail(`VALIDATION_FAIL — ${failed.length} of ${results.length} checks failed`);
for (const f of failed) ui.detail(f.name);
console.log("\n  Nothing was repaired. Fix the cause and re-run.\n");
process.exit(1);

/* ---------- helpers ---------- */

/**
 * Poll `url` until it answers, or the budget runs out.
 *
 * Deliberately treats a refused connection as "not up yet" rather than a
 * failure -- a server takes a moment to bind, and the first few attempts are
 * expected to fail. It gives up early only if the process itself exits, since
 * polling a dead server for 90 seconds tells you nothing you did not know one
 * second in.
 */
function waitForStatus(url, budgetMs, child) {
  const deadline = Date.now() + budgetMs;
  let exited = false;
  child.once("exit", () => {
    exited = true;
  });

  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (exited) {
        reject(new Error("the server process exited before answering"));
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error(`no response within ${budgetMs / 1000}s`));
        return;
      }

      const request = http.get(url, (response) => {
        response.resume();
        resolve(response.statusCode);
      });
      request.setTimeout(3000, () => request.destroy());
      request.on("error", () => setTimeout(attempt, 500));
    };

    attempt();
  });
}

/**
 * Kill the server and everything it spawned.
 *
 * `npm run start` is a shim that spawns the real server as a child, so killing
 * the shim alone leaves the server holding the port -- and the next run then
 * fails for a reason that has nothing to do with the project. Windows needs
 * taskkill for the tree; elsewhere the process group does it.
 */
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  } catch {
    /* Already gone. Nothing to clean up. */
  }
}

