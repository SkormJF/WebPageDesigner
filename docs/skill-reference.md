# Skill Reference

## How Skills Work
Skills are markdown files that Claude Code reads automatically. This project bundles **22 skills** in `.claude/skills/` — they all load automatically when Claude opens the project.

---

## Bundled Skills (included in this project, load automatically)

| Skill | Location | What It Does |
|-------|----------|-------------|
| `frontend-design` | `.claude/skills/frontend-design/` | Design methodology, anti-AI-slop rules, typography/color/layout/motion guidelines. Includes 7 reference docs. |
| `shadcn-ui` | `.claude/skills/shadcn-ui/` | React component library with Tailwind CSS. Copy-paste accessible components. |
| `humanizalo` | `.claude/skills/humanizalo/` | Removes AI writing patterns from text. 40-pattern detection, personality injection, 6-dimension scoring, self-audit loop. |
| `vercel-react-best-practices` | `.claude/skills/vercel-react-best-practices/` | 62 performance rules across 8 categories for React/Next.js. Includes full AGENTS.md + 64 rule files. |
| `vercel-deploy` | `.claude/skills/vercel-deploy/` | **Deploy to Vercel sandbox** — no account or CLI needed. Includes `deploy.sh` script that auto-detects framework, packages, and deploys. MIT licensed by Vercel. |
| `building-components` | `.claude/skills/building-components/` | Guide for building modern, accessible, composable UI components. Includes 15 reference docs covering accessibility, composition, polymorphism, design tokens, and more. |
| `web-design-guidelines` | `.claude/skills/web-design-guidelines/` | Review UI code against Vercel's Web Interface Guidelines. Fetches latest rules and audits compliance. |
| `playwright-cli` | `.claude/skills/playwright-cli/` | Browser automation for screenshots and visual QA. Includes 7 reference docs. |
| `chrome-bridge-automation` | `.claude/skills/chrome-bridge-automation/` | Fallback visual QA — connects to user's Chrome via Midscene extension. Vision-driven screenshots. |
| `seo-audit` | `.claude/skills/seo-audit/` | Technical SEO analysis, meta tags, heading structure. |
| `ui-ux-pro-max` | `.claude/skills/ui-ux-pro-max/` | Design intelligence database — 161 color palettes, 73 font pairings, 50+ styles. Python CLI for search. |
| `web-reader` | `.claude/skills/web-reader/` | Analyze a reference URL the user provides — palette, typography, layout, component patterns — via `WebFetch` plus a `playwright-cli` screenshot. |
| `deep-research` | `.claude/skills/deep-research/` | Systematic web research for industry-specific copy and content. |
| `emil-design-eng` | `.claude/skills/emil-design-eng/` | UI polish & animation craft — Emil Kowalski's philosophy on micro-interactions and invisible details. |
| `design-taste-frontend` | `.claude/skills/design-taste-frontend/` | Anti-LLM-bias rules for React/Next.js — metric-based typography, spacing, and component architecture. |
| `full-output-enforcement` | `.claude/skills/full-output-enforcement/` | Prevents truncated code output — enforces complete file generation, bans placeholder patterns. |
| `imagegen-frontend-web` | `.claude/skills/imagegen-frontend-web/` | Generates design reference images for Round 4's visual approval conversation in Phase 1 — 1-2 to start (hero + one section with visible components), more later once sections are defined. |
| `redesign-existing-projects` | `.claude/skills/redesign-existing-projects/` | Structured audit + targeted upgrade workflow for Phase 5 iteration and polish. |
| `performance-audit` | `.claude/skills/performance-audit/` | Systematic, grep-verified performance audit — duplicate auth checks, un-optimized bundle imports, dead dependencies, sequential queries. Runs automatically in Phase 5, after build. |
| `pre-deploy-verification` | `.claude/skills/pre-deploy-verification/` | Mandatory pass before a real production deploy: E2E with disposable accounts through the real UI, security review with an explicit verdict (Full-Stack only), subdomain availability check before naming, and real-HTTP verification after deploy. See Phase 6. |
| `staged-app-builder` | `.claude/skills/staged-app-builder/` | Plans a large Full-Stack Extension backend (3+ related entities, cross-entity logic, or a detailed spec) as dependency-ordered phases tracked in `PROJECT-BRIEF.md`, with a per-phase verification bar and this stack's known gotchas. See Phase 3.5. |
| `navigation-shell` | `.claude/skills/navigation-shell/` | Headers, sticky/scroll behavior, mobile menus, dashboard sidebars, and the app shell. Covers WCAG 2.2 SC 2.4.11 / 2.5.7 / 1.4.13, the `position: sticky` failure modes, and the three gaps shadcn's `sidebar` leaves unfilled. |

All 22 skills are bundled — no installation needed.

---

## Invocation Examples

### vercel-deploy (bundled) — DEPLOY WITHOUT ACCOUNT
The primary deployment method. No Vercel account, CLI, or login needed.

```bash
# Deploy the site directory
bash .claude/skills/vercel-deploy/scripts/deploy.sh site
```

The script:
1. Auto-detects the framework from `package.json` (Next.js, Gatsby, Remix, Astro, etc.)
2. Creates a tarball (excludes node_modules, .git, .next, .env)
3. Uploads to Vercel's deploy endpoint
4. Polls until build completes (up to 5 minutes)
5. Returns JSON with `previewUrl` and `claimUrl`

**Output:** Share `previewUrl` with user. Mention `claimUrl` as optional for permanent hosting.

**Always run `npm run build` first** to catch errors before deploying.

If the Vercel CLI is installed and authenticated, you can also use: `cd site && npx vercel --yes`

### building-components (bundled)
Automatically loaded. Provides guidance when building UI components during Phase 4:
- Component taxonomy (primitives, components, blocks, templates)
- Accessibility patterns (ARIA, keyboard navigation, focus management)
- Composition patterns (slots, render props, controlled/uncontrolled state)
- Design token systems and theming
- Data attributes for styling and state

### web-design-guidelines (bundled)
Use during Phase 5 (QA) to review the built page against Vercel's Web Interface Guidelines.
Fetches the latest guidelines from GitHub and checks UI code for compliance.

### humanizalo (bundled)
The humanizalo skill loads automatically. Invoke it after writing any copy (headlines, body text, CTAs, taglines):
- Detects 40 AI writing tells across 5 categories: content inflation, vocabulary, structure, formatting, and communication artifacts (full list in `.claude/skills/humanizalo/SKILL.md`)
- Injects personality per its Soul guidelines — opinions, varied rhythm, first person where natural — since voiceless text is itself the biggest tell
- Scores the draft on 6 dimensions (directness, rhythm, trust, authenticity, density, soul) against a 42/60 threshold
- Runs a self-audit loop (draft → self-interrogation → rewrite) for up to 3 iterations until the score passes
- Check all text for banned words: delve, tapestry, landscape, foster, showcase, vibrant, nestled, leverage, innovative, cutting-edge, game-changing, seamless, empower, harness

### seo-audit (bundled)
Run after the page is built, during Phase 5 (Preview & QA), before deployment.
The skill checks:
- Title tags (50-60 chars, keyword near start)
- Meta descriptions (150-160 chars, unique, includes CTA)
- Heading hierarchy (one H1, proper H2/H3 order)
- Image alt text (descriptive, not just filename)
- Core Web Vitals indicators
- Mobile readiness
- Structured data opportunities (JSON-LD for rich snippets)

### ui-ux-pro-max (bundled)

**Available `--domain` values:**

| Domain | What It Returns | Example Query |
|--------|----------------|---------------|
| `product` | Product type recommendations (SaaS, e-commerce, portfolio, etc.) | `"saas dashboard"` |
| `style` | UI styles (glassmorphism, minimalism, brutalism, etc.) + CSS keywords | `"luxury minimal"` |
| `typography` | Font pairings with Google Fonts imports | `"elegant serif"` |
| `color` | Color palettes by product type and mood | `"restaurant warm"` |
| `landing` | Landing page structure and CTA strategies | `"saas"` |
| `chart` | Chart types and library recommendations | `"financial dashboard"` |
| `ux` | Best practices and anti-patterns | `"form design"` |

**Available `--stack` values:** `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

```bash
# Color palette for a restaurant
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "restaurant warm" --domain color

# Font pairing for elegant vibe
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "elegant serif" --domain typography

# Landing page structure for SaaS
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "saas" --domain landing

# UI style recommendations for luxury brand
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "luxury brand" --domain style

# Stack-specific recommendations for Next.js + shadcn
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "modern clean" --stack shadcn
```

### playwright-cli (bundled)
```bash
# Open browser and navigate
playwright-cli open http://localhost:3000

# Take desktop screenshot
playwright-cli screenshot --filename=preview-desktop.png

# Resize to mobile and screenshot
playwright-cli resize 375 812
playwright-cli screenshot --filename=preview-mobile.png

# Resize to tablet
playwright-cli resize 768 1024
playwright-cli screenshot --filename=preview-tablet.png

# Close browser
playwright-cli close
```

### web-reader (bundled)
Use when the user provides reference URLs they like the look of.
```
Invoke by telling Claude to use the web-reader skill to analyze a URL.
Example: "Use web-reader to analyze https://example.com and note its
colors, layout approach, typography, and overall design direction."
```
It pairs `WebFetch` (structure, copy, section order, whatever CSS is inline) with a `playwright-cli` screenshot (what actually renders, at desktop and mobile width) — neither alone tells you what a site looks like. Output is concrete values for Phase 2: hex codes, font families, layout rhythm. It always separates what the reference does from what's worth borrowing.

### deep-research (bundled)
Use when you need industry-specific knowledge for writing better copy or making design decisions.
```
Invoke by telling Claude to use deep-research for a specific topic.
Example: "Use deep-research to learn about the artisan bakery market —
what messaging resonates, what competitors look like, what customers care about."
```
Returns systematic findings from multiple sources — better than a single web search.

### emil-design-eng (bundled)
Loads automatically during Phase 4 (Build) for animation and micro-interaction polish.
- Guides easing curves, spring physics, transform choices, clip-path reveals, and gesture feedback
- Encodes Emil Kowalski's philosophy: motion should feel invisible, not decorative
- Use when refining hover states, page transitions, or any Framer Motion animation

### design-taste-frontend (bundled)
Loads automatically during Phase 4 (Build) to counter default LLM design biases.
- Enforces metric-based rules for typography scale, spacing, and component architecture
- Anti-slop checks: no generic card grids, no centered-everything layouts, no AI color palette
- Use alongside `frontend-design` for a second pass on visual judgment calls

### full-output-enforcement (bundled)
Loads automatically during Phase 4 (Build) to prevent truncated files.
- Bans placeholder patterns like `// ... rest of the code` or `/* TODO: implement */`
- If a file is too large for one response, uses the `[PAUSED — X of Y complete]` protocol to continue cleanly instead of silently cutting code
- Enforces complete, unabridged file generation every time

### imagegen-frontend-web (bundled)
Use during Phase 2 (Design System) when the user wants generated reference images instead of only text direction.
- Produces one design-reference image per page section (hero, features, testimonials, etc.)
- Applies anti-AI-slop composition rules and a combinatorial variation engine so sections don't look repetitive
- Useful before Phase 4 to align on visual direction with actual imagery, not just descriptions

### redesign-existing-projects (bundled)
Use during Phase 5 (Preview & QA) when the user wants to upgrade an existing site instead of building from scratch.
- Structured audit: typography, color, layout, interactivity, content, and component-level review
- Produces a fix-priority order so improvements are applied in a sensible sequence
- Works with any CSS framework or vanilla CSS — doesn't require a rebuild
