# Support queue role skills

Four agent skills for a fictional support queue. Keep each skill name and directory stable when revising its guidance so consumers can update their existing installations.

| Skill | When to use it |
|---|---|
| [queue-ui](skills/queue-ui/SKILL.md) | Implement queue filtering, refresh and loading states |
| [queue-api](skills/queue-api/SKILL.md) | Implement ticket ownership changes and retries |
| [queue-aqa](skills/queue-aqa/SKILL.md) | Write a regression test that exposes a lost ownership update |
| [queue-design](skills/queue-design/SKILL.md) | Specify accessible status badges for both themes |

## Install from the public catalog

After hosting this repository on GitHub, replace `OWNER/REPO` with its actual slug. Run from the consuming project, using Node.js 22.20 or later.

```sh
npx skills add OWNER/REPO --skill queue-ui queue-api queue-aqa queue-design --agent codex claude-code --copy
npx skills list --json
```

Edit the source under `skills/`, run the matching exercise in the companion `role-skills-lab`, and merge the improvement into the default branch. In a consumer that tracks the public catalog, check for updates and apply the relevant name, for example:

```sh
npx skills check
npx skills update queue-aqa --project
```

Review the resulting skill and lockfile changes, then run the role tests in the consuming project. New installations from the default branch receive its current guidance. skills.sh indexes installations from the public repository. See the [directory FAQ](https://skills.sh/docs/faq) and the [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).

The tags `v1` and `v2` identify the two revisions in the offline update exercise. Use the default branch when the intent is to follow later improvements.
