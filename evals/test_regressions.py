import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from check_skill_boundaries import (
    LAB, LEDGER, NEW_SKILL, SKILL_DIRECTORIES, agent_command, check_apply_result, run_case,
)


class ReportOnlyTest(unittest.TestCase):
    def test_codex_command_allows_project_and_skill_edits(self):
        command = agent_command("codex")
        self.assertEqual(command[command.index("--sandbox") + 1], "workspace-write")
        self.assertEqual(command[command.index("--add-dir") + 1], SKILL_DIRECTORIES["codex"])

    def test_checkout_write_fails_despite_a_correct_report(self):
        for target, directory in SKILL_DIRECTORIES.items():
            with self.subTest(target=target):
                fake_agent = (
                    "import sys; from pathlib import Path; "
                    f"assert 'Use {directory}/skills-upkeep/SKILL.md' in sys.stdin.read(); "
                    f"Path('{directory}/queue-aqa/SKILL.md').write_text('unexpected edit'); "
                    "print('report-only for queue-aqa')"
                )
                with self.assertRaisesRegex(AssertionError, "report-only changed status, unstaged"):
                    run_case(6, [sys.executable, "-c", fake_agent], target=target)


class ApplyResultTest(unittest.TestCase):
    def test_preserves_coverage_and_installs_a_usable_skill(self):
        baseline = (LAB / LEDGER).read_text(encoding="utf-8")
        row = "| qa/ | Claim review | unknown | unknown | queue-review | See qa/review.md |"
        updated = baseline.replace("\n\nThe project minimum", f"\n{row}\n\nThe project minimum")
        header = "---\nname: queue-review\ndescription: >\n  Review queue claims.\n---\n"
        procedure = "Check claim conflicts and read back the owner. Run `node --test qa/claim-race.test.mjs`."
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            new_skill = f"{SKILL_DIRECTORIES['claude']}/{NEW_SKILL}"
            skill = repo / new_skill
            skill.parent.mkdir(parents=True)
            ledger = repo / LEDGER
            ledger.parent.mkdir(parents=True)
            ledger.write_text(updated, encoding="utf-8")
            skill.write_text(header + procedure, encoding="utf-8")
            check_apply_result(repo, baseline, new_skill)

            for contents, guidance, expected in (
                ("queue-review", "", "lost coverage"),
                (updated.replace("22.20.0", "unknown", 1), header + procedure, "lost coverage"),
                (baseline + "\nCreated queue-review", header + procedure, "coverage row"),
                (updated, "", "frontmatter"),
                (updated, header.replace("description: >", "description: [") + procedure, "invalid YAML"),
                (updated, header.replace("name: queue-review", "name: queue-api") + procedure, "name"),
                (updated, header + "Run the tests.", "QA check"),
                (updated, header + "Read the owner. Run `node --test qa/claim-race.test.mjs`.", "conflict"),
            ):
                with self.subTest(expected=expected):
                    ledger.write_text(contents, encoding="utf-8")
                    skill.write_text(guidance, encoding="utf-8")
                    with self.assertRaisesRegex(AssertionError, expected):
                        check_apply_result(repo, baseline, new_skill)


class ReleaseSnapshotTest(unittest.TestCase):
    def test_only_warns_for_a_complete_snapshot_from_default_branch_history(self):
        checker = LAB.parent / ".github/scripts/check_skills_snapshot.py"
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)

            git_env = {**os.environ, "GIT_CONFIG_GLOBAL": str(repo / "test.gitconfig")}

            def git(*args):
                return subprocess.check_output(
                    ["git", "-c", "user.name=CI", "-c", "user.email=ci@example.com",
                     "-c", "core.autocrlf=false", *args], cwd=repo, env=git_env
                )

            git("config", "--global", "safe.directory", repo.resolve().as_posix())
            git("init", "--quiet", "-b", "main")
            skill = repo / "skills/skills-upkeep"
            skill.mkdir(parents=True)
            entry = {"path": "SKILL.md", "contents": "Original\n"}
            guide = {"path": "guide.md", "contents": "Keep this guide.\n"}
            for file in (entry, guide):
                (skill / file["path"]).write_bytes(file["contents"].encode())
            git("add", "skills")
            git("commit", "-qm", "Publish original skill")
            original = git("rev-parse", "HEAD").decode().strip()

            git("checkout", "-qb", "unmerged")
            (skill / "SKILL.md").write_bytes(b"Branch only\n")
            git("commit", "-qam", "Unmerged change")
            git("checkout", "-q", "main")
            (skill / "SKILL.md").write_bytes(b"Current\n")
            git("commit", "-qam", "Publish current skill")

            archive = repo / "expected.zip"
            archive.write_bytes(git("archive", "--format=zip", "HEAD:skills/skills-upkeep"))
            snapshot = repo / "actual.json"
            for files, history, status, warning in (
                ([guide, dict(entry, contents="Current\n")], ["HEAD"], 0, False),
                ([guide, entry], [], 1, False),
                ([guide, entry], ["HEAD"], 0, True),
                ([guide, dict(entry, contents="Branch only\n")], ["HEAD"], 1, False),
                ([entry], ["HEAD"], 1, False),
                ([guide, entry, entry], ["HEAD"], 1, False),
            ):
                with self.subTest(files=files, history=history):
                    snapshot.write_text(json.dumps({"files": files}), encoding="utf-8")
                    result = subprocess.run([sys.executable, checker, archive, snapshot, *history],
                                            cwd=repo, capture_output=True, text=True, env=git_env)
                    self.assertEqual(result.returncode, status, result.stderr)
                    self.assertEqual("::warning::" in result.stdout, warning)
                    if warning:
                        self.assertIn(original, result.stdout)

    def test_matches_every_path_and_its_contents(self):
        checker = LAB.parent / ".github/scripts/check_skills_snapshot.py"
        entry = {"path": "SKILL.md", "contents": "Use the workflow.\n"}
        guide = {"path": "references/workflow.md", "contents": "Reviewed → applied.\n"}
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "expected.zip"
            snapshot = Path(directory) / "actual.json"
            with ZipFile(archive, "w") as expected:
                for item in (entry, guide):
                    expected.writestr(item["path"], item["contents"])
            for files, error in (
                ([guide, entry], None),
                ([entry], "Missing"),
                ([entry, dict(guide, contents="stale")], "differs"),
                ([entry, guide, dict(guide, path="retired.md")], "Unexpected"),
                ([entry, guide, guide], "Duplicate"),
            ):
                with self.subTest(error=error):
                    snapshot.write_text(json.dumps({"files": files}), encoding="utf-8")
                    result = subprocess.run([sys.executable, checker, archive, snapshot], capture_output=True)
                    if error:
                        self.assertNotEqual(result.returncode, 0)
                        self.assertIn(error, result.stderr.decode())
                    else:
                        self.assertEqual(result.returncode, 0, result.stderr)
