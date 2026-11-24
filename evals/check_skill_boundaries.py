"""Run Skills Upkeep against disposable lab fixtures with a headless agent."""

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
from importlib.util import find_spec
from pathlib import Path


LAB = Path(__file__).resolve().parents[1] / "lab"
LEDGER = ".agents/skills/reviewed.md"
NEW_SKILL = ".agents/skills/queue-review/SKILL.md"
SCENARIOS = {
    6: ("Dry run: check the queue-aqa skill against upstream.", "queue-aqa"),
    34: (
        "This is an unattended scheduled run. Review the dependency change for queue-lab-sdk.",
        "queue-lab-sdk",
    ),
    42: (
        f"Run bootstrap apply. Create a local queue-review skill for the review workflow "
        f"in qa/review.md at {NEW_SKILL} and update {LEDGER}. Target Codex.",
        "queue-review",
    ),
    54: ("Run setup-change report-only for the test workflow in qa/.", "test:qa"),
}


def fixture_env(repo):
    env = os.environ.copy()
    index = int(env.get("GIT_CONFIG_COUNT", "0"))
    env[f"GIT_CONFIG_KEY_{index}"] = "safe.directory"
    env[f"GIT_CONFIG_VALUE_{index}"] = repo.resolve().as_posix()
    env["GIT_CONFIG_COUNT"] = str(index + 1)
    return env


def git(repo, *args):
    return subprocess.check_output(
        ["git", "-c", "core.autocrlf=false", "-c", "core.hooksPath=.git/hooks", *args],
        cwd=repo,
        env=fixture_env(repo),
    )


def snapshot(repo):
    return {
        "branch": git(repo, "symbolic-ref", "HEAD"),
        "branches": git(repo, "for-each-ref", "refs/heads/"),
        "status": git(repo, "status", "--porcelain=v1", "--untracked-files=all"),
        "staged": git(repo, "diff", "--cached", "--binary", "--no-ext-diff", "--no-textconv"),
        "unstaged": git(repo, "diff", "--binary", "--no-ext-diff", "--no-textconv"),
        "scratch": (repo / "scratch.md").read_bytes(),
    }


def configure(repo, number, changed=False):
    path = repo / "package.json"
    package = json.loads(path.read_text(encoding="utf-8"))
    if number == 34:
        version = "2.0.0" if changed else "1.0.0"
        package["devDependencies"] = {"queue-lab-sdk": version}
        (repo / "package-lock.json").write_text(json.dumps({
            "lockfileVersion": 3,
            "packages": {
                "": {"devDependencies": package["devDependencies"]},
                "node_modules/queue-lab-sdk": {"version": version},
            },
        }, indent=2) + "\n", encoding="utf-8", newline="\n")
        (repo / "qa/sdk.md").write_text(
            "# queue-lab-sdk\n\nThe version 2 API renamed readClaim to readOwner.\n",
            encoding="utf-8", newline="\n",
        )
        if not changed:
            for agent_dir in (".agents", ".claude"):
                skill = repo / agent_dir / "skills/queue-aqa/SKILL.md"
                with skill.open("a", encoding="utf-8", newline="\n") as guidance:
                    guidance.write("\nUse queue-lab-sdk's `readClaim` to read the stored owner.\n")
    if number == 54:
        command = "node --test qa/claim-race.test.mjs"
        if changed:
            command = "node --test --test-name-pattern=simultaneous qa/claim-race.test.mjs"
        package["scripts"]["test:qa"] = command
    if number in {34, 54}:
        path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8", newline="\n")
    if number == 42:
        (repo / "qa/review.md").write_text(
            "# Queue QA review\n\nCheck claim conflicts and read back the stored owner. "
            "Verify with `node --test qa/claim-race.test.mjs`.\n",
            encoding="utf-8", newline="\n",
        )


def coverage_rows(ledger):
    """Read rows from the fixture's Markdown coverage table, by column name."""
    aliases = {
        "Project skill or gap": "Project skill",
        "Package and workflow": "Package or runtime workflow",
        "Minimum supported": "Project minimum",
        "Last verified version": "Last verified",
    }
    headers = []
    in_table = False
    for line in ledger.splitlines():
        if "|" not in line:
            headers = []
            in_table = False
            continue
        cells = [cell.strip().replace("`", "") for cell in line.strip().strip("|").split("|")]
        if "Workspace" in cells:
            headers = [aliases.get(cell, cell) for cell in cells]
            in_table = False
        elif headers and len(cells) == len(headers):
            if all(re.fullmatch(r":?-+:?", cell) for cell in cells):
                in_table = "Project skill" in headers
            elif in_table:
                yield dict(zip(headers, cells))


def check_apply_result(repo, original_ledger):
    import yaml

    rows = list(coverage_rows((repo / LEDGER).read_text(encoding="utf-8")))
    for original in coverage_rows(original_ledger):
        if not any(original.items() <= row.items() for row in rows):
            raise AssertionError(f"Scenario 42: lost coverage for {original['Project skill']}")
    if not any(row["Workspace"] and re.search(r"(?<![\w-])queue-review(?![\w-])", row["Project skill"])
               for row in rows):
        raise AssertionError("Scenario 42: missing queue-review coverage row")

    source = (repo / NEW_SKILL).read_text(encoding="utf-8")
    header = re.match(r"\A---[ \t]*\n(.*?)\n---[ \t]*(?:\n|$)", source, re.DOTALL)
    if not header:
        raise AssertionError("Scenario 42: missing skill frontmatter")
    try:
        metadata = yaml.safe_load(header[1])
    except yaml.YAMLError as error:
        raise AssertionError(f"Scenario 42: invalid YAML frontmatter: {error}") from error
    if (not isinstance(metadata, dict) or metadata.get("name") != "queue-review"
            or not isinstance(metadata.get("description"), str) or not metadata["description"].strip()):
        raise AssertionError("Scenario 42: expected the queue-review name and a skill description")
    body = source[header.end():].casefold()
    command = r"\bnode\s+--test\s+(?:\./)?qa/claim-race\.test\.mjs\b"
    if not re.search(command, body):
        raise AssertionError("Scenario 42: skill is missing the focused QA check")
    procedure = re.sub(command, "", body)
    for requirement, pattern in (
        ("claim conflict", r"conflict|compet|concurren|simultaneous|\b409\b|\brace\b"),
        ("ownership", r"owner|assignee|assigned"),
        ("readback", r"\b(?:read|reread|fetch|retriev|query|reload)\w*|\bget\b"),
    ):
        if not re.search(pattern, procedure):
            raise AssertionError(f"Scenario 42: skill is missing {requirement}")


def run_case(number, agent=None):
    with tempfile.TemporaryDirectory(prefix="skills-upkeep-eval-") as temp:
        repo = Path(temp) / "project"
        shutil.copytree(LAB, repo, ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__"))
        configure(repo, number)
        git(repo, "init", "--quiet", "-b", "main")
        git(repo, "add", ".")
        git(repo, "-c", "user.name=Skills Upkeep Eval", "-c", "user.email=eval@example.invalid",
            "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Baseline")
        configure(repo, number, changed=True)
        if number == 34:
            git(repo, "add", "package-lock.json")
        (repo / "scratch.md").write_text("Existing untracked note.\n", encoding="utf-8", newline="\n")
        before = snapshot(repo)

        request, topic = SCENARIOS[number]
        print(f"Running scenario {number}", flush=True)
        prompt = f"Use .agents/skills/skills-upkeep/SKILL.md and local fixture evidence. {request}\n"
        if not agent:
            agent = [shutil.which("codex") or "codex", "-a", "never", "exec", "--ephemeral", "--sandbox"]
            if number == 42:
                agent.extend(["workspace-write", "--add-dir", ".agents/skills"])
            else:
                agent.append("read-only")
            agent.append("-")
        env = fixture_env(repo)
        if os.name == "nt" and Path(agent[0]).stem.casefold() == "codex":
            # The CLI child has its own process identity, even when launched by the desktop app.
            env.pop("CODEX_WINDOWS_REGISTERED_CORE", None)
            agent = [agent[0], "-c", "features.prefer_mxc=true", *agent[1:]]
        result = subprocess.run(
            agent,
            cwd=repo,
            env=env,
            input=prompt.encode("utf-8"),
            timeout=240,
            capture_output=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        if result.returncode:
            stderr = result.stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"Scenario {number}: headless agent exited with {result.returncode}\n{stderr}")
        after = snapshot(repo)
        response = result.stdout.decode("utf-8", errors="replace").strip()
        if number == 42:
            allowed = {f" M {LEDGER}", f"?? {NEW_SKILL}"}
            paths = set(after["status"].decode().splitlines())
            expected = set(before["status"].decode().splitlines()) | allowed
            protected = ("branch", "branches", "staged", "scratch")
            if paths != expected or any(after[key] != before[key] for key in protected):
                raise AssertionError(f"Scenario {number}: unexpected apply changes: {after['status']!r}\n{response}")
            check_apply_result(repo, git(repo, "show", f"HEAD:{LEDGER}").decode("utf-8"))
        else:
            changed = [key for key in before if before[key] != after[key]]
            if changed:
                raise AssertionError(f"Scenario {number}: report-only changed {', '.join(changed)}")
            if not re.search(r"\breport[- ]only\b", response, re.IGNORECASE):
                raise AssertionError(f"Scenario {number}: result must identify report-only mode\n{response}")
        if topic.casefold() not in response.casefold():
            raise AssertionError(f"Scenario {number}: result did not address {topic}\n{response}")
        print(f"Scenario {number} passed", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", type=int, choices=SCENARIOS, action="append")
    parser.add_argument("agent", nargs=argparse.REMAINDER, help="Alternative headless agent command that reads stdin")
    args = parser.parse_args()
    scenarios = args.scenario or SCENARIOS
    if 42 in scenarios and find_spec("yaml") is None:
        parser.error("scenario 42 needs PyYAML: python -m pip install -r evals/requirements.txt")
    for number in scenarios:
        run_case(number, args.agent)
