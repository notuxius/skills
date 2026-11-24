"""Compare a skills.sh download with a Git archive of the skill directory."""

import io
import json
import subprocess
import sys
from pathlib import Path
from zipfile import ZipFile


def read_snapshot(snapshot_path):
    entries = json.loads(Path(snapshot_path).read_bytes())["files"]
    if not isinstance(entries, list):
        raise ValueError("Expected a list of snapshot files")
    indexed = {}
    for entry in entries:
        path = entry["path"]
        if path in indexed:
            raise ValueError(f"Duplicate snapshot file: {path}")
        indexed[path] = entry["contents"].encode("utf-8")
    return indexed


def mismatch(archive_path, indexed):
    remaining = indexed.copy()
    with ZipFile(archive_path) as archive:
        for file in archive.infolist():
            if file.is_dir():
                continue
            if file.filename not in remaining:
                return f"Missing snapshot file: {file.filename}"
            if remaining.pop(file.filename) != archive.read(file):
                return f"Snapshot content differs: {file.filename}"
    if remaining:
        return f"Unexpected snapshot files: {', '.join(sorted(remaining))}"
    return None


def check_snapshot(archive_path, snapshot_path, history_ref=None):
    indexed = read_snapshot(snapshot_path)
    error = mismatch(archive_path, indexed)
    if error is None:
        print("skills.sh serves every file in the current skill.")
        return

    if history_ref:
        path = "skills/skills-upkeep"
        commits = subprocess.check_output(
            ["git", "log", "--first-parent", "--format=%H", history_ref, "--", path], text=True
        )
        for commit in commits.splitlines():
            # A revision that removed the whole skill has no published files to match.
            if not subprocess.check_output(["git", "ls-tree", "-d", commit, "--", path]):
                continue
            archive = subprocess.check_output(
                ["git", "-c", "core.autocrlf=false", "archive", "--format=zip", f"{commit}:{path}"]
            )
            if mismatch(io.BytesIO(archive), indexed) is None:
                print(f"::warning::skills.sh still serves the skill from {commit}. Indexing is pending.")
                return
    raise ValueError(error)


if __name__ == "__main__":
    try:
        check_snapshot(*sys.argv[1:])
    except (ValueError, KeyError, TypeError, AttributeError) as error:
        sys.exit(str(error))
