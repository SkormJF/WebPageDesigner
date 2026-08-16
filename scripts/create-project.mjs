#!/usr/bin/env node
/**
 * create-project — compose a new independent repository from approved specs.
 *
 *   node scripts/create-project.mjs --slug <slug>
 *
 * Runs at phase CREATING_PROJECT. The Orchestrator persists that phase *before*
 * calling this script -- write-before-act -- and this script never changes phase
 * itself. Lifecycle state has exactly one writer.
 *
 * The application stack is fixed by builder.config.json: Next.js for every project.
 * Planning decides only whether the product needs the optional Supabase backend capability.
 *
 *   COMMON TEMPLATE + FIXED NEXT TEMPLATE + INHERITED SKILLS + NEXT SKILLS
 *   + OPTIONAL SUPABASE CAPABILITY + APPROVED SPECS = NEW INDEPENDENT PROJECT
 *
 * Mechanical only. It does not change requirements, redesign architecture,
 * alter visual direction, choose another framework, implement features or rewrite specs.
 * It fails on an invalid assumption rather than working around it.
 *
 * The Builder owns exactly one commit in the generated repository's history.
 * Everything after it belongs to that project's own harness.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync, execFileSync } from "node:child_process";
import {
  BUILDER_ROOT,
  paths,
  SPEC_FILES,
  ui,
  abort,
  readJson,
  writeJson,
  loadConfig,
  loadProfile,
  expectedSkills,
  copyDir,
  substituteTokens,
  rmrf,
  listFiles,
  parseArgs,
  isValidSlug,
  describeExecFailure,
  readBackendMode,
  composeBackendCapability,
  resolveProjectTarget,
} from "./lib/common.mjs";
import { runSpecGate, reportSpecGate } from "./lib/spec-gate.mjs";

const args = parseArgs(process.argv.slice(2));

/* ---------- preconditions ---------- */

ui.step("Preconditions");

const slug = args.slug;
if (!isValidSlug(slug)) {
  abort(
    "A valid --slug is required.",
    "Lowercase letters, digits and hyphens; starts with a letter; 2-64 characters.",
  );
}

const config = loadConfig();

const statePath = path.join(paths.builderCurrent, "state.json");
if (!fs.existsSync(statePath)) {
  abort("No active Builder project.", `Expected ${statePath}. The Builder is IDLE.`);
}
const state = readJson(statePath);

/* The harness persists state BEFORE a consequential action, so by the time this
   script runs the phase is already CREATING_PROJECT -- that write is what makes
   an interrupted handoff recoverable. Demanding READY_TO_CREATE here would mean
   the only way to satisfy the script is to skip the write, which is the
   contradiction this guard used to encode.

   READY_TO_CREATE is the state the Spec Gate, the Spec Reviewer and human
   approval produce; CREATING_PROJECT is the Orchestrator's record that it is
   about to create. This script asserts the second and never writes either. */
if (state.phase !== "CREATING_PROJECT") {
  abort(
    `Phase is ${state.phase}, not CREATING_PROJECT.`,
    "Creation follows READY_TO_CREATE -- reached only after the mechanical Spec Gate, the Spec Reviewer and explicit human approval -- and runs once the Orchestrator has persisted CREATING_PROJECT. This script does not change phase.",
  );
}
ui.pass(`Phase is CREATING_PROJECT (project "${state.project_name ?? slug}")`);

if (state.slug && state.slug !== slug) {
  abort(
    `--slug "${slug}" does not match the slug in state.json ("${state.slug}").`,
    "Creating under a different name than the one that was approved is not a mechanical decision.",
  );
}

if ("profile" in args) {
  abort(
    "--profile no longer exists.",
    "This Factory generates Next.js only. The fixed platform is builder.config.stack_profile; Planning decides backend mode, not framework.",
  );
}

const backendMode = readBackendMode();
if (!backendMode || backendMode.startsWith("unsupported:")) {
  abort(
    "design.md does not state a supported Backend Mode.",
    "Expected `**Mode:** none` or `**Mode:** supabase` under `## Backend`.",
  );
}

const profile = loadProfile(config.stack_profile);
ui.pass(`Fixed stack "${profile.id}" resolves to ${profile.template}`);
ui.pass(`Backend mode: ${backendMode}`);

const templateDir = path.join(BUILDER_ROOT, profile.template);
if (!fs.existsSync(path.join(templateDir, "package.json"))) {
  abort(`Stack template ${profile.template} has no package.json.`);
}

for (const spec of SPEC_FILES) {
  if (!fs.existsSync(path.join(paths.builderCurrent, spec))) {
    abort(`Approved specification ${spec} is missing from .builder/current/.`);
  }
}
ui.pass(`All ${SPEC_FILES.length} approved specifications present`);

const gate = runSpecGate();
reportSpecGate(gate);
if (!gate.pass) {
  abort("Mechanical Spec Gate failed.", "Fix the findings above; creation does not proceed past it.");
}

/* The single most destructive thing this script could do is write over
   somebody's project. It never overwrites, never merges, and never invents
   <slug>-2 -- an occupied target is a stop, not a naming problem. */
const target = resolveProjectTarget(slug, config);
if (fs.existsSync(target)) {
  abort(
    `Target already exists: ${target}`,
    "Nothing was written. Choose a different slug, or move the existing directory yourself.",
  );
}
ui.pass(`Target is free: ${target}`);

const skills = expectedSkills(profile.id);
const missingSkills = skills.filter((s) => !fs.existsSync(path.join(paths.skills, s)));
if (missingSkills.length > 0) {
  abort(
    `skill-manifest.json names ${missingSkills.length} skill(s) that do not exist on disk.`,
    missingSkills.join(", "),
  );
}
ui.pass(`${skills.length} skills resolve for this profile`);

/* ---------- compose ---------- */

const staging = path.join(paths.staging, slug);
rmrf(staging);
fs.mkdirSync(staging, { recursive: true });

ui.step(`Composing in ${path.relative(BUILDER_ROOT, staging)}`);

/* Common harness. specs/ is handled separately -- the generated project keeps
   its specifications at the root, and the template's placeholder copies must
   not survive alongside the real ones. */
copyDir(paths.templatesCommon, staging, { exclude: ["specs"] });
ui.pass("common template");

copyDir(templateDir, staging, { exclude: ["gitignore.append"] });
ui.pass(`stack template (${profile.id})`);

const backendCapability = composeBackendCapability(staging, backendMode);
ui.pass(
  backendCapability.supabase
    ? "Supabase capability layer enabled (one shared project MCP + fail-closed read-only DB reviewer role)"
    : "Static/simple capability layer: no Supabase MCP or DB reviewer installed",
);

/* .gitignore ships without its dot inside templates/ so it cannot apply to the
   Builder repo itself. Restore the name here, then append the stack's rules. */
const commonIgnore = path.join(staging, "gitignore");
const finalIgnore = path.join(staging, ".gitignore");
if (!fs.existsSync(commonIgnore)) abort("templates/common/gitignore is missing.");
fs.renameSync(commonIgnore, finalIgnore);

const stackIgnore = path.join(templateDir, "gitignore.append");
if (fs.existsSync(stackIgnore)) {
  fs.appendFileSync(finalIgnore, fs.readFileSync(stackIgnore, "utf8"), "utf8");
}
ui.pass(".gitignore composed from common + stack rules");

const skillsTarget = path.join(staging, ".claude", "skills");
fs.mkdirSync(skillsTarget, { recursive: true });
for (const skill of skills) {
  copyDir(path.join(paths.skills, skill), path.join(skillsTarget, skill));
}
ui.pass(`${skills.length} skills copied`);

/* Approved specifications replace the template's slots entirely. */
for (const spec of SPEC_FILES) {
  fs.copyFileSync(path.join(paths.builderCurrent, spec), path.join(staging, spec));
}
ui.pass(`${SPEC_FILES.length} approved specifications installed at the repository root`);

/* Identity. package.json and package-lock.json must agree in all three places
   npm compares, or `npm ci` refuses to run. */
const projectName = state.project_name ?? slug;
for (const file of ["package.json", "package-lock.json"]) {
  const full = path.join(staging, file);
  if (!fs.existsSync(full)) continue;
  const json = readJson(full);
  json.name = slug;
  if (json.packages && json.packages[""]) json.packages[""].name = slug;
  writeJson(full, json);
}

substituteTokens(staging, { "[PROJECT_NAME]": projectName });
ui.pass(`Identity applied: name "${slug}", project "${projectName}"`);

/* ---------- dependencies ---------- */

ui.step("Installing dependencies");
try {
  execSync("npm ci", { cwd: staging, stdio: "pipe" });
  ui.pass("npm ci");
} catch (error) {
  const cause = describeExecFailure(error);
  rmrf(staging);
  abort("npm ci failed. Nothing was written to the projects root.", cause);
}

if (!fs.existsSync(path.join(staging, "node_modules"))) {
  rmrf(staging);
  abort("npm ci reported success but produced no node_modules.");
}
ui.pass("node_modules exists");

/* ---------- git baseline ---------- */

ui.step("Git baseline");
const git = (...a) => execFileSync("git", a, { cwd: staging, stdio: "pipe" });
try {
  git("init", "-q");
  git("add", "-A");
  git("commit", "-q", "-m", "chore: initialize project");
  ui.pass("initialized, one baseline commit: chore: initialize project");
} catch (error) {
  const cause = describeExecFailure(error);
  rmrf(staging);
  abort("git baseline failed. Nothing was written to the projects root.", cause);
}

const tracked = execFileSync("git", ["ls-files"], { cwd: staging, encoding: "utf8" });
if (/(^|\/)node_modules\//m.test(tracked) || /(^|\/)\.env/m.test(tracked)) {
  rmrf(staging);
  abort("The baseline commit would have tracked node_modules or an env file.", "Nothing was moved.");
}
ui.pass("baseline tracks no dependencies and no env files");

/* ---------- publish ---------- */

ui.step("Moving to the projects root");
fs.mkdirSync(config.projects_root, { recursive: true });

/* The target must appear complete or not at all. Nothing here ever writes into
   the target path directly: the only operation that produces it is a rename of a
   fully-built directory, so an interrupted handoff leaves no half-project behind.
   Fail closed at every step -- an occupied target is never merged, never
   overwritten, never renamed around. */
const failClosed = (code, message, detail) => {
  rmrf(staging);
  abort(`CREATE_FAILED  code: ${code}`, [message, detail].filter(Boolean).join("\n"));
};

const assertTargetFree = (when) => {
  if (fs.existsSync(target)) {
    failClosed(
      "TARGET_EXISTS",
      `${target} exists (${when}). Nothing was written to it.`,
      "Someone else's work may live there. Choose a different slug, or move that directory yourself.",
    );
  }
};

const stagedFileCount = listFiles(staging).length;

assertTargetFree("before the move");

let renamed = false;
try {
  fs.renameSync(staging, target);
  renamed = true;
} catch (error) {
  /* EXDEV is the one error that means "same operation, different filesystem".
     Everything else -- EACCES, EPERM, EBUSY, ENOSPC -- is a real failure, and
     copying on top of it would turn a clean stop into a partial write. */
  if (error.code !== "EXDEV") {
    failClosed(
      "MOVE_FAILED",
      `Could not move staging to ${target}: ${error.code ?? "unknown error"}.`,
      `${error.message}\nNo copy was attempted. Nothing was written to the target.`,
    );
  }

  /* Cross-filesystem: stage a second time *inside the destination filesystem*,
     verify that copy completely, and only then rename it into place. The final
     step is still a rename, so the target still appears atomically. */
  const transit = path.join(config.projects_root, `.transit-${slug}-${process.pid}`);
  rmrf(transit);

  try {
    assertTargetFree("before the cross-filesystem copy");
    copyDir(staging, transit);

    const copiedFileCount = listFiles(transit).length;
    if (copiedFileCount !== stagedFileCount) {
      rmrf(transit);
      failClosed(
        "COPY_INCOMPLETE",
        `Cross-filesystem copy is short: ${copiedFileCount} of ${stagedFileCount} files.`,
        "The target was never created.",
      );
    }
    if (!fs.existsSync(path.join(transit, "package.json")) || !fs.existsSync(path.join(transit, ".git"))) {
      rmrf(transit);
      failClosed("COPY_INCOMPLETE", "Copy is missing package.json or .git.", "The target was never created.");
    }

    /* Re-check immediately before the rename: the copy took time, and something
       else may have claimed the path while it ran. */
    if (fs.existsSync(target)) {
      rmrf(transit);
      failClosed(
        "TARGET_EXISTS",
        `${target} appeared while the copy was running. Nothing was written to it.`,
        "The transit directory was removed.",
      );
    }

    fs.renameSync(transit, target);
    renamed = true;
  } catch (transitError) {
    /* failClosed exits the process, so anything arriving here is a genuine
       throw from copyDir or the final rename. */
    rmrf(transit);
    failClosed(
      "MOVE_FAILED",
      `Cross-filesystem handoff failed: ${transitError.code ?? "unknown error"}.`,
      `${transitError.message}\nThe target was not created.`,
    );
  }
}

if (!renamed || !fs.existsSync(path.join(target, "package.json"))) {
  abort(`CREATE_FAILED  code: MOVE_FAILED`, `${target} is not a complete project. Inspect before retrying.`);
}

rmrf(staging);
ui.pass(`Created ${target}`);

console.log(`
Next: persist phase VALIDATING_PROJECT, then validate. Nothing is reported to the
human before the validator passes.

  node scripts/validate-project.mjs --slug ${slug}
`);
