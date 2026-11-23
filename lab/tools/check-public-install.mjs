import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// This networked rehearsal runs on the Linux CI runner with the official CLI.
const source = 'notuxius/skills-upkeep';
const baselineCommit = 'b11485758e739464efa99467aa0f0ffb4051ce22';
const roles = ['queue-ui', 'queue-api', 'queue-aqa', 'queue-design'];
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temp = mkdtempSync(join(tmpdir(), 'public-queue-skills-'));
const upgradedProject = join(temp, 'upgrade');
let project = upgradedProject;
const readLock = () => JSON.parse(readFileSync(join(project, 'skills-lock.json'), 'utf8'));

function run(command, args) {
  execFileSync(command, args, { cwd: project, stdio: 'inherit' });
}

function skills(...args) {
  run('npx', ['--yes', 'skills@1.9.0', ...args]);
}

function initConsumer() {
  mkdirSync(project);
  run('git', ['init', '--quiet']);
  mkdirSync(join(project, 'tools'));
  cpSync(join(root, 'tools/verify-installs.mjs'), join(project, 'tools/verify-installs.mjs'));
}

try {
  const installed = JSON.parse(execFileSync('npx', ['--yes', 'skills@1.9.0', 'list', '--json'],
    { cwd: root, encoding: 'utf8' }));
  for (const role of roles) {
    assert.ok(installed.some(entry => entry.name === role && entry.scope === 'project'
      && entry.status === 'tracked' && entry.source === source), 'Untracked project skill: ' + role);
  }
  initConsumer();
  skills('add', source + '@' + baselineCommit, '--skill', ...roles,
    '--agent', 'codex', 'claude-code', '--copy', '--yes');
  run('node', ['tools/verify-installs.mjs']);
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
    skills('add', source, '--agent', 'codex', 'claude-code', '--copy', '--yes', '--skill', ...names);
  }
  refresh([roles[0]]);
  const selective = readLock();
  assert.notEqual(selective.skills[roles[0]].computedHash, baseline.skills[roles[0]].computedHash);
  for (const role of roles.slice(1)) {
    assert.deepEqual(selective.skills[role], baseline.skills[role], 'Unselected skill changed: ' + role);
  }
  run('node', ['tools/verify-installs.mjs']);

  refresh(roles.slice(1));
  run('node', ['tools/verify-installs.mjs']);
  const updated = readLock();
  for (const role of roles) {
    assert.notEqual(updated.skills[role].computedHash, baseline.skills[role].computedHash);
  }

  // A fresh installation from the moving default branch must agree with the upgrade.
  project = join(temp, 'fresh');
  initConsumer();
  skills('add', source, '--skill', ...roles, '--agent', 'codex', 'claude-code', '--copy', '--yes');
  const fresh = readLock();
  for (const role of roles) {
    assert.equal(fresh.skills[role].computedHash, updated.skills[role].computedHash);
    const path = join('.agents', 'skills', role, 'SKILL.md');
    assert.deepEqual(readFileSync(join(project, path)), readFileSync(join(upgradedProject, path)));
  }
  run('node', ['tools/verify-installs.mjs']);
  console.log('All public skill upgrades agree with a fresh install.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
