/**
 * Mechanical Spec Gate.
 *
 * The first of the three conditions that close Planning:
 *
 *   Mechanical Spec Gate PASS + Spec Reviewer PASS + explicit Human Approval
 *   = READY_TO_CREATE
 *
 * This half is deterministic and checks only what can be checked without
 * judgement: required files, unresolved placeholders, well-formed IDs, valid
 * requirement/task references, orphan critical requirements, and the presence
 * of required contract sections.
 *
 * It deliberately says nothing about whether the specs are *right*. That is
 * the Spec Reviewer's job, and conflating the two would let a well-formed but
 * wrong specification pass as approved.
 *
 * Helper module, not a fourth top-level script: create-project runs it as a
 * hard precondition, and the Orchestrator may run it directly during
 * SPEC_REVIEW for early feedback.
 *
 *   node scripts/lib/spec-gate.mjs [--dir <path>]
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { paths, SPEC_FILES, ui, parseArgs } from "./common.mjs";

/**
 * Sections each spec must contain. Kept here rather than in a config file
 * because the gate is the only consumer -- a second copy would be one more
 * thing to drift.
 */
const REQUIRED_SECTIONS = {
  "PROJECT.md": ["## Identity", "## What this is", "## Scope", "## Decisions log"],
  "requirements.md": ["## Functional requirements", "## Non-functional requirements"],
  "design.md": ["## Stack profile", "## Architecture", "## Routes", "## Security"],
  "design-system.md": ["## Approval", "## Color", "## Typography", "## Interaction states"],
  "tasks.md": ["## Dependency order"],
};

/** Markers that mean a decision was never made. */
const PLACEHOLDER_PATTERNS = [
  { label: "unresolved [TBD]", re: /\[TBD/g },
  { label: "unremoved <!-- SLOT: --> guidance", re: /<!--\s*SLOT:/g },
  { label: "[PENDIENTE] marker", re: /\[PENDIENTE/gi },
  { label: "unreplaced [PROJECT_NAME] token", re: /\[PROJECT_NAME\]/g },
];

const REQ_ID = /\bREQ-\d{3}\b/g;
const TASK_ID = /\bTASK-\d{3}\b/g;

export function runSpecGate(dir = paths.builderCurrent) {
  const findings = [];
  const add = (file, message) => findings.push({ file, message });

  /* 1 — required files */
  const missing = SPEC_FILES.filter((f) => !fs.existsSync(path.join(dir, f)));
  for (const f of missing) add(f, "required specification is missing");
  if (missing.length === SPEC_FILES.length) {
    return { pass: false, findings, checked: 0 };
  }

  const contents = {};
  for (const f of SPEC_FILES) {
    const file = path.join(dir, f);
    if (fs.existsSync(file)) contents[f] = fs.readFileSync(file, "utf8");
  }

  /* 2 — unresolved placeholders */
  for (const [file, text] of Object.entries(contents)) {
    for (const { label, re } of PLACEHOLDER_PATTERNS) {
      const hits = text.match(re);
      if (hits) add(file, `${hits.length} x ${label}`);
    }
  }

  /* 3 — required contract sections */
  for (const [file, sections] of Object.entries(REQUIRED_SECTIONS)) {
    const text = contents[file];
    if (text === undefined) continue;
    for (const section of sections) {
      if (!text.includes(section)) add(file, `missing required section "${section}"`);
    }
  }

  /* 4 — ID hygiene and cross-references.
     A requirement nobody implements and a task tracing to nothing are the same
     defect seen from opposite ends, so both directions are checked. */
  const reqIds = new Set(
    [...(contents["requirements.md"] ?? "").matchAll(REQ_ID)].map((m) => m[0]),
  );
  const taskIds = new Set([...(contents["tasks.md"] ?? "").matchAll(TASK_ID)].map((m) => m[0]));

  if (reqIds.size === 0) add("requirements.md", "no REQ-nnn identifiers found");
  if (taskIds.size === 0) add("tasks.md", "no TASK-nnn identifiers found");

  const reqsCitedByTasks = new Set(
    [...(contents["tasks.md"] ?? "").matchAll(REQ_ID)].map((m) => m[0]),
  );

  for (const id of reqsCitedByTasks) {
    if (!reqIds.has(id)) add("tasks.md", `references ${id}, which requirements.md does not define`);
  }

  /* An uncovered MUST is a gate failure; an uncovered SHOULD/COULD is not.
     Read priority from the row the ID appears on. */
  const withdrawn = new Set();
  const withdrawnSection = (contents["requirements.md"] ?? "").split("## Withdrawn")[1] ?? "";
  for (const m of withdrawnSection.matchAll(REQ_ID)) withdrawn.add(m[0]);

  /* Only markdown table rows carry declarations. A fenced dependency graph
     mentions the same IDs and is not a declaration of anything -- reading it
     as one reports every node in the graph as an untraced task. */
  const tableRows = (text) =>
    text.split(/\r?\n/).filter((line) => /^\s*\|/.test(line) && !/^\s*\|[\s|:-]+\|?\s*$/.test(line));

  for (const line of tableRows(contents["requirements.md"] ?? "")) {
    const found = line.match(REQ_ID);
    if (!found) continue;
    const id = found[0];
    if (withdrawn.has(id)) continue;
    if (!/\bMUST\b/.test(line)) continue;
    if (!reqsCitedByTasks.has(id)) add("tasks.md", `no task covers ${id}, a MUST requirement`);
  }

  /* 5 — every task links to at least one requirement */
  for (const line of tableRows(contents["tasks.md"] ?? "")) {
    const task = line.match(TASK_ID);
    if (!task) continue;
    if (!line.match(REQ_ID)) add("tasks.md", `${task[0]} links to no requirement`);
  }

  return { pass: findings.length === 0, findings, checked: Object.keys(contents).length };
}

export function reportSpecGate(result) {
  if (result.pass) {
    ui.pass(`Mechanical Spec Gate: ${result.checked} specifications, no findings`);
    return;
  }
  ui.fail(`Mechanical Spec Gate: ${result.findings.length} finding(s)`);
  for (const { file, message } of result.findings) ui.detail(`${file}: ${message}`);
}

/* Direct invocation.
   pathToFileURL, not string concatenation: on Windows import.meta.url is
   `file:///C:/...` while a hand-built `file://` + argv[1] yields
   `file://C:/...`. They never match, the block silently never runs, and the
   script exits 0 having done nothing -- which reads as a pass. */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const dir = typeof args.dir === "string" ? path.resolve(args.dir) : paths.builderCurrent;

  if (!fs.existsSync(dir)) {
    ui.fail(`No specifications at ${dir}`);
    process.exit(1);
  }

  ui.step(`Mechanical Spec Gate — ${dir}`);
  const result = runSpecGate(dir);
  reportSpecGate(result);
  process.exit(result.pass ? 0 : 1);
}
