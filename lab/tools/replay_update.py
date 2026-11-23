"""Replay the four v1 to v2 skill updates in a disposable copy of the lab."""

import argparse
import io
import subprocess
import tempfile
import zipfile
from pathlib import Path


LAB = Path(__file__).resolve().parents[1]
REPO = LAB.parent
AGENTS = (".agents/skills", ".claude/skills")
TESTS = {
    "queue-ui": "frontend/queue-view.test.mjs",
    "queue-api": "backend/claim.test.mjs",
    "queue-aqa": "qa/claim-race.test.mjs",
    "queue-design": "design/status-badge.test.mjs",
}


def git(directory, *args, data=None):
    command = ["git", "-c", f"safe.directory={directory.as_posix()}",
               "-c", "core.autocrlf=false"]
    return subprocess.run(command + list(args), cwd=directory, input=data,
                          stdout=subprocess.PIPE, check=True).stdout


def snapshot(repo, revision, destination):
    data = git(repo, "archive", "--format=zip", revision)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        archive.extractall(destination)


def release_ref(repo, name):
    candidates = (f"refs/tags/{name}", f"refs/heads/{name}", f"refs/remotes/origin/{name}")
    available = git(repo, "for-each-ref", "--format=%(refname)", *candidates).decode().splitlines()
    for candidate in candidates:
        if candidate in available:
            return candidate
    raise RuntimeError(f"Fetch or restore the {name} ref in {repo}")


def check_install(project, catalog):
    subprocess.run(["node", "tools/verify-installs.mjs", str(catalog)],
                   cwd=project, check=True)


def replay(catalog):
    with tempfile.TemporaryDirectory(prefix="role-skills-replay-") as work:
        temp = Path(work)
        upstream = catalog
        if catalog.is_file():
            upstream = temp / "upstream"
            upstream.mkdir()
            git(upstream, "init", "--quiet")
            git(upstream, "fetch", "--quiet", "--no-tags", str(catalog),
                "refs/tags/v1:refs/tags/v1", "refs/tags/v2:refs/tags/v2")

        before, after, consumer = temp / "v1", temp / "v2", temp / "consumer"
        first = release_ref(upstream, "v1")
        second = release_ref(upstream, "v2")
        snapshot(upstream, first, before)
        snapshot(upstream, second, after)
        baseline = release_ref(REPO, "skill-baseline")
        snapshot(REPO, f"{baseline}:lab", consumer)
        git(consumer, "init", "--quiet")
        check_install(consumer, before)

        for name, test in TESTS.items():
            patch = git(upstream, "diff", "--binary", "--no-renames", first, second,
                        "--", f"skills/{name}/")
            if not patch:
                raise RuntimeError(f"No catalog improvement found for {name}")
            # Check both installations against the old release before applying either.
            for flags in (["--check"], []):
                for agent in AGENTS:
                    git(consumer, "apply", *flags, "-p2", f"--directory={agent}", "-",
                        data=patch)
            subprocess.run(["node", "--test", test], cwd=consumer, check=True)
        check_install(consumer, after)
        print("All four updated installations match v2 in both agent directories.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalog", type=Path, nargs="?",
                        default=LAB / "fixtures/role-skill-catalog.bundle",
                        help="Catalog checkout or Git bundle (defaults to the included fixture)")
    args = parser.parse_args()
    replay(args.catalog.resolve(strict=True))
