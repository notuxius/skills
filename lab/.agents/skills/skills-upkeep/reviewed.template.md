# Skills upkeep ledger

The example groups below are optional. Replace them with names or globs that match this project's skills, or omit the block.

```yaml
groups:
  aqa: [playwright-*, k6-*, test-plan-strategy]
  devops: [ci-cd]
  dev: [vitest-*]
```

## Skill reviews

Keep one row per reviewed skill. Reuse the existing row on later reviews. Use `updated`, `pointer`, `no change`, `supersede proposed` or `supersede declined` for audit outcomes. Record a declined gap under its topic as `gap declined`. Record the actual candidate revision as `owner/repo@sha` when a public source was read. Use the versions resolved for the relevant workspaces.

| Skill | Reviewed | Outcome | Candidates considered | Upstream read | Versions seen | Reason |
|---|---|---|---|---|---|---|

## Project package coverage

Add this table alongside existing review rows on the first write-enabled project run. Record a reviewed workflow once per workspace and package. Use the skill's project-relative path so an agent can open it during implementation. Give separate rows to workspaces with different versions or conventions.

For a dependency change, show the previous and current values where known. For bootstrap or first use, a current value is enough. Use `unknown` for missing evidence and `absent` only when verified. Cite a manifest, lockfile importer, configuration file or actual usage. Name the check performed and its result, or explain what remains unverified.

| Workspace | Package and workflow | Declared version | Resolved version | Evidence | Project skill or gap | Outcome | Verification |
|---|---|---|---|---|---|---|---|
