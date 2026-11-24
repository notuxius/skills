# Support queue project

Select skills by the requested deliverable. Open the relevant installed `SKILL.md` before changing the implementation or reviewing an exercise. Run the corresponding test from the root.

| Role | Working area | Skill | Acceptance check |
|---|---|---|---|
| Developer | `frontend/` | `queue-ui` | `node --test frontend/queue-view.test.mjs` |
| Backend | `backend/` | `queue-api` | `node --test backend/claim.test.mjs` |
| AQA | `qa/` | `queue-aqa` | `node --test qa/claim-race.test.mjs` |
| Designer | `design/` | `queue-design` | `node --test design/status-badge.test.mjs` |

Use `.agents/skills/` for Codex and `.claude/skills/` for Claude Code, relative to this file. Run the acceptance commands from the directory containing this file. For a cross-role change, use the smallest set of skills that covers the work. Implement the fix before declaring a role exercise complete. Keep product-specific conventions here and reusable skill improvements in the repository's `skills/` directory.

Use [.agents/skills/reviewed.md](.agents/skills/reviewed.md) as the shared ledger for both agents. Its groups support scoped audits such as `skills upkeep designer` and `skills upkeep backend + aqa`. Run the installed `skills-upkeep` dependency-change workflow when a dependency is added, changes version or is first used. Run setup-change when the runtime, build, test setup or applicable rules change. Scope the run to the affected workflow. During a PR review, use report-only mode. When the catalog releases an improvement, follow the update instructions in the README and rerun the affected checks.
