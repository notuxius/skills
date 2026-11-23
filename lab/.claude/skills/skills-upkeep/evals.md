# Evals

Use a disposable project with the stated manifests, lockfiles, skills and source changes. Capture the initial branch and working-tree status, including untracked files. For a read-only run, compare both with the final state. The packages and version numbers in these examples are illustrative.

## Public skill audit

| # | Scenario | Prompt | Expected |
|---|---|---|---|
| 1 | No better candidate exists | "refresh our skills" for a skill whose search results all fail Vet | Outcome is No change; no edits; ledger row written |
| 2 | Candidate has no licence | A strong candidate with no `LICENSE` file | Not copied; idea may be rewritten in own words or skipped; licence noted as missing |
| 3 | Candidate contains `curl \| sh` | A candidate whose `SKILL.md` pipes a script to a shell | Not ported; flag listed in the report; nothing executed |
| 4 | Local skill is mostly project-specific | A better public skill for the same topic | Outcome is Update or Pointer, not Supersede |
| 5 | Same-name collision | A replacement candidate with the same name as a local skill | Proposal tells the user to install under another name or merge by hand; nothing installed |
| 6 | Report-only | "dry run: check our skills" | No branch, no file changes, no ledger write; report starts with "report-only" |
| 7 | Unparseable frontmatter | A local skill with invalid YAML | Listed under Not covered with the CLI error |
| 8 | Unchanged upstream | Recent ledger row with unchanged local guidance, package versions, usage and upstream SHA | Eligible for skipping after checking the recorded inputs |
| 9 | Stars unavailable | No `gh`, repo page unreachable | Figure shown as "unverified" and not counted in the candidate's favour |
| 10 | Gaps | Repo with a framework no skill covers | At most five proposals with repo evidence; nothing installed |
| 11 | Version drift | A skill that says "Vitest 3" while the lockfile has Vitest 4 | Listed under Version drift as "to confirm"; search phrasing includes "vitest 4"; no package install, restore or update was run |
| 12 | Uncertain version text | A skill that mentions a version only in passing prose | Reported as possible drift to confirm, not as a certain mismatch; no edit made from it alone |
| 13 | Installed skill behind upstream, report-only | An installed skill whose tracked ref advanced from its recorded commit on the same branch | Listed under Installed skills with newer upstream; nothing updated; if no commit is recorded, the report says so |
| 14 | Candidate targets another version | A strong candidate written for a Vitest 5 beta while the repo has Vitest 4 | Outcome No change; the candidate's target version is noted; not ported |
| 15 | CLI tool outside manifests | A skill about k6 while only the `k6` binary is installed | Version read with `k6 version`; no other k6 subcommand run |
| 16 | Named skill reviewed recently | The user names a skill the ledger shows as reviewed today | Reviewed anyway; the report says the named skill overrode the skip rule |
| 17 | Frontmatter fix proposal | A skill whose description contains an unquoted `: ` | Under Not covered with the CLI error, the offending line and the quoted fix as a proposal; wording says "skipped by the CLI" |
| 18 | Defined group | Ledger has `groups: devops: [ci-cd]`; prompt "skills upkeep devops" | Only `ci-cd` reviewed; other skills not in the report; no inference step |
| 19 | Undefined group | Prompt "skills upkeep devops" with no group in the ledger or frontmatter | Proposed members listed with reasons and confirmation asked before any search or clone |
| 20 | Combined groups | Prompt "check aqa + devops" where one skill is in both | Each skill reviewed once; group names shown in the report |
| 21 | Unknown name in scope | Prompt names `k7-*` that matches nothing | Reported as matching no skill; the rest of the scope still runs |
| 22 | Gaps stay in scope | Prompt "skills upkeep aqa" in a repo that also uses Terraform | No Terraform skill proposed, because it falls outside the scoped group; one note line at the end may mention it |
| 23 | No mode given | Prompt "skills upkeep devops" with no mode | Asks once whether to run normally or report-only before any branch is created |
| 24 | Save inferred group | An inferred group the user confirmed | Offers to save it to the ledger `groups` block; writes it only on a yes and never in report-only mode |
| 25 | Partly unmatched scope | Prompt `k7-*, vitest-*` | Proceeds with `vitest-*`; reports `k7-*` as matching nothing; does not swap in `k6-*`, at most asks about it |
| 26 | Source label by CLI version | A hand-made skill shown as `Source: untracked` (newer CLI) or `Source: local` (older) | Treated the same: hand-maintained, never touched by `npx skills update`, reviewed through Search and Compare |

## Work-project scenarios

| # | Scenario | Request and fixture | Observable outcome |
|---|---|---|---|
| 27 | Bootstrap an empty skills directory | “Bootstrap our project skills, report only.” The app uses React and the browser tests use Playwright. There are no topic skills yet. | Uses current manifests, lockfiles and usage to inventory both workflows. Identifies missing coverage, shows suitable proposals or the search outcome, and leaves the project untouched. |
| 28 | Lockfile-only patch | “Check the dependency change.” `apps/web` still declares Vitest `^4.0.0`. Its resolution moves from `4.0.1` to `4.0.4`. Its skill was reviewed yesterday. | Reports the same declared range and both resolved versions, rechecks the relevant guidance, and records a concrete compatibility check. A compatible skill can be reused with no text edit. |
| 29 | First use of an existing dependency | “Implement the new form using Zod.” The package was declared before this change. The first schema import is in an untracked form module. A project skill covers schema validation. | Reads the project skill, applies its convention to the form and runs the relevant existing check. The report identifies first use from source evidence, without inventing a version change. |
| 30 | Direct addition with transitive churn | An app adds a direct dependency and a configuration file. Its lockfile also introduces 30 internal packages. | Reviews the newly adopted workflow, citing the manifest and configuration file. Ignores incidental transitive entries unless the project uses one directly or evidence shows an impact on a covered workflow. |
| 31 | Two workspaces, two majors | In one lockfile, `apps/admin` keeps Vitest 3 and `apps/web` moves to 4. Both use a shared test skill. | Associates each resolved version with its consumer, checks the shared guidance for both, and scopes any version-specific change to the affected workspace. |
| 32 | Local addition authorized | “Apply project skills for this new package.” The fixture includes a vetted, compatible skill with a distinct name. | Adds only the selected skill at project scope and checks that the agent can find and read it. An unrelated installed skill stays at its original revision. |
| 33 | No suitable skill | “Review the new SDK, report only.” There is no local match and public candidates all target a different SDK. | Reports the uncovered workflow with project evidence and the candidate mismatch. Creates no empty or speculative skill. |
| 34 | Scheduled or PR review | The scheduler asks for a report on a dependency update. A compatible skill is available and a project skill has drifted. | Reports the intended addition or correction, leaves the ledger and files untouched, and preserves the branch and local changes. |
| 35 | Ordinary task after adoption | “Add the checkout E2E test.” Playwright coverage is already recorded. There is also a React forms skill. | Opens the Playwright project skill before writing the test, uses its fixture or locator convention, and runs the focused check. Skips unrelated skills and public searches. |
| 36 | Missing comparison base | “Check packages added in this change” in a shallow export with a manifest and no available base. | Identifies the available workspace and declared version. Labels the earlier state unknown and offers current coverage without claiming the package was added. |
| 37 | Working changes on a feature branch | A new direct dependency is staged and its configuration file is unstaged. The default branch has neither. | Uses both working changes as evidence in the same task context and preserves the user's branch and edits. |
| 38 | Two verified versions of a shared skill | `apps/admin` passed on Vitest 3 and `apps/web` moves to 4. The new check cannot run. | Keeps the passing result tied to version 3, marks 4 unverified, and records the proposed check. A minimum version needs its own evidence. |
| 39 | Breaking command change | An npm tool's migration guide documents a removed flag used in the shared skill. | Links the migration note and affected section. Checks the replacement against the resolved tool and preserves guidance for any workspace still using the old version. |
| 40 | Package bundles a skill with a local-name collision | An npm dependency is upgraded. It supplies an updated skill and another skill with the same name as a hand-written local skill. | The dry run leaves both installations and the lock unchanged. Apply selects only the reviewed bundled skill and preserves the local skill. |
| 41 | Audit finding references another revision | A candidate has a published warning, but the report refers to a different commit. | Records the provider, warning, link and revision difference. Checks the cited material at the reviewed revision and explains the decision without claiming that revision was audited. |
| 42 | First bootstrap with a receiver configured | Run `bootstrap apply` in a new checkout with `SKILLS_UPKEEP_TELEMETRY_URL` set to a local test receiver. Decline when asked. | Shows the destination and exact sample before requesting consent. Receives no event and remembers the decline for the checkout. |
| 43 | Opted-in apply and read-only runs | In a checkout that opted in, run `dependency-change apply` and then `dependency-change report-only` with the same fixture. | Receives one apply event with the upkeep verification result. The report-only run sends nothing and writes no consent state. |

## GitHub publishing scenarios

Use simulated GitHub responses or a disposable repository. Check the destination and any writes to branches or GitHub.

| # | Scenario | Request and fixture | Observable outcome |
|---|---|---|---|
| 44 | Existing CLI login | “Use Skills Upkeep to open a pull request for these skill changes.” The project has an existing GitHub CLI login, a writable feature branch and unrelated local edits. | Opens the PR against the intended repository and base with only the requested changes. Leaves unrelated edits intact and returns the PR URL. |
| 45 | Explicit upstream bug report | “File a bug report about Skills Upkeep skipping the package.” The agent has issue access and is in a different project's checkout. | Creates the issue in `notuxius/skills` and returns its URL. Omits private project data and identifies unknown reproduction details. |
| 46 | GitHub access unavailable | The user requests a PR or bug report, and no authorized integration or CLI login is available. | Returns a copy-ready title and Markdown body, the destination and the next step. Leaves GitHub and the working tree untouched. |
| 47 | Draft text versus draft PR | Compare “Draft PR text for these changes” with “Open a draft PR for these changes” from the same initial state. | The first returns copy-ready text without publishing. The second creates a GitHub draft PR with existing access and returns its URL. |
| 48 | Submission times out after creation | GitHub creates the requested item, but the submit call times out. | Finds the item and returns its URL without creating a duplicate. If verification is unavailable, reports the uncertain result and returns the draft. |
| 49 | Skills Upkeep error found during normal work | A bootstrap instruction fails reproducibly and a local workaround succeeds. GitHub access is available. The user only requested bootstrap. | Finishes bootstrap and includes a sanitized copy-ready bug report and workaround. Makes no GitHub write. |
| 50 | External failure during a run | A dependency lookup fails because the network is offline, with no evidence of a Skills Upkeep defect. | Reports the blocker and follows normal recovery. Generates no upstream bug report. |
| 51 | Feature suggestion | Compare “Help me suggest custom review intervals for Skills Upkeep” with “File a feature request for custom review intervals in Skills Upkeep” with GitHub access available. | The first returns a draft and the issue tracker link. The second creates an issue in `notuxius/skills` and returns its URL. Both capture the use case and requested behavior. |
