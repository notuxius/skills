# Maintain and use project skills

Work in the consuming project's checkout, on the branch and working tree containing the package change. Read the applicable project instructions. Identify the agents, skill directories and workspace boundaries the project already uses. Keep changes project-local. If a skill link resolves outside the project, treat it as an external source and preserve the shared original.

## Bootstrap

1. Inventory the direct runtime, development and build tools of each workspace. Read its manifests, lockfiles, task scripts, configuration and representative usage. Include tools supplied through central files such as `Directory.Packages.props` or a shared lockfile. Prioritize the tools that shape implementation, testing or CI. A package name alone seldom justifies a skill.
2. List project skills, including team-specific workflows. Read their descriptions and inspect relevant bodies and references. Resolve links to a shared skill once. Map each important package **and task** to the smallest suitable set of skills. The same package may have different skills for development and testing.
3. Follow **Choose an action** below for each material workflow. In apply mode, add the following rule to the project instructions its agents actually read. Merge it into the existing convention, preserving team rules. If one instruction file imports another, keep the rule in the shared file. Check that each target agent can resolve the upkeep skill and selected domain skills from a fresh checkout.

   > Before implementing, testing or reviewing package-specific work, read and use the project skill that covers the task in this workspace. When a package is added as a direct dependency, changes version, or is first used here, run skills-upkeep dependency-change for that workspace, then use the matching skill on the task. Apply relevant skill changes during implementation. During review or a dry run, report proposed changes. Follow the project's existing restrictions on sources and installation.

4. Record the starting coverage in the [ledger](reviewed.template.md). In report-only mode, show the proposed rule, skill actions and ledger rows in the response. A repeated bootstrap should preserve a current mapping and add the rule only where missing.
5. Finish an apply run with [Optional telemetry](#optional-telemetry). If the helper shows an available receiver, offer the project opt-in once before recording the run.

## Dependency-change

1. **Choose a baseline.** In a PR use its actual base (merge base for a branch). For local changes compare the index and working tree with HEAD and include relevant untracked manifests, config and source. For a change already merged, use the supplied commit range or the last reviewed workspace/package evidence. Examine the current working tree as well when it is part of the task. A checkout with no usable history can be inventoried as a baseline. Label earlier versions and first use as unknown where evidence is missing.
2. **Resolve the affected package in its workspace.** Compare before and after declarations and lockfile resolutions, including direct development, optional and peer dependencies where relevant. Follow the importer's resolution in a shared lockfile. A changed range can resolve to the same version, and an unchanged range can resolve to a new version. With no lock or other reliable version evidence, record the declared constraint and mark the resolution unverified. Read files as data. Leave application dependencies and lockfiles alone during upkeep.
3. **Check actual use.** Read relevant changed imports, scripts, config and CI entries. New use of an already-declared package counts even if the manifest and lockfile are identical. Check for earlier use in that workspace before calling it first use. Keep ordinary transitive churn and unchanged sibling workspaces out of scope unless evidence shows a change to a workflow they use. A removal can retire a workspace mapping once remaining usages have been checked.
4. **Review the affected guidance now.** Map each material change to existing project skills and compare their commands, APIs, examples and project conventions with the resolved version. Check version-specific official documentation or locally available tooling. Recheck even a recently reviewed skill and even if its text never names a version. When editing a shared skill, keep its instructions valid for workspaces still using the previous version. Record an unaffected result when the guidance still works. For a major upgrade or known breaking change, record the version-specific migration note, the affected skill section and a focused check for that change. A command or flag check verifies availability. Use an example, contract test or equivalent when behavior changes.
5. **Act and verify.** Use the decision table below. In apply mode change only affected project skills, their discovery entries and coverage rows. Preserve the package diff on the current branch. In report-only mode show the same decisions and proposed checks in the response. If an implementation or test is already requested, follow **Use a skill on a task** after the review.
6. Finish an apply run with [Optional telemetry](#optional-telemetry). Use the saved setting and skip the opt-in prompt here.

### Preview skills bundled with npm packages

For an installed npm dependency, inspect the package's skill files and the workspace's existing skill names. When the project's approved Skills CLI supports the sync options, use its installed or cached executable to preview the affected package only:

```sh
skills experimental_sync --dry-run --no-remote --no-cleanup --no-frozen-lockfile --include '<package>'
```

Run from the affected workspace or use the CLI's documented workspace support. Check the preview for name collisions and package provenance. When multiple workspaces resolve the same package differently, identify which installed copy supplies the skill before applying the preview. If the CLI is unavailable, inspect the installed package directly. Validate the bundled guidance against the resolved package version and follow the decision table for adoption. In apply mode, repeat the preview with `--include '<package>#<skill>'` for each reviewed skill, then drop `--dry-run` if the selection and provenance agree. Keep the other flags and use the project's agent selection and install mode. Check the current copies for local edits before syncing. When a sync would replace a local skill or team edits, merge the relevant guidance by hand. Recheck the diff, lock and both discovery paths.

## Choose an action

| Evidence | Action |
|---|---|
| A project skill covers this workflow and supports this version | Reuse it. Record which section or check supports the decision. |
| A hand-maintained or locally modified skill contains obsolete advice | Correct the specific advice using version-matched evidence. Keep local rules and credit any ported source. |
| A clean third-party install needs a compatible revision | Inspect the installed state and diff the relevant candidate revision first. Apply only the reviewed skill and revision to the project, preserving pins and local changes. If the CLI cannot target it, report the proposed update. |
| A material workflow has no suitable project skill | Honor previously declined proposals. Check any relevant skill shipped with the installed package, upstream's official skill, then other candidates. Use the **Vet** and **Read** criteria in [SKILL.md](SKILL.md) before adopting external content. Use public package names for public searches and keep internal names and source code in the checkout. |
| A vetted candidate fits an uncovered workflow | In apply mode, honor project source policy, check for name collisions, and install just that skill in the project's existing agent directories. For a Git source and a CLI supporting pinned installs, use `npx skills add <owner>/<repo>@<reviewed-commit> --skill <skill-name> -a <project-agent>`. Otherwise inspect and vendor the approved revision with its attribution and license, if permitted. |
| A recurring workflow is specific to the project | In apply mode, create a small project skill when checked-in code, scripts or team instructions establish a repeatable procedure. Give it a task-specific description, the local paths or commands, and a way to verify the result. |
| The package needs no special guidance, evidence is missing, or installation is restricted | Record the reason and any unresolved gap. Use version-matched official documentation for the task when available. |

Leave replacements of existing skills as proposals unless the user requests the replacement. For agents sharing a linked skill, edit its project-local source once. For separate copies, apply the correction in each intended agent directory and preserve its agent-specific instructions. Verify discovery, frontmatter, relative links, the change diff and any relevant local command. Distinguish checks actually run from checks that need a working project environment. Preserve each workspace's row in the package coverage section of the ledger. In a report, show workspace, package change, evidence, skill and action, and verification. Report-only mode writes no files.

Report the minimum supported version separately from the last verified version, even if the existing ledger lacks these columns. Cite the versioned docs, release note or check that established when the newest requirement in the guidance first became supported. If the evidence shows only that a particular version works, record it as last verified and mark the minimum unknown. Record the last verified version, exact check and result separately for each workspace or supported version that was actually tested. Confirm that the executable or library used for the check matches the workspace resolution. Carry forward prior verification evidence with its original version. Mark a check that could not run as unverified and include its proposed invocation. Record a failed result against the version tested and describe which requirement failed.

The compatibility fields draw on [Zapier's Workflows Doctor](https://skills.sh/zapier/agent-skills/workflows-doctor). The staged major-upgrade checks draw on [Dependency Upgrade](https://skills.sh/wshobson/agents/dependency-upgrade).

## Optional telemetry

From the consuming project root, use the installed [telemetry helper](scripts/telemetry.mjs) with Node.js. Skip this section for report-only runs or when the helper or Node.js is unavailable.

On `bootstrap apply`, run `node <skill-dir>/scripts/telemetry.mjs status`. If the state is `available`, show the endpoint and sample event. Ask whether to share the public Skills Upkeep release, upkeep workflow and verification result on future apply runs in this checkout. Mention how to turn it off. Run `enable <endpoint>` only on an explicit yes. Run `disable` on an explicit no to remember the choice. With no answer, finish upkeep with telemetry off. The helper reads a suggested receiver from `SKILLS_UPKEEP_TELEMETRY_URL`. An unconfigured, disabled or blocked state needs no prompt. CI uses its own explicit enablement and skips this prompt.

After a completed apply run, call `node <skill-dir>/scripts/telemetry.mjs record apply <workflow> <verification>` once. Use `bootstrap` or `dependency-change`. Use `failed` if an upkeep verification check failed, `passed` if checks ran and passed, and `not_run` if none ran. The helper checks consent on every call. Continue normally if it skips the event or the receiver is unavailable.

## Use a skill on a task

Start with the task and its workspace. Consult the recorded mapping or read the local skill descriptions if the ledger is missing. Check the applicable resolved version against the mapping, including changes merged since the last review. When it differs, or the workspace first adopts the tool, run the scoped dependency-change workflow. Otherwise go straight to the matching skill.

Open the selected `SKILL.md` and the references needed for the requested work. Follow its applicable instructions while implementing, testing or reviewing, then run the targeted project check when available. Report the skill used and what it informed, with the actual verification result. For a review-only request, describe the applicable guidance and review findings. Skip the public upstream audit on routine tasks.
