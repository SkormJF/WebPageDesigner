/**
 * Mechanical Spec Gate.
 *
 * Mechanical Spec Gate PASS + Spec Reviewer PASS + explicit Human Approval
 * = READY_TO_CREATE.
 *
 * This module checks only deterministic contract shape: required files/sections,
 * unresolved placeholders, IDs/references, fixed execution phases, build-group
 * capability/gate/clear rules, initial task status, and dependency validity.
 * Whether the plan is semantically good-sized or faithful to the approved
 * product remains the Spec Reviewer's job.
 *
 *   node scripts/lib/spec-gate.mjs [--dir <path>]
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { paths, SPEC_FILES, ui, parseArgs, parseBackendMode } from "./common.mjs";

const REQUIRED_SECTIONS = {
  "PROJECT.md": ["## Identity", "## What this is", "## Scope", "## Decisions in force"],
  "requirements.md": ["## Functional requirements", "## Non-functional requirements"],
  "design.md": ["## Architecture", "## Routes", "## Backend", "## Human platform actions", "## Security"],
  "design-system.md": ["## Approval", "## Color", "## Typography", "## Interaction states"],
  "tasks.md": ["## Dependency order", "## Build groups", "### Fixed phase ownership"],
};

const PLACEHOLDER_PATTERNS = [
  { label: "unresolved [TBD]", re: /\[TBD/g },
  { label: "unremoved <!-- SLOT: --> guidance", re: /<!--\s*SLOT:/g },
  { label: "[PENDIENTE] marker", re: /\[PENDIENTE/gi },
  { label: "unreplaced [PROJECT_NAME] token", re: /\[PROJECT_NAME\]/g },
];

const REQ_ID = /\bREQ-\d{3}\b/g;
const TASK_ID = /\bTASK-\d{3}\b/g;
const PHASES = ["FOUNDATION", "BUILD_TASKS", "INTEGRATION"];
const PHASE_ORDER = new Map(PHASES.map((phase, index) => [phase, index]));
const CAPABILITIES = ["BASE", "SUPABASE"];
const GATES = ["AUTO", "REVIEW", "DB_REVIEW"];
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

const DB_REVIEW_CONTROL_PLANE_PATTERNS = [
  /\bauth(?:entication)?\s+(?:project\s+)?settings?\b/i,
  /\bauthentication\s+is\s+configured\b/i,
  /\bemail\s+confirmation\b/i,
  /\bsmtp\b/i,
  /\bpassword\s+(?:policy|settings?)\b/i,
  /\bprovider\s+(?:configuration|settings?)\b/i,
  /\bproject\s+settings?\b/i,
  /\bstorage\s+(?:configuration|settings?)\b/i,
  /\bedge\s+function\s+(?:deploy|deployment)\b/i,
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

  /* 5 — requirement declarations. */
  const reqIds = new Set([...requirementsText.matchAll(REQ_ID)].map((m) => m[0]));
  if (reqIds.size === 0) add("requirements.md", "no REQ-nnn identifiers found");

  const withdrawn = new Set();
  const withdrawnSection = requirementsText.split("## Withdrawn")[1] ?? "";
  for (const m of withdrawnSection.matchAll(REQ_ID)) withdrawn.add(m[0]);

  /* 6 — build groups, fixed phases, capability, gate and clear contract. */
  const groupsSection = sectionBody(tasksText, "## Build groups");
  const groupRows = tableRows(groupsSection);
  const groups = new Map();
  let extraClearCount = 0;

  for (const line of groupRows) {
    const cells = cellsOf(line);
    if (cells[0] === "Group") continue;
    if (cells.length < 6) {
      add("tasks.md", `build-group row has ${cells.length} columns; expected Group, Phase, Purpose, Capability, Gate, Clear after`);
      continue;
    }

    const [group, phase, _purpose, capability, gate, clearAfter] = cells;
    if (!group) continue;
    if (groups.has(group)) add("tasks.md", `build group ${group} is declared more than once`);

    const meta = { phase, capability, gate, clearAfter, risks: [] };
    groups.set(group, meta);

    if (!PHASES.includes(phase)) add("tasks.md", `build group ${group} has invalid Phase ${phase || "(empty)"}`);
    if (!CAPABILITIES.includes(capability)) {
      add("tasks.md", `build group ${group} has invalid Capability ${capability || "(empty)"}`);
    }
    if (!GATES.includes(gate)) add("tasks.md", `build group ${group} has invalid Gate ${gate || "(empty)"}`);
    if (!["YES", "NO"].includes(clearAfter)) {
      add("tasks.md", `build group ${group} has invalid Clear after value ${clearAfter || "(empty)"}`);
    }

    if (clearAfter === "YES") {
      if (phase !== "BUILD_TASKS") {
        add("tasks.md", `build group ${group} requests Clear after = YES outside BUILD_TASKS`);
      } else {
        extraClearCount += 1;
      }
    }

    if (capability === "SUPABASE" && backendMode !== "supabase") {
      add("tasks.md", `build group ${group} requires Capability SUPABASE but design.md Backend Mode is not supabase`);
    }
    if (gate === "DB_REVIEW" && capability !== "SUPABASE") {
      add("tasks.md", `build group ${group} uses Gate DB_REVIEW but Capability is not SUPABASE`);
    }
    if (gate === "DB_REVIEW" && backendMode !== "supabase") {
      add("tasks.md", `build group ${group} uses Gate DB_REVIEW but design.md Backend Mode is not supabase`);
    }
  }

  if (groups.size === 0) add("tasks.md", "no build groups declared");
  if (extraClearCount > 1) add("tasks.md", "more than one BUILD_TASKS group requests Clear after = YES");

  for (const phase of PHASES) {
    if (![...groups.values()].some((meta) => meta.phase === phase)) {
      add("tasks.md", `fixed phase ${phase} has no declared build group`);
    }
  }

  /* Human-owned platform actions are durable preconditions, not Builder tasks. */
  const humanActionsSection = sectionBody(designText, "## Human platform actions");
  for (const line of tableRows(humanActionsSection)) {
    const cells = cellsOf(line);
    if (cells[0] === "ID" || cells[0] === "—") continue;
    if (cells.length < 4) {
      add("design.md", `human-platform-action row has ${cells.length} columns; expected ID, Human-only action, Before group, Completion proof`);
      continue;
    }
    const [id, action, beforeGroup, proof] = cells;
    if (!/^HPA-\d{3}$/.test(id)) add("design.md", `invalid Human platform action ID ${id || "(empty)"}; use HPA-nnn or the explicit None row`);
    if (!groups.has(beforeGroup)) add("design.md", `${id} waits for undeclared build group ${beforeGroup || "(empty)"}`);
    if (!action || !proof) add("design.md", `${id} must name both the human-only action and its completion proof`);
  }

  /* 7 — task declarations and requirement links.
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

    const [_taskId, name, requirementsCell, dependsCell, group, risk, acceptance, status] = cells;
    const linkedReqs = [...requirementsCell.matchAll(REQ_ID)].map((m) => m[0]);
    if (linkedReqs.length === 0) add("tasks.md", `${id} links to no requirement`);
    for (const req of linkedReqs) {
      reqsCitedByTasks.add(req);
      if (!reqIds.has(req)) add("tasks.md", `references ${req}, which requirements.md does not define`);
    }

    if (!groups.has(group)) add("tasks.md", `${id} belongs to undeclared build group ${group || "(empty)"}`);
    if (!RISKS.includes(risk)) add("tasks.md", `${id} has invalid Risk ${risk || "(empty)"}`);
    if (status !== "PENDING") add("tasks.md", `${id} must start PENDING before project generation; found ${status || "(empty)"}`);

    const deps = [...dependsCell.matchAll(TASK_ID)].map((m) => m[0]);
    if (deps.includes(id)) add("tasks.md", `${id} depends on itself`);

    tasks.set(id, { group, risk, deps, name, acceptance });

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
    if (groups.has(group)) groups.get(group).risks.push(risk);
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

  /* Every declared group must have work; gate/risk compatibility is mechanical. */
  const taskCountByGroup = new Map();
  for (const task of tasks.values()) {
    if (groups.has(task.group)) taskCountByGroup.set(task.group, (taskCountByGroup.get(task.group) ?? 0) + 1);
  }

  for (const [group, meta] of groups.entries()) {
    if (!taskCountByGroup.has(group)) {
      add("tasks.md", `build group ${group} contains no task`);
      continue;
    }

    const validRisks = meta.risks.filter((risk) => RISKS.includes(risk));
    const allLow = validRisks.length > 0 && validRisks.every((risk) => risk === "LOW");
    const hasNonLow = validRisks.some((risk) => risk !== "LOW");
    const hasCritical = validRisks.includes("CRITICAL");

    if (allLow && meta.gate !== "AUTO") add("tasks.md", `build group ${group} is all LOW and must use Gate AUTO`);
    if (hasNonLow && meta.gate === "AUTO") {
      add("tasks.md", `build group ${group} contains non-LOW work and cannot use Gate AUTO`);
    }
    if (meta.gate === "DB_REVIEW" && !hasCritical) {
      add("tasks.md", `build group ${group} uses Gate DB_REVIEW but contains no CRITICAL task`);
    }

    if (meta.gate === "DB_REVIEW") {
      for (const [taskId, task] of tasks.entries()) {
        if (task.group !== group) continue;
        const reviewText = `${task.name} ${task.acceptance}`;
        if (DB_REVIEW_CONTROL_PLANE_PATTERNS.some((re) => re.test(reviewText))) {
          add(
            "tasks.md",
            `${taskId} places Supabase Auth/project/control-plane configuration inside DB_REVIEW; split it to SUPABASE + REVIEW or an explicit human/platform precondition`,
          );
        }
      }
    }
  }

  /* 8 — dependency targets, phase direction and cycles. */
  for (const [id, task] of tasks.entries()) {
    const taskPhase = groups.get(task.group)?.phase;
    for (const dep of task.deps) {
      if (!tasks.has(dep)) {
        add("tasks.md", `${id} depends on undeclared task ${dep}`);
        continue;
      }
      const depTask = tasks.get(dep);
      const depPhase = groups.get(depTask.group)?.phase;
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
