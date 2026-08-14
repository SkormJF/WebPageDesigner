import { test, expect } from '@playwright/test'
/* Named import, not default. @axe-core/playwright is CommonJS with an ESM
   wrapper; under `module: nodenext` the default import resolves to the module
   namespace and fails to construct. The named export works under both
   resolutions, so this needs no compiler-option workaround. */
import { AxeBuilder } from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'

/* Baseline specs. They prove the stack actually serves and that the shipped
   page has no automatically-detectable accessibility violations.
   Keep them as the project grows -- they are the check that catches a broken
   foundation before a feature spec blames itself for it. */

/* The approved language tag, read from PROJECT.md rather than restated here.
   Restating it would let the two drift, and a copy that drifts silently is
   what a language check is supposed to catch in the first place.

   `rootDir` is the directory holding playwright.config.ts -- the project root
   -- and works under both CommonJS and ESM, which `import.meta.url` and
   `__dirname` do not. */
function approvedLanguageTag(rootDir: string): string {
  const spec = fs.readFileSync(path.join(rootDir, 'PROJECT.md'), 'utf8')
  const match = spec.match(/^[-*]\s*\*\*Language tag:\*\*\s*`?([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)`?/m)
  if (!match) {
    throw new Error(
      'PROJECT.md declares no `- **Language tag:** <BCP-47>` line. The product language is an approved ' +
        'decision and this spec has nothing to check against until it is written down.',
    )
  }
  return match[1]
}

test('serves the root route', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

/* Not `toBeTruthy()`. A truthy check passes on the stack template's shipped
   `lang="en"` for a Spanish product, which is exactly the case that has to
   fail. The value is compared, not merely the presence of one. */
test('declares the approved document language', async ({ page }, testInfo) => {
  const expected = approvedLanguageTag(testInfo.config.rootDir)
  await page.goto('/')
  const lang = await page.locator('html').getAttribute('lang')
  expect(lang, `html[lang] must be the language tag approved in PROJECT.md (${expected})`).toBe(expected)
})

test('root route has no axe violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  /* An axe pass is not an accessibility pass -- it catches a minority of real
     barriers. Keyboard order, focus visibility and reflow are checked by hand
     in the Quality Gate. This spec exists to stop regressions in the part that
     can be automated. */
  expect(results.violations).toEqual([])
})
