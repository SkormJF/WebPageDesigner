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

/* ---------- skills ---------- */

/**
 * The deterministic skill set for a profile. create-project copies exactly
 * this; validate-project expects exactly this. One function, so the two can
 * never disagree about what "correct" means.
 */
export function expectedSkills(profileId) {
  const manifest = readJson(paths.skillManifest);
  const expected = [];

  for (const [name, entry] of Object.entries(manifest.skills)) {
    switch (entry.distribution) {
      case "inherited-standard":
      case "optional":
        expected.push(name);
        break;
      case "profile-inherited":
        if ((entry.profiles ?? []).includes(profileId)) expected.push(name);
        break;
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
