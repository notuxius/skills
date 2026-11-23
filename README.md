# Skills Upkeep — **From Zero to Shared Project Skills**

Imagine your checkout app already uses React and Playwright. It has a lockfile and a signed-in test fixture, but no project skills. Your team uses Codex, Claude Code, and GitHub Copilot.

## 1. Install Skills Upkeep

From the checkout app’s root, run this with Node.js 22.20 or later.

```powershell
npx skills add notuxius/skills-upkeep --skill skills-upkeep --agent codex claude-code github-copilot --copy
```

Codex and GitHub Copilot share `.agents/skills/`. Claude Code gets a copy in `.claude/skills/`. The Skills CLI requires `claude-code` as the agent ID. [Supported agents](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)

## 2. Preview and apply the project skills

Open the checkout app in any of the three agents and ask for a preview.

> Run skills-upkeep bootstrap report-only. Check our lockfile and how we use React and Playwright. Show which skills you’d install or write.

An example preview might propose these two skills.

| Workflow | Proposed skill | Why |
| --- | --- | --- |
| React development in `apps/web` | Install a reviewed revision of `vercel-react-best-practices` | It covers component performance and parallel data fetching. |
| Playwright testing in `tests/e2e` | Write a local `browser-tests` skill | The team needs to know which signed-in fixture to import and how to run a focused test headlessly. |

Then ask the agent to apply the preview.

> Run skills-upkeep bootstrap apply for Codex, Claude Code, and GitHub Copilot.

The agent applies the skill changes, records the workspace and resolved package versions in `reviewed.md`, and updates the project instructions so the agents know when to use each skill. [Bootstrap workflow](https://github.com/notuxius/skills-upkeep/blob/main/skills/skills-upkeep/project-workflow.md#bootstrap)

## 3. Verify the installation

```powershell
npx skills list
```

Check for `skills-upkeep` and the skills selected during bootstrap. Commit the skill files, project instructions, `reviewed.md`, and `skills-lock.json` so teammates get the same setup on checkout.

## 4. Use the skills and keep them current

Give any of the three agents a normal task.

> Add a Playwright test that checks a signed-in customer can place an order.

The project instructions guide the agent to `browser-tests`, where it finds the team’s fixture and the focused headless test command.

After upgrading Playwright, ask the agent to check the guidance against the newly locked version.

> Run skills-upkeep dependency-change apply for tests/e2e

## Optional usage telemetry

Telemetry starts off. If you set a receiver URL in `SKILLS_UPKEEP_TELEMETRY_URL`, `bootstrap apply` shows the exact destination and sample event before asking for an opt-in for that checkout. Future apply runs can send the public Skills Upkeep release, workflow, and verification result, along with the schema version. Report-only runs send no event. Run the installed telemetry helper with `disable` from the project root to revoke that checkout's consent. `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` blocks sending.

CI requires both `SKILLS_UPKEEP_TELEMETRY=1` and a receiver URL. The repository includes a loopback SQLite receiver for testing and local collection using Node.js 22.20 or later.

```sh
node telemetry/receiver.mjs serve events.sqlite
node telemetry/receiver.mjs report events.sqlite
```

See the [telemetry workflow](skills/skills-upkeep/project-workflow.md#optional-telemetry) for the consent and recording steps.

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

To install the DevOps and technical writing skills in Codex and Claude Code, run this from your project's root.

```powershell
npx skills add notuxius/skills-upkeep --skill queue-devops queue-docs --agent codex claude-code --copy
```

## Skills Upkeep pricing survey

> Run skills-upkeep pricing-survey.

Which would you choose for Skills Upkeep, a monthly subscription or a one-time purchase? Tell us what you’d pay and how likely you’d be to buy at the proposed one-time price of **$9 USD**.

[Reply publicly on GitHub](https://github.com/notuxius/skills-upkeep/discussions/4) under your GitHub username, or [Answer anonymously in Google Forms](https://docs.google.com/forms/d/e/1FAIpQLSdF1nbzCIxOqb3atj0NxSk5d9f1UiYN7KNUx5CDQyNQFR_dsA/viewform) without signing in. We’ll share anonymous responses in aggregate.
