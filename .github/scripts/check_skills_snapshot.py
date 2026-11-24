"""Compare a skills.sh download with a Git archive of the skill directory."""

import json
import sys
from pathlib import Path
from zipfile import ZipFile


def check_snapshot(archive_path, snapshot_path):
    entries = json.loads(Path(snapshot_path).read_bytes())["files"]
    if not isinstance(entries, list):
        raise ValueError("Expected a list of snapshot files")
    indexed = {}
    for entry in entries:
        path = entry["path"]
        if path in indexed:
            raise ValueError(f"Duplicate snapshot file: {path}")
        indexed[path] = entry["contents"].encode("utf-8")

    with ZipFile(archive_path) as archive:
        for file in archive.infolist():
            if file.is_dir():
                continue
            if file.filename not in indexed:
                raise ValueError(f"Missing snapshot file: {file.filename}")
            if indexed.pop(file.filename) != archive.read(file):
                raise ValueError(f"Snapshot content differs: {file.filename}")
    if indexed:
        raise ValueError(f"Unexpected snapshot files: {', '.join(sorted(indexed))}")


if __name__ == "__main__":
    try:
        check_snapshot(*sys.argv[1:])
    except (ValueError, KeyError, TypeError, AttributeError) as error:
        sys.exit(str(error))
