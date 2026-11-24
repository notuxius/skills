import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from check_skill_boundaries import LAB, LEDGER, NEW_SKILL, check_apply_result


class ApplyResultTest(unittest.TestCase):
    def test_preserves_coverage_and_installs_a_usable_skill(self):
        baseline = (LAB / LEDGER).read_text(encoding="utf-8")
        row = "| qa/ | Claim review | unknown | unknown | queue-review | See qa/review.md |"
        updated = baseline.replace("\n\nThe project minimum", f"\n{row}\n\nThe project minimum")
        header = "---\nname: queue-review\ndescription: >\n  Review queue claims.\n---\n"
        procedure = "Check claim conflicts and read back the owner. Run `node --test qa/claim-race.test.mjs`."
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            skill = repo / NEW_SKILL
            skill.parent.mkdir(parents=True)
            ledger = repo / LEDGER
            ledger.write_text(updated, encoding="utf-8")
            skill.write_text(header + procedure, encoding="utf-8")
            check_apply_result(repo, baseline)

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
                        check_apply_result(repo, baseline)


class ReleaseSnapshotTest(unittest.TestCase):
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
