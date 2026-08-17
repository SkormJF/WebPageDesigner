/**
 * Mechanical Spec Gate.
 *
 * Mechanical Spec Gate PASS + Spec Reviewer PASS + explicit Human Approval
 * = READY_TO_CREATE.
 *
 * This module checks only deterministic contract shape: required files/sections,
 * unresolved placeholders, IDs/references, fixed implementation phases,
 * stack invariants, initial task status, and dependency validity.
 * Whether the plan is semantically good-sized or faithful to the approved
 * product remains the Spec Reviewer's job.
 *
 *   node scripts/lib/spec-gate.mjs [--dir <path>]
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { paths, SPEC_FILES, ui, parseArgs, parseBackendMode, parseAuthenticationMode } from "./common.mjs";

const REQUIRED_SECTIONS = {
  "PROJECT.md": ["## Identity", "## What this is", "## Scope", "## Decisions in force"],
  "requirements.md": ["## Functional requirements", "## Non-functional requirements"],
  "design.md": ["## Architecture", "## Routes", "## Backend", "## Human platform actions", "## Security"],
  "design-system.md": ["## Approval", "## Color", "## Typography", "## Interaction states", "## Responsive behaviour"],
  "tasks.md": ["## Dependency order", "## Implementation tasks", "## Phase ownership"],
};

const PLACEHOLDER_PATTERNS = [
  { label: "unresolved [TBD]", re: /\[TBD/g },
  { label: "unremoved <!-- SLOT: --> guidance", re: /<!--\s*SLOT:/g },
  { label: "[PENDIENTE] marker", re: /\[PENDIENTE/gi },
  { label: "unreplaced [PROJECT_NAME] token", re: /\[PROJECT_NAME\]/g },
];

const DISC_ID = /\bDISC-\d{3}\b/g;
const REQ_ID = /\bREQ-\d{3}\b/g;
const TASK_ID = /\bTASK-\d{3}\b/g;
const PHASES = ["FOUNDATION", "PRODUCT_BUILD"];
const PHASE_ORDER = new Map(PHASES.map((phase, index) => [phase, index]));
const RISKS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/* Obvious planning mistakes that are deterministic enough to reject before the
   semantic Spec Reviewer. These are deliberately narrow: the gate catches the
   exact lifecycle/capability leaks the harness can prove mechanically, while
   sizing and nuanced reviewability remain reviewer judgement. */
const GLOBAL_LIFECYCLE_TASK_PATTERNS = [
  { re: /\b(?:e2e|end[- ]to[- ]end)\s+suite\b/i, label: "standalone E2E-suite work belongs to lifecycle phase E2E" },
  { re: /\b(?:full|whole|global|serious|persistent)\s+(?:playwright\s+)?(?:e2e|end[- ]to[- ]end)\b/i, label: "full E2E execution belongs to lifecycle phase E2E" },
  { re: /\bvisual\s+qa\b/i, label: "Visual QA is a whole-product lifecycle phase, not a task" },
  { re: /\bquality\s+gate\b/i, label: "Quality Gate is a whole-product lifecycle phase, not a task" },
  { re: /\bpost[- ]deploy\b/i, label: "Post-deploy is a lifecycle phase, not a task" },
  { re: /\bbreak(?:ing)?\s+(?:it|the\s+test|a\s+test)\s+once\b/i, label: "deliberately breaking a test is not task acceptance" },
  { re: /\bfull\s+(?:task\s+)?lifecycle\b/i, label: "full product/task lifecycle regression belongs to lifecycle phase E2E" },
  { re: /\b(?:whole|full|complete|product[- ]wide)\s+(?:product\s+)?regression\s+pass\b/i, label: "product-wide regression pass belongs to lifecycle phase E2E" },
  { re: /\b(?:both|all)\s+(?:desktop\s+and\s+mobile|mobile\s+and\s+desktop)\s+viewports?\b/i, label: "all-viewports whole-product verification belongs to lifecycle phase E2E" },
];

const HUMAN_ONLY_CONTROL_PLANE_TASK_PATTERNS = [
  /\b(?:set|change|toggle|disable|enable|configure)\b[\s\S]{0,80}\b(?:confirm\s+email|email\s+confirmation|smtp|auth\s+provider|provider\s+settings?|password\s+policy|project\s+settings?)\b/i,
  /\b(?:confirm\s+email|email\s+confirmation|smtp|auth\s+provider|provider\s+settings?|password\s+policy|project\s+settings?)\b[\s\S]{0,80}\b(?:set|changed?|toggled?|disabled?|enabled?|configured?)\b/i,
];
const DISPOSABLE_FIXTURE_PATTERN = /\b(?:test|scratch|temporary|temp|disposable)\s+(?:auth\s+)?(?:users?|accounts?|rows?|records?|data|fixtures?)\b/i;
const FIXTURE_CLEANUP_PATTERN = /\b(?:delete|remove|clean(?:up|ed)?|purge)\b[\s\S]{0,120}\b(?:verify|confirm|absence|absent|zero|no\s+residue|no\s+rows?)\b|\b(?:verify|confirm)\b[\s\S]{0,120}\b(?:deleted|removed|clean(?:up|ed)?|absence|absent|zero|no\s+residue|no\s+rows?)\b/i;

const tableRows = (text) =>
  text
    .split(/\r?\n/)
    .filter((line) => /^\s*\|/.test(line) && !/^\s*\|[\s|:-]+\|?\s*$/.test(line));

const cellsOf = (line) => line.split("|").slice(1, -1).map((cell) => cell.trim());

const sectionBody = (text, heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(`${escaped}\\s*([\\s\\S]*?)(?=\\n---|\\n## |$)`))?.[1] ?? "";
};

export function runSpecGate(dir = paths.builderCurrent) {
  const findings = [];
  const add = (file, message) => findings.push({ file, message });

  /* 1 — required files. */
  const missing = SPEC_FILES.filter((f) => !fs.existsSync(path.join(dir, f)));
  for (const f of missing) add(f, "required specification is missing");
  if (missing.length === SPEC_FILES.length) return { pass: false, findings, checked: 0 };

  const contents = {};
  for (const f of SPEC_FILES) {
    const file = path.join(dir, f);
    if (fs.existsSync(file)) contents[f] = fs.readFileSync(file, "utf8");
  }

  /* 2 — unresolved template markers. */
  for (const [file, text] of Object.entries(contents)) {
    for (const { label, re } of PLACEHOLDER_PATTERNS) {
      const hits = text.match(re);
      if (hits) add(file, `${hits.length} x ${label}`);
    }
  }

  /* 3 — required contract sections. */
  for (const [file, sections] of Object.entries(REQUIRED_SECTIONS)) {
    const text = contents[file];
    if (text === undefined) continue;
    for (const section of sections) {
      if (!text.includes(section)) add(file, `missing required section "${section}"`);
    }
  }

  /* 4 — fixed platform and backend mode. */
  const designText = contents["design.md"] ?? "";
  const backendMode = parseBackendMode(designText);
  if (!backendMode) add("design.md", "Backend Mode must be exactly `none` or `supabase`");
  else if (backendMode.startsWith("unsupported:")) {
    add("design.md", `unsupported Backend Mode ${backendMode.slice("unsupported:".length)}; use none or supabase`);
  }

  const requirementsText = contents["requirements.md"] ?? "";
  const tasksText = contents["tasks.md"] ?? "";
  const designSystemText = contents["design-system.md"] ?? "";

  /* Machine-readable design choices. Textual discussion of a forbidden implementation is not itself an implementation;
     semantic stack choices are Reviewer-owned, while generated files are enforced later by validate-project. */
  const authenticationMode = parseAuthenticationMode(designText);
  if (!authenticationMode) add("design.md", "Authentication must be exactly `none` or `supabase`");
  else if (authenticationMode.startsWith("unsupported:")) {
    add("design.md", `unsupported Authentication ${authenticationMode.slice("unsupported:".length)}; use none or supabase`);
  } else if (authenticationMode === "supabase" && backendMode !== "supabase") {
    add("design.md", "Authentication `supabase` requires Backend Mode `supabase`");
  }

  const routesSection = sectionBody(designText, "## Routes");
  const declaredRouteCells = tableRows(routesSection).map(cellsOf).filter((cells) => cells[0] !== "Route");
  if (!declaredRouteCells.some((cells) => cells[0]?.replace(/`/g, "") === "/")) {
    add("design.md", "the root route `/` has no explicit behaviour/access contract");
  }

  const responsiveRows = tableRows(sectionBody(designSystemText, "## Responsive behaviour"))
    .map(cellsOf)
    .filter((cells) => cells[0] !== "Breakpoint");
  const ranges = [];
  for (const cells of responsiveRows) {
    const width = (cells[1] ?? "").replace(/[–—]/g, "-").replace(/`|px|\s/gi, "");
    let match = width.match(/^(\d+)-(\d+)$/);
    if (match) ranges.push({ start: Number(match[1]), end: Number(match[2]), label: cells[0] });
    else if ((match = width.match(/^(\d+)\+$/))) ranges.push({ start: Number(match[1]), end: Infinity, label: cells[0] });
    else add("design-system.md", `responsive width for ${cells[0] || "(unnamed breakpoint)"} must use canonical N-M or N+ syntax`);
  }
  ranges.sort((a, b) => a.start - b.start);
  if (ranges.length > 0) {
    if (ranges[0].start !== 0) add("design-system.md", "responsive coverage must start at 0px");
    for (let i = 1; i < ranges.length; i += 1) {
      if (ranges[i].start !== ranges[i - 1].end + 1) {
        add("design-system.md", `responsive ranges are not contiguous between ${ranges[i - 1].label} and ${ranges[i].label}`);
      }
    }
    if (ranges.at(-1).end !== Infinity) add("design-system.md", "responsive coverage must end with an N+ range");
  } else if (designSystemText) {
    add("design-system.md", "no responsive breakpoint ranges declared");
  }

  /* 5 — requirement declarations. */
  const reqIds = new Set([...requirementsText.matchAll(REQ_ID)].map((m) => m[0]));
  if (reqIds.size === 0) add("requirements.md", "no REQ-nnn identifiers found");

  const withdrawn = new Set();
  const withdrawnSection = requirementsText.split("## Withdrawn")[1] ?? "";
  for (const m of withdrawnSection.matchAll(REQ_ID)) withdrawn.add(m[0]);

  /* 6 — Discovery product-decision traceability. This validates connections, not semantic fidelity. */
  const discoveryFile = path.join(dir, "discovery.md");
  const discoveryText = fs.existsSync(discoveryFile) ? fs.readFileSync(discoveryFile, "utf8") : "";
  if (!discoveryText) add("discovery.md", "approved Discovery is missing; product decisions cannot be traced into requirements");
  const ledger = sectionBody(discoveryText, "## Product decision ledger");
  const discoveryDecisions = new Set();
  for (const line of tableRows(ledger)) {
    const cells = cellsOf(line);
    if (cells[0] === "ID" || cells[0] === "—") continue;
    const id = cells[0] ?? "";
    if (!/^DISC-\d{3}$/.test(id)) {
      if (id) add("discovery.md", `invalid product decision ID ${id}; use DISC-nnn`);
      continue;
    }
    if (discoveryDecisions.has(id)) add("discovery.md", `${id} is declared more than once`);
    discoveryDecisions.add(id);
    if (!cells[1]) add("discovery.md", `${id} has no approved product decision text`);
  }
  if (discoveryText && discoveryDecisions.size === 0) {
    add("discovery.md", "Product decision ledger has no DISC-nnn decisions");
  }

  const reqSources = new Map();
  for (const line of tableRows(requirementsText)) {
    const req = line.match(REQ_ID)?.[0];
    if (!req || withdrawn.has(req)) continue;
    const sourceIds = [...line.matchAll(DISC_ID)].map((m) => m[0]);
    reqSources.set(req, new Set(sourceIds));
    if (sourceIds.length === 0) add("requirements.md", `${req} has no DISC-nnn Source`);
    for (const disc of sourceIds) {
      if (!discoveryDecisions.has(disc)) add("requirements.md", `${req} cites ${disc}, which discovery.md does not define`);
    }
  }
  const citedDecisions = new Set([...reqSources.values()].flatMap((ids) => [...ids]));
  for (const disc of discoveryDecisions) {
    if (!citedDecisions.has(disc)) add("requirements.md", `${disc} is an approved product decision with no owning requirement`);
  }

  /* 7 — human-owned platform actions are durable preconditions, not Builder tasks. */
  const humanActionsSection = sectionBody(designText, "## Human platform actions");
  const humanActions = [];
  for (const line of tableRows(humanActionsSection)) {
    const cells = cellsOf(line);
    if (cells[0] === "ID" || cells[0] === "—") continue;
    if (cells.length < 4) {
      add("design.md", `human-platform-action row has ${cells.length} columns; expected ID, Human-only action, Before phase, Completion proof`);
      continue;
    }
    const [id, action, beforePhase, proof] = cells;
    if (!/^HPA-\d{3}$/.test(id)) add("design.md", `invalid Human platform action ID ${id || "(empty)"}; use HPA-nnn or the explicit None row`);
    if (!PHASES.includes(beforePhase)) add("design.md", `${id} waits for invalid phase ${beforePhase || "(empty)"}`);
    if (!action || !proof) add("design.md", `${id} must name both the human-only action and its completion proof`);
    humanActions.push({ id, action, beforePhase, proof });
  }
  if (authenticationMode === "supabase") {
    const confirmEmailHpa = humanActions.find(({ action, beforePhase }) =>
      beforePhase === "FOUNDATION" && /confirm\s+email/i.test(action) && /(?:disable|disabled|off)/i.test(action));
    if (!confirmEmailHpa) {
      add("design.md", "Supabase Authentication requires a FOUNDATION HPA that disables Confirm Email before Auth work");
    }
  }

  /* 8 — task declarations and requirement links.
     Only table rows are declarations; dependency diagrams may repeat IDs. */
  const taskRows = tableRows(tasksText).filter((line) => line.match(TASK_ID));
  const tasks = new Map();
  const reqsCitedByTasks = new Set();

  for (const line of taskRows) {
    const cells = cellsOf(line);
    if (cells[0] === "ID") continue;
    const idMatch = cells[0]?.match(/^TASK-\d{3}$/);
    if (!idMatch) continue;
    const id = idMatch[0];

    if (tasks.has(id)) {
      add("tasks.md", `${id} is declared more than once`);
      continue;
    }
    if (cells.length < 8) {
      add("tasks.md", `${id} row has ${cells.length} columns; expected 8 task columns`);
      continue;
    }

    const [_taskId, name, requirementsCell, dependsCell, phase, risk, acceptance, status] = cells;
    const linkedReqs = [...requirementsCell.matchAll(REQ_ID)].map((m) => m[0]);
    if (linkedReqs.length === 0) add("tasks.md", `${id} links to no requirement`);
    for (const req of linkedReqs) {
      reqsCitedByTasks.add(req);
      if (!reqIds.has(req)) add("tasks.md", `references ${req}, which requirements.md does not define`);
    }

    if (!PHASES.includes(phase)) add("tasks.md", `${id} has invalid Phase ${phase || "(empty)"}`);
    if (!RISKS.includes(risk)) add("tasks.md", `${id} has invalid Risk ${risk || "(empty)"}`);
    if (status !== "PENDING") add("tasks.md", `${id} must start PENDING before project generation; found ${status || "(empty)"}`);

    const deps = [...dependsCell.matchAll(TASK_ID)].map((m) => m[0]);
    if (deps.includes(id)) add("tasks.md", `${id} depends on itself`);

    tasks.set(id, { phase, risk, deps, name, acceptance });

    const lifecycleText = `${name} ${acceptance}`;
    for (const rule of GLOBAL_LIFECYCLE_TASK_PATTERNS) {
      if (rule.re.test(lifecycleText)) add("tasks.md", `${id}: ${rule.label}`);
    }
    if (HUMAN_ONLY_CONTROL_PLANE_TASK_PATTERNS.some((re) => re.test(lifecycleText))) {
      add("tasks.md", `${id} assigns a human-only platform/control-plane mutation to Builder; record it as design.md HPA-nnn and let the task verify resulting behaviour instead`);
    }
    if (DISPOSABLE_FIXTURE_PATTERN.test(lifecycleText) && !FIXTURE_CLEANUP_PATTERN.test(lifecycleText)) {
      add("tasks.md", `${id} uses disposable test fixtures without explicit cleanup plus final absence/no-residue verification`);
    }
  }

  if (tasks.size === 0) add("tasks.md", "no TASK-nnn declarations found");

  /* MUST coverage. */
  for (const line of tableRows(requirementsText)) {
    const found = line.match(REQ_ID);
    if (!found) continue;
    const id = found[0];
    if (withdrawn.has(id) || !/\bMUST\b/.test(line)) continue;
    if (!reqsCitedByTasks.has(id)) add("tasks.md", `no task covers ${id}, a MUST requirement`);
  }

  for (const phase of PHASES) {
    if (![...tasks.values()].some((task) => task.phase === phase)) {
      add("tasks.md", `fixed phase ${phase} has no task`);
    }
  }

  /* 9 — dependency targets, phase direction and cycles. */
  for (const [id, task] of tasks.entries()) {
    const taskPhase = task.phase;
    for (const dep of task.deps) {
      if (!tasks.has(dep)) {
        add("tasks.md", `${id} depends on undeclared task ${dep}`);
        continue;
      }
      const depTask = tasks.get(dep);
      const depPhase = depTask.phase;
      if (PHASE_ORDER.has(taskPhase) && PHASE_ORDER.has(depPhase) && PHASE_ORDER.get(depPhase) > PHASE_ORDER.get(taskPhase)) {
        add("tasks.md", `${id} in ${taskPhase} depends on later-phase ${dep} in ${depPhase}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  let cycleReported = false;

  const visit = (id, stack) => {
    if (visited.has(id) || cycleReported) return;
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id].join(" -> ");
      add("tasks.md", `task dependency cycle detected: ${cycle}`);
      cycleReported = true;
      return;
    }

    visiting.add(id);
    stack.push(id);
    for (const dep of tasks.get(id)?.deps ?? []) {
      if (tasks.has(dep)) visit(dep, stack);
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of tasks.keys()) visit(id, []);

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
