# Skills upkeep ledger

The example groups below are optional. Replace them with names or globs that match this project's skills, or omit the block.

```yaml
groups:
  aqa: [playwright-*, k6-*, test-plan-strategy]
  devops: [ci-cd]
  dev: [vitest-*]
```

## Skill reviews

Keep one row per reviewed skill. Reuse the existing row on later reviews. Use `updated`, `pointer`, `no change`, `supersede proposed` or `supersede declined` for audit outcomes. Record a declined gap under its topic as `gap declined`. Record the actual candidate revision as `owner/repo@sha` when a public source was read. Add the provider, status, finding and link for relevant audits, and explain any revision mismatch or unavailable evidence. Use the versions resolved for the relevant workspaces.

In Reason, include the workspace and environment, the setup and rule sources that mattered, and the reviewed checkout revision or file content identity needed to recognize later changes. Use file content identities for inputs that differ from the recorded commit. For a setup-only workflow with no package, record the decision here. Existing ledgers can use their current columns. When a prior input is unknown, establish it during review.

| Skill | Reviewed | Outcome | Candidates considered | Upstream read | Versions seen | Audit evidence | Reason |
|---|---|---|---|---|---|---|---|

## Project package coverage

Add this table alongside existing review rows on the first write-enabled project run. If a coverage table already exists, add missing compatibility columns as needed and carry forward its existing evidence. Record a reviewed workflow once per workspace and package. Use the skill's project-relative path so an agent can open it during implementation. Give separate rows to workspaces with different versions or conventions.

For a dependency change, show the previous and current values where known. For bootstrap or first use, a current value is enough. Use `unknown` for missing evidence and `absent` only when verified. Cite a manifest, lockfile importer, configuration file or actual usage. Cite the evidence next to any minimum supported version. Record the version last checked and the exact command and result. When a check cannot run, carry forward previous results with their versions and mark the new version unverified. For breaking changes, cite the upstream migration note, affected skill section and focused check in the verification entry.

When a package-backed workflow changes setup, keep the package versions in the row and include the before and after setup in Evidence. Identify the environment and cite the rules preserved. Use Verification to distinguish a configured value from a runtime behavior you checked.

| Workspace | Package and workflow | Declared version | Resolved version | Evidence | Project skill or gap | Outcome | Minimum supported | Last verified version | Verification |
|---|---|---|---|---|---|---|---|---|---|
