---
name: vercel-deploy
description: Deploy a generated project to Vercel through the Vercel MCP, and verify with real requests that the deployed site actually works. Use at the DEPLOY and POST_DEPLOY stages, after the Quality Gate has passed and the human has approved a production deploy.
---

# Vercel Deploy

Deploying is the easy half. The half that goes wrong is believing it worked.

A deployment reporting `READY` means Vercel finished a build. It does not mean the site serves, that the
public routes are public, or that the routes you protected are protected. Those are four different claims,
and this skill exists because three of them have failed in practice while the status said `READY`.

---

## The MCP is the path. There is no fallback.

Remote Vercel operations go through the **Vercel MCP**. Not the CLI, not raw API calls, not a script.

**Verify before you act, and verify the capability you actually need.** A server answering is not a grant.
Listing teams can succeed while reading projects returns an empty array and fetching a project by an ID
straight out of local config answers 404 — those are different permissions. Exercise the specific call the
next step depends on.

**If it is not authorized, stop and ask the human to complete it.** They approve the MCP session when Claude
Code prompts. You cannot do it for them, and you should not try.

**No silent CLI fallback.** If the MCP is unavailable, the deploy is blocked. That is the correct outcome,
not an obstacle to route around. An exception needs explicit human approval and stays an exception.

Never invent or persist a secret value. Environment variable **names** may be configured when authorized;
values live where the human put them.

---

## Before deploying

The Quality Gate has passed and the human has approved a production deploy. Separately, and this time.

### Pick the subdomain before creating the project, not after

Vercel appends a random suffix when the clean `<name>.vercel.app` is already taken, and it does so quietly.
Check candidates first:

```bash
curl -sS -D - "https://<candidate>.vercel.app/" -o /dev/null
```

Read `X-Vercel-Error`:

- `DEPLOYMENT_NOT_FOUND` → nobody has claimed it. Free.
- anything else — a `200`, `DEPLOYMENT_DISABLED`, any other error → taken.

Propose two or three, check each, and create or rename the project to the **first available one before the
first production deploy**. That is what lets the clean alias be claimed automatically.

Renaming an existing project does **not** retroactively claim the clean alias. After a rename, assign it
explicitly, or the carefully-checked name is not the one anyone gets.

### Set the framework explicitly

A project created outside the dashboard can end up with `framework: null` in its settings while
`next build` runs and succeeds during the deploy. Vercel's routing layer then does not know how to serve
the output and **every route 404s under a "Build Completed" status**.

```json
{ "$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs" }
```

Confirm the failure mode before assuming this is the cause: build logs clean, runtime logs showing **zero
requests**. Zero requests is the proof — it means the failure is at the edge, before anything reached the
application.

### Push the environment variables

A local env file never reaches Vercel on its own. Push each variable the build needs, by name, through the
MCP.

Build-time-inlined variables (anything the client bundle reads) are baked in at build. If one of them must
be the site's own production URL, expect a throwaway first deploy to learn the assigned domain, correct the
variable, and deploy again — otherwise the build carries a placeholder forever.

### Turn off the default access gate

New Vercel projects enable **Vercel Authentication** by default, which puts every URL — including the
public landing page — behind Vercel's own login. Read the project's deployment protection and disable it
unless the human specifically wants a gated deployment.

This is a default, not a misconfiguration, and it is why the first deploy of a public site answers `302`
rather than `200`.

---

## After deploying — verify, do not assume

`READY` is a build status. These are the checks that tell you whether a site exists.

```bash
# A public route must answer 200 and return real content
curl -s -o /dev/null -w "status=%{http_code}\n" "https://<domain>/"

# A protected route with no session must redirect to the login page
curl -s -o /dev/null -w "status=%{http_code}\n" "https://<domain>/<protected-route>"
```

Expect `200` on public routes, and a `302`/`307` toward the login page on protected ones. That redirect is
the proof that route protection is actually running in production — not merely that pages render.

**When a public route redirects unexpectedly, follow the redirect before concluding the build broke:**

```bash
curl -sS -D - "https://<domain>/" -o /dev/null | grep -i location
```

A `Location` pointing at Vercel's own SSO endpoint means the access gate above is still on. That is a
setting, not a bug in the application, and diagnosing it as a build failure wastes an hour.

Check the routes that matter to this product, not a generic list: the public entry point, one protected
route, and the critical flow's first step. If an integration must be reachable, confirm it is.

---

## Reporting

Give the human the production URL and say what you verified, in those terms.

"The site is live at X. The home page returns 200, `/panel` redirects to the login as expected, and the
contact link opens." That is a report. "Deployment successful" is a status message, and it has been true
while the site was 404ing on every route.

If something failed, say which check failed and what it returned.

---

## Recovering an interrupted deploy

**Inspect the observed remote state before retrying.** Read the project's deployments through the MCP and
find out what actually happened. A retry that assumes the previous attempt failed is how one deploy becomes
two, and how a half-configured project gets a second set of environment variables.
