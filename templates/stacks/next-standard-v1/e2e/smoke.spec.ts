import { test, expect } from "@playwright/test";
/* Named import, not default. @axe-core/playwright is CommonJS with an ESM
   wrapper; a default import resolves to the module namespace and fails to
   construct under stricter module resolutions. The named export works under
   both, so this needs no compiler-option workaround. */
import { AxeBuilder } from "@axe-core/playwright";

/* Baseline specs. They prove the stack actually serves and that the shipped
   page has no automatically-detectable accessibility violations.
   Keep them as the project grows -- they are the check that catches a broken
   foundation before a feature spec blames itself for it. */

test("serves the root route", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("declares a document language", async ({ page }) => {
  await page.goto("/");
  const lang = await page.locator("html").getAttribute("lang");
  expect(lang, "html[lang] must match the product language in PROJECT.md").toBeTruthy();
});

test("root route has no axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  /* An axe pass is not an accessibility pass -- it catches a minority of real
     barriers. Keyboard order, focus visibility and reflow are checked by hand
     in the Quality Gate. This spec exists to stop regressions in the part that
     can be automated. */
  expect(results.violations).toEqual([]);
});
