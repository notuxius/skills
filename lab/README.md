# Support queue skills lab

A fictional ticket queue for testing four project skills. The reference solution is on `main`. Both Claude Code and Codex receive the skills on checkout. The project uses Node.js 22.20 or later, with no application packages to install.

| Role | Exercise | Improvement tested |
|---|---|---|
| Developer | [Queue view](frontend/task.md) | Keep an older refresh of the same filter from overwriting the latest response. |
| Backend | [Ticket claims](backend/task.md) | Preserve the winning owner after a competing claim and confirm it through a read. |
| AQA | [Ownership regression](qa/task.md) | Catch a service that reports the right conflict while persisting the wrong owner. |
| Designer | [Status badges](design/task.md) | Provide a readable neutral fallback for unfamiliar states in both themes. |

## Run the lab

From the repository root, enter the lab directory before running its commands.

```sh
cd lab
npm test
npm run skills:verify -- ..
npm run skills:bundle-test
npm run skills:public-test
```

To try AQA, run these commands from the repository root.

```sh
git worktree add --detach ../queue-practice origin/practice-aqa
cd ../queue-practice/lab
```

The other practice branches are `practice-developer`, `practice-backend`, and `practice-designer`. Each exercise seeds one defect and keeps the other roles' reference implementations. Start your agent in the practice checkout's `lab/` directory, give it the role's task, and run the corresponding acceptance check before and after the repair.

## Compare agent runs

Start independent sessions from identical copies of a practice fixture. Keep the role skill and project instructions in one copy. For a baseline, use a copy without installed skills or their routing rules. Give both sessions the same task prompt and keep the model and test commands fixed. Record the skill each agent opened, which files it changed, and the acceptance result. For AQA, compare whether both runs catch the faulty service at ownership readback and keep the backend implementation intact.

For a routing tie, ask AQA to add the ownership regression while mentioning that the backend engineer owns the claim and retry code. Expect the QA files to change and the backend to stay intact. `npm test` includes a deterministic description-matching check for this prompt and a representative prompt for each catalog skill.

The bundled-skill fixture uses the pinned Skills CLI and installs two local npm tarballs in a temporary project. It checks CLI discovery of all five catalog skills, the read-only preview, flag compatibility before and after the upgrade, and updates to the reviewed skill in both agents. It also checks that a local skill with a colliding name is preserved and that an unreviewed bundled skill is skipped.

Project instructions map tasks to skills. The installed `skills-upkeep` workflow handles package additions, upgrades and first use. Make reusable improvements in the [catalog](../skills/) and record lab-specific rules in [AGENTS.md](AGENTS.md).

## Rehearse a catalog release offline

The included catalog bundle contains two tagged releases. From `lab/`, run this command in a clone that includes `skill-baseline`. It applies each role's Git diff from `v1` to `v2` in a temporary consumer, runs the role's tests and checks both agent installations. It requires Python 3, Node.js and Git.

```sh
python tools/replay_update.py
```

## Follow future improvements from skills.sh

Edit the four skills in [notuxius/skills-upkeep](https://github.com/notuxius/skills-upkeep). The default branch supplies current installations. The bundled catalog keeps the original two releases available for the offline rehearsal.

To install the four skills in another project, run these commands from its root. Preserve any existing same-name local customizations as project rules before adopting the upstream copies.

```sh
npx skills add notuxius/skills-upkeep --skill queue-ui queue-api queue-aqa queue-design --agent codex claude-code --copy
npx skills list --json
```

Confirm that each selected skill tracks the intended source in `skills-lock.json`. Commit the project skills and lockfile together so a fresh checkout includes the reviewed versions.

After an improvement lands on the catalog's default branch, check for local edits and refresh the affected names. The command explicitly selects Codex and Claude Code so both copies receive the new guidance. For example, after an AQA improvement:

```sh
npx skills check
npm run skills:refresh -- queue-aqa
npm run skills:verify
node --test qa/claim-race.test.mjs
```

Review the diff before committing. Keep the same catalog source and skill names for future releases. To verify exact content against the catalog in this checkout, run `node tools/verify-installs.mjs ..` from `lab/`. See the [directory FAQ](https://skills.sh/docs/faq) and [official CLI commands](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).
