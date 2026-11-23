import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyInstalls } from './verify-installs.mjs';

const source = 'notuxius/skills';
const baselineCommit = '4fc9a43aeb84034c9f7a2f8de3d957e5a7454f7d';
const roles = ['queue-ui', 'queue-api', 'queue-aqa', 'queue-design'];
const allSkills = [...roles, 'skills-upkeep'];
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run via npm run skills:public-test');
const temp = mkdtempSync(join(tmpdir(), 'public-queue-skills-'));
const upgradedProject = join(temp, 'upgrade');
let project = upgradedProject;
const readLock = () => JSON.parse(readFileSync(join(project, 'skills-lock.json'), 'utf8'));

function skills(directory, ...args) {
  return execFileSync(process.execPath, [npmCli, 'exec', '--yes', '--package=skills@1.9.0', '--', 'skills', ...args], {
    cwd: directory, encoding: 'utf8', env: { ...process.env, DISABLE_TELEMETRY: '1' },
  });
}

function initConsumer() {
  mkdirSync(project);
  execFileSync('git', ['init', '--quiet'], { cwd: project });
}

try {
  const installed = JSON.parse(skills(root, 'list', '--json'));
  for (const role of roles) {
    assert.ok(installed.some(entry => entry.name === role && entry.scope === 'project'
      && entry.status === 'tracked' && entry.source === source), 'Untracked project skill: ' + role);
  }
  initConsumer();
  skills(project, 'add', source + '@' + baselineCommit, '--skill', ...roles,
    '--agent', 'codex', 'claude-code', '--copy', '--yes');
  verifyInstalls(project, roles);
  const baseline = readLock();

  // Reconstruct an existing consumer that installed this release while it was
  // current on main. Clear the temporary checkout's explicit historical pin.
  for (const role of roles) {
    const entry = baseline.skills[role];
    assert.equal(entry.source, source);
    assert.equal(entry.ref, baselineCommit);
    delete entry.ref;
  }
  writeFileSync(join(project, 'skills-lock.json'), JSON.stringify(baseline, null, 2) + '\n');
  function refresh(names) {
    skills(project, 'add', source, '--agent', 'codex', 'claude-code', '--copy', '--yes', '--skill', ...names);
  }
  refresh([roles[0]]);
  const selective = readLock();
  assert.notEqual(selective.skills[roles[0]].computedHash, baseline.skills[roles[0]].computedHash);
  for (const role of roles.slice(1)) {
    assert.deepEqual(selective.skills[role], baseline.skills[role], 'Unselected skill changed: ' + role);
  }
  verifyInstalls(project, roles);

  refresh(roles.slice(1));
  verifyInstalls(project, roles);
  const updated = readLock();
  for (const role of roles) {
    assert.notEqual(updated.skills[role].computedHash, baseline.skills[role].computedHash);
  }

  // A fresh installation from the moving default branch must agree with the upgrade.
  project = join(temp, 'fresh');
  initConsumer();
  refresh(allSkills);
  const fresh = readLock();
  const upkeep = fresh.skills['skills-upkeep'];
  assert.equal(upkeep.source, source);
  assert.equal(upkeep.sourceType, 'github');
  assert.match(upkeep.commit, /^[0-9a-f]{40}$/);
  for (const role of roles) {
    assert.equal(fresh.skills[role].computedHash, updated.skills[role].computedHash);
    const path = join('.agents', 'skills', role, 'SKILL.md');
    assert.deepEqual(readFileSync(join(project, path)), readFileSync(join(upgradedProject, path)));
  }
  verifyInstalls(project, allSkills);
  console.log(`Public Skills Upkeep installed at ${upkeep.commit}. All four public role upgrades agree with a fresh install.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
