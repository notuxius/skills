# Skills Upkeep

Set up, maintain, and update shared coding-agent skills. Audit project skills against the dependency versions each workspace actually uses, and find missing guidance when your team adopts a new library or tool.

## From zero to shared project skills

Imagine your checkout app already uses React and Playwright. It has a lockfile and a signed-in test fixture, but no project skills. Your team wants to share project guidance across its coding agents.

### 1. Install Skills Upkeep

From the checkout app’s root, run this with Node.js 22.20 or later.

```powershell
npx skills add notuxius/skills --skill skills-upkeep --copy
```

Select your team's coding agents when prompted and install at project scope. For scripted installs, pass their CLI IDs with `--agent`. [Supported agents](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)

### 2. Preview and apply the project skills

Open the checkout project in your coding agent and ask for a preview.

> Run skills-upkeep bootstrap report-only. Check our lockfile and how we use React and Playwright. Show which skills you’d install or write.

An example preview might propose these two skills.

| Workflow | Proposed skill | Why |
| --- | --- | --- |
| React development in `apps/web` | Install a reviewed revision of `vercel-react-best-practices` | It covers component performance and parallel data fetching. |
| Playwright testing in `tests/e2e` | Write a local `browser-tests` skill | The team needs to know which signed-in fixture to import and how to run a focused test headlessly. |

Then ask the agent to apply the preview.

> Run skills-upkeep bootstrap apply for the coding agents this project uses. Apply the previewed skills and add the dependency-change rule to our project instructions.

The agent applies the skill changes, records the workspace and resolved package versions in `reviewed.md`, and updates the project instructions so the agents know when to use each skill. [Bootstrap workflow](https://github.com/notuxius/skills/blob/main/skills/skills-upkeep/project-workflow.md#bootstrap)

### 3. Verify the installation

```powershell
npx skills list
```

Check for `skills-upkeep` and the skills selected during bootstrap. Commit the skill files, project instructions, `reviewed.md`, and `skills-lock.json` so teammates get the same setup on checkout.

### 4. Keep project skills up to date

Give your coding agent a normal task.

> Add a Playwright test that checks a signed-in customer can place an order.

The project instructions guide the agent to `browser-tests`, where it finds the team’s fixture and the focused headless test command.

To keep up with dependency changes, ask the agent to check the guidance against the newly locked version after upgrading Playwright.

> Run skills-upkeep dependency-change apply for tests/e2e

## Report a bug, suggest a feature or open a pull request

If Skills Upkeep finds a problem in its own workflow, it includes a copy-ready bug report in the result, even if a workaround succeeds. You can ask it to draft or file an issue, or open a pull request for your skill changes.

> Use Skills Upkeep to draft a feature request for custom skill review intervals.

> Use Skills Upkeep to file a feature request for custom skill review intervals.

> Use Skills Upkeep to open a pull request for these skill changes.

The agent submits to GitHub only when you ask it to publish, using your existing GitHub connection or CLI login. If it can't submit, it gives you a copy-ready title, Markdown body and link for posting. [GitHub workflow](skills/skills-upkeep/github-workflow.md)

To give feedback directly, sign in to GitHub and choose **New issue**. For a bug, describe what happened and how to reproduce it. For a suggestion, explain what you'd like to change and when it would help. [Skills Upkeep issues](https://github.com/notuxius/skills/issues)

The feedback workflow is available starting in `v2.2.0`. If your project install follows the default branch, refresh it from the project root with `npx skills update skills-upkeep --project`.

## Optional usage telemetry

The repository's standalone telemetry helper records usage only when called directly. To use it, run it with Node.js 22.20 or later from the consuming project's root. Set `SKILLS_UPKEEP_TELEMETRY_URL` and run `status` to preview the destination and sample event. Run `enable <endpoint>` to opt in for that checkout or `disable` to revoke consent. [Telemetry helper](telemetry/telemetry.mjs)

```sh
node /path/to/skills/telemetry/telemetry.mjs record apply bootstrap passed
```

Substitute `dependency-change` for that workflow and use `passed`, `failed` or `not_run` for the actual verification result. The event contains the release, workflow, verification result and schema version. `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` blocks sending.

CI requires both `SKILLS_UPKEEP_TELEMETRY=1` and a receiver URL. The repository includes a loopback SQLite receiver for testing and local collection using Node.js 22.20 or later.

```sh
node telemetry/receiver.mjs serve events.sqlite
node telemetry/receiver.mjs report events.sqlite
```

## Install a role skill from the support queue catalog

Choose the roles that fit your work. Each skill can be installed separately from your project's root.

| Role | Skill | Covers |
| --- | --- | --- |
| Frontend developer | `queue-ui` | Queue filters, loading, retries, and stale responses. |
| Backend developer | `queue-api` | Ticket claims, conflict handling, and persisted ownership. |
| QA automation | `queue-aqa` | Regression tests for simultaneous claims and ownership readback. |
| Designer | `queue-design` | Status badges, contrast, and fallback labels. |
| DevOps | `queue-devops` | Deployment checks, release monitoring, and rollback decisions. |
| Technical writer | `queue-docs` | Help articles for support agents working with tickets. |

To install the DevOps and technical writing skills, run this from your project's root and select your coding agents.

```powershell
npx skills add notuxius/skills --skill queue-devops queue-docs --copy
```

## Release ZIP

When a stable `vMAJOR.MINOR.PATCH` release is published, GitHub Actions attaches `skills-upkeep-vMAJOR.MINOR.PATCH.zip` to its [release assets](https://github.com/notuxius/skills/releases). The ZIP contains one `skills-upkeep/` folder with `SKILL.md`, its workflow references, the ledger template, the example report and the license. The support queue `lab/` stays in the repository source archive.

Upload the release ZIP when submitting or updating Skills Upkeep on Agensi. [Agensi packaging guide](https://www.agensi.io/docs/packaging)

## Find Skills Upkeep

You can [buy Skills Upkeep on Agensi](https://www.agensi.io/skills/skills-upkeep) to help build and improve the project, or [find it on skills.sh](https://skills.sh/notuxius/skills/skills-upkeep).

## Skills Upkeep pricing survey

Which would you choose for Skills Upkeep, a monthly subscription or a one-time purchase? Tell us what you’d pay and how likely you’d be to buy at the proposed one-time price of **$5 USD**.

[Reply publicly on GitHub](https://github.com/notuxius/skills/discussions/4) under your GitHub username, or [Answer anonymously in Google Forms](https://docs.google.com/forms/d/e/1FAIpQLSdF1nbzCIxOqb3atj0NxSk5d9f1UiYN7KNUx5CDQyNQFR_dsA/viewform?entry.663372071=5) without signing in. We’ll share anonymous responses in aggregate.
