#!/usr/bin/env node
/**
 * validate-project — prove a generated repository is ready for a fresh session.
 *
 *   node scripts/validate-project.mjs --slug <slug> [--profile <id>] [--quick]
 *
 * It answers one question and nothing else: did the Builder generate a valid
 * independent repository?
 *
 * It does not run product E2E, does not authenticate MCP servers, and repairs
 * nothing. A validator that fixes what it finds cannot tell you what was
 * broken.
 *
 * Exit 0 on PASS, 1 on FAIL.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
} from "./lib/common.mjs";

const args = parseArgs(process.argv.slice(2));
const config = loadConfig();

const target = args.path
  ? path.resolve(args.path)
  : args.slug
    ? path.join(config.projects_root, args.slug)
    : abort("Pass --slug <slug> or --path <dir>.");

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

check(
  "Lives under the configured projects root",
  path.resolve(target).startsWith(path.resolve(config.projects_root)),
  `Expected a directory under ${config.projects_root}`,
);

check(
  "Is not inside the Builder repository",
  !path.resolve(target).startsWith(path.resolve(paths.builderCurrent, "..", "..")),
  "A generated project inside the Builder repository defeats the whole boundary.",
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

const profileId = args.profile ?? readProfileFromDesign() ?? config.default_stack_profile;
const profile = loadProfile(profileId);
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

if (args.quick) {
  ui.step("Technical scaffold");
  ui.info("skipped (--quick)");
} else {
  ui.step("Technical scaffold");
  const run = (label, cmd, cmdArgs) => {
    try {
      execFileSync(cmd, cmdArgs, {
        cwd: target,
        stdio: "pipe",
        shell: process.platform === "win32",
      });
      return check(label, true);
    } catch (error) {
      const out = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
      return check(label, false, out.split(/\r?\n/).slice(-6).join(" | "));
    }
  };

  run("npm ci", "npm", ["ci"]);
  run("lint", "npm", ["run", "lint"]);
  run("typecheck", "npm", ["run", "typecheck"]);
  run("build", "npm", ["run", "build"]);
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

function readProfileFromDesign() {
  const file = path.join(target, "design.md");
  if (!fs.existsSync(file)) return null;
  const match = fs.readFileSync(file, "utf8").match(/\*\*Profile:\*\*\s*`?([a-z0-9-]+)`?/i);
  return match ? match[1] : null;
}
