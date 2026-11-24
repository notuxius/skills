"""Run Skills Upkeep against disposable lab fixtures with a headless agent."""

import argparse
import json
import re
import shutil
import subprocess
import tempfile
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


def git(repo, *args):
    return subprocess.check_output(
        ["git", "-c", "core.autocrlf=false", "-c", "core.hooksPath=.git/hooks", *args],
        cwd=repo,
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


def run_case(number, agent):
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
        result = subprocess.run(
            agent,
            cwd=repo,
            input=prompt.encode("utf-8"),
            timeout=240,
            capture_output=True,
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
            if (paths != expected or any(after[key] != before[key] for key in protected)
                    or "queue-review" not in (repo / LEDGER).read_text(encoding="utf-8")):
                raise AssertionError(f"Scenario {number}: unexpected apply changes: {after['status']!r}\n{response}")
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
    parser.add_argument("agent", nargs=argparse.REMAINDER, help="Headless agent command that reads stdin")
    args = parser.parse_args()
    if not args.agent:
        parser.error("provide a headless agent command")
    for number in args.scenario or SCENARIOS:
        run_case(number, args.agent)
