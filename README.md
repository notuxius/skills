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
