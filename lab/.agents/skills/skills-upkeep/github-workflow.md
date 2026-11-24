# Report a bug, suggest a feature or open a pull request

Publish only when the user explicitly asks to open, file or submit the item. A request to open a draft PR authorizes creating a GitHub draft PR. A request for draft text or a report-only or dry run stays local and leaves branches and GitHub untouched.

## When Skills Upkeep encounters an error

Diagnose and recover as part of the current task. If the evidence points to a defect in Skills Upkeep's instructions or workflow, add one line to the outcome and offer to draft a report. Draft it only on request.

## Resolve the target and prepare the draft

Use the repository the user names. For a bug or feature suggestion about Skills Upkeep itself, default to `github.com/notuxius/skills`. For work in a consuming project, use its intended GitHub repository. Resolve the target from project instructions or the Git remotes when clear. Ask if the target is ambiguous, and provide the draft text while it is unresolved. Share only task-relevant material appropriate for that repository. Leave credentials, private logs and unrelated project data out of both the draft and the submission.

Use the repository's template when available. Give the item a title and a Markdown body.

- For a pull request, identify the head and intended base, inspect the actual diff, and summarize what changed, why and what was tested. Use the project's configured PR base or the repository default when the user hasn't specified a base. Keep unrelated changes out of the PR.
- For a bug report, include the observed and expected behavior, known reproduction steps, and relevant versions or environment details. Mark missing evidence as unknown and use only sanitized excerpts.
- For a feature suggestion, describe the problem, the requested behavior and an example of who would use it or when. Preserve the user's intent and return a copy-ready draft if they have only asked to share or develop the idea in chat.

## Publish with existing access

Use an available GitHub integration authorized to create the requested item under the intended account, or use the existing GitHub CLI session. For the CLI, check `gh auth status --active --hostname <host>` without displaying tokens. Try the other route if one lacks access and the other is already authorized. Leave sign-in and credential changes to the user. If neither route is available, return the draft before making any Git changes.

- For a bug report or feature suggestion, create the issue in the resolved repository. With the CLI, use `gh issue create --repo <host/owner/repo> --title <title> --body-file <path>`.
- For a pull request, check for an existing open PR with the same head and base and return its URL if found. Verify there are changes to propose. Use a feature branch, creating one if needed. Commit only work the user asked to include, and leave unrelated staged and unstaged work intact. Verify the outgoing diff before pushing the branch to the intended writable repository or fork. Use explicit head and base refs when creating the PR. With the CLI, use `gh pr create --repo <host/owner/repo> --base <base> --head <head> --title <title> --body-file <path>`. For a user-owned fork, pass `<owner>:<branch>` as the head. Add `--draft` only when the user asks to open a draft PR. Keep pushes off the base branch and avoid force-pushes.

Return the confirmed GitHub URL. If a submission times out or its result is unclear, look up the item before retrying. If its state remains uncertain, return the draft and surface the uncertainty. Reuse any branch already pushed.

## Return a copy-ready draft

If the user asks for text only, or publishing is blocked by missing access, missing tools, an unready branch or a failed submission, provide the title and the raw Markdown body in separate copyable blocks. Include the target repository and what is needed to submit. For an issue, link to the target's new-issue page when known. For a PR, include the head and base, and a compare link when both refs are on GitHub. Report any local commit or remote push already made and whether publication was confirmed.
