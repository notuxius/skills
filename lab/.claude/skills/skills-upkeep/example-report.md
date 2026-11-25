# Example reports

All paths, versions, candidates, metrics and verification results below are illustrative.

## Bootstrap a work project

**Request:** “Set up project skills for the packages this team uses. Apply the changes.”

The development team already uses a shared validation schema for its forms. The browser tests use a custom signed-in fixture. The project had no topic skills.

| Workspace | Package and workflow | Declared / resolved | Project evidence | Skill decision and check |
|---|---|---|---|---|
| `apps/web` | Zod form validation | `^4.1.0` / `4.1.2` | `apps/web/package.json`, web importer in `pnpm-lock.yaml`, `src/forms/profile/schema.ts` | Created `.agents/skills/form-validation/SKILL.md` from the project's shared-schema convention. Verified its example against the existing profile form and confirmed project discovery. |
| `tests/e2e` | Browser tests with `@playwright/test` | `^1.55.0` / `1.55.1` | `tests/e2e/package.json`, E2E importer in `pnpm-lock.yaml`, `tests/e2e/fixtures/session.ts` | Created `.agents/skills/browser-tests/SKILL.md` documenting the signed-in fixture and the team's locator convention. Verified the fixture import against the existing checkout test and confirmed project discovery. |

## Review a dependency change

**Request:** “Report only. Which skills does this pull request affect?”

Compared the pull request with its merge base. The web workspace's Vitest resolution changed, and the API now imports a package that was already declared.

| Workspace and evidence | Package and change | Declared before → after | Resolved before → after | Skill, outcome and verification |
|---|---|---|---|---|
| `apps/web/package.json`, web importer in `pnpm-lock.yaml` | Vitest patch update | `^4.0.0` → `^4.0.0` | `4.0.1` → `4.0.4` | Reuse `.agents/skills/unit-tests/SKILL.md`. Checked the example's flags against the installed CLI help. The example still applies. |
| `services/api/package.json`, API importer in `pnpm-lock.yaml`, new `services/api/src/jobs/retry.ts` | First direct use of BullMQ | `^2.0.0` → `^2.0.0` | `2.1.0` → `2.1.0` | Uncovered. The existing HTTP retry skill documents a different workflow. The public candidate covers another major. No verified queue skill to recommend. |

The ledger preview contains these two workspace rows. Vitest 4.0.4 is the last verified version for `apps/web`. The minimum supported version is unknown. The recorded check is `npx --no-install vitest --help`, which showed the flags used in the skill. The run made no project changes.

## Review a setup change

**Request:** “Run setup-change report-only for the API and preserve our project rules.”

Local development switched from starting PostgreSQL with `docker run` to using Docker Compose. The `pnpm-lock.yaml` file is unchanged. GitHub Actions still starts PostgreSQL as a service container. [Docker Compose startup](https://docs.docker.com/reference/cli/docker/compose/up/) · [GitHub Actions service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)

| Workspace and environment | Setup and rule evidence | Skill decision | Verification |
|---|---|---|---|
| `services/api`, local development | `docs/local-development.md` now uses `docker compose up --wait postgres`. `compose.yaml` defines the service health check. | Reopen `api-development` even though the ledger shows a recent review. Use the Compose command in the startup example and keep the readiness check. | Confirmed the configured command and health check by inspection. A background API smoke check is pending. |
| `services/api`, CI | `.github/workflows/integration.yml` still defines a PostgreSQL service container. | Keep the CI startup instructions for the service container. | Confirmed the CI configuration by inspection. |

The report-only run previews the skill edit and ledger evidence for the local setup change. The branch, checkout and ledger are unchanged.

## Review a shared skill after a breaking change

ESLint 9 makes flat config the default. The `linting` skill now tells agents which config each workspace uses, based on its resolved version and config files. [ESLint 9 migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)

| Workspace | Resolved version | Minimum supported | Last verified version | Verification |
|---|---|---|---|---|
| `apps/admin` | `8.57.1` | Unknown for this workspace's `.eslintrc.cjs` | `8.57.1` | `pnpm exec eslint src` passed with the existing `.eslintrc.cjs`. |
| `apps/web` | `8.57.1` → `9.0.0` | `9.0.0` for flat config by default | `9.0.0` | `pnpm exec eslint src` passed with `eslint.config.js`. A run with only the legacy config failed to find a flat config. |

## Vendored skill health check

| Skill | Reviewed | Next due | Synced from |
|---|---|---|---|
| `adopt-rtk-query` | 2026-11-25 | 2027-02-23 | `@reduxjs/toolkit@2.12.0` |
| `playwright-cli` | 2026-11-25 | 2027-02-23 | `@playwright/cli@0.1.22` |

Read the `version` field in the installed `@reduxjs/toolkit` and `@playwright/cli` packages' `package.json` files. Use the installation that supplies each skill. [Redux Toolkit bundled skills](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.12.0) · [Playwright CLI skills](https://playwright.dev/docs/getting-started-cli#installing-skills)

From the project root, pass those versions to the checker. Adjust the helper path for your installation.

```sh
node .agents/skills/skills-upkeep/check-ledger.mjs .agents/skills/reviewed.md '@reduxjs/toolkit@2.13.0' '@playwright/cli@0.1.22'
```

The check reports `re-sync due` for `adopt-rtk-query` because the installed Redux Toolkit version has changed. The Playwright CLI version matches its recorded source.

## Use a skill during implementation

**Request:** “Add a checkout test for a signed-in customer.”

Used `.agents/skills/browser-tests/SKILL.md` for `tests/e2e/checkout.spec.ts`, imported the team's signed-in fixture, and located the order button by its accessible role and name. The focused checkout test passed.

## Audit against public skills

**Mode:** Report-only.

```
Updated
(none: report-only)

Not updated
| Skill | Reason |
| playwright-patterns | Candidate has nothing ours lacks; ours covers the project's locator rule |
| ci-cd | Candidate is GitHub-only; ours targets GitLab |
| vitest-react-testing | Verify the setup section against the installed Vitest major before proposing an edit |
| typescript-build | A newer upstream revision is available for review |

Not covered
| Skill | Why it was out of scope |
| deploy-runbook | Project workflow |
| api-testing | Skipped by the CLI: YAML parse error at line 13 (fix the frontmatter first) |
| k6-performance-testing | Deferred by budget (15 skills per pass) |

Version drift (to confirm)
| Skill | Tool | Skill says | Repo has | Proposed action |
| vitest-react-testing | Vitest | "Vitest 3" in the setup section | 4.0 (lockfile) | Search with "vitest 4"; Update if a fitting candidate exists |

Installed skills with newer upstream (not updated)
| Skill | Source | Recorded commit | Remote head |
| typescript-build | example-org/typescript-skills | a1b2c3d | f4e5d6c |

Proposed replacements (not applied)
| Local skill | Candidate | What it does better | Local rules to keep | Installs / stars / licence | Migration plan |
| code-review | example-org/code-review@skill | Severity scale and a coverage note | Our severity labels, "tests first" rule | 12K / 3.1K / MIT | Install under another name, move our rules into a short overlay, remove the old skill after you confirm |

Proposed new skills (not installed)
| Topic | Evidence in repo | Candidate | Installs / stars / licence | Install command |
| Tailwind CSS utilities | `apps/web/package.json` declares `tailwindcss` v4 and no skill covers it | example-org/tailwind-skills@tailwind-v4 | 4.2K / unverified / MIT | npx skills add example-org/tailwind-skills --skill tailwind-v4 |
```

The ledger records how each relevant audit finding affected the decision. For example, a provider warned that `example-org/code-review@111aaaa` sends data to an external URL. The reviewer checked the cited file and its helper scripts at `example-org/code-review@222bbbb` and found the external call had been removed. The ledger links the warning, records both revisions and explains why the warning did not block the replacement proposal. Stars for `example-org/tailwind-skills` are unverified.

```
Reviewed: 5 | Updated: 0 | Pointer: 0 | Supersede proposed: 1 | No change: 4 | Not covered: 3 | Gaps proposed: 1 | Branch: report-only | Confidence: Medium
```
