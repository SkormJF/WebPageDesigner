#!/usr/bin/env node
/**
 * create-project — compose a new independent repository from approved specs.
 *
 *   node scripts/create-project.mjs --slug <slug> [--profile <id>]
 *
 *   COMMON TEMPLATE + STACK TEMPLATE + INHERITED SKILLS + PROFILE SKILLS
 *   + APPROVED SPECS = NEW INDEPENDENT PROJECT
 *
 * Mechanical only. It does not change requirements, redesign architecture,
 * alter visual direction, choose a stack, implement features or rewrite specs.
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
  parseArgs,
  isValidSlug,
  describeExecFailure,
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

if (state.phase !== "READY_TO_CREATE") {
  abort(
    `Phase is ${state.phase}, not READY_TO_CREATE.`,
    "Creation runs only after the mechanical Spec Gate, the Spec Reviewer, and explicit human approval have all passed.",
  );
}
ui.pass(`Phase is READY_TO_CREATE (project "${state.project_name ?? slug}")`);

if (state.slug && state.slug !== slug) {
  abort(
    `--slug "${slug}" does not match the slug in state.json ("${state.slug}").`,
    "Creating under a different name than the one that was approved is not a mechanical decision.",
  );
}

const profileId = args.profile ?? state.stack_profile ?? config.default_stack_profile;
const profile = loadProfile(profileId);
ui.pass(`Stack profile "${profile.id}" resolves to ${profile.template}`);

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
const target = path.join(config.projects_root, slug);
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
try {
  fs.renameSync(staging, target);
} catch {
  /* Rename fails across volumes. Copy, verify, then remove the source. */
  copyDir(staging, target);
  if (!fs.existsSync(path.join(target, "package.json"))) {
    abort(`Copy to ${target} did not complete. Staging left at ${staging} for inspection.`);
  }
  rmrf(staging);
}
ui.pass(`Created ${target}`);

console.log(`
Next: validate it before reporting anything to the human.

  node scripts/validate-project.mjs --slug ${slug}
`);
