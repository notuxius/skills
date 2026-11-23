# Example reports

All paths, versions, candidates, metrics and verification results below are illustrative.

## Bootstrap a work project

**Request:** “Set up project skills for the packages this team uses. Apply the changes.”

The development team already uses a shared validation schema for its forms. The browser tests use a custom signed-in fixture. The project had no topic skills.

| Workspace | Package and workflow | Declared / resolved | Project evidence | Skill decision and check |
|---|---|---|---|---|
| `apps/web` | Zod form validation | `^4.1.0` / `4.1.2` | `apps/web/package.json`, web importer in `pnpm-lock.yaml`, `src/forms/profile/schema.ts` | Created `.agents/skills/form-validation/SKILL.md` from the project's shared-schema convention. Verified its example against the existing profile form and confirmed project discovery. |
| `tests/e2e` | Playwright browser tests | `^1.55.0` / `1.55.1` | `tests/e2e/package.json`, E2E importer in `pnpm-lock.yaml`, `tests/e2e/fixtures/session.ts` | Created `.agents/skills/browser-tests/SKILL.md` documenting the signed-in fixture and the team's locator convention. Verified the fixture import against the existing checkout test and confirmed project discovery. |

## Review a dependency change

**Request:** “Report only. Which skills does this pull request affect?”

Compared the pull request with its merge base. The web workspace's Vitest resolution changed, and the API now imports a package that was already declared.

| Workspace and evidence | Package and change | Declared before → after | Resolved before → after | Skill, outcome and verification |
|---|---|---|---|---|
| `apps/web/package.json`, web importer in `pnpm-lock.yaml` | Vitest patch update | `^4.0.0` → `^4.0.0` | `4.0.1` → `4.0.4` | Reuse `.agents/skills/unit-tests/SKILL.md`. Checked the example's flags against the installed CLI help. The example still applies. |
| `services/api/package.json`, API importer in `pnpm-lock.yaml`, new `services/api/src/jobs/retry.ts` | First direct use of BullMQ | `^2.0.0` → `^2.0.0` | `2.1.0` → `2.1.0` | Uncovered. The existing HTTP retry skill documents a different workflow. The public candidate covers another major. No verified queue skill to recommend. |

The ledger preview contains these two workspace rows. Vitest 4.0.4 is the last verified version for `apps/web`. The minimum supported version is unknown. The recorded check is `npx --no-install vitest --help`, which showed the flags used in the skill. The run made no project changes.

## Review a shared skill after a breaking change

The queue reporting package's v2 migration note replaces `--format json` with `--output json`. The `Export a queue report` section of `queue-report/SKILL.md` now selects the flag from each workspace's lockfile. Running the commands from the two workspaces produced this ledger evidence.

| Workspace | Resolved version | Minimum supported | Last verified version | Verification |
|---|---|---|---|---|
| `apps/admin` | `1.0.0` | `1.0.0` for `--format`, documented in the v1 CLI reference | `1.0.0` | `node queue-fixture.mjs report --format json` passed |
| `apps/web` | `1.0.0` → `2.0.0` | `2.0.0` for `--output`, introduced in the v2 migration note | `2.0.0` | `node queue-fixture.mjs report --output json` passed and `--format json` failed with the expected unsupported flag error |

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
| example-skill | A newer upstream revision is available for review |

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
| example-skill | example-org/example-skills | a1b2c3d | f4e5d6c |

Proposed replacements (not applied)
| Local skill | Candidate | What it does better | Local rules to keep | Installs / stars / licence | Migration plan |
| code-review | example-org/code-review@skill | Severity scale and a coverage note | Our severity labels, "tests first" rule | 12K / 3.1K / MIT | Install under another name, move our rules into a short overlay, remove the old skill after you confirm |

Proposed new skills (not installed)
| Topic | Evidence in repo | Candidate | Installs / stars / licence | Install command |
| EF Core migrations | `*.csproj` references EF Core, no skill covers it | example-org/dotnet-skills@ef-migrations | 4.2K / unverified / MIT | npx skills add example-org/dotnet-skills@ef-migrations |
```

The ledger records how each relevant audit finding affected the decision. For example, a provider warned that `example-org/code-review@111aaaa` sends data to an external URL. The reviewer checked the cited file and its helper scripts at `example-org/code-review@222bbbb` and found the external call had been removed. The ledger links the warning, records both revisions and explains why the warning did not block the replacement proposal. Stars for `example-org/dotnet-skills` are unverified.

```
Reviewed: 5 | Updated: 0 | Pointer: 0 | Supersede proposed: 1 | No change: 4 | Not covered: 3 | Gaps proposed: 1 | Branch: report-only | Confidence: Medium
```
