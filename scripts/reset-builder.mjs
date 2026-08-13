#!/usr/bin/env node
/**
 * reset-builder — return the Builder to IDLE.
 *
 *   node scripts/reset-builder.mjs [--yes]
 *
 * Single responsibility: delete `<builder-root>/.builder/current/`.
 *
 * It takes no path argument, on purpose. A delete script that accepts a target
 * is one typo away from removing something that matters, and there is exactly
 * one directory this is ever allowed to remove. It verifies that the thing it
 * is about to delete is its own, and it is idempotent.
 *
 * It never touches the projects root, templates, skills, config, scripts, or
 * any generated repository.
 */

import fs from "node:fs";
import path from "node:path";
import { BUILDER_ROOT, paths, ui, abort, readJson, parseArgs, rmrf } from "./lib/common.mjs";

const args = parseArgs(process.argv.slice(2));

const target = paths.builderCurrent;
const expected = path.join(BUILDER_ROOT, ".builder", "current");

/* The target is a constant derived from this file's own location, so this can
   only fail if the repository layout moved underneath us -- in which case
   deleting anything is the wrong response. */
if (path.resolve(target) !== path.resolve(expected)) {
  abort("Refusing to delete: resolved target is not the Builder's own .builder/current.", target);
}

if (!fs.existsSync(target)) {
  ui.pass("Already IDLE — .builder/current/ does not exist");
  process.exit(0);
}

/* Report what is about to be lost, by name. "Are you sure?" is not a
   confirmation if it does not say what disappears. */
const statePath = path.join(target, "state.json");
if (fs.existsSync(statePath)) {
  const state = readJson(statePath);
  ui.step("About to delete the active Builder project");
  ui.info(`project: ${state.project_name ?? "(unnamed)"}`);
  ui.info(`slug:    ${state.slug ?? "(none)"}`);
  ui.info(`phase:   ${state.phase ?? "(unknown)"}`);
} else {
  ui.step("About to delete .builder/current/ (no state.json inside)");
}

const files = fs.readdirSync(target);
ui.info(`contents: ${files.join(", ") || "(empty)"}`);

if (!args.yes) {
  console.log(`
Nothing was deleted.

This discards the discovery, the specifications and the visual decisions in
that directory. If the project was handed off, they already live in the
generated repository and this is safe. If it was abandoned mid-planning, they
are gone.

Re-run with --yes to proceed:

  node scripts/reset-builder.mjs --yes
`);
  process.exit(1);
}

rmrf(target);

if (fs.existsSync(target)) {
  abort("Deletion did not complete.", `${target} still exists.`);
}

ui.pass("Builder reset to IDLE — .builder/current/ removed");
