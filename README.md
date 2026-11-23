# Skills Upkeep

Four agent skills for a fictional support queue and a [hands-on lab](lab/README.md) to try them with Codex or Claude Code. The lab includes one exercise per role and a rehearsal for upgrading installed skills.

| Skill | When to use it |
|---|---|
| [queue-ui](skills/queue-ui/SKILL.md) | Implement queue filtering, refresh and loading states |
| [queue-api](skills/queue-api/SKILL.md) | Implement ticket ownership changes and retries |
| [queue-aqa](skills/queue-aqa/SKILL.md) | Write a regression test that exposes a lost ownership update |
| [queue-design](skills/queue-design/SKILL.md) | Specify accessible status badges for both themes |

## Install from the public catalog

Run from the consuming project, using Node.js 22.20 or later.

```sh
npx skills add notuxius/skills-upkeep --skill queue-ui queue-api queue-aqa queue-design --agent codex claude-code --copy
npx skills list --json
```

Edit the source under `skills/`, refresh the two agent copies in `lab/`, and run the matching [lab exercise](lab/README.md). Keep each skill name and directory stable so consumers can update their existing installations.

In the consuming project, run `npx skills check` and inspect the installed copies for local edits. Preserve any team-specific changes before refreshing. For an improved AQA skill, refresh the two project copies together.

```sh
npx skills add notuxius/skills-upkeep --skill queue-aqa --agent codex claude-code --copy
```

Verify that both `.agents/skills/queue-aqa/SKILL.md` and `.claude/skills/queue-aqa/SKILL.md` contain the revised guidance. Review the skill and lockfile changes, then run the AQA exercise. For another role, substitute its skill name. New installations from the default branch receive its current guidance. skills.sh indexes installations from the public repository. See the [directory FAQ](https://skills.sh/docs/faq) and the [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).

The refs `v1` and `v2` identify the baseline and improved revisions in the update exercise. Install from the default branch to follow later improvements.
