/**
 * Shared helpers for the three mechanical scripts.
 *
 * Implementation detail, not a fourth entry point. Nothing here makes a
 * decision that belongs to the Orchestrator -- these functions read, copy,
 * compare and report.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BUILDER_ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");

export const paths = {
  config: path.join(BUILDER_ROOT, "builder.config.json"),
  skillManifest: path.join(BUILDER_ROOT, "config", "skill-manifest.json"),
  stackProfiles: path.join(BUILDER_ROOT, "config", "stack-profiles"),
  templatesCommon: path.join(BUILDER_ROOT, "templates", "common"),
  templatesStacks: path.join(BUILDER_ROOT, "templates", "stacks"),
  skills: path.join(BUILDER_ROOT, ".claude", "skills"),
  builderCurrent: path.join(BUILDER_ROOT, ".builder", "current"),
  staging: path.join(BUILDER_ROOT, ".staging"),
};

export const SPEC_FILES = [
  "PROJECT.md",
  "requirements.md",
  "design.md",
  "design-system.md",
  "tasks.md",
];

/* ---------- output ---------- */

const isTTY = process.stdout.isTTY;
const paint = (code, s) => (isTTY ? `\u001b[${code}m${s}\u001b[0m` : s);

export const ui = {
  pass: (s) => console.log(`${paint(32, "PASS")}  ${s}`),
  fail: (s) => console.log(`${paint(31, "FAIL")}  ${s}`),
  info: (s) => console.log(`      ${s}`),
  step: (s) => console.log(`\n${paint(1, s)}`),
  detail: (s) => console.log(`        ${s}`),
};

/** Stop with a message. Used only for conditions that make continuing unsafe. */
export function abort(message, detail) {
  console.error(`\n${paint(31, "STOP")}  ${message}`);
  if (detail) console.error(`      ${detail}`);
  process.exit(1);
}

/* ---------- json ---------- */

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    abort(`Cannot read ${path.relative(BUILDER_ROOT, file)}`, error.message);
  }
}

export function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function loadConfig() {
  const config = readJson(paths.config);
  for (const key of ["schema_version", "projects_root", "default_stack_profile"]) {
    if (config[key] === undefined) abort(`builder.config.json is missing "${key}".`);
  }
  return config;
}

export function loadProfile(id) {
  const file = path.join(paths.stackProfiles, `${id}.json`);
  if (!fs.existsSync(file)) {
    const available = fs
      .readdirSync(paths.stackProfiles)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
    abort(`Unknown stack profile "${id}".`, `Available: ${available.join(", ")}`);
  }
  return readJson(file);
}

/* ---------- the approved stack profile ---------- */

/**
 * Extract the approved stack profile id from design.md's text.
 *
 * Pure and string-in/string-out so it can be exercised directly. It matches the
 * template's own line -- `- **Profile:** <id>` under `## Stack profile` -- and
 * nothing else, because guessing from prose is how a project gets generated on a
 * foundation nobody approved.
 *
 * Line-based on purpose. The previous version delimited the section with
 * `(?=^##\s|\Z)`, and JavaScript has no `\Z`: in a regular expression it is an
 * identity escape for the letter Z, so the alternative that was supposed to mean
 * "end of input" only matched a literal Z somewhere later in the file. A
 * design.md whose `## Stack profile` was the final section parsed as null and
 * creation stopped on a profile the human had in fact approved. Walking lines
 * has no end-of-input case to get wrong.
 *
 * Handles LF and CRLF, a final newline or none, and the section appearing first,
 * in the middle, or last. Returns null when the section is absent or unfilled.
 */
export function parseApprovedProfile(designText) {
  if (typeof designText !== "string") return null;

  let insideSection = false;

  for (const line of designText.split(/\r\n|\n|\r/)) {
    /* A level-2 heading either opens the section or closes it. `###` and deeper
       belong to whichever section is currently open. */
    if (/^##[^#]/.test(line) || /^##$/.test(line)) {
      insideSection = /^##\s+Stack profile\s*$/.test(line);
      continue;
    }
    if (!insideSection) continue;

    const match = line.match(/^\s*[-*]\s*\*\*Profile:\*\*\s*(.+?)\s*$/);
    if (!match) continue;

    const value = match[1].replace(/^`+|`+$/g, "").trim();
    if (!value || value.startsWith("[")) return null; // [TBD] and friends are not a decision
    return value;
  }

  return null;
}

/**
 * The approved profile for the active Builder project. design.md owns this --
 * it is not duplicated into state.json, which stays minimal operational memory.
 */
export function readApprovedProfile(dir = paths.builderCurrent) {
  const file = path.join(dir, "design.md");
  if (!fs.existsSync(file)) return null;
  return parseApprovedProfile(fs.readFileSync(file, "utf8"));
}

/**
 * Resolve a slug to its target directory under projects_root, refusing anything
 * that would land outside it. Deterministic by construction rather than by
 * inspecting a caller-supplied path afterwards.
 */
export function resolveProjectTarget(slug, config) {
  if (!isValidSlug(slug)) {
    abort(
      "A valid --slug is required.",
      "Lowercase letters, digits and hyphens; starts with a letter; 2-64 characters.",
    );
  }
  const root = path.resolve(config.projects_root);
  const target = path.resolve(path.join(root, slug));
  const withinRoot = target === root ? false : target.startsWith(root + path.sep);
  if (!withinRoot) {
    abort(`Refusing to resolve "${slug}" outside ${root}.`, `Resolved to ${target}.`);
  }
  return target;
}

/* ---------- skills ---------- */

/**
 * The deterministic skill set for a profile. create-project copies exactly
 * this; validate-project expects exactly this. One function, so the two can
 * never disagree about what "correct" means.
 */
export function expectedSkills(profileId) {
  const manifest = readJson(paths.skillManifest);

  /* Two owners, one decision each. The manifest classifies a skill; the profile
     decides which PROFILE-INHERITED skills it takes. The manifest used to also
     carry a `profiles` array naming the recipients, which meant two places could
     disagree about the same fact -- and the one the code read was not the one the
     manifest's own documentation described. */
  const profile = loadProfile(profileId);
  const profileSkills = profile.profile_skills ?? [];

  for (const name of profileSkills) {
    const entry = manifest.skills[name];
    if (!entry) {
      abort(
        `Stack profile "${profileId}" lists profile_skills entry "${name}", which the manifest does not classify.`,
      );
    }
    if (entry.distribution !== "profile-inherited") {
      abort(
        `Stack profile "${profileId}" lists "${name}" in profile_skills, but the manifest classifies it "${entry.distribution}".`,
        "A profile may only add skills classified profile-inherited.",
      );
    }
  }

  const expected = [];

  for (const [name, entry] of Object.entries(manifest.skills)) {
    switch (entry.distribution) {
      case "inherited-standard":
        expected.push(name);
        break;
      case "profile-inherited":
        if (profileSkills.includes(name)) expected.push(name);
        break;
      /* Optional/emergency skills are NOT inherited. The set is exactly
         inherited-standard + the selected profile's additions.
         An optional skill reaches a project only through an explicit later
         decision -- copying it by default would make "requires explicit human
         approval" a sentence in a document rather than a property of the
         repository. */
      case "optional":
      case "builder-only":
        break;
      default:
        abort(
          `skill-manifest.json: skill "${name}" has unknown distribution "${entry.distribution}".`,
        );
    }
  }

  return expected.sort();
}

/* ---------- filesystem ---------- */

export function copyDir(from, to, { exclude = [] } = {}) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst, { exclude });
    else fs.copyFileSync(src, dst);
  }
}

/** Every file under `dir`, as paths relative to it, using forward slashes. */
export function listFiles(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

/** Replace [PROJECT_NAME]-style tokens in every text file under `dir`. */
export function substituteTokens(dir, tokens) {
  const textFile = /\.(md|json|ts|tsx|js|jsx|mjs|css|html|txt|yml|yaml)$/i;
  for (const rel of listFiles(dir)) {
    if (!textFile.test(rel)) continue;
    const file = path.join(dir, rel);
    const before = fs.readFileSync(file, "utf8");
    let after = before;
    for (const [token, value] of Object.entries(tokens)) {
      after = after.split(token).join(value);
    }
    if (after !== before) fs.writeFileSync(file, after, "utf8");
  }
}

export function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

/* ---------- child processes ---------- */

/**
 * Why every npm call in these scripts uses `execSync` with a command *string*
 * rather than `execFileSync` with an args array.
 *
 * On Windows npm is a `.cmd` shim, and Node cannot spawn a `.cmd` without a
 * shell -- `execFileSync("npm.cmd", [...])` fails with ENOENT. The obvious
 * workaround, `{ shell: true }` alongside an args array, trips Node's DEP0190:
 * with a shell, the array is concatenated into a command line instead of being
 * escaped, which is a genuine injection hazard the moment an argument is not a
 * literal.
 *
 * `execSync` takes one string and no array, so neither problem applies. That is
 * safe *here specifically* because every command in these scripts is a compile-
 * time constant and nothing user-supplied is ever interpolated into one. If that
 * stops being true, this has to change with it.
 */

/**
 * A readable cause for a failed child process, whatever it failed with.
 *
 * A spawn failure (ENOENT and friends) carries no stdout and no stderr at all,
 * so formatting only those produces an error report that says nothing about why
 * anything went wrong -- which is how a broken script looks like a broken
 * project.
 */
export function describeExecFailure(error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
  if (output) return output.slice(-1500);
  return `${error.code ?? "no exit output"}: ${error.message}`;
}

/* ---------- args ---------- */

/** Minimal `--key value` / `--flag` parser. No dependencies, no surprises. */
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

export function isValidSlug(slug) {
  return typeof slug === "string" && /^[a-z][a-z0-9-]{1,63}$/.test(slug);
}
